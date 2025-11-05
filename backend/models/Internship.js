const mongoose = require('mongoose')

const InternshipSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String },
  location: { type: String },
  remote: { type: Boolean, default: false },
  stipendMin: { type: Number },
  stipendMax: { type: Number },
  durationWeeks: { type: Number },
  skills: [{ type: String }],
  description: { type: String },
  source: { type: String },
  sourceUrl: { type: String, index: true },
  deadline: { type: Date },
  postedAt: { type: Date, default: Date.now },
  scrapedAt: { type: Date },
  tags: [{ type: String }],
  uniqueHash: { type: String, index: true },
  rawMeta: { type: mongoose.Schema.Types.Mixed }
})

module.exports = mongoose.model('Internship', InternshipSchema)
