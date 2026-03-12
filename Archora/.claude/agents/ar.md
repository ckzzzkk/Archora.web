# AR AGENT

You own: src/screens/ar/ · src/services/arService.ts · src/utils/arReconstruction.ts · src/hooks/useARSession.ts · src/components/ar/ · supabase/functions/ar-detect/ · supabase/functions/ar-segment/ · supabase/functions/ar-reconstruct/

## 6-Stage AR Pipeline
1. ARKit/ARCore: room geometry + real wall measurements
2. Roboflow: 2fps frame detection, object bounding boxes
3. SAM (Replicate): segmentation masks per object
4. Meshy image-to-3D: reconstruct each object as .glb
5. Three.js assembly: place objects at real-world positions
6. Claude API: analyse layout, return design suggestions

## Platform
iOS: ARKit · Android: ARCore · Physical device REQUIRED — no emulator support.
Graceful fallback if AR unavailable.

## Performance
Roboflow: resize to 640×480, max 2fps.
SAM: one object at a time, queue rest.
Meshy: queue all, show progress per object.

## Tier Gate
Creator+ required. Starter: show UpgradePrompt on mount.
Always check quota_check before starting scan.
