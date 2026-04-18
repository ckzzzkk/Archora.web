-- 1. Add architect generation column to users
alter table users add column if not exists architect_generations_used integer not null default 0;

-- 2. Add renders_used and ai_edits_used to users
alter table users add column if not exists renders_used integer not null default 0;
alter table users add column if not exists ai_edits_used integer not null default 0;

-- 3. Add per-architect generation counters (12 architects)
alter table users add column if not exists architect_wright_used integer not null default 0;
alter table users add column if not exists architect_hadid_used integer not null default 0;
alter table users add column if not exists architect_ando_used integer not null default 0;
alter table users add column if not exists architect_foster_used integer not null default 0;
alter table users add column if not exists architect_corbusier_used integer not null default 0;
alter table users add column if not exists architect_zumthor_used integer not null default 0;
alter table users add column if not exists architect_ingels_used integer not null default 0;
alter table users add column if not exists architect_kuma_used integer not null default 0;
alter table users add column if not exists architect_calatrava_used integer not null default 0;
alter table users add column if not exists architect_carle_used integer not null default 0;
alter table users add column if not exists architect_kahn_used integer not null default 0;
alter table users add column if not exists architect_koolhaas_used integer not null default 0;

-- 4. Create tier_limits table (single source of truth for all limits)
create table if not exists tier_limits (
  tier text primary key check (tier in ('starter','creator','pro','architect')),
  ai_generations_per_month integer not null,
  ai_edits_per_month integer not null,
  renders_per_month integer not null,
  ar_scans_per_month integer not null,
  max_undo_steps integer not null,
  auto_save_seconds integer not null,
  created_at timestamptz default now()
);

insert into tier_limits (tier, ai_generations_per_month, ai_edits_per_month, renders_per_month, ar_scans_per_month, max_undo_steps, auto_save_seconds) values
('starter', 10, 10, 2, 0, 10, -1),
('creator', 40, 40, 10, 15, 50, 120),
('pro', 100, 100, 30, 30, 100, 60),
('architect', -1, -1, -1, -1, -1, 30)
on conflict (tier) do nothing;

-- 5. Create architect_tiers table (which architects are available per tier)
create table if not exists architect_tiers (
  architect_id text primary key,
  tier_required text not null check (tier_required in ('starter','creator','pro','architect')),
  token_multiplier numeric(3,1) not null default 1.0
);

insert into architect_tiers (architect_id, tier_required, token_multiplier) values
('frank-lloyd-wright', 'starter', 1.0),
('zaha-hadid', 'starter', 1.5),
('tadao-ando', 'starter', 1.0),
('norman-foster', 'creator', 1.5),
('le-corbusier', 'creator', 1.0),
('peter-zumthor', 'creator', 1.5),
('bjarke-ingels', 'creator', 1.5),
('kengo-kuma', 'pro', 1.5),
('alain-carle', 'pro', 1.5),
('louis-kahn', 'pro', 1.5),
('santiago-calatrava', 'pro', 2.0),
('rem-koolhaas', 'architect', 2.0)
on conflict (architect_id) do nothing;