import type { SubscriptionTier } from '../types';

/** Alias for SubscriptionTier — matches CLAUDE.md spec */
export type Tier = SubscriptionTier;

export interface TierLimits {
  // Project limits
  maxProjects: number;           // -1 = unlimited
  maxRoomsPerProject: number;    // -1 = unlimited
  maxFurniturePerRoom: number;   // -1 = unlimited
  maxFloors: number;             // -1 = unlimited
  // Legacy aliases (kept for backward compat with existing gate usages)
  savedProjects: number;         // same as maxProjects
  maxRooms: number;              // same as maxRoomsPerProject

  // AI quotas
  aiGenerationsPerMonth: number; // -1 = unlimited
  arScansPerMonth: number;       // -1 = unlimited
  arSessionsPerMonth: number;    // alias for arScansPerMonth
  photoImportsPerMonth: number;  // -1 = unlimited
  exportsPerMonth: number;       // -1 = unlimited
  rendersPerMonth: number;       // -1 = unlimited
  aiChatMessagesPerDay: number;  // -1 = unlimited

  // Editing
  dailyEditTimeSeconds: number;  // -1 = unlimited (Starter: 2700 = 45min)
  maxUndoSteps: number;          // -1 = unlimited
  autoSave: boolean;
  autoSaveIntervalSeconds: number; // 0 if autoSave false

  // Features — booleans
  walkthrough: boolean;
  cinematicTour: boolean;
  cinematicTourWatermark: boolean;
  copyRoom: boolean;
  copyLayout: boolean;
  stylePaste: boolean;
  customFurniture: boolean;
  offlineMode: boolean;
  cadExport: boolean;
  costEstimator: boolean;
  collaboration: boolean;
  commercialBuildings: boolean;
  exportWatermark: boolean;
  publishTemplates: boolean;
  vipSupport: boolean;

  // Collaboration
  maxCollaborators: number;     // 0 = none
  // Legacy alias
  collaborationLimit: number;   // same as maxCollaborators

  // Templates & styles
  maxPublishedTemplates: number; // -1 = unlimited
  templateRevenueShare: number;  // 0.0–1.0 fraction
  availableStyles: string[] | 'all';
  templateAccess: number | 'all';

  // Legacy fields kept for backward compat
  audioInput: boolean;
  blueprintUpload: boolean;
  uploadsPerMonth: number;
  firstPersonView: boolean;
  meshyFurniture: boolean;
  batchGeneration: boolean;
  batchSize: number;
  buildingCodeCompliance: boolean;
  monetiseTemplates: boolean;
  creatorRevenueSplit: number;  // percentage 0-100 (legacy of templateRevenueShare × 100)
  prioritySupport: boolean;
  threeDSessionMinutes: number; // -1 = unlimited
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  starter: {
    maxProjects: 3,
    maxRoomsPerProject: 4,
    maxFurniturePerRoom: 10,
    maxFloors: 1,
    savedProjects: 3,
    maxRooms: 4,

    aiGenerationsPerMonth: 10,
    arScansPerMonth: 0,
    arSessionsPerMonth: 0,
    photoImportsPerMonth: 0,
    exportsPerMonth: 2,
    rendersPerMonth: 0,
    aiChatMessagesPerDay: 5,

    dailyEditTimeSeconds: 2700,
    maxUndoSteps: 10,
    autoSave: false,
    autoSaveIntervalSeconds: 0,

    walkthrough: false,
    cinematicTour: false,
    cinematicTourWatermark: true,
    copyRoom: false,
    copyLayout: false,
    stylePaste: false,
    customFurniture: false,
    offlineMode: false,
    cadExport: false,
    costEstimator: false,
    collaboration: false,
    commercialBuildings: false,
    exportWatermark: true,
    publishTemplates: false,
    vipSupport: false,

    maxCollaborators: 0,
    collaborationLimit: 0,

    maxPublishedTemplates: 0,
    templateRevenueShare: 0,
    availableStyles: ['minimalist', 'modern', 'rustic'],
    templateAccess: 5,

    audioInput: false,
    blueprintUpload: false,
    uploadsPerMonth: 0,
    firstPersonView: false,
    meshyFurniture: false,
    batchGeneration: false,
    batchSize: 1,
    buildingCodeCompliance: false,
    monetiseTemplates: false,
    creatorRevenueSplit: 0,
    prioritySupport: false,
    threeDSessionMinutes: 5,
  },

  creator: {
    maxProjects: 25,
    maxRoomsPerProject: 20,
    maxFurniturePerRoom: 50,
    maxFloors: 5,
    savedProjects: 25,
    maxRooms: 20,

    aiGenerationsPerMonth: 200,
    arScansPerMonth: 15,
    arSessionsPerMonth: 15,
    photoImportsPerMonth: 20,
    exportsPerMonth: 20,
    rendersPerMonth: 10,
    aiChatMessagesPerDay: 50,

    dailyEditTimeSeconds: -1,
    maxUndoSteps: 50,
    autoSave: true,
    autoSaveIntervalSeconds: 120,

    walkthrough: true,
    cinematicTour: true,
    cinematicTourWatermark: true,
    copyRoom: true,
    copyLayout: false,
    stylePaste: true,
    customFurniture: false,
    offlineMode: true,
    cadExport: false,
    costEstimator: false,
    collaboration: true,
    commercialBuildings: false,
    exportWatermark: false,
    publishTemplates: true,
    vipSupport: false,

    maxCollaborators: 1,
    collaborationLimit: 1,

    maxPublishedTemplates: 5,
    templateRevenueShare: 0.60,
    availableStyles: 'all',
    templateAccess: 'all',

    audioInput: true,
    blueprintUpload: true,
    uploadsPerMonth: 20,
    firstPersonView: true,
    meshyFurniture: false,
    batchGeneration: false,
    batchSize: 1,
    buildingCodeCompliance: false,
    monetiseTemplates: true,
    creatorRevenueSplit: 60,
    prioritySupport: false,
    threeDSessionMinutes: -1,
  },

  pro: {
    maxProjects: 50,
    maxRoomsPerProject: 20,
    maxFurniturePerRoom: 100,
    maxFloors: 10,
    savedProjects: 50,
    maxRooms: 20,

    aiGenerationsPerMonth: 500,
    arScansPerMonth: -1,
    arSessionsPerMonth: -1,
    photoImportsPerMonth: -1,
    exportsPerMonth: -1,
    rendersPerMonth: -1,
    aiChatMessagesPerDay: -1,

    dailyEditTimeSeconds: -1,
    maxUndoSteps: 100,
    autoSave: true,
    autoSaveIntervalSeconds: 60,

    walkthrough: true,
    cinematicTour: true,
    cinematicTourWatermark: false,
    copyRoom: true,
    copyLayout: true,
    stylePaste: true,
    customFurniture: true,
    offlineMode: true,
    cadExport: false,
    costEstimator: true,
    collaboration: true,
    commercialBuildings: true,
    exportWatermark: false,
    publishTemplates: true,
    vipSupport: false,

    maxCollaborators: 1,
    collaborationLimit: 1,

    maxPublishedTemplates: -1,
    templateRevenueShare: 0.60,
    availableStyles: 'all',
    templateAccess: 'all',

    audioInput: true,
    blueprintUpload: true,
    uploadsPerMonth: -1,
    firstPersonView: true,
    meshyFurniture: false,
    batchGeneration: true,
    batchSize: 3,
    buildingCodeCompliance: true,
    monetiseTemplates: true,
    creatorRevenueSplit: 60,
    prioritySupport: false,
    threeDSessionMinutes: -1,
  },

  architect: {
    maxProjects: -1,
    maxRoomsPerProject: -1,
    maxFurniturePerRoom: -1,
    maxFloors: -1,
    savedProjects: -1,
    maxRooms: -1,

    aiGenerationsPerMonth: -1,
    arScansPerMonth: -1,
    arSessionsPerMonth: -1,
    photoImportsPerMonth: -1,
    exportsPerMonth: -1,
    rendersPerMonth: -1,
    aiChatMessagesPerDay: -1,

    dailyEditTimeSeconds: -1,
    maxUndoSteps: -1,
    autoSave: true,
    autoSaveIntervalSeconds: 30,

    walkthrough: true,
    cinematicTour: true,
    cinematicTourWatermark: false,
    copyRoom: true,
    copyLayout: true,
    stylePaste: true,
    customFurniture: true,
    offlineMode: true,
    cadExport: true,
    costEstimator: true,
    collaboration: true,
    commercialBuildings: true,
    exportWatermark: false,
    publishTemplates: true,
    vipSupport: true,

    maxCollaborators: 5,
    collaborationLimit: 5,

    maxPublishedTemplates: -1,
    templateRevenueShare: 0.80,
    availableStyles: 'all',
    templateAccess: 'all',

    audioInput: true,
    blueprintUpload: true,
    uploadsPerMonth: -1,
    firstPersonView: true,
    meshyFurniture: true,
    batchGeneration: true,
    batchSize: 5,
    buildingCodeCompliance: true,
    monetiseTemplates: true,
    creatorRevenueSplit: 70,
    prioritySupport: true,
    threeDSessionMinutes: -1,
  },
};

export const TIER_PRICES = {
  creator: { monthly: 14.99, annual: 143.90 },
  pro: { monthly: 24.99, annual: 239.90 },
  architect: { monthly: 39.99, annual: 383.90 },
} as const;

export const STRIPE_PRICE_IDS = {
  creator_monthly:   process.env.EXPO_PUBLIC_STRIPE_PRICE_CREATOR_MONTHLY   ?? '',
  creator_annual:    process.env.EXPO_PUBLIC_STRIPE_PRICE_CREATOR_ANNUAL    ?? '',
  pro_monthly:       process.env.EXPO_PUBLIC_STRIPE_PRICE_PRO_MONTHLY       ?? '',
  pro_annual:        process.env.EXPO_PUBLIC_STRIPE_PRICE_PRO_ANNUAL        ?? '',
  architect_monthly: process.env.EXPO_PUBLIC_STRIPE_PRICE_ARCHITECT_MONTHLY ?? '',
  architect_annual:  process.env.EXPO_PUBLIC_STRIPE_PRICE_ARCHITECT_ANNUAL  ?? '',
};

export function isFeatureAllowed(tier: SubscriptionTier, feature: keyof TierLimits): boolean {
  const limit = TIER_LIMITS[tier][feature];
  if (typeof limit === 'boolean') return limit;
  if (typeof limit === 'number') return limit > 0 || limit === -1 || limit === Infinity;
  if (limit === 'all') return true;
  if (Array.isArray(limit)) return limit.length > 0;
  return false;
}

export function getUpgradeTier(feature: keyof TierLimits): SubscriptionTier | null {
  if (isFeatureAllowed('creator', feature)) return 'creator';
  if (isFeatureAllowed('pro', feature)) return 'pro';
  if (isFeatureAllowed('architect', feature)) return 'architect';
  return null;
}

/** Returns true if the given count is under the tier limit (-1 means unlimited). */
export function isUnderLimit(tier: SubscriptionTier, feature: keyof TierLimits, count: number): boolean {
  const limit = TIER_LIMITS[tier][feature];
  if (typeof limit !== 'number') return true;
  if (limit === -1 || limit === Infinity) return true;
  return count < limit;
}

/** Returns which styles are accessible for a given tier. */
export function getAvailableStyles(tier: SubscriptionTier): string[] | 'all' {
  return TIER_LIMITS[tier].availableStyles;
}

/** Returns true if the given styleId is accessible for the provided availableStyles value. */
export function isStyleAccessible(styleId: string, availableStyles: string[] | 'all'): boolean {
  if (availableStyles === 'all') return true;
  return (availableStyles as string[]).includes(styleId);
}

/** Returns the next tier above the given one, or null if already at top. */
export function getUpgradeTierFromCurrent(tier: Tier): Tier | null {
  if (tier === 'starter') return 'creator';
  if (tier === 'creator') return 'pro';
  if (tier === 'pro') return 'architect';
  return null;
}
