-- Institution edits — shared BD-pipeline state for the Command Center.
-- Backs /api/edits (see app/api/edits/route.ts). Columns mirror that route's
-- read/write mapping exactly.
--
-- Run this ONCE in the DESTINATION (production) project's Supabase SQL editor,
-- THEN copy the rows with:  node scripts/migrate-supabase.mjs copy
--
-- Note: the production API talks to Supabase with the ANON key, so RLS must
-- permit anon access (mirrors 0001_conference_state.sql). Adjust if your
-- security posture requires stricter policies.

create table if not exists public.institution_edits (
  institution_name text primary key,
  priority         numeric,
  relationship     numeric     not null default 1,
  expansion        numeric     not null default 30,
  notes            text,
  display_name     text,
  system           text,
  lead_practice    text,
  contacts         jsonb       not null default '[]'::jsonb,   -- [{ name, notes }]
  projects         jsonb       not null default '[]'::jsonb,   -- [{ name, budget_m, ... }]
  gsf              numeric,
  nasf             numeric,
  eg_nasf          numeric,
  thecb_total_m    numeric,
  strategy_notes   text,
  hks_status       text,
  next_action      text,
  next_action_date text,                                       -- stored as text ("" when unset)
  owner            text,
  pursuit_stage    text        default 'Tracking',
  capture_plan     jsonb       not null default '{}'::jsonb,
  updated_at       timestamptz not null default now()
);

alter table public.institution_edits enable row level security;

drop policy if exists "institution_edits anon access" on public.institution_edits;
create policy "institution_edits anon access"
  on public.institution_edits
  for all
  using (true)
  with check (true);
