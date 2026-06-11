-- 061_align_tier_limits.sql
-- Align the tier_limits enforcement table with the documented tier matrix
-- (CLAUDE.md + src/utils/tierLimits.ts, the canonical source of truth).
--
-- Drift introduced by 040's seed values:
--   starter   was 10 gens / 10 edits / 2 renders  → documented 0 / 0 / 0 (manual only)
--   creator   was 40 edits / 10 renders           → documented 30 edits / 5 renders
--   pro       was 30 AR scans                     → documented unlimited (-1)
--   architect was unlimited everything            → documented 300 / 300 / 100 / 100
--
-- Starter AI generation was already blocked by model routing (no model assigned),
-- but renders/edits quota over-granted; architect was never metered at all.

UPDATE public.tier_limits SET
  ai_generations_per_month = 0,
  ai_edits_per_month       = 0,
  renders_per_month        = 0,
  ar_scans_per_month       = 0
WHERE tier = 'starter';

UPDATE public.tier_limits SET
  ai_generations_per_month = 40,
  ai_edits_per_month       = 30,
  renders_per_month        = 5,
  ar_scans_per_month       = 15
WHERE tier = 'creator';

UPDATE public.tier_limits SET
  ai_generations_per_month = 100,
  ai_edits_per_month       = 80,
  renders_per_month        = 30,
  ar_scans_per_month       = -1
WHERE tier = 'pro';

UPDATE public.tier_limits SET
  ai_generations_per_month = 300,
  ai_edits_per_month       = 300,
  renders_per_month        = 100,
  ar_scans_per_month       = 100
WHERE tier = 'architect';
