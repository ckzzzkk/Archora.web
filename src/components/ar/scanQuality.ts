interface ScanQualityResult {
  qualityPercent: number; // 0–100
  wallCount: number;
  cornerCount: number;
  prompt: string;
}

/**
 * Calculate scan quality based on captured wall count.
 * Quality = walls captured (up to 4) + corners found.
 */
export function calculateScanQuality(
  capturedWallCount: number,
): ScanQualityResult {
  const wallCount = Math.max(0, capturedWallCount);
  const cornerCount = Math.floor(wallCount / 2);

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
  } else {
    prompt = 'Room captured — tap Complete';
  }

  return { qualityPercent, wallCount, cornerCount, prompt };
}
