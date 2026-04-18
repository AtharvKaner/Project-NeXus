require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nexus');
    await mongoose.connection.dropDatabase();
    console.log('Database dropped.');

    const salt = await bcrypt.genSalt(10);
    const studentPass = await bcrypt.hash('1234', salt);

    const users = [
      { name: 'Atharv', identifier: '101', password: studentPass, role: 'student' },
      { name: 'Rahul', identifier: '102', password: studentPass, role: 'student' },
      { name: 'Priya', identifier: '103', password: studentPass, role: 'student' },
      { name: 'Neha', identifier: '104', password: studentPass, role: 'student' },
      { name: 'Vikas', identifier: '105', password: studentPass, role: 'student' },
      
      { name: 'Lab Admin', identifier: 'lab@test.com', password: await bcrypt.hash('lab123', salt), role: 'lab' },
      { name: 'HOD', identifier: 'hod@test.com', password: await bcrypt.hash('hod123', salt), role: 'hod' },
      { name: 'Principal', identifier: 'principal@test.com', password: await bcrypt.hash('admin123', salt), role: 'principal' }
    ];

    await User.insertMany(users);
    console.log('Database seeded with dummy users!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
