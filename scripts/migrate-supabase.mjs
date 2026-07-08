// One-off cross-project Supabase copy for BD Command Center.
// Reads creds from .env.migrate.local (gitignored). NEVER commit that file.
//
//   node scripts/migrate-supabase.mjs count   # show row counts, write nothing
//   node scripts/migrate-supabase.mjs copy    # upsert every source row -> destination
//
// "copy" is an upsert: rows in the destination whose key matches a source row
// are OVERWRITTEN. Rows only in the destination are left untouched.
import { createClient } from '@supabase/supabase-js';

try { process.loadEnvFile('.env.migrate.local'); }
catch { console.error('Could not read .env.migrate.local — is it in the project root?'); process.exit(1); }

const { SRC_URL, SRC_KEY, DST_URL, DST_KEY } = process.env;
for (const [k, v] of Object.entries({ SRC_URL, SRC_KEY, DST_URL, DST_KEY })) {
  if (!v) { console.error(`Missing ${k} in .env.migrate.local`); process.exit(1); }
}
if (SRC_URL === DST_URL) {
  console.error('SRC_URL and DST_URL are the same project — nothing to copy. Aborting.');
  process.exit(1);
}

const opts = { auth: { persistSession: false } };
const src  = createClient(SRC_URL, SRC_KEY, opts);
const dst  = createClient(DST_URL, DST_KEY, opts);

const TABLES = [
  { name: 'institution_edits', conflict: 'institution_name' },
  { name: 'conference_state',  conflict: 'conference_id' },
];

async function count(client, table) {
  const { count, error } = await client.from(table).select('*', { count: 'exact', head: true });
  if (error) return `ERR ${error.code ?? ''} ${(error.message ?? '').slice(0, 50)}`.trim();
  return count === null ? 'MISSING/none' : count;
}

const mode = process.argv[2] ?? 'count';

function keyInfo(label, key) {
  try {
    const p = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString('utf8'));
    return `${label}: role=${p.role}  ref=${p.ref ?? '?'}`;
  } catch {
    return `${label}: (non-JWT key — cannot introspect)`;
  }
}

if (mode === 'count') {
  console.log(keyInfo('SRC_KEY', SRC_KEY));
  console.log(keyInfo('DST_KEY', DST_KEY));
  console.log();
  console.log('table                 |  source |   dest');
  console.log('----------------------|---------|-------');
  for (const { name } of TABLES) {
    const [s, d] = await Promise.all([count(src, name), count(dst, name)]);
    console.log(`${name.padEnd(21)} | ${String(s).padStart(7)} | ${String(d).padStart(6)}`);
  }
  console.log('\nNothing was written. If direction looks right, run: node scripts/migrate-supabase.mjs copy');
} else if (mode === 'copy') {
  for (const { name, conflict } of TABLES) {
    const { data, error } = await src.from(name).select('*');
    if (error) { console.log(`${name}: not readable in source (${error.code ?? ''}) — skipped`); continue; }
    if (!data?.length) { console.log(`${name}: source empty — skipped`); continue; }
    if (data.length >= 1000) console.warn(`${name}: WARNING — hit 1000-row page cap; pagination needed`);
    const { error: upErr } = await dst.from(name).upsert(data, { onConflict: conflict });
    if (upErr) { console.error(`${name}: write FAILED — ${upErr.code ?? ''} ${upErr.message}\n  (create the table in the destination first)`); continue; }
    console.log(`${name}: copied ${data.length} rows -> destination`);
  }
  console.log('\nDone.');
} else if (mode === 'backup') {
  const { writeFileSync } = await import('node:fs');
  const out = '../institution_edits.source-backup.json'; // parent Documents dir — outside the repo
  const { data, error } = await src.from('institution_edits').select('*');
  if (error) { console.error(error.message); process.exit(1); }
  writeFileSync(out, JSON.stringify(data, null, 2));
  console.log(`Backed up ${data.length} source rows -> ${out}`);
} else if (mode === 'verify') {
  async function stats(client) {
    const { data, error } = await client.from('institution_edits').select('*');
    if (error) return `ERR ${error.message}`;
    let projects = 0, contacts = 0, withPlan = 0, withNotes = 0;
    for (const r of data) {
      projects += Array.isArray(r.projects) ? r.projects.length : 0;
      contacts += Array.isArray(r.contacts) ? r.contacts.length : 0;
      if (r.capture_plan && Object.keys(r.capture_plan).length) withPlan++;
      if (r.notes && r.notes.trim()) withNotes++;
    }
    return { rows: data.length, projects, contacts, rowsWithCapturePlan: withPlan, rowsWithNotes: withNotes };
  }
  console.log('SRC', await stats(src));
  console.log('DST', await stats(dst));
} else if (mode === 'keys') {
  const { data, error } = await src.from('institution_edits').select('*').limit(1);
  if (error) { console.error(error.message); process.exit(1); }
  const row = data?.[0] ?? {};
  for (const k of Object.keys(row)) {
    const v = row[k];
    const t = v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v;
    console.log(`${k.padEnd(20)} ${t}`);
  }
} else if (mode === 'diag') {
  for (const [lbl, client] of [['SRC', src], ['DST', dst]]) {
    for (const { name } of TABLES) {
      const { error } = await client.from(name).select('*').limit(1);
      console.log(`${lbl.padEnd(3)} ${name.padEnd(20)} : ${error ? (error.code ?? '') + ' ' + error.message : 'OK — table exists'}`);
    }
  }
} else {
  console.error(`Unknown mode "${mode}". Use "count", "copy", or "diag".`);
  process.exit(1);
}
