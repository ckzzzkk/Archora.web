# /view-3d

Switch the blueprint workspace to 3D orbit view.

## Usage
```
/view-3d
```

## What this does
1. Sets `blueprintStore.viewMode = '3D'`
2. Renders `Viewer3D` component with OrbitControls
3. Camera auto-fits to blueprint bounding box

## Key files
- `src/components/3d/Viewer3D.tsx`
- `src/components/3d/ProceduralBuilding.tsx`
- `src/stores/blueprintStore.ts` — `setViewMode`
- `src/hooks/use3DScene.ts` — camera preset calculation
