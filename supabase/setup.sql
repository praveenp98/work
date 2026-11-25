-- Rocco: paste this whole file into Supabase → SQL Editor → Run. Safe to run twice.

-- Rocco memory: workspaces (personal connector URLs), report snapshots, proposal runs, applied changes.
-- Run once in Supabase → SQL editor. Server uses the service role key; no public access (RLS on, no policies).

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists snapshots (
  id uuid primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  brand text not null,
  kind text not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists snapshots_ws on snapshots (workspace_id, created_at desc);

create table if not exists runs (
  id uuid primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  brand text not null,
  kind text not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists runs_ws on runs (workspace_id, created_at desc);

create table if not exists actions (
  id uuid primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  brand text not null,
  status text not null,
  applied_at timestamptz not null,
  follow_up_at timestamptz not null,
  data jsonb not null
);
create index if not exists actions_ws on actions (workspace_id, applied_at desc);

alter table workspaces enable row level security;
alter table snapshots enable row level security;
alter table runs enable row level security;
alter table actions enable row level security;

-- Email list (homepage / pricing signups)
create table if not exists waitlist (
  email text primary key,
  source text,
  created_at timestamptz not null default now()
);
alter table waitlist enable row level security;

-- Text Rocco: teammates' phones linked to a workspace (iMessage/SMS). Run after 001.
create table if not exists phones (
  phone text primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  opted_out boolean not null default false,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists phones_ws on phones (workspace_id);
create index if not exists workspaces_link_code on workspaces ((data->>'linkCode'));
alter table phones enable row level security;

-- Check: should list actions, phones, runs, snapshots, waitlist, workspaces
select table_name from information_schema.tables where table_schema = 'public' order by 1;

-- Rocco: shared spam limits and "only once" marks, so they hold across every server (not per instance).
-- Paste into Supabase → SQL Editor → Run. Safe to run twice. Until it runs, Rocco falls back to per-server limits.

create table if not exists rocco_hits (
  key text not null,
  at timestamptz not null default now()
);
create index if not exists rocco_hits_key_at on rocco_hits (key, at);
alter table rocco_hits enable row level security;

create table if not exists rocco_marks (
  key text primary key,
  created_at timestamptz not null default now()
);
alter table rocco_marks enable row level security;

-- Atomic "may this happen again?": at most p_max times per p_window_seconds for this key.
create or replace function rocco_hit(p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  perform pg_advisory_xact_lock(hashtext(p_key));
  delete from rocco_hits where key = p_key and at < now() - make_interval(secs => p_window_seconds);
  select count(*) into n from rocco_hits where key = p_key;
  if n >= p_max then
    return false;
  end if;
  insert into rocco_hits (key) values (p_key);
  return true;
end;
$$;

-- Housekeeping (the daily job calls this): drop marks and hits older than 3 days.
create or replace function rocco_limits_cleanup()
returns void
language sql
security definer
set search_path = public
as $$
  delete from rocco_hits where at < now() - interval '3 days';
  delete from rocco_marks where created_at < now() - interval '3 days';
$$;


-- ── 004_events.sql ──────────────────────────────────────────────────────────────────────────────────────
-- Rocco: first-party funnel events (no third-party analytics, no cookies, no IP or user agent stored).
-- Paste into Supabase → SQL Editor → Run. Safe to run twice. Until it runs, events are dropped quietly
-- and /admin/funnel shows zeros.

create table if not exists rocco_events (
  id bigint generated always as identity primary key,
  event text not null,                 -- page_view, lead_captured, tool_result, call_click, call_booked, hire_click, signup_started, checkout_started, paid
  path text,                           -- page path only: no query string, never a team link
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  ref_host text,                       -- first-touch referrer host (e.g. "x.com"), never the full URL
  anon_id text,                        -- random id kept in the visitor's own browser storage; not sent with Do Not Track
  props jsonb not null default '{}',   -- magnet, tool or plan
  ref text,                            -- team id on checkout_started and paid, so "paid" can inherit the visit's source
  created_at timestamptz not null default now()
);
create index if not exists rocco_events_created on rocco_events (created_at);
create index if not exists rocco_events_event_created on rocco_events (event, created_at);
create index if not exists rocco_events_ref on rocco_events (ref) where ref is not null;
-- A team can only be counted as paid once, however many payment webhooks arrive.
create unique index if not exists rocco_events_paid_once on rocco_events (ref) where event = 'paid';
alter table rocco_events enable row level security;

-- The funnel for /admin/funnel: one row per source for the last p_days days.
-- Source = utm_source, else the referrer host, else "direct". Visits and checkouts count people, the rest count events.
create or replace function rocco_funnel(p_days int)
returns table (source text, visits bigint, leads bigint, call_clicks bigint, calls_booked bigint, checkouts bigint, paid bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(nullif(utm_source, ''), nullif(ref_host, ''), 'direct') as source,
    count(distinct case when event = 'page_view' then coalesce(anon_id, id::text) end) as visits,
    count(*) filter (where event = 'lead_captured') as leads,
    count(*) filter (where event = 'call_click') as call_clicks,
    count(*) filter (where event = 'call_booked') as calls_booked,
    count(distinct case when event = 'checkout_started' then coalesce(ref, anon_id, id::text) end) as checkouts,
    count(*) filter (where event = 'paid') as paid
  from rocco_events
  where created_at >= now() - make_interval(days => p_days)
  group by 1
  order by 2 desc, 1;
$$;


-- ── 005_leads.sql ───────────────────────────────────────────────────────────────────────────────────────
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

-- ── 006_partners.sql ─────────────────────────────────────────────────────────────────────────────────────
-- Rocco: partner program (docs/PARTNERSHIPS.md, lib/partner-db.ts).
-- Paste into Supabase → SQL Editor → Run. Safe to run twice. Until it runs, the apply form still answers but the
-- application is only kept as a lead (marketing_leads), and referrals are not recorded.

create table if not exists partners (
  id bigint generated always as identity primary key,
  code text unique,                              -- set when Praveen approves (lowercase letters, digits, hyphens)
  name text not null,
  type text not null check (type in ('agency', 'tool', 'community', 'other')),
  email text not null unique,                    -- lowercased; one application per email
  website text,
  share numeric(4,3) not null default 0.300,     -- share of the seller's first payment (lib/partners.ts PARTNER_SHARE)
  status text not null default 'pending' check (status in ('pending', 'approved', 'paused')),
  reach text,                                    -- how many US sellers they reach (a band, from the form)
  how text,                                      -- how they'd share Rocco (from the form)
  created_at timestamptz not null default now(),
  approved_at timestamptz
);
create index if not exists partners_status on partners (status);

create table if not exists partner_referrals (
  id bigint generated always as identity primary key,
  partner_code text not null references partners (code) on update cascade,
  workspace_id text not null unique,             -- one referral per team: its first payment
  payment_id text,                               -- the Dodo payment (its metadata.partner holds the code too)
  plan text not null check (plan in ('annual', 'monthly')),
  amount numeric(10,2) not null,                 -- USD the seller paid
  currency text,                                 -- what Dodo charged in
  paid_at timestamptz not null,
  guarantee_ends_at timestamptz not null,        -- paid_at + 14 days (GUARANTEE_DAYS); no payout before this
  refunded boolean not null default false,
  payout_status text not null default 'due' check (payout_status in ('due', 'paid', 'void')),
  payout_paid_at timestamptz,
  payout_amount numeric(10,2),                   -- what Praveen sent; log it as a marketing cost (hard rule 4)
  created_at timestamptz not null default now()
);
create index if not exists partner_referrals_code on partner_referrals (partner_code);
create index if not exists partner_referrals_due on partner_referrals (guarantee_ends_at) where payout_status = 'due' and refunded = false;

-- Server only (service role key), like marketing_leads.
alter table partners enable row level security;
alter table partner_referrals enable row level security;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then revoke all on partners, partner_referrals from anon; end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then revoke all on partners, partner_referrals from authenticated; end if;
end $$;

-- /admin/funnel: a visit or sale through a partner's link counts under "partner:<code>" (props.partner is added on
-- the server from the rocco_partner cookie, never taken from the browser). Same columns as before.
create or replace function rocco_funnel(p_days int)
returns table (source text, visits bigint, leads bigint, call_clicks bigint, calls_booked bigint, checkouts bigint, paid bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce('partner:' || nullif(props->>'partner', ''), nullif(utm_source, ''), nullif(ref_host, ''), 'direct') as source,
    count(distinct case when event = 'page_view' then coalesce(anon_id, id::text) end) as visits,
    count(*) filter (where event = 'lead_captured') as leads,
    count(*) filter (where event = 'call_click') as call_clicks,
    count(*) filter (where event = 'call_booked') as calls_booked,
    count(distinct case when event = 'checkout_started' then coalesce(ref, anon_id, id::text) end) as checkouts,
    count(*) filter (where event = 'paid') as paid
  from rocco_events
  where created_at >= now() - make_interval(days => p_days)
  group by 1
  order by 2 desc, 1;
$$;
