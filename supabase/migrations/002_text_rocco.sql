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
