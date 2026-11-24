-- Rocco: marketing leads (lead magnets and email capture). No email is sent from this table by the app.
-- Paste into Supabase → SQL Editor → Run. Safe to run twice. Until it runs, lead forms still show the download
-- but the email is not saved.

create table if not exists marketing_leads (
  id bigint generated always as identity primary key,
  email text not null,                          -- lowercased
  name text,
  marketplace text,
  monthly_ad_spend_band text,
  source_page text,                             -- page path the form was on, no query string
  lead_magnet text not null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  referrer text,                                -- first-touch referrer host only
  consent_marketing boolean not null default false,
  consent_text text,                            -- the exact words next to the box they ticked
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  notes text,
  unique (email, lead_magnet)
);
create index if not exists marketing_leads_created on marketing_leads (created_at);
create index if not exists marketing_leads_email on marketing_leads (email);

-- No public access at all: no policies, so the anon and signed-in keys can neither read nor write.
-- Rows are written and read only by the server (service role key) through /api/leads and /admin/leads.
alter table marketing_leads enable row level security;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then revoke all on marketing_leads from anon; end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then revoke all on marketing_leads from authenticated; end if;
end $$;
