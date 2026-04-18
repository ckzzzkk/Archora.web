-- 035_renders.sql
-- Stores AI-generated photorealistic renders (Pro+ feature).
-- Pipeline: blueprint → Claude prompt engineer → Replicate SDXL → render_url

create table if not exists renders (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  project_id   uuid references projects(id) on delete set null,
  render_url   text not null,
  atmosphere   text not null,
  view_type    text not null,
  created_at   timestamptz not null default now()
);

alter table renders enable row level security;

create policy "Users own their renders"
  on renders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index renders_user_id_idx on renders(user_id, created_at desc);