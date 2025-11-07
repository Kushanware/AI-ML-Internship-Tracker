const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const internshipRoutes = require('./routes/internships');
const userRoutes = require('./routes/users');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const adminRoutes = require('./routes/admin');

const app = express();

// Security & basics
app.use(helmet());

// CORS config
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
const corsOptions = allowedOrigins.length
  ? {
      origin: function (origin, callback) {
        // Allow non-browser clients (no origin)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    }
  : { origin: true, credentials: true };
app.use(cors(corsOptions));

app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use(compression());

// Rate limiting (can be disabled via DISABLE_RATE_LIMIT=true)
if (process.env.DISABLE_RATE_LIMIT !== 'true') {
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 2000,
    skip: (req) => req.ip === '::1' || req.ip === '127.0.0.1' || (process.env.ADMIN_TOKEN && req.headers['x-admin-token'] === process.env.ADMIN_TOKEN),
  });
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });
  app.use(generalLimiter);
  app.use('/', authLimiter, authRoutes); // stricter for auth
} else {
  app.use('/', authRoutes);
}

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
// auth routes are mounted above with/without limiter
app.use('/', internshipRoutes);
app.use('/', userRoutes);
app.use('/', adminRoutes);

// 404 and error
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;