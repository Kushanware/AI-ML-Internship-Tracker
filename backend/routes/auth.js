const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

router.post(
  '/auth/register',
  [
    body('name').isString().trim().isLength({ min: 2 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;
    try {
      const existing = await User.findOne({ email });
      if (existing) return res.status(409).json({ error: 'Email already registered' });

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email, passwordHash });
      const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, process.env.JWT_SECRET, {
        expiresIn: '7d',
      });
      return res.status(201).json({ user: { id: user._id, name: user.name, email: user.email }, token });
    } catch (err) {
      console.error('POST /auth/register error:', err.message);
      return res.status(500).json({ error: 'Registration failed' });
    }
  }
);

router.post(
  '/auth/login',
  [body('email').isEmail().normalizeEmail(), body('password').isLength({ min: 6 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ error: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
      const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, process.env.JWT_SECRET, {
        expiresIn: '7d',
      });
      return res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
      console.error('POST /auth/login error:', err.message);
      return res.status(500).json({ error: 'Login failed' });
    }
  }
);

module.exports = router;
