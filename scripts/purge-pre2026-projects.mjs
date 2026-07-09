// One-off cleanup: remove every project with year <= 2025 from the production
// institution_edits rows (all states). Projects with a null year are kept —
// they aren't "before 2026", just undated.
//
//   node scripts/purge-pre2026-projects.mjs scan    # report what would be removed, write nothing
//   node scripts/purge-pre2026-projects.mjs apply   # backup full table, then upsert only affected rows
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'node:fs';

try { process.loadEnvFile('.env.local'); }
catch { console.error('Could not read .env.local'); process.exit(1); }

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) { console.error('Missing Supabase creds in .env.local'); process.exit(1); }

const db = createClient(url, key, { auth: { persistSession: false } });
const CUTOFF = 2026; // remove year < CUTOFF

const { data: rows, error } = await db.from('institution_edits').select('*');
if (error) { console.error(error.message); process.exit(1); }
if (rows.length >= 1000) { console.error('Hit 1000-row page cap — add pagination before running.'); process.exit(1); }

const affected = [];
let removedTotal = 0, keptTotal = 0;
for (const r of rows) {
  const projects = Array.isArray(r.projects) ? r.projects : null;
  if (!projects) continue;
  const removed = projects.filter(p => typeof p.year === 'number' && p.year < CUTOFF);
  keptTotal += projects.length - removed.length;
  if (!removed.length) continue;
  removedTotal += removed.length;
  affected.push({ row: r, kept: projects.filter(p => !(typeof p.year === 'number' && p.year < CUTOFF)), removed });
}

console.log(`Rows scanned: ${rows.length}   projects kept: ${keptTotal}   to remove (year < ${CUTOFF}): ${removedTotal}\n`);
for (const a of affected) {
  console.log(`${a.row.institution_name}  — removing ${a.removed.length}:`);
  for (const p of a.removed) console.log(`    FY${p.year}  ${p.name}${p.budget_m ? `  ($${p.budget_m}M)` : ''}`);
}

const mode = process.argv[2] ?? 'scan';
if (mode === 'scan') {
  console.log('\nNothing was written. To apply: node scripts/purge-pre2026-projects.mjs apply');
} else if (mode === 'apply') {
  if (!affected.length) { console.log('Nothing to remove.'); process.exit(0); }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backup = `../institution_edits.backup-${stamp}.json`; // parent Documents dir — outside the repo
  writeFileSync(backup, JSON.stringify(rows, null, 2));
  console.log(`\nBacked up ${rows.length} rows -> ${backup}`);
  const updates = affected.map(a => ({ ...a.row, projects: a.kept }));
  const { error: upErr } = await db.from('institution_edits').upsert(updates, { onConflict: 'institution_name' });
  if (upErr) { console.error(`Write FAILED — ${upErr.message}`); process.exit(1); }
  console.log(`Updated ${updates.length} rows; removed ${removedTotal} pre-${CUTOFF} projects.`);
} else {
  console.error(`Unknown mode "${mode}". Use "scan" or "apply".`);
  process.exit(1);
}
