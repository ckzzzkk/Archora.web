# /first-person

Enter first-person walk-through mode (Creator/Architect tier).

## Usage
```
/first-person
```

## What this does
1. Checks `firstPersonView` tier gate
2. Sets `blueprintStore.viewMode = 'FirstPerson'`
3. Renders `InHouseView` with swipe-to-look controls
4. Camera starts at eye-height (1.65m) at the centroid of the first room

## Tier gate
- Requires `firstPersonView = true` (Creator or Architect)
- Starter users see an upgrade prompt

## Key files
- `src/components/3d/InHouseView.tsx`
- `src/utils/procedural/sceneHelpers.ts` — `computeFirstPersonPreset`
- `src/utils/tierLimits.ts` — `firstPersonView`
