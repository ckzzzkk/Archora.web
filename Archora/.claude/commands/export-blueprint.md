# /export-blueprint

Export the current blueprint in various formats.

## Usage
```
/export-blueprint [format]
```
Formats: `json` | `png` | `cad` (Architect tier only)

## What this does
- `json`: Saves current `BlueprintData` as a JSON file via `expo-file-system`
- `png`: Captures a screenshot of the 2D canvas using Skia `makeImageSnapshot()`
- `cad`: Calls a future `export-cad` Edge Function (Architect tier only)

## Tier gate
- `watermarkedExports`: Starter tier exports include a watermark
- `cadExport`: Architect tier only

## Key files
- `src/stores/blueprintStore.ts` — source data
- `src/utils/tierLimits.ts` — `cadExport` flag
- `src/hooks/useTierGate.ts` — gate check
