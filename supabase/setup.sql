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
