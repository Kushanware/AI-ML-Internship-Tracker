const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config()
const Internship = require('../models/Internship')
const User = require('../models/User')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aiml-internships'

const sample = [
  {
    title: 'Machine Learning Intern',
    company: 'AI Labs',
    location: 'Remote',
    remote: true,
    stipendMin: 0,
    stipendMax: 5000,
    durationWeeks: 12,
    skills: ['Python','PyTorch','ML'],
    source: 'LinkedIn',
    sourceUrl: 'https://example.com/1',
    deadline: null,
    postedAt: new Date()
  },
  {
    title: 'Data Science Intern',
    company: 'DataCorp',
    location: 'Bengaluru, India',
    remote: false,
    stipendMin: 10000,
    stipendMax: 20000,
    durationWeeks: 8,
    skills: ['Python','Pandas','SQL'],
    source: 'Internshala',
    sourceUrl: 'https://example.com/2',
    deadline: new Date('2025-12-15'),
    postedAt: new Date()
  }
]

async function run(){
  await mongoose.connect(MONGODB_URI, { useNewUrlParser:true, useUnifiedTopology:true })
  console.log('Connected to MongoDB for seeding')
  await Internship.deleteMany({})
  const inserted = await Internship.insertMany(sample)
  console.log(`Seeded ${inserted.length} internships`)

  await User.deleteMany({})
  const passwordHash = await bcrypt.hash('Password123!', 10)
  const demoUser = await User.create({
    name: 'Demo Student',
    email: 'demo@example.com',
    passwordHash
  })

  if (inserted[0]) {
    demoUser.saved.push({ internship: inserted[0]._id, status: 'interested' })
    await demoUser.save()
  }

  console.log('Seeded demo user (email: demo@example.com, password: Password123!)')
  process.exit(0)
}

run().catch(err=>{console.error(err); process.exit(1)})
