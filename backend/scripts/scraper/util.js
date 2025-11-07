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

function decodeHTML(input = '') {
  return String(input)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\u00a0/g, ' ');
}

function inferStipend(text = '') {
  // crude extraction: look for ranges like 10,000 - 20,000 or $3000-$5000 or 3k-5k
  const s = String(text).toLowerCase();
  const range = s.match(/(?:\$|₹|rs\.?|inr)?\s*([0-9]{1,3}(?:[,\s]?[0-9]{3})+|[0-9]+k)\s*[-–to]{1,3}\s*(?:\$|₹|rs\.?|inr)?\s*([0-9]{1,3}(?:[,\s]?[0-9]{3})+|[0-9]+k)/i);
  const single = s.match(/(?:\$|₹|rs\.?|inr)?\s*([0-9]{1,3}(?:[,\s]?[0-9]{3})+|[0-9]+k)\s*(?:stipend|per\s*month|monthly)/i);
  function toNum(v) {
    if (!v) return undefined;
    let n = v.replace(/[,\s]/g, '');
    if (n.endsWith('k')) n = String(parseFloat(n) * 1000);
    const num = Number(n);
    return isFinite(num) ? num : undefined;
  }
  if (range) return { min: toNum(range[1]), max: toNum(range[2]) };
  if (single) { const m = toNum(single[1]); return { min: m, max: m }; }
  return { min: undefined, max: undefined };
}

module.exports = { hashUnique, upsertInternship, decodeHTML, inferStipend };
