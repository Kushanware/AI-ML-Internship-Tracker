const express = require('express');
const { body, validationResult } = require('express-validator');
const Internship = require('../models/Internship');

const router = express.Router();

// GET /internships with filters and pagination
router.get('/internships', async (req, res) => {
  try {
    const {
      domain,
      location,
      remote,
      minStipend,
      maxStipend,
      source,
      q,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};
    if (location) filter.location = new RegExp(location, 'i');
    if (source) filter.source = new RegExp(source, 'i');
    if (remote !== undefined) filter.remote = String(remote) === 'true';
    if (domain) filter.tags = { $in: [new RegExp(domain, 'i')] };
    if (minStipend) filter.stipendMin = { ...(filter.stipendMin || {}), $gte: Number(minStipend) };
    if (maxStipend) filter.stipendMax = { ...(filter.stipendMax || {}), $lte: Number(maxStipend) };
    if (q) {
      filter.$or = [
        { title: new RegExp(q, 'i') },
        { company: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [count, data] = await Promise.all([
      Internship.countDocuments(filter),
      Internship.find(filter).sort({ postedAt: -1, createdAt: -1 }).skip(skip).limit(Number(limit)),
    ]);

    res.json({ count, data });
  } catch (err) {
    console.error('GET /internships error:', err.message);
    res.status(500).json({ error: 'Failed to fetch internships' });
  }
});

// GET /internships/:id
router.get('/internships/:id', async (req, res) => {
  try {
    const doc = await Internship.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: 'Invalid ID' });
  }
});

// POST /internships (upsert by sourceUrl or uniqueHash)
const admin = require('../middleware/admin');
router.post(
  '/internships',
  admin,
  [body('title').isString().notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const payload = req.body;

    try {
      const by = payload.sourceUrl
        ? { sourceUrl: payload.sourceUrl }
        : payload.uniqueHash
        ? { uniqueHash: payload.uniqueHash }
        : null;

      let doc;
      if (by) {
        doc = await Internship.findOneAndUpdate(by, { $set: payload }, { new: true, upsert: true });
      } else {
        doc = await Internship.create(payload);
      }
      const status = doc.wasNew ? 201 : 200; // not reliable, but ok for MVP
      res.status(status).json({ internship: doc });
    } catch (err) {
      if (err.code === 11000) return res.status(200).json({ message: 'Duplicate ignored' });
      console.error('POST /internships error:', err.message);
      res.status(500).json({ error: 'Failed to upsert internship' });
    }
  }
);

module.exports = router;
