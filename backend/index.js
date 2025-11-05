require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const internshipsRoutes = require('./routes/internships');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
  crossOriginEmbedder: process.env.NODE_ENV === 'production',
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Environment variables
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aiml-internships';

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'aiml-internship-tracker-backend',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/internships', internshipsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Error Handler]', {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    requestId: req.id
  });
});

// Connect to MongoDB and start server
mongoose.connect(MONGODB_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  heartbeatFrequencyMS: 10000,
})
  .then(() => {
    console.log('Connected to MongoDB')
    app.listen(PORT, '0.0.0.0', ()=> console.log(`Server listening on port ${PORT}`))
  })
  .catch(err=>{
    console.error('MongoDB connection error:', err)
    // Still start server to serve basic endpoints (in case DB is temporarily down)
    app.listen(PORT, '0.0.0.0', ()=> console.log(`Server listening on port ${PORT} (no DB)`))
  })

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err)
})
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason)
})

