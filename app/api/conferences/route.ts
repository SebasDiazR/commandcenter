import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { ConferenceStateMap } from '@/lib/conference-persistence';

// Mirrors app/api/edits/route.ts. Backs the shared conference watchlist /
// attendee lists / archive state. Conference state is global (no per-state
// prefixing) since conferences are not scoped to a US state.

function serverSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key);
}

function missingCreds() {
  return NextResponse.json({ error: "Supabase credentials not configured" }, { status: 503 });
}

// Postgres "undefined_table" — the migration hasn't been run yet. We return 200
// with tableMissing:true so the client silently falls back to localStorage.
function isTableMissing(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "42P01" || /relation .* does not exist/i.test(error.message ?? "");
}

// GET /api/conferences — load the whole conference-state map
export async function GET() {
  let sb: ReturnType<typeof serverSupabase>;
  try { sb = serverSupabase(); } catch { return missingCreds(); }

  const { data, error } = await sb.from('conference_state').select('*');

  if (error) {
    if (isTableMissing(error)) {
      return NextResponse.json({ state: {}, tableMissing: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const state: ConferenceStateMap = {};
  for (const row of data ?? []) {
    state[row.conference_id] = {
      bookmarked: row.bookmarked ?? false,
      archived:   row.archived ?? false,
      attendees:  row.attendees ?? [],
      custom:     row.custom ?? undefined,
    };
  }

  return NextResponse.json({ state });
}

// POST /api/conferences — upsert the whole conference-state map
export async function POST(request: NextRequest) {
  let sb: ReturnType<typeof serverSupabase>;
  try { sb = serverSupabase(); } catch { return missingCreds(); }

  const { state }: { state: ConferenceStateMap } = await request.json();

  const rows = Object.entries(state ?? {}).map(([conference_id, r]) => ({
    conference_id,
    bookmarked: r.bookmarked ?? false,
    archived:   r.archived ?? false,
    attendees:  r.attendees ?? [],
    custom:     r.custom ?? null,
    updated_at: new Date().toISOString(),
  }));

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
  }

  const { error } = await sb
    .from('conference_state')
    .upsert(rows, { onConflict: 'conference_id' });

  if (error) {
    if (isTableMissing(error)) {
      return NextResponse.json({ ok: false, tableMissing: true }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
}
