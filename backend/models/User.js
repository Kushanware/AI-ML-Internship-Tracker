const mongoose = require('mongoose')

const SavedSchema = new mongoose.Schema({
  internship: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship' },
  status: { type: String, enum: ['interested','applied','selected'], default: 'interested' },
  savedAt: { type: Date, default: Date.now },
  lastReminderAt: { type: Date }
}, { _id: false })

const UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  saved: [SavedSchema],
  preferences: {
    domains: [{ type: String }],
    locations: [{ type: String }],
    emailReminders: { type: Boolean, default: true }
  }
}, { timestamps: true })

module.exports = mongoose.model('User', UserSchema)
