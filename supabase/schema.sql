-- =========================================================
-- GEOVISE.IO — Supabase schema (leads capture pipeline)
-- =========================================================
-- Run this ONCE in the new project's SQL Editor (Dashboard → SQL Editor → New query).
-- This is the single source of truth for the leads table + notification wiring —
-- replaces the old setup_leads_table.sql / fix_leads_table.sql / verify_webhook_setup.sql,
-- which disagreed on the table name ("leads" vs "Leads") and left the notification
-- webhook as an undocumented, manually-clicked Dashboard setting.

-- 1. Table
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  company text not null,
  email text not null,
  product_of_interest text not null,
  message text,
  market text,
  project_size text,
  created_at timestamptz not null default now()
);

-- 2. Row Level Security — the public "anon" key (used by the website) may only INSERT.
alter table public.leads enable row level security;

create policy "Allow anon insert"
  on public.leads
  for insert
  to anon
  with check (true);

-- 3. Auto-notify: call the send-lead-notification Edge Function on every insert.
-- This is the SQL equivalent of Dashboard → Database → Webhooks, written down so it
-- survives a project rebuild instead of living only as a manual dashboard click.
--
-- Before running this statement:
--   a) Deploy the edge function first: supabase functions deploy send-lead-notification
--   b) Replace <PROJECT_REF> with this project's ref (visible in the project URL).
-- If the trigger fails to create with "schema supabase_functions does not exist",
-- open Dashboard → Database → Webhooks once (any action there provisions the schema),
-- then re-run this statement.
create trigger "send_lead_notification"
after insert on public.leads
for each row execute function supabase_functions.http_request(
  'https://<PROJECT_REF>.supabase.co/functions/v1/send-lead-notification',
  'POST',
  '{"Content-type":"application/json"}',
  '{}',
  '5000'
);
