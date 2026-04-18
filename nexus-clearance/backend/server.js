const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const users = {
  atharv: { role: 'student', password: '1234' },
  rahul: { role: 'student', password: '1234' },
  priya: { role: 'student', password: '1234' },
  neha: { role: 'student', password: '1234' },
  rohit: { role: 'student', password: '1234' },
  vikas: { role: 'student', password: '1234' },
  sneha: { role: 'student', password: '1234' },
  amit: { role: 'student', password: '1234' },
  lab: { role: 'lab', password: 'lab123' },
  hod: { role: 'hod', password: 'hod123' },
  principal: { role: 'principal', password: 'admin123' }
};

// Dummy Applications Data
let requests = [
  {
    id: 1,
    studentId: 'atharv',
    studentName: 'Atharv',
    status: {
      lab: { state: 'approved', comment: '' },
      hod: { state: 'pending', comment: '' },
      principal: { state: 'pending', comment: '' }
    },
    finalStatus: 'pending'
  },
  {
    id: 2,
    studentId: 'rahul',
    studentName: 'Rahul',
    status: {
      lab: { state: 'approved', comment: '' },
      hod: { state: 'approved', comment: '' },
      principal: { state: 'pending', comment: '' }
    },
    finalStatus: 'pending'
  },
  {
    id: 3,
    studentId: 'priya',
    studentName: 'Priya',
    status: {
      lab: { state: 'pending', comment: '' },
      hod: { state: 'pending', comment: '' },
      principal: { state: 'pending', comment: '' }
    },
    finalStatus: 'pending'
  },
  {
    id: 4,
    studentId: 'neha',
    studentName: 'Neha',
    status: {
      lab: { state: 'approved', comment: '' },
      hod: { state: 'rejected', comment: 'Library dues not cleared' },
      principal: { state: 'pending', comment: '' }
    },
    finalStatus: 'rejected'
  },
  {
    id: 5,
    studentId: 'amit',
    studentName: 'Amit',
    status: {
      lab: { state: 'pending', comment: '' },
      hod: { state: 'pending', comment: '' },
      principal: { state: 'pending', comment: '' }
    },
    finalStatus: 'pending'
  }
];

let nextId = 6;

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (users[username] && users[username].password === password) {
    return res.json({ success: true, role: users[username].role, username });
  }
  
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// Get all requests (for admin dashboards)
app.get('/api/requests', (req, res) => {
  res.json(requests);
});

// Get requests for a specific student
app.get('/api/requests/:studentId', (req, res) => {
  const studentRequests = requests.filter(r => r.studentId === req.params.studentId);
  res.json(studentRequests);
});

// Submit a new clearance request
app.post('/api/requests', (req, res) => {
  const { studentId, studentName } = req.body;
  
  // Check if already exists
  const existing = requests.find(r => r.studentId === studentId);
  if (existing) {
    return res.status(400).json({ message: 'Request already exists for this student' });
  }

  const newRequest = {
    id: nextId++,
    studentId,
    studentName: studentName || studentId,
    status: {
      lab: { state: 'pending', comment: '' },
      hod: { state: 'pending', comment: '' },
      principal: { state: 'pending', comment: '' }
    },
    finalStatus: 'pending'
  };
  
  requests.push(newRequest);
  res.status(201).json(newRequest);
});

// Approve a stage
app.post('/api/requests/:id/approve', (req, res) => {
  const { role } = req.body;
  const id = parseInt(req.params.id);
  
  const request = requests.find(r => r.id === id);
  if (!request) {
    return res.status(404).json({ message: 'Request not found' });
  }

  // Workflow validation
  if (role === 'hod' && request.status.lab.state !== 'approved') {
    return res.status(400).json({ message: 'Lab must approve first' });
  }
  if (role === 'principal' && request.status.hod.state !== 'approved') {
    return res.status(400).json({ message: 'HOD must approve first' });
  }

  if (['lab', 'hod', 'principal'].includes(role)) {
    request.status[role] = { state: 'approved', comment: '' };
    
    // Check if all are approved
    if (request.status.lab.state === 'approved' && 
        request.status.hod.state === 'approved' && 
        request.status.principal.state === 'approved') {
      request.finalStatus = 'approved';
    }
    
    return res.json(request);
  }

  res.status(400).json({ message: 'Invalid role' });
});

// Reject a stage
app.post('/api/requests/:id/reject', (req, res) => {
  const { role, comment } = req.body;
  const id = parseInt(req.params.id);
  
  const request = requests.find(r => r.id === id);
  if (!request) {
    return res.status(404).json({ message: 'Request not found' });
  }

  // Workflow validation
  if (role === 'hod' && request.status.lab.state !== 'approved') {
    return res.status(400).json({ message: 'Lab must approve first' });
  }
  if (role === 'principal' && request.status.hod.state !== 'approved') {
    return res.status(400).json({ message: 'HOD must approve first' });
  }

  if (['lab', 'hod', 'principal'].includes(role)) {
    request.status[role] = { state: 'rejected', comment: comment || '' };
    request.finalStatus = 'rejected';
    
    return res.json(request);
  }

  res.status(400).json({ message: 'Invalid role' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
