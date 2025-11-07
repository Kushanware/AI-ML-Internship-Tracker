const mongoose = require('mongoose');

const InternshipSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, trim: true },
    location: { type: String, trim: true },
    remote: { type: Boolean, default: false },
    stipendMin: { type: Number },
    stipendMax: { type: Number },
    durationWeeks: { type: Number },
    skills: [{ type: String, trim: true }],
    description: { type: String },
    source: { type: String, trim: true },
    sourceUrl: { type: String, trim: true, index: true, unique: true, sparse: true },
    deadline: { type: Date },
    postedAt: { type: Date },
    scrapedAt: { type: Date, default: Date.now },
    tags: [{ type: String, trim: true }],
    uniqueHash: { type: String, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Internship', InternshipSchema);
