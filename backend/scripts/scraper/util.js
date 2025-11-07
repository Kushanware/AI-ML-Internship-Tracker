const crypto = require('crypto');

function hashUnique({ title = '', company = '', location = '', sourceUrl = '' }) {
  const norm = `${title.trim().toLowerCase()}|${company.trim().toLowerCase()}|${location.trim().toLowerCase()}|${sourceUrl.trim().toLowerCase()}`;
  return crypto.createHash('sha256').update(norm).digest('hex');
}

async function upsertInternship(payload) {
  const base = process.env.API_BASE_URL || 'http://localhost:5000';
  const res = await fetch(`${base}/internships`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-admin-token': process.env.ADMIN_TOKEN || '',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upsert failed: ${res.status} ${text}`);
  }
  return res.json();
}

module.exports = { hashUnique, upsertInternship };