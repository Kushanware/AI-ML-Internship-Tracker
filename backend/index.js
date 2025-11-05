const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Simple health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'aiml-internship-tracker-backend' });
});

// Sample internships (static for scaffold)
const sampleInternships = [
  {
    id: '1',
    title: 'Machine Learning Intern',
    company: 'AI Labs',
    location: 'Remote',
    remote: true,
    stipendMin: 0,
    stipendMax: 5000,
    durationWeeks: 12,
    skills: ['Python', 'PyTorch', 'ML'],
    source: 'LinkedIn',
    sourceUrl: 'https://example.com/1',
    deadline: null
  },
  {
    id: '2',
    title: 'Data Science Intern',
    company: 'DataCorp',
    location: 'Bengaluru, India',
    remote: false,
    stipendMin: 10000,
    stipendMax: 20000,
    durationWeeks: 8,
    skills: ['Python', 'Pandas', 'SQL'],
    source: 'Internshala',
    sourceUrl: 'https://example.com/2',
    deadline: '2025-12-15'
  }
];

app.get('/internships', (req, res) => {
  // TODO: replace with DB query and filters
  res.json({ count: sampleInternships.length, data: sampleInternships });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
