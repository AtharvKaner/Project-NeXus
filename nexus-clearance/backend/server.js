require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const archiver = require('archiver');
const { createObjectCsvWriter } = require('csv-writer');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const User = require('./models/User');
const Request = require('./models/Request');
const Due = require('./models/Due');
const ReminderLog = require('./models/ReminderLog');
const Razorpay = require('razorpay');

// Initialize cron jobs
require('./cronJobs');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const BASE_URL = 'https://fragrant-setback-nursing.ngrok-free.dev';

let memoryDues = []; // In-memory store for CSV dues
const duesFilePath = path.join(__dirname, 'dues.json');
const duesUpdatedCsvPath = path.join(__dirname, 'dues_updated.csv');

const normalizeDueRecord = (due) => ({
  studentId: (due.studentId || '').toString().trim().toLowerCase(),
  name: (due.name || '').toString().trim(),
  department: (due.department || '').toString().trim().toLowerCase(),
  amount: Number(due.amount) || 0,
  status: (due.status || 'unpaid').toString().trim().toLowerCase(),
  reason: (due.reason || '').toString().trim(),
  transactionId: due.transactionId || '',
  razorpayOrderId: due.razorpayOrderId || '',
  razorpayPaymentId: due.razorpayPaymentId || '',
  paidAt: due.paidAt || null
});

const stripBlankDues = (dues) => dues
  .map(normalizeDueRecord)
  .filter(due => due.studentId && due.department);

const persistDuesFile = () => {
  fs.writeFileSync(duesFilePath, JSON.stringify(memoryDues, null, 2));
};

const exportDuesToCSV = async (allDues) => {
  const csvWriter = createObjectCsvWriter({
    path: duesUpdatedCsvPath,
    header: [
      { id: 'studentId', title: 'studentId' },
      { id: 'name', title: 'name' },
      { id: 'department', title: 'department' },
      { id: 'amount', title: 'amount' },
      { id: 'status', title: 'status' },
      { id: 'reason', title: 'reason' }
    ]
  });

  const rows = allDues.map((due) => ({
    studentId: due.studentId || '',
    name: due.name || '',
    department: due.department || '',
    amount: Number(due.amount) || 0,
    status: due.status || 'unpaid',
    reason: due.reason || ''
  }));
        const signatureX = pageWidth - 230;
        const signatureY = pageHeight - 210;
};

const formatDate = (dateValue) => {
  const date = new Date(dateValue || Date.now());
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

const generateCertId = () => `CERT-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

const streamToBuffer = (stream) => new Promise((resolve, reject) => {
  const chunks = [];
  stream.on('data', (chunk) => chunks.push(chunk));
  stream.on('end', () => resolve(Buffer.concat(chunks)));
  stream.on('error', reject);
});

const safeFileName = (value) => (value || 'file')
  .toString()
  .replace(/[\\/:*?"<>|]+/g, '_')
  .replace(/\s+/g, ' ')
  .trim();

const dataUrlToFile = (dataUrl, originalName) => {
  if (!dataUrl || typeof dataUrl !== 'string') return null;

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;

  const mimeType = match[1] || 'application/octet-stream';
  const base64Payload = match[2] || '';
  const mimeToExtension = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
  };

  const parsedName = safeFileName(originalName || 'document');
  const hasExtension = /\.[a-zA-Z0-9]+$/.test(parsedName);
  const fallbackExt = mimeToExtension[mimeType] || 'bin';
  const fileName = hasExtension ? parsedName : `${parsedName}.${fallbackExt}`;

  try {
    return {
      fileName,
      buffer: Buffer.from(base64Payload, 'base64')
    };
  } catch (_error) {
    return null;
  }
};

const buildNoDuesCertificatePdf = async ({ request, dueRecords, verificationUrl, certId }) => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    bufferPages: true
  });

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const usableWidth = pageWidth - 120;
  const departmentLabel = dueRecords.length > 0
    ? [...new Set(dueRecords.map((due) => due.department).filter(Boolean))].join(', ')
    : 'Institutional Clearance';

  doc.rect(28, 28, pageWidth - 56, pageHeight - 56).lineWidth(1.5).strokeColor('#1e293b').stroke();

  doc.save();
  doc.fillColor('#cbd5e1').opacity(0.12).font('Helvetica-Bold').fontSize(34);
  doc.rotate(-28, { origin: [pageWidth / 2, pageHeight / 2] });
  doc.text('NEXUS SYSTEM', 0, pageHeight / 2 - 18, { width: pageWidth, align: 'center' });
  doc.restore();

  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(24);
  doc.text('NO DUES CERTIFICATE', 0, 70, { align: 'center', width: pageWidth });

  doc.moveTo(150, 104).lineTo(pageWidth - 150, 104).lineWidth(1).strokeColor('#94a3b8').stroke();

  doc.fillColor('#334155').font('Helvetica').fontSize(11);
  doc.text('Certificate ID', 60, 120, { width: 100 });
  doc.font('Helvetica-Bold').text(certId, 160, 120, { width: 240 });

  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(13);
  doc.text('Student Details', 60, 155);

  doc.roundedRect(60, 180, usableWidth, 120, 10).lineWidth(1).strokeColor('#cbd5e1').stroke();

  const leftX = 80;
  const valueX = 210;
  const row1Y = 202;
  const rowGap = 24;

  doc.fillColor('#334155').font('Helvetica-Bold').fontSize(11);
  doc.text('Student Name', leftX, row1Y);
  doc.text('Student ID / Roll No.', leftX, row1Y + rowGap);
  doc.text('Department', leftX, row1Y + rowGap * 2);

  doc.fillColor('#0f172a').font('Helvetica').fontSize(11);
  doc.text(request.studentName || '-', valueX, row1Y);
  doc.text(request.studentIdentifier || request.studentId || '-', valueX, row1Y + rowGap);
  doc.text(departmentLabel, valueX, row1Y + rowGap * 2, { width: usableWidth - 240 });

  doc.fillColor('#111827').font('Helvetica').fontSize(13);
  doc.text(
    `This is to certify that the above-mentioned student (${request.studentName || '-'}) has cleared all dues and is eligible for clearance.`,
    70,
    330,
    {
      width: pageWidth - 140,
      align: 'center',
      lineGap: 4
    }
  );

  doc.roundedRect(72, 392, pageWidth - 144, 70, 10).fillAndStroke('#f8fafc', '#e2e8f0');
  doc.fillColor('#334155').font('Helvetica-Bold').fontSize(10);
  doc.text('Status', 90, 412);
  doc.text('Remarks', 230, 412);
  doc.fillColor('#15803d').font('Helvetica-Bold').fontSize(12);
  doc.text('ALL DUES CLEARED', 90, 428);
  doc.fillColor('#334155').font('Helvetica').fontSize(10);
  doc.text('Final principal approval confirmed and clearance marked complete.', 230, 428, {
    width: pageWidth - 300
  });

  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(11);
  doc.text(`Issue Date: ${formatDate(Date.now())}`, 70, pageHeight - 125);

  const signatureX = pageWidth - 230;
  const signatureY = pageHeight - 210;
  doc.moveTo(signatureX, signatureY).lineTo(signatureX + 150, signatureY).lineWidth(1).strokeColor('#0f172a').stroke();
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(11);
  doc.text('Authorized Signature', signatureX, signatureY + 8, { width: 160, align: 'center' });
  doc.font('Helvetica-Bold').fontSize(12);
  doc.text('B.N. Chaudhary', signatureX, signatureY + 24, { width: 160, align: 'center' });

  doc.fillColor('#64748b').font('Helvetica').fontSize(9);
  doc.text('Nexus Automated Clearance System', 70, pageHeight - 65, { width: pageWidth - 140, align: 'center' });

  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'M',
    margin: 1,
    scale: 5,
    width: 120,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });

  const qrX = pageWidth - 150;
  const qrY = pageHeight - 140;
  doc.roundedRect(qrX - 10, qrY - 10, 130, 130, 10).fillAndStroke('#ffffff', '#cbd5e1');
  doc.image(qrCodeDataUrl, qrX, qrY, { width: 110, height: 110 });
  doc.fillColor('#334155').font('Helvetica-Bold').fontSize(7.5);
  doc.text('Scan to verify authenticity', qrX - 12, qrY + 114, { width: 135, align: 'center' });

  return doc;
};

const updateCachedDue = (studentId, department, patch) => {
  const normalizedStudentId = (studentId || '').toString().trim().toLowerCase();
  const normalizedDepartment = (department || '').toString().trim().toLowerCase();

  memoryDues = memoryDues.map((due) => {
    if (
      due.studentId &&
      due.department &&
      due.studentId.toLowerCase() === normalizedStudentId &&
      due.department.toLowerCase() === normalizedDepartment
    ) {
      return normalizeDueRecord({ ...due, ...patch });
    }

    return normalizeDueRecord(due);
  });
};

const findDueRecord = async (studentId, department) => {
  const normalizedStudentId = (studentId || '').toString().trim().toLowerCase();
  const normalizedDepartment = (department || '').toString().trim().toLowerCase();

  let due = await Due.findOne({
    studentId: normalizedStudentId,
    department: normalizedDepartment
  }).lean();

  if (due) {
    return normalizeDueRecord(due);
  }

  due = memoryDues.find((item) => (
    item.studentId &&
    item.department &&
    item.studentId.toLowerCase() === normalizedStudentId &&
    item.department.toLowerCase() === normalizedDepartment
  ));

  return due ? normalizeDueRecord(due) : null;
};

const saveDueRecord = async (due) => {
  const normalizedDue = normalizeDueRecord(due);

  await Due.findOneAndUpdate(
    {
      studentId: normalizedDue.studentId,
      department: normalizedDue.department
    },
    { $set: normalizedDue },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  updateCachedDue(normalizedDue.studentId, normalizedDue.department, normalizedDue);
  persistDuesFile();
};

const replaceAllDues = async (dues) => {
  memoryDues = stripBlankDues(dues);
  await Due.deleteMany({});

  if (memoryDues.length > 0) {
    await Due.insertMany(memoryDues.map(normalizeDueRecord));
  }

  persistDuesFile();
};

try {
  if (fs.existsSync(duesFilePath)) {
    memoryDues = stripBlankDues(JSON.parse(fs.readFileSync(duesFilePath, 'utf8')));
  }
} catch (e) {
  console.log("No previous dues file found or failed to parse");
}

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_Sey90jixlpZZSl',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '569CQOBbRBQaDRk9EJl0AlA3',
});

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nexus')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

mongoose.connection.once('open', async () => {
  try {
    const dueCount = await Due.countDocuments();
    if (dueCount === 0 && memoryDues.length > 0) {
      await Due.insertMany(memoryDues.map(normalizeDueRecord));
    }
  } catch (error) {
    console.error('Failed to sync dues cache:', error);
  }
});

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
    console.error(err); res.status(500).json({ message: err.message });
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
    console.error(err); res.status(500).json({ message: err.message });
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
      certId: r.certId,
      documents: r.documents,
      status: r.status,
      finalStatus: r.finalStatus,
      createdAt: r.createdAt,
      hasDues: memoryDues.some(d => d.studentId && r.studentIdentifier && d.studentId.toLowerCase() === r.studentIdentifier.toLowerCase() && d.status.toLowerCase() === 'unpaid')
    }));
    
    res.json(mapped);
  } catch (err) {
    console.error('Signup Error:', err);
    console.error(err); res.status(500).json({ message: err.message });
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
      certId: r.certId,
      documents: r.documents,
      status: r.status,
      finalStatus: r.finalStatus,
      createdAt: r.createdAt
    }));
    res.json(mapped);
  } catch (err) {
    console.error('Signup Error:', err);
    console.error(err); res.status(500).json({ message: err.message });
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
    console.error(err); res.status(500).json({ message: err.message });
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
        if (!request.certId) {
          request.certId = generateCertId();
          request.certificateIssuedAt = new Date();
        }
      }
      
      await request.save();
      return res.json(request);
    }
    
    res.status(403).json({ message: 'Invalid role' });
  } catch (err) {
    console.error('Signup Error:', err);
    console.error(err); res.status(500).json({ message: err.message });
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
    console.error(err); res.status(500).json({ message: err.message });
  }
});

// --- DUES SYSTEM ---

app.post('/api/admin/upload-dues', authMiddleware, async (req, res) => {
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
    }).filter(due => due.studentId && due.department);

    await replaceAllDues(newDues);
    res.json({ success: true, message: `Successfully loaded ${memoryDues.length} due records.` });
  } catch (err) {
    console.error('Failed to upload dues:', err);
    res.status(500).json({ message: 'Failed to parse CSV' });
  }
});

app.get('/api/dues/:studentIdentifier', authMiddleware, async (req, res) => {
  try {
    const studentIdentifier = req.params.studentIdentifier.toLowerCase();
    const duesFromDb = await Due.find({ studentId: studentIdentifier }).lean();
    const studentDues = (duesFromDb.length > 0 ? duesFromDb : memoryDues)
      .filter(d => d.studentId && d.studentId.toLowerCase() === studentIdentifier)
      .map(normalizeDueRecord);
    res.json(studentDues);
  } catch (error) {
    console.error('Failed to fetch dues:', error);
    res.status(500).json({ message: 'Failed to load dues' });
  }
});

app.get('/api/check-clearance/:studentIdentifier', authMiddleware, async (req, res) => {
  try {
    const studentIdentifier = req.params.studentIdentifier.toLowerCase();
    const hasUnpaid = await Due.exists({ studentId: studentIdentifier, status: 'unpaid' });
    const fallbackHasUnpaid = memoryDues.some(d => d.studentId && d.studentId.toLowerCase() === studentIdentifier && d.status === 'unpaid');
    res.json({ allowed: !(hasUnpaid || fallbackHasUnpaid) });
  } catch (error) {
    console.error('Failed to check clearance:', error);
    res.status(500).json({ message: 'Failed to check clearance' });
  }
});

app.get('/api/admin/dues', authMiddleware, async (req, res) => {
  if (!['lab', 'hod', 'principal'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Only admins can view dues' });
  }

  try {
    const dues = await Due.find().sort({ studentId: 1, department: 1 }).lean();
    const response = (dues.length > 0 ? dues : memoryDues).map(normalizeDueRecord);
    res.json(response);
  } catch (error) {
    console.error('Failed to fetch all dues:', error);
    res.status(500).json({ message: 'Failed to load dues' });
  }
});

app.get('/api/admin/dues/export', authMiddleware, async (req, res) => {
  if (!['lab', 'hod', 'principal'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Only admins can export dues' });
  }

  try {
    const allDues = await Due.find().sort({ studentId: 1, department: 1 }).lean();
    const normalized = (allDues.length > 0 ? allDues : memoryDues).map(normalizeDueRecord);
    await exportDuesToCSV(normalized);
    res.download(duesUpdatedCsvPath, 'dues_updated.csv');
  } catch (error) {
    console.error('Failed to export dues csv:', error);
    res.status(500).json({ message: 'Failed to export dues CSV' });
  }
});

app.get('/api/requests/:id/certificate/pdf', authMiddleware, async (req, res) => {
  try {
    const requestRecord = await Request.findById(req.params.id).lean();
    if (!requestRecord) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const isOwner = String(requestRecord.studentId) === String(req.user.id);
    const isAdmin = ['lab', 'hod', 'principal'].includes(req.user.role);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to download this certificate' });
    }

    if (requestRecord.finalStatus !== 'approved') {
      return res.status(400).json({ message: 'Certificate is available only after final approval' });
    }

    const requestCertId = requestRecord.certId || generateCertId();
    if (!requestRecord.certId) {
      await Request.findByIdAndUpdate(requestRecord._id, {
        $set: {
          certId: requestCertId,
          certificateIssuedAt: requestRecord.certificateIssuedAt || new Date()
        }
      });
    }

    const dueRecords = await Due.find({ studentId: requestRecord.studentIdentifier }).lean();
    const verifyURL = `${BASE_URL}/verify/${requestCertId}`;
    const pdf = await buildNoDuesCertificatePdf({
      request: requestRecord,
      dueRecords: dueRecords.length > 0 ? dueRecords : memoryDues.filter((due) => due.studentId === requestRecord.studentIdentifier)
      ,
      verificationUrl: verifyURL,
      certId: requestCertId
    });

    const filename = `no-dues-certificate-${requestRecord.studentIdentifier || requestRecord._id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    pdf.pipe(res);
    pdf.end();
  } catch (error) {
    console.error('Failed to generate certificate PDF:', error);
    res.status(500).json({ message: 'Failed to generate certificate PDF' });
  }
});

const downloadLockerHandler = async (req, res) => {
  try {
    const studentIdParam = (req.params.studentId || '').toString().trim();
    const normalizedStudentId = studentIdParam.toLowerCase();

    if (!normalizedStudentId) {
      return res.status(400).json({ message: 'studentId is required' });
    }

    const requestRecord = await Request.findOne({ studentIdentifier: normalizedStudentId }).sort({ createdAt: -1 }).lean();
    if (!requestRecord) {
      return res.status(404).json({ message: 'No locker data found for this student' });
    }

    const requestCertId = requestRecord.certId || generateCertId();
    if (!requestRecord.certId) {
      await Request.findByIdAndUpdate(requestRecord._id, {
        $set: {
          certId: requestCertId,
          certificateIssuedAt: requestRecord.certificateIssuedAt || new Date()
        }
      });
    }

    const lockerFileName = `locker-${normalizedStudentId}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${lockerFileName}"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (error) => {
      throw error;
    });
    archive.pipe(res);

    const studentLockerDir = path.join(__dirname, 'locker', normalizedStudentId);
    const fsCertificatePath = path.join(studentLockerDir, 'Certificate.pdf');
    const fsReceiptsDir = path.join(studentLockerDir, 'Receipts');
    const fsDocumentsDir = path.join(studentLockerDir, 'Documents');

    if (fs.existsSync(fsCertificatePath)) {
      archive.file(fsCertificatePath, { name: 'Certificate.pdf' });
    } else if (requestRecord.finalStatus === 'approved') {
      const dueRecords = await Due.find({ studentId: normalizedStudentId }).lean();
      const verifyURL = `${BASE_URL}/verify/${requestCertId}`;
      const pdf = await buildNoDuesCertificatePdf({
        request: requestRecord,
        dueRecords: dueRecords.length > 0 ? dueRecords : memoryDues.filter((due) => due.studentId === normalizedStudentId),
        verificationUrl: verifyURL,
        certId: requestCertId
      });
      const pdfBufferPromise = streamToBuffer(pdf);
      pdf.end();
      const pdfBuffer = await pdfBufferPromise;
      archive.append(pdfBuffer, { name: 'Certificate.pdf' });
    }

    if (fs.existsSync(fsReceiptsDir)) {
      archive.directory(fsReceiptsDir, 'Receipts');
    } else {
      const paidDues = await Due.find({ studentId: normalizedStudentId, status: 'paid' }).sort({ paidAt: -1 }).lean();
      if (paidDues.length > 0) {
        paidDues.forEach((due, index) => {
          const receiptContent = [
            `Receipt #${index + 1}`,
            `Student ID: ${normalizedStudentId}`,
            `Department: ${due.department || '-'}`,
            `Amount: ${Number(due.amount || 0)}`,
            `Status: ${due.status || 'paid'}`,
            `Transaction ID: ${due.transactionId || '-'}`,
            `Razorpay Order ID: ${due.razorpayOrderId || '-'}`,
            `Razorpay Payment ID: ${due.razorpayPaymentId || '-'}`,
            `Paid At: ${due.paidAt ? new Date(due.paidAt).toISOString() : '-'}`
          ].join('\n');

          const receiptName = safeFileName(`${due.department || 'payment'}-receipt-${index + 1}.txt`);
          archive.append(receiptContent, { name: `Receipts/${receiptName}` });
        });
      } else {
        archive.append('No payment receipts found for this student.', { name: 'Receipts/README.txt' });
      }
    }

    if (fs.existsSync(fsDocumentsDir)) {
      archive.directory(fsDocumentsDir, 'Documents');
    } else {
      const documents = requestRecord.documents || {};
      const documentEntries = [documents.idCard, documents.libraryReceipt, documents.labClearance].filter(Boolean);

      if (documentEntries.length > 0) {
        documentEntries.forEach((docItem, index) => {
          const parsed = dataUrlToFile(docItem.dataUrl, docItem.name || `document-${index + 1}`);
          if (parsed) {
            archive.append(parsed.buffer, { name: `Documents/${parsed.fileName}` });
          }
        });
      } else {
        archive.append('No uploaded documents found for this student.', { name: 'Documents/README.txt' });
      }
    }

    archive.finalize();
  } catch (error) {
    console.error('Failed to generate locker zip:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to generate locker ZIP' });
    }
  }
};

app.get('/download-locker/:studentId', downloadLockerHandler);
app.get('/api/download-locker/:studentId', downloadLockerHandler);

app.get('/verify/:certId', async (req, res) => {
  try {
    const requestRecord = await Request.findOne({ certId: req.params.certId, finalStatus: 'approved' }).lean();

    if (!requestRecord) {
      return res.status(404).json({ valid: false, message: 'Invalid certificate', studentInfo: null });
    }

    return res.json({
      valid: true,
      certId: requestRecord.certId,
      studentInfo: {
        studentName: requestRecord.studentName,
        studentIdentifier: requestRecord.studentIdentifier,
        requestId: requestRecord._id,
        issuedAt: requestRecord.certificateIssuedAt || requestRecord.updatedAt,
        finalStatus: requestRecord.finalStatus
      }
    });
  } catch (error) {
    console.error('Failed to verify certificate:', error);
    res.status(500).json({ valid: false, message: 'Verification failed', studentInfo: null });
  }
});

const createOrderHandler = async (req, res) => {
  try {
    const { amount, department, studentId } = req.body;
    if (!studentId || !department) {
      return res.status(400).json({ message: 'studentId and department are required' });
    }

    const due = await findDueRecord(studentId, department);
    const orderAmount = Number(due?.amount ?? amount);

    if (!Number.isFinite(orderAmount) || orderAmount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    
    const options = {
      amount: Math.round(orderAmount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    
    if (!order) {
      return res.status(500).json({ message: 'Some error occurred' });
    }

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Razorpay Create Order Error:', error);
    res.status(500).json({ message: 'Error creating order' });
  }
};

app.post('/api/create-order', authMiddleware, createOrderHandler);
app.post('/create-order', authMiddleware, createOrderHandler);

const verifyPaymentHandler = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      studentId,
      department
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !studentId || !department) {
      return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || '')
      .update(sign.toString())
      .digest("hex");

    const isValidSignature = razorpay_signature === expectedSign;
    const allowFallback = process.env.RAZORPAY_DEMO_FALLBACK === 'true' || process.env.NODE_ENV !== 'production';

    if (!isValidSignature && !allowFallback) {
      return res.status(400).json({ success: false, message: 'Invalid signature sent!' });
    }

    const due = await findDueRecord(studentId, department);
    if (!due) {
      return res.status(404).json({ success: false, message: 'Due record not found' });
    }

    const transactionId = `txn_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const updatedDue = {
      ...due,
      status: 'paid',
      transactionId,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      paidAt: new Date().toISOString()
    };

    await saveDueRecord(updatedDue);
    const allDues = await Due.find();
    await exportDuesToCSV(allDues);

    return res.json({
      success: true,
      message: isValidSignature ? 'Payment verified successfully' : 'Payment verified via demo fallback',
      transactionId,
      due: updatedDue,
      fallbackUsed: !isValidSignature
    });
  } catch (error) {
    console.error('Razorpay Verify Error:', error);
    res.status(500).json({ success: false, message: 'Error verifying payment' });
  }
};

app.post('/api/verify-payment', authMiddleware, verifyPaymentHandler);
app.post('/verify-payment', authMiddleware, verifyPaymentHandler);

app.get('/api/admin/analytics', authMiddleware, async (req, res) => {
  if (!['lab', 'hod', 'principal'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Only admins can view analytics' });
  }

  try {
    const twoDaysAgo = new Date();
    twoDaysAgo.setMinutes(twoDaysAgo.getMinutes() - 2);

    const totalPending = await Request.countDocuments({ finalStatus: 'pending' });
    const overdueRequests = await Request.countDocuments({ finalStatus: 'pending', updatedAt: { $lt: twoDaysAgo } });

    // Calculate authority-wise pending
    const requests = await Request.find({ finalStatus: 'pending' });
    let authorityWise = { lab: 0, hod: 0, principal: 0 };
    requests.forEach(req => {
      if (req.status.lab.state === 'pending') authorityWise.lab++;
      else if (req.status.lab.state === 'approved' && req.status.hod.state === 'pending') authorityWise.hod++;
      else if (req.status.lab.state === 'approved' && req.status.hod.state === 'approved' && req.status.principal.state === 'pending') authorityWise.principal++;
    });

    const reminderHistory = await ReminderLog.find()
      .populate('studentId', 'name identifier')
      .sort({ reminderDate: -1 })
      .limit(50);

    res.json({
      totalPending,
      overdueRequests,
      authorityWise,
      reminderHistory
    });
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
