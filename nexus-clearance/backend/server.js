require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Request = require('./models/Request');

const fs = require('fs');
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

let memoryDues = []; // In-memory store for CSV dues
try {
  if (fs.existsSync('./dues.json')) {
    memoryDues = JSON.parse(fs.readFileSync('./dues.json', 'utf8'));
  }
} catch (e) {
  console.log("No previous dues file found or failed to parse");
}

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
    const { name, identifier, password, role } = req.body;
    
    console.log('BODY:', req.body); let user = await User.findOne({ identifier });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      identifier,
      password: hashedPassword,
      role: role || 'student'
    });

    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role, name: user.name, identifier: user.identifier }, JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, role: user.role, identifier: user.identifier } });
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { identifier, password, loginType } = req.body;

    const user = await User.findOne({ identifier });
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

    const token = jwt.sign({ id: user._id, role: user.role, name: user.name, identifier: user.identifier }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ success: true, token, role: user.role, name: user.name, id: user._id, identifier: user.identifier });
  } catch (err) {
    console.error('Login Error:', err);
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
      studentId: r.studentId ? r.studentId._id : r.studentId,
      studentIdentifier: r.studentIdentifier,
      studentName: r.studentName,
      documents: r.documents,
      status: r.status,
      finalStatus: r.finalStatus,
      createdAt: r.createdAt,
      hasDues: memoryDues.some(d => d.studentId && r.studentIdentifier && d.studentId.toLowerCase() === r.studentIdentifier.toLowerCase() && d.status.toLowerCase() === 'unpaid')
    }));
    
    res.json(mapped);
  } catch (err) {
    console.error('Signup Error:', err);
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
    console.error('Signup Error:', err);
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
      studentIdentifier: req.user.identifier,
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
      studentIdentifier: newRequest.studentIdentifier,
      studentName: newRequest.studentName,
      status: newRequest.status,
      documents: newRequest.documents,
      finalStatus: newRequest.finalStatus
    });
  } catch (err) {
    console.error('Signup Error:', err);
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
    console.error('Signup Error:', err);
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
    console.error('Signup Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- DUES SYSTEM ---

app.post('/api/admin/upload-dues', authMiddleware, (req, res) => {
  if (!['lab', 'hod', 'principal'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Only admins can upload dues' });
  }

  const { csvData } = req.body;
  if (!csvData) return res.status(400).json({ message: 'No CSV data provided' });

  try {
    const lines = csvData.split('\n').filter(line => line.trim().length > 0);
    // Assuming structure: studentId,name,department,amount,status,reason
    
    // Skip header if it exists
    if (lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('amount')) {
      lines.shift();
    }

    const newDues = lines.map(line => {
      // Handle commas inside quotes or just basic split. For simple CSVs:
      const parts = line.split(',');
      return {
        studentId: parts[0]?.trim(),
        name: parts[1]?.trim(),
        department: parts[2]?.trim(),
        amount: parts[3]?.trim(),
        status: parts[4]?.trim().toLowerCase(),
        reason: parts[5]?.trim()
      };
    });

    memoryDues = newDues;
    fs.writeFileSync('./dues.json', JSON.stringify(memoryDues, null, 2));
    res.json({ success: true, message: `Successfully loaded ${memoryDues.length} due records.` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to parse CSV' });
  }
});

app.get('/api/dues/:studentIdentifier', authMiddleware, (req, res) => {
  const studentIdentifier = req.params.studentIdentifier.toLowerCase();
  const studentDues = memoryDues.filter(d => d.studentId && d.studentId.toLowerCase() === studentIdentifier);
  res.json(studentDues);
});

app.get('/api/check-clearance/:studentIdentifier', authMiddleware, (req, res) => {
  const studentIdentifier = req.params.studentIdentifier.toLowerCase();
  const hasUnpaid = memoryDues.some(d => d.studentId && d.studentId.toLowerCase() === studentIdentifier && d.status === 'unpaid');
  res.json({ allowed: !hasUnpaid });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
