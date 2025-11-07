const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// GET /users/:id (sanitized)
router.get('/users/:id', auth, async (req, res) => {
  if (req.user.id !== req.params.id) return res.status(403).json({ error: 'Forbidden' });
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { _id, name, email, preferences } = user;
  res.json({ id: _id, name, email, preferences: preferences || {} });
});

// GET /users/:id/saved
router.get('/users/:id/saved', auth, async (req, res) => {
  if (req.user.id !== req.params.id) return res.status(403).json({ error: 'Forbidden' });
  const user = await User.findById(req.params.id).populate('saved.internship');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user.saved);
});

// POST /users/:id/save { internshipId }
router.post(
  '/users/:id/save',
  auth,
  [body('internshipId').isMongoId()],
  async (req, res) => {
    if (req.user.id !== req.params.id) return res.status(403).json({ error: 'Forbidden' });
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { internshipId } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const exists = user.saved.find((s) => s.internship?.toString() === internshipId);
    if (!exists) user.saved.push({ internship: internshipId, status: 'interested' });
    await user.save();
    res.status(201).json(user.saved);
  }
);

// PATCH /users/:id/status { internshipId, status }
router.patch(
  '/users/:id/status',
  auth,
  [body('internshipId').isMongoId(), body('status').isIn(['interested', 'applied', 'selected'])],
  async (req, res) => {
    if (req.user.id !== req.params.id) return res.status(403).json({ error: 'Forbidden' });
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { internshipId, status } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const item = user.saved.find((s) => s.internship?.toString() === internshipId);
    if (!item) return res.status(404).json({ error: 'Saved internship not found' });

    item.status = status;
    await user.save();
    res.json(user.saved);
  }
);

// DELETE /users/:id/save/:internshipId
router.delete('/users/:id/save/:internshipId', auth, async (req, res) => {
  if (req.user.id !== req.params.id) return res.status(403).json({ error: 'Forbidden' });
  const { internshipId } = req.params;
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.saved = user.saved.filter((s) => s.internship?.toString() !== internshipId);
  await user.save();
  res.status(204).send();
});

// PATCH /users/:id/preferences { emailReminders?, domains?, locations? }
router.patch('/users/:id/preferences', auth, async (req, res) => {
  if (req.user.id !== req.params.id) return res.status(403).json({ error: 'Forbidden' });
  const { emailReminders, domains, locations } = req.body || {};
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (typeof emailReminders === 'boolean') user.preferences = { ...(user.preferences || {}), emailReminders };
  if (Array.isArray(domains)) user.preferences = { ...(user.preferences || {}), domains };
  if (Array.isArray(locations)) user.preferences = { ...(user.preferences || {}), locations };
  await user.save();
  res.json({ preferences: user.preferences || {} });
});

module.exports = router;
