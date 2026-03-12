import type { SubscriptionTier } from '../types';

export interface TierLimits {
  aiGenerationsPerMonth: number; // Infinity = unlimited
  arScansPerMonth: number;
  savedProjects: number;
  maxRooms: number;
  threeDSessionMinutes: number; // -1 = unlimited
  watermarkedExports: boolean;
  audioInput: boolean;
  blueprintUpload: boolean;
  uploadsPerMonth: number;
  firstPersonView: boolean;
  meshyFurniture: boolean;
  batchGeneration: boolean;
  batchSize: number;
  cadExport: boolean;
  buildingCodeCompliance: boolean;
  costEstimator: boolean;
  templateMonetisation: boolean;
  creatorRevenueSplit: number; // percentage
  prioritySupport: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  starter: {
    aiGenerationsPerMonth: 15,
    arScansPerMonth: 2,
    savedProjects: 10,
    maxRooms: 1,
    threeDSessionMinutes: 5,
    watermarkedExports: true,
    audioInput: false,
    blueprintUpload: false,
    uploadsPerMonth: 0,
    firstPersonView: false,
    meshyFurniture: false,
    batchGeneration: false,
    batchSize: 1,
    cadExport: false,
    buildingCodeCompliance: false,
    costEstimator: false,
    templateMonetisation: false,
    creatorRevenueSplit: 0,
    prioritySupport: false,
  },
  creator: {
    aiGenerationsPerMonth: 200,
    arScansPerMonth: 15,
    savedProjects: Infinity,
    maxRooms: 5,
    threeDSessionMinutes: -1,
    watermarkedExports: false,
    audioInput: true,
    blueprintUpload: true,
    uploadsPerMonth: 30,
    firstPersonView: true,
    meshyFurniture: false,
    batchGeneration: false,
    batchSize: 1,
    cadExport: false,
    buildingCodeCompliance: false,
    costEstimator: false,
    templateMonetisation: true,
    creatorRevenueSplit: 0,
    prioritySupport: false,
  },
  architect: {
    aiGenerationsPerMonth: Infinity,
    arScansPerMonth: Infinity,
    savedProjects: Infinity,
    maxRooms: Infinity,
    threeDSessionMinutes: -1,
    watermarkedExports: false,
    audioInput: true,
    blueprintUpload: true,
    uploadsPerMonth: Infinity,
    firstPersonView: true,
    meshyFurniture: true,
    batchGeneration: true,
    batchSize: 5,
    cadExport: true,
    buildingCodeCompliance: true,
    costEstimator: true,
    templateMonetisation: true,
    creatorRevenueSplit: 70,
    prioritySupport: true,
  },
};

export const TIER_PRICES = {
  creator: { monthly: 14.99, annual: 129 },
  architect: { monthly: 39.99, annual: 349 },
} as const;

export const STRIPE_PRICE_IDS = {
  creator_monthly: 'FILL_IN_STRIPE_PRICE_ID',
  creator_annual: 'FILL_IN_STRIPE_PRICE_ID',
  architect_monthly: 'FILL_IN_STRIPE_PRICE_ID',
  architect_annual: 'FILL_IN_STRIPE_PRICE_ID',
} as const;

export function isFeatureAllowed(tier: SubscriptionTier, feature: keyof TierLimits): boolean {
  const limit = TIER_LIMITS[tier][feature];
  if (typeof limit === 'boolean') return limit;
  if (typeof limit === 'number') return limit > 0 || limit === -1 || limit === Infinity;
  return false;
}

export function getUpgradeTier(feature: keyof TierLimits): SubscriptionTier | null {
  if (isFeatureAllowed('creator', feature)) return 'creator';
  if (isFeatureAllowed('architect', feature)) return 'architect';
  return null;
}
