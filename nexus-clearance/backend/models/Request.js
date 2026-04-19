const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema({
  state: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  comment: { type: String, default: '' }
}, { _id: false });

const requestSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentIdentifier: { type: String, required: true },
  studentName: { type: String, required: true },
  status: {
    lab: { type: statusSchema, default: () => ({}) },
    hod: { type: statusSchema, default: () => ({}) },
    principal: { type: statusSchema, default: () => ({}) }
  },
  documents: {
    idCard: { name: String, fileType: String, dataUrl: String },
    libraryReceipt: { name: String, fileType: String, dataUrl: String },
    labClearance: { name: String, fileType: String, dataUrl: String }
  },
  certId: { type: String, unique: true, sparse: true },
  certificateIssuedAt: { type: Date, default: null },
  finalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
