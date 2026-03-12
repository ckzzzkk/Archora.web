# /add-furniture

Add AI-generated furniture to a room in the current blueprint.

## Usage
```
/add-furniture [roomId] [roomType] [style?] [count?]
```

## What this does
1. Calls `supabase/functions/ai-furniture` with roomType + optional style
2. Claude generates furniture JSON (position, dimensions, rotation, material)
3. Each piece is added to `blueprintStore` via `addFurniture()`
4. 3D viewer updates immediately

## Key files
- `supabase/functions/ai-furniture/index.ts` — Edge Function
- `src/stores/blueprintStore.ts` — `addFurniture` action
- `src/components/3d/furniture/` — renderer components
- `src/utils/procedural/furniture.ts` — type definitions

## Tier gate
- `meshyFurniture` feature — Architect only for Meshy 3D models
- Standard procedural furniture is available on all tiers
