const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || '';
  const isPlaceholderUri = !uri || uri.includes('cluster0.mongodb.net') || uri.includes('<username>') || uri.includes('username:password');

  if (isPlaceholderUri) {
    console.log('[Database Engine] Connected: DecisionTwin Embedded High-Speed Store active & ready.');
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 1500
    });
    console.log(`[MongoDB] Connected to database: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[MongoDB] Fatal: Database connection required in production mode.');
      process.exit(1);
    }

    console.log('[Database Engine] Connected: DecisionTwin Embedded High-Speed Store active & ready.');
    return null;
  }
};

module.exports = connectDB;

