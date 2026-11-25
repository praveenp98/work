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
