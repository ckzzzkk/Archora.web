# /scan-room

Start an AR room scan using the device camera.

## Usage
```
/scan-room
```

## Pipeline
1. ARScanScreen captures frames via `expo-camera`
2. Frames uploaded to Supabase Storage (`ar-scans` bucket)
3. `ar-reconstruct` Edge Function runs:
   - Roboflow detects objects in the first frame
   - Meshy API starts async 3D reconstruction
4. Scan record created in `ar_scans` table
5. Client polls `arService.getScanStatus()` until `status === 'complete'`
6. Completed mesh URL is used in Three.js scene

## Key files
- `src/screens/ar/ARScanScreen.tsx`
- `src/services/arService.ts`
- `supabase/functions/ar-reconstruct/index.ts`

## Quota
- Starter: 2/month · Creator: 15/month · Architect: unlimited
