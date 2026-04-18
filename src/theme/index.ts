export * from './colors';
export * from './spacing';
export * from './shapes';

// Premium layered shadows — each tier adds depth + subtle color glow
// Usage: import { SHADOW } from '../../theme'
// Prefer SHADOW.sm / SHADOW.md / SHADOW.lg for cards and interactive elements
// Use DS.shadow in designSystem.ts for component-specific shadow variants
export const SHADOW = {
  // Subtle — for chips, tags, small buttons
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  // Medium — for cards, list items, pressed states
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  // Large — for modals, floating elements, active cards
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
  },
  // Glow — accent-colored outer glow for FABs and highlighted elements
  glow: {
    shadowColor: '#D4A84B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  // Card default (kept for backwards compat)
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  // Modal default (kept for backwards compat)
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 16,
  },
} as const;
