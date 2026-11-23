-- Rocco: first-party funnel events (no third-party analytics, no cookies, no IP or user agent stored).
-- Paste into Supabase → SQL Editor → Run. Safe to run twice. Until it runs, events are dropped quietly
-- and /admin/funnel shows zeros.

create table if not exists rocco_events (
  id bigint generated always as identity primary key,
  event text not null,                 -- page_view, lead_captured, tool_result, call_click, call_booked, hire_click, signup_started, checkout_started, link_click, paid
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
