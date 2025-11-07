const express = require('express');
const { body, validationResult } = require('express-validator');
const Internship = require('../models/Internship');

const router = express.Router();

// GET /internships with filters and pagination
router.get('/internships', async (req, res) => {
  try {
    const {
      domain,
      tags,
      location,
      remote,
      minStipend,
      maxStipend,
      source,
      deadlineFrom,
      deadlineTo,
      sort,
      q,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};
    if (location) filter.location = new RegExp(location, 'i');
    if (source) filter.source = new RegExp(`^${source}$`, 'i');
    if (remote !== undefined) filter.remote = String(remote) === 'true';
    const selectedTags = tags ? String(tags).split(',').map((s) => s.trim()).filter(Boolean) : [];
    if (selectedTags.length) filter.tags = { $in: selectedTags };
    else if (domain) filter.tags = { $in: [new RegExp(domain, 'i')] };
    if (minStipend) filter.stipendMin = { ...(filter.stipendMin || {}), $gte: Number(minStipend) };
    if (maxStipend) filter.stipendMax = { ...(filter.stipendMax || {}), $lte: Number(maxStipend) };
    if (deadlineFrom || deadlineTo) {
      filter.deadline = { ...(filter.deadline || {}) };
      if (deadlineFrom) filter.deadline.$gte = new Date(deadlineFrom);
      if (deadlineTo) filter.deadline.$lte = new Date(deadlineTo);
    }
    if (q) {
      filter.$or = [
        { title: new RegExp(q, 'i') },
        { company: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    let sortSpec = { postedAt: -1, createdAt: -1 };
    if (sort === 'deadline_asc') sortSpec = { deadline: 1, postedAt: -1 };
    else if (sort === 'stipend_desc') sortSpec = { stipendMax: -1, stipendMin: -1 };
    else if (sort === 'oldest') sortSpec = { postedAt: 1, createdAt: 1 };

    const [count, data] = await Promise.all([
      Internship.countDocuments(filter),
      Internship.find(filter).sort(sortSpec).skip(skip).limit(Number(limit)),
    ]);

    res.json({ count, data });
  } catch (err) {
    console.error('GET /internships error:', err.message);
    res.status(500).json({ error: 'Failed to fetch internships' });
  }
});

// Meta: distinct sources and top tags (global)
router.get('/internships/meta', async (req, res) => {
  try {
    const sources = (await Internship.distinct('source')).filter(Boolean).sort();
    const tagAgg = await Internship.aggregate([
      { $unwind: '$tags' },
      { $match: { tags: { $ne: null } } },
      { $group: { _id: '$tags', c: { $sum: 1 } } },
      { $sort: { c: -1 } },
      { $limit: 30 },
    ]);
    const tags = tagAgg.map((t) => t._id);
    res.json({ sources, tags });
  } catch (err) {
    console.error('GET /internships/meta error:', err.message);
    res.status(500).json({ error: 'Failed to fetch meta' });
  }
});

// Facets scoped to current filters
router.get('/internships/facets', async (req, res) => {
  try {
    const {
      domain,
      tags,
      location,
      remote,
      minStipend,
      maxStipend,
      source,
      deadlineFrom,
      deadlineTo,
      q,
    } = req.query;

    const filter = {};
    if (location) filter.location = new RegExp(location, 'i');
    if (source) filter.source = new RegExp(`^${source}$`, 'i');
    if (remote !== undefined) filter.remote = String(remote) === 'true';
    const selectedTags = tags ? String(tags).split(',').map((s) => s.trim()).filter(Boolean) : [];
    if (selectedTags.length) filter.tags = { $in: selectedTags };
    else if (domain) filter.tags = { $in: [new RegExp(domain, 'i')] };
    if (minStipend) filter.stipendMin = { ...(filter.stipendMin || {}), $gte: Number(minStipend) };
    if (maxStipend) filter.stipendMax = { ...(filter.stipendMax || {}), $lte: Number(maxStipend) };
    if (deadlineFrom || deadlineTo) {
      filter.deadline = { ...(filter.deadline || {}) };
      if (deadlineFrom) filter.deadline.$gte = new Date(deadlineFrom);
      if (deadlineTo) filter.deadline.$lte = new Date(deadlineTo);
    }
    if (q) {
      filter.$or = [
        { title: new RegExp(q, 'i') },
        { company: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
      ];
    }

    const facets = await Internship.aggregate([
      { $match: filter },
      {
        $facet: {
          sources: [
            { $group: { _id: '$source', c: { $sum: 1 } } },
            { $sort: { c: -1 } },
            { $limit: 20 },
          ],
          tags: [
            { $unwind: '$tags' },
            { $group: { _id: '$tags', c: { $sum: 1 } } },
            { $sort: { c: -1 } },
            { $limit: 30 },
          ],
        },
      },
    ]);

    const out = facets[0] || { sources: [], tags: [] };
    res.json({ sources: out.sources.map((s) => s._id).filter(Boolean), tags: out.tags.map((t) => t._id).filter(Boolean) });
  } catch (err) {
    console.error('GET /internships/facets error:', err.message);
    res.status(500).json({ error: 'Failed to fetch facets' });
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
