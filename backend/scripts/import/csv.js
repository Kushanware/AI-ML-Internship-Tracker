require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const path = require('path');
const { hashUnique, upsertInternship } = require('../scraper/util');

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = [];
    let cur = '';
    let inQuotes = false;
    const line = lines[i];
    for (let ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { cols.push(cur); cur = ''; continue; }
      cur += ch;
    }
    cols.push(cur);
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (cols[idx] || '').trim(); });
    rows.push(obj);
  }
  return rows;
}

function toPayload(row) {
  const skills = row.skills ? row.skills.split('|').map((s) => s.trim()) : [];
  const tags = row.tags ? row.tags.split('|').map((s) => s.trim()) : [];
  const payload = {
    title: row.title,
    company: row.company,
    location: row.location,
    remote: String(row.remote).toLowerCase() === 'true',
    stipendMin: row.stipendMin ? Number(row.stipendMin) : undefined,
    stipendMax: row.stipendMax ? Number(row.stipendMax) : undefined,
    durationWeeks: row.durationWeeks ? Number(row.durationWeeks) : undefined,
    skills,
    description: row.description,
    source: row.source || 'CSV',
    sourceUrl: row.sourceUrl || undefined,
    deadline: row.deadline ? new Date(row.deadline) : undefined,
    postedAt: row.postedAt ? new Date(row.postedAt) : undefined,
    tags,
  };
  payload.uniqueHash = row.uniqueHash || hashUnique(payload);
  return payload;
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node scripts/import/csv.js <path-to-csv>');
    process.exit(1);
  }
  const abs = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
  const text = fs.readFileSync(abs, 'utf8');
  const rows = parseCSV(text);
  let ok = 0, err = 0;
  for (const r of rows) {
    try { await upsertInternship(toPayload(r)); ok++; }
    catch (e) { err++; console.error('Import failed:', e.message); }
  }
  console.log(`Imported ${ok} rows, ${err} errors`);
}

if (require.main === module) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
