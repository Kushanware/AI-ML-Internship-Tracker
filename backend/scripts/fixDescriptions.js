require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Internship = require('../models/Internship');
const { decodeHTML } = require('./scraper/util');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aiml-internships';

async function run() {
  await mongoose.connect(MONGODB_URI);
  const cursor = Internship.find({ description: /&lt;|&gt;|&amp;|&#39;|&quot;/ }).cursor();
  let n = 0;
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    const clean = decodeHTML(doc.description || '').replace(/<[^>]+>/g, '');
    if (clean !== doc.description) {
      doc.description = clean;
      await doc.save();
      n++;
    }
  }
  console.log(`Fixed ${n} descriptions`);
  await mongoose.disconnect();
}

if (require.main === module) {
  run().catch(async (e) => { console.error(e); await mongoose.disconnect(); process.exit(1); });
}
