import type { DetectedPlane } from '../../native/ARCoreModule';

interface ScanQualityResult {
  qualityPercent: number; // 0–100
  wallCount: number;
  cornerCount: number;
  prompt: string;
}

/**
 * Calculate scan quality based on detected wall planes.
 * Quality = walls captured (up to 4) + corners found.
 * Corners = where 2+ walls meet at similar positions.
 */
export function calculateScanQuality(
  planes: DetectedPlane[],
  capturedWallCount: number,
): ScanQualityResult {
  const wallCount = capturedWallCount;
  const cornerCount = Math.floor(wallCount / 2); // rough estimate

  const qualityPercent = Math.min(
    100,
    Math.round((wallCount / 4) * 80 + (cornerCount / 4) * 20),
  );

  let prompt: string;
  if (wallCount === 0) {
    prompt = 'Point your camera at a wall and slowly walk around';
  } else if (wallCount === 1) {
    prompt = 'Good — scan the next wall';
  } else if (wallCount === 2) {
    prompt = 'Good coverage — scan corners next';
  } else if (wallCount === 3) {
    prompt = 'Almost complete — scan the last wall';
  } else if (wallCount >= 4) {
    prompt = 'Room captured — tap Complete';
  } else {
    prompt = 'Keep scanning walls';
  }

  return { qualityPercent, wallCount, cornerCount, prompt };
}
