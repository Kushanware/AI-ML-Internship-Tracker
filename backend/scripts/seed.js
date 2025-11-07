require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Internship = require('../models/Internship');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aiml-internships';

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const count = await Internship.estimatedDocumentCount();
    if (count > 0) {
      console.log(`DB already has ${count} internships. Skipping seeding.`);
      return;
    }

    const docs = [
      {
        title: 'AI/ML Intern',
        company: 'Acme AI',
        location: 'Remote',
        remote: true,
        stipendMin: 10000,
        stipendMax: 20000,
        durationWeeks: 12,
        skills: ['Python', 'Machine Learning', 'NLP'],
        description: 'Work on ML models and data pipelines.',
        source: 'Seed',
        sourceUrl: 'https://example.com/jobs/acme-ml-intern',
        deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
        postedAt: new Date(),
        tags: ['AI', 'ML', 'NLP'],
        uniqueHash: 'acme-ml-intern-1',
      },
      {
        title: 'Data Science Intern',
        company: 'DataCorp',
        location: 'Bengaluru',
        remote: false,
        stipendMin: 15000,
        stipendMax: 25000,
        durationWeeks: 24,
        skills: ['Python', 'Pandas', 'Statistics'],
        description: 'Assist with data analysis and model evaluation.',
        source: 'Seed',
        sourceUrl: 'https://example.com/jobs/datacorp-ds-intern',
        deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21),
        postedAt: new Date(),
        tags: ['Data Science', 'ML'],
        uniqueHash: 'datacorp-ds-intern-1',
      },
    ];

    await Internship.insertMany(docs, { ordered: false });
    console.log('Seeded internships');
  } catch (err) {
    console.error('Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();
