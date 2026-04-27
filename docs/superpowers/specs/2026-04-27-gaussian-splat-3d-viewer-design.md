# Gaussian Splat 3D Viewer — Design Specification

## Context

Asoria Architect users want hyper-realistic 3D visualization of furniture and blueprints. This feature adds a "Realistic" rendering mode that swaps procedural box geometry for real GLB/splat meshes sourced from Meshy AI (for furniture generation) and Supabase Storage (for uploaded .splat files from SuperSplat).

**Use cases:**
1. **Furniture preview** — AI-generated furniture from Meshy rendered as realistic GLB meshes in the blueprint viewer
2. **Blueprint visualization** — Uploaded .splat files (generated via SuperSplat externally) rendered in the 3D view for hyper-realistic room scans

**Tier:** Architect only (enforced at UI toggle + Edge Function quota)

---

## Architecture

### Rendering Paths

```
meshUrl → SplatViewer (auto-detects file type)
  ├─ .glb  → useGLTF(url) → <primitive object={gltf.scene} />
  └─ .splat/.ply → SplatLoader.load(url) → THREE.Points → <primitive object={points} />
```

### Tier Gate

- `useTierGate('Architect')` enforced on the `RealisticToggle` button — hidden or disabled for Starter/Creator/Pro users
- Server-side: `render-splat` Edge Function validates Architect quota on every load (limit: 10 requests/hr)

---

## New Files

### `src/components/3d/SplatViewer.tsx`
R3F component that:
- Accepts `meshUrl: string` and `position`, `rotation`, `scale` props
- Auto-detects file type from URL extension (`.glb` vs `.splat`/`.ply`)
- GLB path: uses `useGLTF` from `@react-three/drei`
- Splat path: uses `SplatLoader` (WASM) to decode and render as `THREE.Points`
- Handles loading state with `CompassRoseLoader`
- Handles error state (corrupt file, network failure) gracefully
- Disposes geometry/materials on unmount

### `src/components/3d/SplatLoader.ts`
WASM-based splat decoder:
- Loads the splat WASM binary from a CDN URL once (cached after first load)
- `load(url: string): Promise<THREE.Points>` — fetches .splat, decodes via WASM, returns Three.js Points object
- Works in React Native via expo-gl WebGL2 context
- Memory-managed: caller is responsible for calling `.dispose()` on returned geometry

### `src/components/3d/RealisticToggle.tsx`
Oval toggle button:
- Reuses the `OvalButton` component with a "Realistic" / "Procedural" label
- Reads `isRealistic` from `useSplatMode` hook
- Animated: icon swap + spring scale on toggle
- `useTierGate('Architect')` — renders null (hidden) for non-Architect tiers

### `src/hooks/useSplatMode.ts`
Zustand-backed hook:
```typescript
{ isRealistic: boolean; setRealistic: (v: boolean) => void }
```
Persisted to `uiStore` (not persisted to storage, resets on app restart).

---

## Modified Files

### `src/components/3d/Viewer3D.tsx`
- Import and render `RealisticToggle` in the toolbar area (next to existing grid/shadows toggles)
- Pass `isRealistic` to `FurnitureMesh`

### `src/components/3d/FurnitureMesh.tsx`
Current fallback:
```typescript
// when resolveComponent returns null → box primitive
```
New fallback logic:
```typescript
if (meshUrl && isRealistic) {
  return <SplatViewer meshUrl={meshUrl} position={...} rotation={...} scale={...} />;
}
return <mesh.BoxGeometry />; // existing fallback
```

### `src/stores/blueprintStore.ts` (or `uiStore`)
Add `isRealistic: boolean` and `setRealistic` action.

### `src/types/blueprint.ts`
`FurniturePiece` and `CustomAsset` already have `meshUrl?: string` — no type changes needed.

---

## Edge Function

### `supabase/functions/render-splat/`
- **Input:** `{ meshUrl: string, type: 'glb' | 'splat' }`
- **Auth:** JWT verified (user_id from token)
- **Quota:** Architect tier — 10 requests/hr. Returns `429` with message if exceeded.
- **Fallback:** If file not found or quota exceeded, returns `{ fallbackUrl: null, error: string }`
- **Response:** Streams file directly or returns signed URL

---

## WASM Splat Decoder CDN

Use `splat.js` or similar — the WASM binary is loaded from a CDN at runtime. No native code needed since expo-gl provides WebGL2.

Example CDN: `https://cdn.jsdelivr.net/npm/splat-js@latest/dist/splat.wasm`

---

## Interaction Flow

```
User taps "Realistic" toggle (Architect only)
  → isRealistic = true
  → Viewer3D passes isRealistic to FurnitureMesh
  → FurnitureMesh checks meshUrl on each piece
  → Pieces with meshUrl → SplatViewer (GLB or splat)
  → Pieces without meshUrl → procedural box fallback (unchanged)
  → Toggle back to "Procedural" → restores normal rendering
```

---

## Memory Management

- Splat files can be 10s-100s of MB. Load one at a time.
- `SplatViewer` calls `.dispose()` on geometry and materials in `useEffect` cleanup.
- Loading state shown per-piece via inline `CompassRoseLoader` in the 3D scene (centered on furniture bounding box).

---

## Verification

1. **Unit:** `SplatLoader.load()` returns valid `THREE.Points` for a test .splat file
2. **Integration:** `SplatViewer` renders a GLB mesh when given a `.glb` meshUrl
3. **Tier gate:** Toggle is hidden for Starter user, visible for Architect
4. **Memory:** Verify `.dispose()` is called on unmount (memory leak check)
5. **Quota:** Exceed 10 splat loads/hr → Edge Function returns 429, UI shows toast "Splat quota exceeded. Upgrade to Architect for more."
6. **Fallback:** When meshUrl is invalid or network fails, `SplatViewer` falls back to box geometry silently (or shows optional error toast)

---

## Out of Scope

- AR mode splat rendering (AR Agent owns AR screens)
- Splat editing (SuperSplat-style manipulation — future work)
- Generating splats directly from Meshy (Meshy outputs GLB; splats must be uploaded or converted externally)
