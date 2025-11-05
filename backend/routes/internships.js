const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Internship = require('../models/Internship');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /internships
 * @desc Search and filter internships
 */
router.get('/', [
  query('search').optional().isString(),
  query('skills').optional().isString(),
  query('location').optional().isString(),
  query('remote').optional().isBoolean(),
  query('minStipend').optional().isNumeric(),
  query('sortBy').optional().isIn(['postedAt', 'deadline', 'stipendMin']),
  query('order').optional().isIn(['asc', 'desc']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Invalid query parameters',
      details: errors.array() 
    });
  }

  try {
    const {
      search,
      skills,
      location,
      remote,
      minStipend,
      sortBy = 'postedAt',
      order = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (skills) {
      query.skills = { 
        $in: skills.split(',').map(s => new RegExp(s.trim(), 'i')) 
      };
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (remote !== undefined) {
      query.remote = remote;
    }

    if (minStipend) {
      query.stipendMin = { $gte: parseInt(minStipend) };
    }

    // Add filter for active internships
    query.deadline = { $gt: new Date() };

    // Execute query with pagination
    const [items, total] = await Promise.all([
      Internship.find(query)
        .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Internship.countDocuments(query)
    ]);

    res.json({ 
      data: items,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });

  } catch (err) {
    console.error('[Internships] Search failed:', {
      error: err.message,
      query: req.query
    });
    res.status(500).json({ 
      error: 'Search failed',
      message: 'Unable to search internships. Please try again.'
    });
  }
});

/**
 * @route POST /internships
 * @desc Create a new internship listing
 */
router.post(
  '/',
  auth, // Require authentication
  [
    body('title')
      .notEmpty().withMessage('Title is required')
      .isString().withMessage('Title must be a string')
      .trim(),
    body('company')
      .optional()
      .isString().withMessage('Company must be a string')
      .trim(),
    body('sourceUrl')
      .optional()
      .isURL().withMessage('Source URL must be a valid URL'),
    body('deadline')
      .optional()
      .isISO8601().withMessage('Deadline must be a valid date')
      .toDate(),
    body('skills')
      .optional()
      .isArray().withMessage('Skills must be an array'),
    body('remote')
      .optional()
      .isBoolean().withMessage('Remote must be a boolean'),
    body('stipendMin')
      .optional()
      .isNumeric().withMessage('Stipend min must be a number'),
    body('stipendMax')
      .optional()
      .isNumeric().withMessage('Stipend max must be a number')
      .custom((value, { req }) => {
        if (req.body.stipendMin && value < req.body.stipendMin) {
          throw new Error('Maximum stipend cannot be less than minimum');
        }
        return true;
      })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    try {
      const payload = req.body;
      
      // Generate unique hash for deduplication
      payload.uniqueHash = require('crypto')
        .createHash('md5')
        .update(payload.sourceUrl || payload.title + payload.company)
        .digest('hex');

      const internship = await Internship.create({
        title: payload.title,
        company: payload.company,
        location: payload.location,
        remote: payload.remote,
        stipendMin: payload.stipendMin,
        stipendMax: payload.stipendMax,
        durationWeeks: payload.durationWeeks,
        skills: payload.skills,
        description: payload.description,
        source: payload.source,
        sourceUrl: payload.sourceUrl,
        deadline: payload.deadline,
        postedAt: payload.postedAt || new Date(),
        tags: payload.tags || [],
        uniqueHash: payload.uniqueHash,
        rawMeta: payload.rawMeta
      });

      res.status(201).json({ data: internship });
    } catch (err) {
      if (err.code === 11000) { // Duplicate key error
        return res.status(409).json({
          error: 'Duplicate internship',
          message: 'This internship has already been added'
        });
      }

      console.error('[Internships] Creation failed:', {
        error: err.message,
        title: req.body.title
      });
      res.status(500).json({
        error: 'Creation failed',
        message: 'Unable to create internship. Please try again.'
      });
    }
  }
);

/**
 * @route GET /internships/saved
 * @desc Get user's saved internships
 */
router.get('/saved', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('saved.internship')
      .lean();

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Unable to find user account'
      });
    }

    const saved = user.saved.filter(s => s.internship != null);
    res.json({ data: saved });

  } catch (err) {
    console.error('[Internships] Fetch saved failed:', {
      error: err.message,
      userId: req.user.id
    });
    res.status(500).json({
      error: 'Fetch failed',
      message: 'Unable to fetch saved internships. Please try again.'
    });
  }
});

/**
 * @route POST /internships/:id/save
 * @desc Save/unsave an internship
 */
router.post('/:id/save', auth, [
  body('status')
    .isIn(['interested', 'applied', 'selected'])
    .withMessage('Invalid status')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array() 
    });
  }

  try {
    const internshipId = req.params.id;
    const { status } = req.body;

    // Verify internship exists
    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Internship not found'
      });
    }

    // Update user's saved internships
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Unable to find user account'
      });
    }

    const savedIndex = user.saved.findIndex(
      s => s.internship.toString() === internshipId
    );

    if (savedIndex === -1) {
      // Add new saved internship
      user.saved.push({
        internship: internshipId,
        status,
        savedAt: new Date()
      });
    } else {
      // Update existing status
      user.saved[savedIndex].status = status;
    }

    await user.save();
    res.json({ message: 'Updated successfully' });

  } catch (err) {
    console.error('[Internships] Save status failed:', {
      error: err.message,
      internshipId: req.params.id,
      userId: req.user.id
    });
    res.status(500).json({
      error: 'Update failed',
      message: 'Unable to update internship status. Please try again.'
    });
  }
});

/**
 * @route DELETE /internships/:id/save
 * @desc Remove an internship from saved list
 */
router.delete('/:id/save', auth, async (req, res) => {
  try {
    const internshipId = req.params.id;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Unable to find user account'
      });
    }

    // Remove from saved array
    user.saved = user.saved.filter(
      s => s.internship.toString() !== internshipId
    );

    await user.save();
    res.json({ message: 'Removed successfully' });

  } catch (err) {
    console.error('[Internships] Remove saved failed:', {
      error: err.message,
      internshipId: req.params.id,
      userId: req.user.id
    });
    res.status(500).json({
      error: 'Remove failed',
      message: 'Unable to remove internship. Please try again.'
    });
  }
});

module.exports = router;
        scrapedAt: payload.scrapedAt,
        tags: payload.tags,
        uniqueHash: payload.uniqueHash,
        rawMeta: payload.rawMeta
      })

      res.status(201).json({ internship })
    } catch (err) {
      console.error('Error creating internship', err)
      res.status(500).json({ error: 'Failed to create internship' })
    }
  }
)

module.exports = router
