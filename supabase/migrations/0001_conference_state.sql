-- Conferences tab — shared state (watchlist / attendees / archive / user-added).
-- Backs /api/conferences (see app/api/conferences/route.ts), mirroring the
-- existing institution_edits table. Run this once in the Supabase SQL editor.
--
-- Until this table exists the API responds with tableMissing:true and the app
-- transparently falls back to per-browser localStorage — so the Conferences tab
-- works before the migration runs; it just isn't shared across users yet.

create table if not exists public.conference_state (
  conference_id text primary key,
  bookmarked    boolean     not null default false,
  archived      boolean     not null default false,
  attendees     jsonb       not null default '[]'::jsonb,   -- [{ name, office, role }]
  custom        jsonb,                                       -- full Conference object for user-added entries; null for seed
  updated_at    timestamptz not null default now()
);

-- Access model: the app authenticates with a single shared site password and
-- talks to Supabase with the anon key (same as institution_edits). If your
-- institution_edits table uses RLS policies, replicate them here. The block
-- below grants the anon role full access via a permissive policy — adjust to
-- match your project's security posture.
alter table public.conference_state enable row level security;

drop policy if exists "conference_state anon access" on public.conference_state;
create policy "conference_state anon access"
  on public.conference_state
  for all
  using (true)
  with check (true);
