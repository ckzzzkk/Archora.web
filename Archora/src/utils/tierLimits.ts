import type { SubscriptionTier } from '../types';

export interface TierLimits {
  aiGenerationsPerMonth: number; // Infinity = unlimited
  arScansPerMonth: number;
  savedProjects: number;
  maxRooms: number;
  maxFloors: number;             // Infinity = unlimited
  threeDSessionMinutes: number;  // -1 = unlimited
  exportWatermark: boolean;      // true = watermark on exports
  audioInput: boolean;
  blueprintUpload: boolean;
  uploadsPerMonth: number;
  firstPersonView: boolean;
  walkthrough: boolean;
  cinematicTour: boolean;
  cinematicTourWatermark: boolean; // true = ASORIA watermark on cinematic tour
  meshyFurniture: boolean;
  customFurniture: boolean;
  batchGeneration: boolean;
  batchSize: number;
  copyRoom: boolean;
  copyLayout: boolean;
  stylePaste: boolean;
  offlineMode: boolean;
  cadExport: boolean;
  buildingCodeCompliance: boolean;
  costEstimator: boolean;
  collaboration: boolean;
  collaborationLimit: number;      // 0 = none
  commercialBuildings: boolean;
  monetiseTemplates: boolean;
  creatorRevenueSplit: number;     // percentage
  prioritySupport: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  starter: {
    aiGenerationsPerMonth: 10,
    arScansPerMonth: 0,
    savedProjects: 3,
    maxRooms: 1,
    maxFloors: 1,
    threeDSessionMinutes: 5,
    exportWatermark: true,
    audioInput: false,
    blueprintUpload: false,
    uploadsPerMonth: 0,
    firstPersonView: false,
    walkthrough: false,
    cinematicTour: false,
    cinematicTourWatermark: true,
    meshyFurniture: false,
    customFurniture: false,
    batchGeneration: false,
    batchSize: 1,
    copyRoom: false,
    copyLayout: false,
    stylePaste: false,
    offlineMode: false,
    cadExport: false,
    buildingCodeCompliance: false,
    costEstimator: false,
    collaboration: false,
    collaborationLimit: 0,
    commercialBuildings: false,
    monetiseTemplates: false,
    creatorRevenueSplit: 0,
    prioritySupport: false,
  },
  creator: {
    aiGenerationsPerMonth: 200,
    arScansPerMonth: 15,
    savedProjects: Infinity,
    maxRooms: 5,
    maxFloors: 5,
    threeDSessionMinutes: -1,
    exportWatermark: false,
    audioInput: true,
    blueprintUpload: true,
    uploadsPerMonth: 30,
    firstPersonView: true,
    walkthrough: true,
    cinematicTour: true,
    cinematicTourWatermark: true,
    meshyFurniture: false,
    customFurniture: false,
    batchGeneration: false,
    batchSize: 1,
    copyRoom: true,
    copyLayout: false,
    stylePaste: true,
    offlineMode: true,
    cadExport: false,
    buildingCodeCompliance: false,
    costEstimator: false,
    collaboration: false,
    collaborationLimit: 0,
    commercialBuildings: false,
    monetiseTemplates: true,
    creatorRevenueSplit: 0,
    prioritySupport: false,
  },
  architect: {
    aiGenerationsPerMonth: Infinity,
    arScansPerMonth: Infinity,
    savedProjects: Infinity,
    maxRooms: Infinity,
    maxFloors: Infinity,
    threeDSessionMinutes: -1,
    exportWatermark: false,
    audioInput: true,
    blueprintUpload: true,
    uploadsPerMonth: Infinity,
    firstPersonView: true,
    walkthrough: true,
    cinematicTour: true,
    cinematicTourWatermark: false,
    meshyFurniture: true,
    customFurniture: true,
    batchGeneration: true,
    batchSize: 5,
    copyRoom: true,
    copyLayout: true,
    stylePaste: true,
    offlineMode: true,
    cadExport: true,
    buildingCodeCompliance: true,
    costEstimator: true,
    collaboration: true,
    collaborationLimit: 5,
    commercialBuildings: true,
    monetiseTemplates: true,
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
