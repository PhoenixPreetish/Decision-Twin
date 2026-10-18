const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const digitalTwinRoutes = require('./routes/digitalTwinRoutes');
const scenarioRoutes = require('./routes/scenarioRoutes');
const simulationRoutes = require('./routes/simulationRoutes');
const whatIfRoutes = require('./routes/whatIfRoutes');
const reportRoutes = require('./routes/reportRoutes');
const marketRoutes = require('./routes/marketRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');

const app = express();

// CORS configuration (supports localhost, Vercel frontend domains, and wildcard in dev)
app.use(cors({
  origin: process.env.CLIENT_URL ? [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'] : '*',
  credentials: true
}));

app.use(express.json());

// Rate limiter for authentication endpoints (SRS 5.3)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' }
});

const mongoose = require('mongoose');

// Health check endpoint (for Render / Railway liveness probes)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'DecisionTwin AI REST API Layer',
    database: mongoose.connection.readyState === 1 ? 'connected (MongoDB Cloud/Local)' : 'active (Offline In-Memory Database Engine)',
    timestamp: new Date().toISOString(),
    version: '1.1.0'
  });
});

// Route bindings
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/digital-twin', digitalTwinRoutes);
app.use('/api/scenarios', scenarioRoutes);
app.use('/api/simulations', simulationRoutes);
app.use('/api/what-if', whatIfRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/chatbot', chatbotRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
