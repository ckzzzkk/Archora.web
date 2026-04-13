-- Generation sessions: tracks multi-iteration AI design progress
-- The edge function writes progress here; clients subscribe via Realtime

create table if not exists generation_sessions (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        references auth.users(id) on delete cascade not null,
  status            text        not null default 'pending'
                                check (status in ('pending','generating','scoring','refining','complete','error')),
  iteration         integer     not null default 0,
  total_iterations  integer     not null default 3,
  current_message   text,
  iteration_scores  jsonb       not null default '[]'::jsonb,
  final_score       integer,
  blueprint_data    jsonb,
  error_message     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table generation_sessions enable row level security;

create policy "Users see own sessions"
  on generation_sessions for select
  using (auth.uid() = user_id);

create policy "Users insert own sessions"
  on generation_sessions for insert
  with check (auth.uid() = user_id);

-- updated_at trigger
create or replace function _update_generation_sessions_ts()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_gs_updated_at
  before update on generation_sessions
  for each row execute function _update_generation_sessions_ts();

-- Enable Realtime so clients get live progress
alter publication supabase_realtime add table generation_sessions;
