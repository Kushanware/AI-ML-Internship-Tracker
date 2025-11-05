const express = require('express')
const { body, param, validationResult } = require('express-validator')
const mongoose = require('mongoose')
const User = require('../models/User')
const Internship = require('../models/Internship')
const auth = require('../middleware/auth')

const router = express.Router()

const statusOptions = ['interested', 'applied', 'selected']

const formatSaved = (user) =>
  user.saved.map((entry) => ({
    internship: entry.internship instanceof mongoose.Types.ObjectId ? entry.internship : entry.internship?._id,
    status: entry.status,
    savedAt: entry.savedAt,
    lastReminderAt: entry.lastReminderAt,
    internshipDetails: entry.internship && entry.internship.title
      ? {
          id: entry.internship._id,
          title: entry.internship.title,
          company: entry.internship.company,
          location: entry.internship.location,
          remote: entry.internship.remote,
          stipendMin: entry.internship.stipendMin,
          stipendMax: entry.internship.stipendMax,
          deadline: entry.internship.deadline,
          source: entry.internship.source
        }
      : undefined
  }))

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  next()
}

router.use(auth)

router.get('/me/saved', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'saved.internship',
      select: 'title company location remote stipendMin stipendMax deadline source'
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ saved: formatSaved(user) })
  } catch (err) {
    console.error('Error fetching saved internships', err)
    res.status(500).json({ error: 'Failed to fetch saved internships' })
  }
})

router.post(
  '/me/save',
  [body('internshipId').notEmpty().withMessage('internshipId required')],
  validate,
  async (req, res) => {
    const { internshipId } = req.body

    if (!mongoose.Types.ObjectId.isValid(internshipId)) {
      return res.status(400).json({ error: 'Invalid internshipId' })
    }

    try {
      const internship = await Internship.findById(internshipId)
      if (!internship) {
        return res.status(404).json({ error: 'Internship not found' })
      }

      const user = await User.findById(req.user.id)
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      const existing = user.saved.find((entry) => entry.internship.toString() === internshipId)
      if (existing) {
        return res.status(200).json({ message: 'Already saved', saved: formatSaved(user) })
      }

      user.saved.push({ internship: internshipId })
      await user.save()

      await user.populate({
        path: 'saved.internship',
        select: 'title company location remote stipendMin stipendMax deadline source'
      })

      res.status(201).json({ saved: formatSaved(user) })
    } catch (err) {
      console.error('Error saving internship', err)
      res.status(500).json({ error: 'Failed to save internship' })
    }
  }
)

router.patch(
  '/me/save/:internshipId',
  [
    param('internshipId').notEmpty(),
    body('status').isIn(statusOptions).withMessage('Invalid status')
  ],
  validate,
  async (req, res) => {
    const { internshipId } = req.params
    const { status } = req.body

    if (!mongoose.Types.ObjectId.isValid(internshipId)) {
      return res.status(400).json({ error: 'Invalid internshipId' })
    }

    try {
      const user = await User.findById(req.user.id)
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      const entry = user.saved.find((item) => item.internship.toString() === internshipId)
      if (!entry) {
        return res.status(404).json({ error: 'Internship not saved' })
      }

      entry.status = status
      await user.save()

      await user.populate({
        path: 'saved.internship',
        select: 'title company location remote stipendMin stipendMax deadline source'
      })

      res.json({ saved: formatSaved(user) })
    } catch (err) {
      console.error('Error updating status', err)
      res.status(500).json({ error: 'Failed to update status' })
    }
  }
)

router.delete(
  '/me/save/:internshipId',
  [param('internshipId').notEmpty()],
  validate,
  async (req, res) => {
    const { internshipId } = req.params

    if (!mongoose.Types.ObjectId.isValid(internshipId)) {
      return res.status(400).json({ error: 'Invalid internshipId' })
    }

    try {
      const user = await User.findById(req.user.id)
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      const initialLength = user.saved.length
      user.saved = user.saved.filter((item) => item.internship.toString() !== internshipId)

      if (user.saved.length === initialLength) {
        return res.status(404).json({ error: 'Internship not saved' })
      }

      await user.save()

      await user.populate({
        path: 'saved.internship',
        select: 'title company location remote stipendMin stipendMax deadline source'
      })

      res.json({ saved: formatSaved(user) })
    } catch (err) {
      console.error('Error removing saved internship', err)
      res.status(500).json({ error: 'Failed to remove saved internship' })
    }
  }
)

module.exports = router
