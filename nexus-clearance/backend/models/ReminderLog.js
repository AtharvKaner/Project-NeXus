const mongoose = require('mongoose');

const reminderLogSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorityName: { type: String, required: true },
  reminderDate: { type: Date, default: Date.now },
  emailStatus: { type: String, enum: ['sent', 'failed'], default: 'sent' }
}, { timestamps: true });

module.exports = mongoose.model('ReminderLog', reminderLogSchema);
