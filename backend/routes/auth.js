const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

/**
 * Issue a JWT token for a user
 */
const issueToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      email: user.email,
      roles: user.roles || []
    }, 
    process.env.JWT_SECRET || 'dev_jwt_secret',
    {
      expiresIn: '7d',
      algorithm: 'HS256'
    }
  );
};

/**
 * @route POST /auth/register
 * @desc Register a new user
 */
router.post(
  '/register',
  [
    // Validation middleware
    body('name')
      .optional()
      .isString().withMessage('Name must be a string')
      .trim()
      .isLength({ min: 2, max: 120 }).withMessage('Name must be between 2 and 120 characters'),
    body('email')
      .isEmail().withMessage('Valid email required')
      .normalizeEmail()
      .custom(async (email) => {
        const existing = await User.findOne({ email });
        if (existing) {
          throw new Error('Email already registered');
        }
        return true;
      }),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase and numbers')
  ],
  async (req, res) => {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { name, email, password } = req.body;

    try {
      // Hash password with strong salt
      const passwordHash = await bcrypt.hash(password, 12);
      
      // Create user with default preferences
      const user = await User.create({ 
        name, 
        email, 
        passwordHash,
        preferences: {
          domains: ['AI', 'ML', 'Data Science'],
          emailReminders: true
        }
      });

      // Generate token and send response
      const token = issueToken(user);
      res.status(201).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          preferences: user.preferences
        }
      });

    } catch (err) {
      console.error('[Auth] Registration failed:', {
        error: err.message,
        email: email // Log email for debugging
      });
      res.status(500).json({ 
        error: 'Registration failed',
        message: 'Unable to create account. Please try again later.'
      });
    }
  });
);

/**
 * @route POST /auth/login
 * @desc Authenticate user and get token
 */
router.post(
  '/login',
  [
    body('email')
      .isEmail().withMessage('Valid email required')
      .normalizeEmail(),
    body('password')
      .isString().withMessage('Password is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    try {
      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid email or password'
        });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid email or password'
        });
      }

      // Issue token and send response
      const token = issueToken(user);
      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          preferences: user.preferences
        }
      });

    } catch (err) {
      console.error('[Auth] Login failed:', {
        error: err.message,
        email
      });
      res.status(500).json({
        error: 'Login failed',
        message: 'Unable to authenticate. Please try again later.'
      });
    }
  }
);

/**
 * @route GET /auth/me
 * @desc Get current user profile
 */
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({
        error: 'Not found',
        message: 'User account not found'
      });
    }
    res.json({ user });
  } catch (err) {
    console.error('[Auth] Profile fetch failed:', {
      error: err.message,
      userId: req.user?.id
    });
    res.status(500).json({
      error: 'Profile fetch failed',
      message: 'Unable to retrieve profile. Please try again later.'
    });
  }
});

module.exports = router;
    }
  }
)

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body

    try {
      const user = await User.findOne({ email })
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      const match = await bcrypt.compare(password, user.passwordHash || '')
      if (!match) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      const token = issueToken(user._id.toString())
      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      })
    } catch (err) {
      console.error('Error in login', err)
      res.status(500).json({ error: 'Failed to login' })
    }
  }
)

module.exports = router
