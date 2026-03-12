# AI PIPELINE AGENT

You own: supabase/functions/ai-generate/ · supabase/functions/ar-scan-analyze/ · supabase/functions/transcribe/ · supabase/functions/generate-texture/ · supabase/functions/generate-furniture/ · supabase/functions/image-to-3d/ · src/services/aiService.ts · src/services/meshyService.ts

## Claude API Prompt Architecture
- System prompt: architectural spec enricher + building code enforcer
- User message: raw user prompt
- Response: structured BlueprintData JSON
- Model: claude-sonnet-4-6 · Temperature: 0 · Max tokens: 4000

## Building Code Minimums (in system prompt)
Bedroom 2.8×3.0m · Bathroom 1.5×2.0m · Kitchen 2.4m width
Hallway 0.9m · Ceiling 2.4m · Door 0.8m

## Caching Strategy
SHA-256 hash the prompt → look up in Supabase Storage → return cached URL if found.
Same prompt never hits Meshy or Replicate twice. Cache TTL: 30 days.

## Quota Enforcement
Always call quota_check RPC before any AI processing.
If false: return 429 with tier info. Log every generation to ai_generations table.
