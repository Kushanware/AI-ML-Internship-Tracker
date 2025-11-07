require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Internship = require('../models/Internship');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aiml-internships';
const DAYS = Number(process.env.REMINDER_DAYS_BEFORE || 3);

async function main() {
  await mongoose.connect(MONGODB_URI);

  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email env not configured. Exiting.');
    await mongoose.disconnect();
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  const now = new Date();
  const target = new Date(now.getTime() + DAYS * 24 * 60 * 60 * 1000);

  const users = await User.find({ 'preferences.emailReminders': { $ne: false } });

  for (const user of users) {
    const savedIds = user.saved.map((s) => s.internship);
    if (!savedIds.length) continue;
    const internships = await Internship.find({ _id: { $in: savedIds }, deadline: { $lte: target, $gte: now } });

    if (!internships.length) continue;

    const text = internships
      .map((i) => `• ${i.title} @ ${i.company} — deadline: ${i.deadline?.toDateString()}\n${i.sourceUrl || ''}`)
      .join('\n\n');

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Upcoming deadlines in ${DAYS} day(s)`,
      text: `Hi ${user.name},\n\nThese internships have upcoming deadlines:\n\n${text}\n\nGood luck!`,
    });
  }

  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect();
  process.exit(1);
});
