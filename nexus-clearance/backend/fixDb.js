const mongoose = require('mongoose');
require('dotenv').config();
const Request = require('./models/Request');

const fixDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nexus');
    console.log('Connected to DB');

    // Remove the problematic index if it exists
    try {
      await Request.collection.dropIndex('certId_1');
      console.log('Dropped certId_1 index successfully.');
    } catch (err) {
      console.log('Index certId_1 might not exist or already dropped.', err.message);
    }

    // Unset all certId fields that are explicitly null
    const result = await Request.updateMany(
      { certId: null },
      { $unset: { certId: 1 } }
    );
    console.log(`Unset certId for ${result.modifiedCount} documents.`);

    // Rebuild indexes
    await Request.syncIndexes();
    console.log('Indexes synced successfully.');

    console.log('Fix completed.');
    process.exit(0);
  } catch (err) {
    console.error('Error fixing DB:', err);
    process.exit(1);
  }
};

fixDatabase();
