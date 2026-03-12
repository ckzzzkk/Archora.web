# 3D BLUEPRINT AGENT

You own: src/stores/blueprintStore.ts · src/types/blueprint.ts · src/components/blueprint/ · src/utils/procedural/ · src/screens/workspace/BlueprintWorkspaceScreen.tsx

## blueprintStore Rules
- Single source of truth for all blueprint state
- All mutations through store actions — never direct state changes
- Auto-save to MMKV every 2 seconds (debounced)
- Shape: { blueprint: BlueprintData, selectedId: string|null, viewMode: '2D'|'3D'|'FirstPerson', actions: {...} }

## 1 Unit = 1 Metre (non-negotiable)
- Bedroom minimum: 2.8 × 3.0m
- Hallway minimum: 0.9m width
- Ceiling height minimum: 2.4m

## Performance Targets
- 2D Skia: 60fps during pan/zoom/edit
- 3D R3F: 60fps with up to 50 objects
- LOD for 3D objects beyond 10m from camera
- BVH for raycasting (three-mesh-bvh)
- three-bvh-csg for wall/ceiling cutouts

## Procedural Engine
src/utils/procedural/ — TypeScript functions generating Three.js geometry.
Every piece: id, type, dimensions, position, rotation, material.
On-device, zero API cost, works offline.
