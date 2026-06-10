import { vi } from 'vitest';

// Mock expo-crypto — the real module pulls in react-native (Flow syntax) which the
// node test environment cannot parse. randomUUID just needs to return a unique string.
vi.mock('expo-crypto', () => ({
  randomUUID: () => 'test-' + Math.random().toString(36).slice(2) + Date.now().toString(36),
}));

// Mock userCache
vi.mock('../utils/userCache', () => ({
  userCache: {
    load: vi.fn().mockReturnValue({ subscriptionTier: 'architect' }),
  },
}));

// Mock blueprintStorage
vi.mock('../utils/storage', () => ({
  blueprintStorage: {
    get: vi.fn(),
    getString: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock floorHelpers
vi.mock('../utils/floorHelpers', () => ({
  migrateToMultiFloor: vi.fn((data) => data),
  deriveTopLevel: vi.fn((floors, idx) => ({ currentFloorIndex: idx })),
  getFloorLabel: vi.fn((idx) => `Floor ${idx}`),
}));

// Mock geometry utils
vi.mock('../utils/geometry/autoRepair', () => ({
  autoRepairBlueprint: vi.fn((bp) => ({ repaired: bp, report: { totalFixes: 0, wallsSnapped: 0, areasRecalculated: 0, furnitureMoved: 0, openingsClamped: 0 } })),
}));
vi.mock('../utils/geometry/blueprintValidator', () => ({
  validateBlueprint: vi.fn(() => []),
  violationSummary: vi.fn(() => ({ isValid: true, total: 0, critical: 0, major: 0, minor: 0 })),
}));
vi.mock('../utils/geometry/dimensionAccuracy', () => ({
  computeDimensionAccuracy: vi.fn(() => 1.0),
}));

// Mock clipboard
vi.mock('../utils/clipboard', () => ({
  clipboard: {
    push: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  },
}));

// Silence console.warn in tests
vi.spyOn(console, 'warn').mockImplementation(() => {});