const mongoose = require('mongoose');

async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(process.env.MONGO_URI);
  // eslint-disable-next-line no-console
  console.log(`[db] connected to ${mongoose.connection.name}`);

  mongoose.connection.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('[db] connection error:', err);
  });
}

module.exports = { connectDB };
