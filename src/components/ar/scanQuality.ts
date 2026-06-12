interface ScanQualityResult {
  qualityPercent: number; // 0–100
  wallCount: number;
  cornerCount: number;
  prompt: string;
}

export interface ScanQualitySignals {
  /** Sum of detected wall-plane areas in m² — fragmented scans score lower. */
  totalPlaneAreaM2?: number;
}

/**
 * Calculate scan quality from captured wall count plus an optional plane-area
 * signal. Base quality = walls captured (up to 4) + corners found; the area
 * factor then discounts fragmented detections (lots of tiny plane slivers
 * that reconstruct badly) and slightly rewards solid full-wall captures.
 */
export function calculateScanQuality(
  capturedWallCount: number,
  signals?: ScanQualitySignals,
): ScanQualityResult {
  const wallCount = Math.max(0, capturedWallCount);
  const cornerCount = Math.floor(wallCount / 2);

  let qualityPercent = Math.min(
    100,
    Math.round((wallCount / 4) * 80 + (cornerCount / 4) * 20),
  );

  if (wallCount > 0 && signals?.totalPlaneAreaM2 !== undefined) {
    const avgArea = signals.totalPlaneAreaM2 / wallCount;
    // A real wall capture is ≥ ~1.5m² of plane area.
    if (avgArea < 0.75) qualityPercent = Math.round(qualityPercent * 0.6);
    else if (avgArea < 1.5) qualityPercent = Math.round(qualityPercent * 0.8);
    else if (avgArea >= 3) qualityPercent = Math.min(100, qualityPercent + 5);
  }

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
