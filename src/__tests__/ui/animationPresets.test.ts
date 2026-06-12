import { describe, it, expect } from 'vitest';
import { SPRING, DUR, STAGGER_MS } from '../../utils/animationPresets';

// Shape pin: an accidental edit to the shared motion vocabulary should fail
// loudly here rather than silently changing the feel of every screen.
describe('animationPresets', () => {
  it('exposes the three spring tiers with sane physics', () => {
    for (const name of ['snappy', 'standard', 'soft'] as const) {
      const s = SPRING[name];
      expect(s.damping).toBeGreaterThan(0);
      expect(s.stiffness).toBeGreaterThan(0);
      expect(s.mass).toBeGreaterThan(0);
    }
    // snappy reacts faster than soft
    expect(SPRING.snappy.stiffness).toBeGreaterThan(SPRING.soft.stiffness);
  });

  it('re-exports the design-system duration tokens', () => {
    expect(DUR).toEqual({ fast: 150, normal: 250, slow: 400, verySlow: 600 });
  });

  it('stagger stays subtle', () => {
    expect(STAGGER_MS).toBeGreaterThanOrEqual(40);
    expect(STAGGER_MS).toBeLessThanOrEqual(100);
  });
});
