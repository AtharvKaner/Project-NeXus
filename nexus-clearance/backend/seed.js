require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nexus');

  await User.deleteMany({});
  
  const salt = await bcrypt.genSalt(10);
  const studentPass = await bcrypt.hash('1234', salt);

  const users = [
    { name: 'Atharv', email: 'atharv@test.com', password: studentPass, role: 'student' },
    { name: 'Rahul', email: 'rahul@test.com', password: studentPass, role: 'student' },
    { name: 'Priya', email: 'priya@test.com', password: studentPass, role: 'student' },
    { name: 'Vikas', email: 'vikas@test.com', password: studentPass, role: 'student' },
    { name: 'Lab Admin', email: 'lab@test.com', password: await bcrypt.hash('lab123', salt), role: 'lab' },
    { name: 'HOD', email: 'hod@test.com', password: await bcrypt.hash('hod123', salt), role: 'hod' },
    { name: 'Principal', email: 'principal@test.com', password: await bcrypt.hash('admin123', salt), role: 'principal' }
  ];

  await User.insertMany(users);
  console.log('Database seeded with dummy users!');
  process.exit();
};

seed();
