require('dotenv').config();
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const mongoose = require('mongoose');
const User = require('../models/User');
const Internship = require('../models/Internship');

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Check and send deadline reminders
 */
async function sendDeadlineReminders() {
  console.log('[Notifications] Checking for upcoming deadlines:', new Date().toISOString());

  try {
    // Connect to MongoDB if not connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aiml-internships');
    }

    // Get users who want email notifications
    const users = await User.find({
      'preferences.emailReminders': true,
      'saved': { $exists: true, $not: { $size: 0 } }
    }).populate('saved.internship');

    // Process each user
    for (const user of users) {
      try {
        const deadlineInternships = [];

        // Check each saved internship
        for (const saved of user.saved) {
          if (!saved.internship || !saved.internship.deadline) continue;

          const daysUntilDeadline = Math.ceil(
            (saved.internship.deadline - new Date()) / (1000 * 60 * 60 * 24)
          );

          // Only remind if:
          // 1. Deadline is within next 3 days
          // 2. Haven't sent a reminder in last 24 hours
          // 3. User hasn't marked it as 'applied' or 'selected'
          if (
            daysUntilDeadline <= 3 && 
            daysUntilDeadline > 0 &&
            saved.status === 'interested' &&
            (!saved.lastReminderAt || 
              Date.now() - saved.lastReminderAt.getTime() > 24 * 60 * 60 * 1000)
          ) {
            deadlineInternships.push({
              internship: saved.internship,
              daysLeft: daysUntilDeadline
            });
          }
        }

        // Send email if there are upcoming deadlines
        if (deadlineInternships.length > 0) {
          await sendDeadlineEmail(user.email, deadlineInternships);
          
          // Update reminder timestamps
          const updates = deadlineInternships.map(({ internship }) => ({
            'saved.$[elem].lastReminderAt': new Date()
          }));

          await User.updateOne(
            { _id: user._id },
            { $set: updates },
            {
              arrayFilters: [
                { 'elem.internship': { $in: deadlineInternships.map(d => d.internship._id) } }
              ]
            }
          );
        }
      } catch (err) {
        console.error('[Notifications] Failed to process user:', {
          userId: user._id,
          error: err.message
        });
      }
    }

  } catch (err) {
    console.error('[Notifications] Deadline check failed:', err);
  }
}

/**
 * Send new internship notifications
 */
async function sendNewInternshipNotifications() {
  console.log('[Notifications] Checking for new internships:', new Date().toISOString());

  try {
    // Connect to MongoDB if not connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aiml-internships');
    }

    // Get internships posted in last 24 hours
    const newInternships = await Internship.find({
      postedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (newInternships.length === 0) return;

    // Group internships by domain/skills
    const domainGroups = new Map();
    for (const internship of newInternships) {
      for (const skill of internship.skills) {
        if (!domainGroups.has(skill)) {
          domainGroups.set(skill, []);
        }
        domainGroups.get(skill).push(internship);
      }
    }

    // Get users who want notifications
    const users = await User.find({
      'preferences.emailReminders': true
    });

    // Send notifications to each user based on their preferences
    for (const user of users) {
      try {
        const relevantInternships = new Set();
        
        // Match internships with user's preferred domains
        for (const domain of (user.preferences?.domains || [])) {
          const matches = domainGroups.get(domain) || [];
          matches.forEach(i => relevantInternships.add(i));
        }

        if (relevantInternships.size > 0) {
          await sendNewInternshipsEmail(
            user.email,
            Array.from(relevantInternships)
          );
        }
      } catch (err) {
        console.error('[Notifications] Failed to notify user:', {
          userId: user._id,
          error: err.message
        });
      }
    }

  } catch (err) {
    console.error('[Notifications] New internships check failed:', err);
  }
}

/**
 * Send deadline reminder email
 */
async function sendDeadlineEmail(to, deadlineInternships) {
  const html = `
    <h2>⏰ Deadline Reminders</h2>
    <p>The following internships you're interested in have upcoming deadlines:</p>
    ${deadlineInternships.map(({ internship, daysLeft }) => `
      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0;">${internship.title}</h3>
        <p style="margin: 5px 0; color: #64748b;">
          ${internship.company}${internship.location ? ` • ${internship.location}` : ''}
        </p>
        <p style="margin: 5px 0; color: #dc2626; font-weight: bold;">
          Deadline in ${daysLeft} day${daysLeft > 1 ? 's' : ''}!
        </p>
        ${internship.sourceUrl ? `
          <a href="${internship.sourceUrl}" style="display: inline-block; margin-top: 10px; padding: 8px 12px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 4px;">
            View Details & Apply
          </a>
        ` : ''}
      </div>
    `).join('')}
    <p style="color: #64748b; font-size: 14px;">
      You're receiving this email because you enabled deadline reminders. 
      You can disable these notifications in your account settings.
    </p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: '🚨 Upcoming Internship Deadlines',
    html
  });
}

/**
 * Send new internships notification email
 */
async function sendNewInternshipsEmail(to, internships) {
  const html = `
    <h2>🎯 New AI/ML Internships</h2>
    <p>We found ${internships.length} new internship${internships.length > 1 ? 's' : ''} matching your interests:</p>
    ${internships.map(internship => `
      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0;">${internship.title}</h3>
        <p style="margin: 5px 0; color: #64748b;">
          ${internship.company}${internship.location ? ` • ${internship.location}` : ''}
        </p>
        ${internship.stipendMin ? `
          <p style="margin: 5px 0;">
            Stipend: ₹${internship.stipendMin.toLocaleString()}${
              internship.stipendMax ? ` - ₹${internship.stipendMax.toLocaleString()}` : ''
            }
          </p>
        ` : ''}
        ${internship.deadline ? `
          <p style="margin: 5px 0;">
            Deadline: ${internship.deadline.toLocaleDateString()}
          </p>
        ` : ''}
        ${internship.sourceUrl ? `
          <a href="${internship.sourceUrl}" style="display: inline-block; margin-top: 10px; padding: 8px 12px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 4px;">
            View Details
          </a>
        ` : ''}
      </div>
    `).join('')}
    <p style="color: #64748b; font-size: 14px;">
      You're receiving this email because you enabled internship notifications. 
      You can customize your preferences or disable notifications in your account settings.
    </p>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: `🎉 ${internships.length} New AI/ML Internship${internships.length > 1 ? 's' : ''} Found`,
    html
  });
}

// Schedule tasks:
// Check deadlines every 12 hours
cron.schedule('0 */12 * * *', sendDeadlineReminders);

// Check new internships every 6 hours
cron.schedule('0 */6 * * *', sendNewInternshipNotifications);

// Run both immediately on script start
Promise.all([
  sendDeadlineReminders(),
  sendNewInternshipNotifications()
]);