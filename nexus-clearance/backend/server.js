require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Request = require('./models/Request');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nexus')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Auth Middleware
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// --- ROUTES ---

// Signup
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'student'
    });

    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, role: user.role, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password, loginType } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Ensure users log in via their respective portals
    if (loginType === 'student' && user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Please use the Admin Portal.' });
    }
    if (loginType === 'admin' && user.role === 'student') {
      return res.status(403).json({ message: 'Access denied. Please use the Student Portal.' });
    }

    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ success: true, token, role: user.role, name: user.name, id: user._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Requests (Admin/Student specific)
app.get('/api/requests', authMiddleware, async (req, res) => {
  try {
    let requests;
    if (req.user.role === 'student') {
      requests = await Request.find({ studentId: req.user.id });
    } else {
      requests = await Request.find().populate('studentId', 'name email');
    }
    
    // Map to frontend structure
    const mapped = requests.map(r => ({
      id: r._id,
      studentId: r.studentId._id,
      studentName: r.studentName,
      documents: r.documents,
      status: r.status,
      finalStatus: r.finalStatus,
      createdAt: r.createdAt
    }));
    
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Student Request (Backward compatibility for frontend)
app.get('/api/requests/:userId', authMiddleware, async (req, res) => {
  try {
    const requests = await Request.find({ studentId: req.user.id });
    const mapped = requests.map(r => ({
      id: r._id,
      studentId: r.studentId._id,
      studentName: r.studentName,
      documents: r.documents,
      status: r.status,
      finalStatus: r.finalStatus,
      createdAt: r.createdAt
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create Request (Student)
app.post('/api/requests', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Only students can create requests' });

    const existing = await Request.findOne({ studentId: req.user.id });
    if (existing) return res.status(400).json({ message: 'Request already exists' });

    const newRequest = new Request({
      studentId: req.user.id,
      studentName: req.user.name,
      documents: req.body.documents,
      status: {
        lab: { state: 'pending', comment: '' },
        hod: { state: 'pending', comment: '' },
        principal: { state: 'pending', comment: '' }
      },
      finalStatus: 'pending'
    });

    await newRequest.save();
    
    res.status(201).json({
      id: newRequest._id,
      studentId: newRequest.studentId,
      studentName: newRequest.studentName,
      status: newRequest.status,
      finalStatus: newRequest.finalStatus
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve Stage
app.post('/api/requests/:id/approve', authMiddleware, async (req, res) => {
  try {
    const { comment } = req.body;
    const role = req.user.role; // lab, hod, principal
    
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (role === 'hod' && request.status.lab.state !== 'approved') return res.status(400).json({ message: 'Lab must approve first' });
    if (role === 'principal' && request.status.hod.state !== 'approved') return res.status(400).json({ message: 'HOD must approve first' });

    if (['lab', 'hod', 'principal'].includes(role)) {
      request.status[role] = { state: 'approved', comment: comment || '' };
      
      if (request.status.lab.state === 'approved' && 
          request.status.hod.state === 'approved' && 
          request.status.principal.state === 'approved') {
        request.finalStatus = 'approved';
      }
      
      await request.save();
      return res.json(request);
    }
    
    res.status(403).json({ message: 'Invalid role' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject Stage
app.post('/api/requests/:id/reject', authMiddleware, async (req, res) => {
  try {
    const { comment } = req.body;
    const role = req.user.role;
    
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (role === 'hod' && request.status.lab.state !== 'approved') return res.status(400).json({ message: 'Lab must approve first' });
    if (role === 'principal' && request.status.hod.state !== 'approved') return res.status(400).json({ message: 'HOD must approve first' });

    if (['lab', 'hod', 'principal'].includes(role)) {
      request.status[role] = { state: 'rejected', comment: comment || '' };
      request.finalStatus = 'rejected';
      
      await request.save();
      return res.json(request);
    }

    res.status(403).json({ message: 'Invalid role' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
