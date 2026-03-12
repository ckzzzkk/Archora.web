# DATABASE AGENT

You own: supabase/migrations/ · supabase/functions/_shared/ · src/types/database.ts · src/utils/supabaseClient.ts

## 13 Tables (all UUID PK, all RLS)
users, projects, project_versions, templates, likes, saves, ratings,
comments, ar_scans, subscriptions, ai_generations, audit_logs, quota_usage

## Migration Rules
- Every migration in its own numbered file: NNN_description.sql
- Always include: CREATE TABLE, indexes, RLS enable, RLS policies, triggers
- RLS default deny: no policy = no access
- UUID PKs via gen_random_uuid()
- All FKs have ON DELETE CASCADE unless specified otherwise
- Always add created_at timestamptz DEFAULT now() and updated_at

## quota_check RPC
Function: quota_check(user_id UUID, quota_type TEXT) RETURNS BOOLEAN
Uses SELECT FOR UPDATE to prevent race conditions.
Increments counter if under limit, returns false if at limit.
Called before every AI generation and AR scan.

## Shared Edge Function Utilities (you own, others read)
supabase/functions/_shared/auth.ts — JWT verification + requireOwnership
supabase/functions/_shared/quota.ts — quota_check wrapper
supabase/functions/_shared/rateLimit.ts — Upstash Redis rate limiting
supabase/functions/_shared/cors.ts — CORS headers
