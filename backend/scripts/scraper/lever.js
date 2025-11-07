require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { hashUnique, upsertInternship } = require('./util');

const COMPANIES = [
  'ramp',
  'plaid',
  'rippling',
  'brex',
  'robinhood'
];

async function fetchCompany(company) {
  const url = `https://api.lever.co/v0/postings/${company}?mode=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Lever ${company} failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

function normalize(job, company) {
  const title = job.text || '';
  const isIntern = /intern/i.test(title);
  if (!isIntern) return null;
  const raw = job.descriptionPlain || job.description || '';
  const description = require('./util').decodeHTML(raw);
  const mlLike = /(machine learning|ml|data science|ai)/i.test(`${title} ${description}`);
  if (!mlLike) return null;
  const location = job.categories?.location || '';
  const sourceUrl = job.hostedUrl || job.applyUrl || '';
  const companyName = company;

  const payload = {
    title,
    company: companyName,
    location,
    remote: /remote/i.test(location),
    description: String(description).replace(/<[^>]+>/g, '').slice(0, 4000),
    source: 'Lever',
    sourceUrl,
    postedAt: job.createdAt ? new Date(job.createdAt) : undefined,
    tags: ['AI','ML','Data'],
  };
  const stipend = require('./util').inferStipend(description);
  if (stipend.min) payload.stipendMin = stipend.min;
  if (stipend.max) payload.stipendMax = stipend.max;
  payload.uniqueHash = hashUnique(payload);
  return payload;
}

async function run() {
  let total = 0;
  for (const c of COMPANIES) {
    try {
      const jobs = await fetchCompany(c);
      for (const j of jobs) {
        const norm = normalize(j, c);
        if (!norm) continue;
        await upsertInternship(norm);
        total++;
      }
    } catch (e) {
      console.error(`[lever] ${c}:`, e.message);
    }
  }
  console.log(`[lever] upserted ${total} internships`);
}

if (require.main === module) {
  run().catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { run };