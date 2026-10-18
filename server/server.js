require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 DecisionTwin AI Server listening on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`=========================================`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(`[Unhandled Rejection]: ${err.message}`);
    // server.close(() => process.exit(1));
  });
});
