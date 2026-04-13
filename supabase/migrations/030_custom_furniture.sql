-- 030_custom_furniture.sql
-- Stores AI-generated furniture models from user photos (Pro+ feature).
-- Pipeline: photo → Claude Vision → Meshy AI → custom_furniture record → CustomAsset in blueprint.

create table if not exists custom_furniture (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  project_id       uuid references projects(id) on delete set null,
  name             text not null,
  category         text not null default 'living',
  mesh_url         text,
  thumbnail_url    text,
  source_image_url text,
  dimensions       jsonb not null default '{"x": 1, "y": 1, "z": 1}',
  style_tags       text[] default '{}',
  created_at       timestamptz not null default now()
);

alter table custom_furniture enable row level security;

create policy "Users own their custom furniture"
  on custom_furniture for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index custom_furniture_user_id_idx on custom_furniture(user_id, created_at desc);