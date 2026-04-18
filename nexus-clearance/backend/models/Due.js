const mongoose = require('mongoose');

const dueSchema = new mongoose.Schema({
  studentId: { type: String, required: true, index: true },
  name: { type: String, default: '' },
  department: { type: String, required: true, index: true },
  amount: { type: Number, default: 0 },
  status: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid', index: true },
  reason: { type: String, default: '' },
  transactionId: { type: String, default: '' },
  razorpayOrderId: { type: String, default: '' },
  razorpayPaymentId: { type: String, default: '' },
  paidAt: { type: Date, default: null }
}, { timestamps: true });

dueSchema.index({ studentId: 1, department: 1 }, { unique: true });

module.exports = mongoose.model('Due', dueSchema);
