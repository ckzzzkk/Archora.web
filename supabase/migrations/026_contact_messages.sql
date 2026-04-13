-- 026_contact_messages.sql
-- Stores contact form submissions from the website.
-- No RLS — only service_role inserts (edge function), admin reads via dashboard.

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now()
);
