import { describe, it, expect } from 'vitest';
import { calculateScanQuality } from '../../components/ar/scanQuality';

describe('calculateScanQuality', () => {
  it('grows with wall count up to 100%', () => {
    expect(calculateScanQuality(0).qualityPercent).toBe(0);
    const q1 = calculateScanQuality(1).qualityPercent;
    const q2 = calculateScanQuality(2).qualityPercent;
    const q4 = calculateScanQuality(4).qualityPercent;
    expect(q1).toBeGreaterThan(0);
    expect(q2).toBeGreaterThan(q1);
    expect(q4).toBe(90); // 4 walls + 2 corners of 4 (pre-existing formula)
  });

  it('discounts fragmented scans (tiny plane slivers)', () => {
    const solid = calculateScanQuality(4, { totalPlaneAreaM2: 24 }); // 6m² per wall
    const slivers = calculateScanQuality(4, { totalPlaneAreaM2: 2 }); // 0.5m² per wall
    expect(slivers.qualityPercent).toBeLessThan(solid.qualityPercent);
    expect(slivers.qualityPercent).toBeLessThan(70); // would trip the confirm gate
  });

  it('behaves exactly as before when no signals are provided', () => {
    expect(calculateScanQuality(3).qualityPercent).toBe(
      Math.min(100, Math.round((3 / 4) * 80 + (1 / 4) * 20)),
    );
  });

  it('prompts progress through the scan', () => {
    expect(calculateScanQuality(0).prompt).toContain('Point your camera');
    expect(calculateScanQuality(4).prompt).toContain('Complete');
  });
});
