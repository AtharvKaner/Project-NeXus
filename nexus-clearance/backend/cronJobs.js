const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Request = require('./models/Request');
const ReminderLog = require('./models/ReminderLog');
const User = require('./models/User');

const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Run every minute for demo purposes
cron.schedule('* * * * *', async () => {
  console.log('[CRON] Running demo check for stale applications...');
  
  try {
    const twoDaysAgo = new Date();
    twoDaysAgo.setMinutes(twoDaysAgo.getMinutes() - 2); // Demo mode: 2 minutes instead of 2 days

    const staleRequests = await Request.find({
      finalStatus: 'pending',
      updatedAt: { $lt: twoDaysAgo }
    }).populate('studentId');

    if (staleRequests.length === 0) {
      console.log('[CRON] No stale applications found.');
      return;
    }

    // Get today's start and end date to check for duplicate reminders
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Dynamically fetch registered admins from the database
    const adminUsers = await User.find({ role: { $in: ['lab', 'hod', 'principal'] } }).select('identifier role');
    
    const labEmails = adminUsers.filter(u => u.role === 'lab').map(u => u.identifier).join(',');
    const hodEmails = adminUsers.filter(u => u.role === 'hod').map(u => u.identifier).join(',');
    const principalEmails = adminUsers.filter(u => u.role === 'principal').map(u => u.identifier).join(',');

    const authorityEmails = {
      lab: labEmails || process.env.LAB_EMAIL || 'lab-admin@nexus.edu',
      hod: hodEmails || process.env.HOD_EMAIL || 'hod-admin@nexus.edu',
      principal: principalEmails || process.env.PRINCIPAL_EMAIL || 'principal@nexus.edu'
    };

    const authorityNames = {
      lab: 'Laboratory',
      hod: 'HOD',
      principal: 'Principal'
    };

    for (let req of staleRequests) {
      let currentAuthorityKey = null;
      if (req.status.lab.state === 'pending') currentAuthorityKey = 'lab';
      else if (req.status.lab.state === 'approved' && req.status.hod.state === 'pending') currentAuthorityKey = 'hod';
      else if (req.status.lab.state === 'approved' && req.status.hod.state === 'approved' && req.status.principal.state === 'pending') currentAuthorityKey = 'principal';

      if (!currentAuthorityKey) continue;

      const authName = authorityNames[currentAuthorityKey];
      const authEmail = authorityEmails[currentAuthorityKey];

      // Demo Mode: Check if reminder was already sent in the last 2 minutes (instead of today)
      const recentLogTime = new Date();
      recentLogTime.setMinutes(recentLogTime.getMinutes() - 2);

      const existingLog = await ReminderLog.findOne({
        requestId: req._id,
        reminderDate: { $gte: recentLogTime }
      });

      if (existingLog) {
        continue; // Skip, already reminded today
      }

      // Prepare email for this specific request
      const mailOptions = {
        from: `"Nexus Automated System" <${process.env.EMAIL_USER || 'no-reply@nexus.edu'}>`,
        to: authEmail,
        subject: `Pending Clearance Request Reminder - ${req.studentName}`,
        text: `Dear ${authName} Authority,\n\nA student clearance request is pending for your review for more than 2 minutes.\nStudent: ${req.studentName} (${req.studentIdentifier})\n\nPlease login to Nexus Portal and take action.\n\nThank you.`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
            <h2 style="color: #06b6d4; margin-bottom: 20px;">Pending Clearance Request Reminder</h2>
            <p>Dear <strong>${authName} Authority</strong>,</p>
            <p>A student clearance request has been pending for your review for more than 2 minutes.</p>
            <ul>
              <li><strong>Student:</strong> ${req.studentName}</li>
              <li><strong>ID:</strong> ${req.studentIdentifier}</li>
              <li><strong>Submitted:</strong> ${new Date(req.createdAt).toLocaleDateString()}</li>
            </ul>
            <p>Please login to the Nexus Portal and take action.</p>
            <div style="margin: 30px 0;">
              <a href="http://localhost:5173/login?type=admin" style="background-color: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Login to Dashboard</a>
            </div>
            <p>Thank you.</p>
          </div>
        `
      };

      let emailStatus = 'failed';
      try {
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          await transporter.sendMail(mailOptions);
          emailStatus = 'sent';
          console.log(`[CRON] Live Email Sent to ${authName} for request ${req._id}`);
        } else {
          emailStatus = 'sent'; // Mark as sent in dev mode to allow testing logs
          console.log(`[CRON] (Dev Mode) Reminder prepared for ${authName} regarding request ${req._id}`);
        }
      } catch (err) {
        console.error(`[CRON] Failed to send email to ${authName}:`, err);
        emailStatus = 'failed';
      }

      // Save log
      await ReminderLog.create({
        requestId: req._id,
        studentId: req.studentId,
        authorityName: authName,
        emailStatus: emailStatus
      });
    }

    console.log('[CRON] Daily reminder check complete.');

  } catch (err) {
    console.error('[CRON] Error checking for stale applications:', err);
  }
});

console.log('[SYSTEM] Nexus Automatic Pending Request Reminder System initialized.');
