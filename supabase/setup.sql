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
