# src/components/ — Component Context

Owner: 3D Blueprint Agent (blueprint/, 3d/) · UI Social Agent (common/, social/, dashboard/)

## Component Patterns

### All components
- Named exports only (no default exports)
- NativeWind className for layout; inline style only for dynamic values
- Reanimated 3 for all animation (entering/exiting/useAnimatedStyle)
- Never use ActivityIndicator — import CompassRoseLoader

### common/
- Atoms only: no data fetching, no store access
- Props should be minimal and composable
- Always forward testID

### blueprint/
- May read from blueprintStore (selector pattern)
- Mutations always through `actions.*`
- No direct API calls — use hooks

### 3d/
- R3F components only (render inside a <Canvas>)
- Furniture components receive position/rotation/dimensions as Vector3D props
- Shared materials via `getSharedMaterial()` from geometry.ts
- Dispose geometries and materials on unmount for memory management

### social/
- May call Supabase directly for optimistic updates (likes, ratings)
- All writes are fire-and-forget with local revert on error
