# /generate-building

Generate a complete AI building floor plan from a text prompt.

## Usage
```
/generate-building [prompt]
```

## What this does
1. Calls `aiService.generateFloorPlan()` with the provided prompt
2. The Edge Function sends the prompt to Claude claude-sonnet-4-6
3. Claude returns a `BlueprintData` JSON matching `src/types/blueprint.ts`
4. The blueprint is loaded into `blueprintStore` and saved via MMKV
5. The workspace switches to 2D view to show the result

## Key files
- `supabase/functions/ai-generate/index.ts` — Edge Function
- `src/services/aiService.ts` — client caller
- `src/types/blueprint.ts` — BlueprintData contract
- `src/stores/blueprintStore.ts` — state store

## Quota
- Starter: 15/month · Creator: 200/month · Architect: unlimited
- Enforced server-side via `checkQuota()` + `increment_quota RPC`
