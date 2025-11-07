require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { hashUnique, upsertInternship } = require('./util');

const COMPANIES = [
  'stripe',
  'asana',
  'roblox',
  'databricks',
  'snowflakecomputing',
  'atlassian'
];

async function fetchCompany(company) {
  const url = `https://boards-api.greenhouse.io/v1/boards/${company}/jobs?content=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Greenhouse ${company} failed: ${res.status}`);
  const data = await res.json();
  return data.jobs || [];
}

function normalize(job, company) {
  const title = job.title || '';
  const isIntern = /intern/i.test(title);
  if (!isIntern) return null;
  const description = job.content || '';
  const mlLike = /(machine learning|ml|data science|ai)/i.test(`${title} ${description}`);
  if (!mlLike) return null;
  const location = job.location?.name || '';
  const sourceUrl = job.absolute_url || '';
  const companyName = job.company?.name || company;

  const payload = {
    title,
    company: companyName,
    location,
    remote: /remote/i.test(location),
    stipendMin: undefined,
    stipendMax: undefined,
    skills: [],
    description: description.replace(/<[^>]+>/g, '').slice(0, 4000),
    source: 'Greenhouse',
    sourceUrl,
    postedAt: job.updated_at ? new Date(job.updated_at) : undefined,
    tags: ['AI','ML','Data'],
  };
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
      console.error(`[greenhouse] ${c}:`, e.message);
    }
  }
  console.log(`[greenhouse] upserted ${total} internships`);
}

if (require.main === module) {
  run().catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { run };