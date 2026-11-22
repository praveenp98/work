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
