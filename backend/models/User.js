const mongoose = require('mongoose');

const SavedSchema = new mongoose.Schema(
  {
    internship: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship', required: true },
    status: { type: String, enum: ['interested', 'applied', 'selected'], default: 'interested' },
    savedAt: { type: Date, default: Date.now },
    reminders: [{ type: Date }],
    lastReminderAt: { type: Date },
  },
  { _id: false }
);

const PreferencesSchema = new mongoose.Schema(
  {
    domains: [{ type: String }],
    locations: [{ type: String }],
    emailReminders: { type: Boolean, default: true },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    saved: [SavedSchema],
    preferences: PreferencesSchema,
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
