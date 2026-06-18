import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { EditStateMap, InstEditState } from '@/lib/types';

function serverSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key);
}

function missingCreds() {
  return NextResponse.json({ error: "Supabase credentials not configured" }, { status: 503 });
}

// Institution names for non-Texas states are prefixed: "ca::UC Berkeley"
// Texas rows have no prefix (backwards compatible with existing data).
function nameToKey(name: string, stateId: string) {
  return stateId === "tx" ? name : `${stateId}::${name}`;
}

function keyToName(key: string, stateId: string) {
  const prefix = `${stateId}::`;
  return stateId === "tx" ? key : key.startsWith(prefix) ? key.slice(prefix.length) : key;
}

// GET /api/edits?state=tx — load institution edits for a given state
export async function GET(request: NextRequest) {
  const stateId = request.nextUrl.searchParams.get("state") ?? "tx";

  let sb: ReturnType<typeof serverSupabase>;
  try { sb = serverSupabase(); } catch { return missingCreds(); }

  let query = sb.from('institution_edits').select('*');

  if (stateId === "tx") {
    // Texas: rows without a "::" prefix OR legacy rows (backward compat)
    query = query.not('institution_name', 'like', '%::%');
  } else {
    query = query.like('institution_name', `${stateId}::%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const editState: EditStateMap = {};
  for (const row of data ?? []) {
    const instName = keyToName(row.institution_name, stateId);
    editState[instName] = {
      priority:         row.priority,
      relationship:     row.relationship,
      expansion:        row.expansion,
      notes:            row.notes,
      displayName:      row.display_name,
      system:           row.system,
      lead_practice:    row.lead_practice,
      contacts:         row.contacts ?? [],
      projects:         row.projects ?? [],
      gsf:              row.gsf,
      nasf:             row.nasf,
      eg_nasf:          row.eg_nasf,
      thecb_total_m:    row.thecb_total_m,
      strategy_notes:   row.strategy_notes,
      hks_status:       row.hks_status,
      next_action:      row.next_action,
      next_action_date: row.next_action_date,
      owner:            row.owner,
      pursuit_stage:    row.pursuit_stage ?? "Tracking",
      capture_plan:     row.capture_plan ?? {},
    } satisfies InstEditState;
  }

  return NextResponse.json({ editState });
}

// POST /api/edits — save entire EditStateMap for a given state
export async function POST(request: NextRequest) {
  let sb: ReturnType<typeof serverSupabase>;
  try { sb = serverSupabase(); } catch { return missingCreds(); }

  const { editState, stateId = "tx" }: { editState: EditStateMap; stateId?: string } = await request.json();

  const rows = Object.entries(editState).map(([name, e]) => ({
    institution_name: nameToKey(name, stateId),
    priority:         e.priority,
    relationship:     e.relationship,
    expansion:        e.expansion,
    notes:            e.notes,
    display_name:     e.displayName,
    system:           e.system,
    lead_practice:    e.lead_practice,
    contacts:         e.contacts,
    projects:         e.projects,
    gsf:              e.gsf,
    nasf:             e.nasf,
    eg_nasf:          e.eg_nasf,
    thecb_total_m:    e.thecb_total_m,
    strategy_notes:   e.strategy_notes,
    hks_status:       e.hks_status,
    next_action:      e.next_action,
    next_action_date: e.next_action_date,
    owner:            e.owner,
    pursuit_stage:    e.pursuit_stage ?? "Tracking",
    capture_plan:     e.capture_plan ?? {},
    updated_at:       new Date().toISOString(),
  }));

  const { error } = await sb
    .from('institution_edits')
    .upsert(rows, { onConflict: 'institution_name' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
}
