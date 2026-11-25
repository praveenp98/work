-- Rocco: free read-only audit (Nov 25, 2026). Paste into Supabase → SQL Editor → Run. Safe to run twice.
-- Until it runs, /admin/funnel shows 0 in "Free audits" (the audit itself works without it: it lives on the workspace).

-- /admin/funnel with a "Free audits" column (audit_started: the "See my account free first" tap, lib/free-audit.ts).
-- The return type changes, so the old function is dropped first.
drop function if exists rocco_funnel(int);
create or replace function rocco_funnel(p_days int)
returns table (source text, visits bigint, leads bigint, call_clicks bigint, calls_booked bigint, audits bigint, checkouts bigint, paid bigint)
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
    count(*) filter (where event = 'audit_started') as audits,
    count(distinct case when event = 'checkout_started' then coalesce(ref, anon_id, id::text) end) as checkouts,
    count(*) filter (where event = 'paid') as paid
  from rocco_events
  where created_at >= now() - make_interval(days => p_days)
  group by 1
  order by 2 desc, 1;
$$;
