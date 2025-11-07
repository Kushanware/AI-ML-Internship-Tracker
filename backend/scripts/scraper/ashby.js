require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const { hashUnique, upsertInternship } = require('./util');

// Ashby provides a public job board API per organization. We'll try two endpoints:
// - https://jobs.ashbyhq.com/api/job-board/<org>
// - https://jobs.ashbyhq.com/api/non-user-organization/<org>.jobs
const ORGS = [
  'openai',
  'nvidia',
  'anthropic',
  'datadog',
  'snowflake',
];

async function fetchOrg(org) {
  const urls = [
    `https://jobs.ashbyhq.com/api/job-board/${org}`,
    `https://jobs.ashbyhq.com/api/non-user-organization/${org}.jobs`,
  ];
  for (const url of urls) {
    const res = await fetch(url);
    if (res.ok) return { url, data: await res.json() };
  }
  throw new Error(`Ashby ${org} returned no valid endpoints`);
}

function iterateJobs(resp) {
  if (Array.isArray(resp)) return resp; // non-user-organization variant
  if (resp && Array.isArray(resp.jobs)) return resp.jobs; // job-board variant
  return [];
}

function normalize(job, org) {
  const title = job.title || job.job?.title || '';
  const isIntern = /intern/i.test(title);
  if (!isIntern) return null;
  const company = job.companyName || job.organization?.name || org;
  const description = job.description || job.job?.descriptionHtml || '';
  const mlLike = /(machine learning|ml|data science|ai|deep learning|nlp)/i.test(`${title} ${description}`);
  if (!mlLike) return null;
  const location = job.location || job.locationName || job.job?.location || '';
  const sourceUrl = job.url || job.job?.jobUrl || job.jobUrl || '';

  const payload = {
    title,
    company,
    location,
    remote: /remote/i.test(location),
    description: String(description).replace(/<[^>]+>/g, '').slice(0, 4000),
    source: 'Ashby',
    sourceUrl,
    postedAt: job.updatedAt || job.createdAt ? new Date(job.updatedAt || job.createdAt) : undefined,
    tags: ['AI','ML','Data'],
  };
  payload.uniqueHash = hashUnique(payload);
  return payload;
}

async function run() {
  let total = 0;
  for (const org of ORGS) {
    try {
      const { data } = await fetchOrg(org);
      const jobs = iterateJobs(data);
      for (const j of jobs) {
        const norm = normalize(j, org);
        if (!norm) continue;
        await upsertInternship(norm);
        total++;
      }
    } catch (e) {
      console.error(`[ashby] ${org}:`, e.message);
    }
  }
  console.log(`[ashby] upserted ${total} internships`);
}

if (require.main === module) {
  run().catch((e) => { console.error(e); process.exit(1); });
}

module.exports = { run };