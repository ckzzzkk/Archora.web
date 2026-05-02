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
  aiEditsPerMonth: number;       // -1 = unlimited
  arScansPerMonth: number;       // -1 = unlimited
  arSessionsPerMonth: number;    // alias for arScansPerMonth
  vigaRequestsPerMonth: number; // -1 = unlimited (Architect tier)
  photoImportsPerMonth: number;  // -1 = unlimited
  exportsPerMonth: number;       // -1 = unlimited
  rendersPerMonth: number;       // -1 = unlimited
  aiChatMessagesPerDay: number;  // -1 = unlimited

  // Editing
  dailyEditTimeSeconds: number;  // -1 = unlimited (Starter: 900 = 15min)
  maxUndoSteps: number;          // -1 = unlimited
  autoSave: boolean;
  autoSaveIntervalSeconds: number; // 0 if autoSave false

  // Features — booleans
  arMeasure: boolean;
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
  coProjectsEnabled: boolean;
  codesignEnabled: boolean;

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

  // AI model routing
  aiModelGeneration: string | null;   // null = not available for this tier
  aiModelChat: string | null;
  aiModelEdits: string | null;
  aiChatFallbackModel: string | null;  // model to use when soft cap is hit
  aiChatSoftCapPerDay: number;         // silent degradation threshold
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  starter: {
    // Heavy friction — manual mode only, no AI
    maxProjects: 1,
    maxRoomsPerProject: 2,
    maxFurniturePerRoom: 5,
    maxFloors: 1,
    savedProjects: 1,
    maxRooms: 2,

    aiGenerationsPerMonth: 0,      // NO AI generation — manual only
    aiEditsPerMonth: 0,            // No AI editing
    arScansPerMonth: 0,
    arSessionsPerMonth: 0,
    vigaRequestsPerMonth: 0,
    photoImportsPerMonth: 0,
    exportsPerMonth: 1,            // Reduced exports
    rendersPerMonth: 0,            // No AI renders
    aiChatMessagesPerDay: 0,       // No AI chat

    dailyEditTimeSeconds: 900,    // 15 min/day only
    maxUndoSteps: 5,
    autoSave: false,
    autoSaveIntervalSeconds: 0,

    arMeasure: false,
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
    coProjectsEnabled: false,
    codesignEnabled: false,

    maxCollaborators: 0,
    collaborationLimit: 0,

    maxPublishedTemplates: 0,
    templateRevenueShare: 0,
    availableStyles: ['minimalist', 'modern', 'rustic'],
    templateAccess: 3,

    audioInput: false,
    blueprintUpload: false,
    uploadsPerMonth: 0,
    firstPersonView: false,
    meshyFurniture: false,
    batchGeneration: false,
    batchSize: 0,
    buildingCodeCompliance: false,
    monetiseTemplates: false,
    creatorRevenueSplit: 0,
    prioritySupport: false,
    threeDSessionMinutes: 0,

    // AI model routing
    aiModelGeneration: null,
    aiModelChat: null,
    aiModelEdits: null,
    aiChatFallbackModel: null,
    aiChatSoftCapPerDay: 0,
  },

  creator: {
    maxProjects: 25,
    maxRoomsPerProject: 15,
    maxFurniturePerRoom: 50,
    maxFloors: 5,
    savedProjects: 25,
    maxRooms: 15,

    aiGenerationsPerMonth: 40,
    aiEditsPerMonth: 30,
    arScansPerMonth: 15,
    arSessionsPerMonth: 15,
    vigaRequestsPerMonth: 0,
    photoImportsPerMonth: 10,
    exportsPerMonth: 20,
    rendersPerMonth: 5,
    aiChatMessagesPerDay: 25,

    dailyEditTimeSeconds: -1,
    maxUndoSteps: 50,
    autoSave: true,
    autoSaveIntervalSeconds: 120,

    arMeasure: false,
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
    coProjectsEnabled: false,
    codesignEnabled: false,

    maxCollaborators: 1,
    collaborationLimit: 1,

    maxPublishedTemplates: 5,
    templateRevenueShare: 0.60,
    availableStyles: 'all',
    templateAccess: 'all',

    audioInput: false,
    blueprintUpload: true,
    uploadsPerMonth: 10,
    firstPersonView: true,
    meshyFurniture: false,
    batchGeneration: false,
    batchSize: 0,
    buildingCodeCompliance: false,
    monetiseTemplates: true,
    creatorRevenueSplit: 60,
    prioritySupport: false,
    threeDSessionMinutes: 30,

    // AI model routing
    aiModelGeneration: 'deepseek-chat',
    aiModelChat: 'deepseek-chat',
    aiModelEdits: 'deepseek-chat',
    aiChatFallbackModel: null,
    aiChatSoftCapPerDay: 25,
  },

  pro: {
    maxProjects: 50,
    maxRoomsPerProject: 20,
    maxFurniturePerRoom: 100,
    maxFloors: 10,
    savedProjects: 50,
    maxRooms: 20,

    aiGenerationsPerMonth: 100,
    aiEditsPerMonth: 80,
    arScansPerMonth: -1,
    arSessionsPerMonth: -1,
    vigaRequestsPerMonth: 10,
    photoImportsPerMonth: -1,
    exportsPerMonth: -1,
    rendersPerMonth: 30,
    aiChatMessagesPerDay: -1,

    dailyEditTimeSeconds: -1,
    maxUndoSteps: 100,
    autoSave: true,
    autoSaveIntervalSeconds: 60,

    arMeasure: true,
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
    coProjectsEnabled: false,
    codesignEnabled: false,

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

    // AI model routing
    aiModelGeneration: 'deepseek-chat',
    aiModelChat: 'claude-haiku-4-5-20251001',
    aiModelEdits: 'deepseek-chat',
    aiChatFallbackModel: 'deepseek-chat',
    aiChatSoftCapPerDay: 50,
  },

  architect: {
    maxProjects: 100,
    maxRoomsPerProject: 50,
    maxFurniturePerRoom: -1,
    maxFloors: 20,
    savedProjects: 100,
    maxRooms: 50,

    aiGenerationsPerMonth: 300,
    aiEditsPerMonth: 300,
    arScansPerMonth: 100,
    arSessionsPerMonth: 100,
    vigaRequestsPerMonth: 50,
    photoImportsPerMonth: 100,
    exportsPerMonth: 50,
    rendersPerMonth: 100,
    aiChatMessagesPerDay: 200,

    dailyEditTimeSeconds: -1,
    maxUndoSteps: -1,
    autoSave: true,
    autoSaveIntervalSeconds: 30,

    arMeasure: true,
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
    coProjectsEnabled: true,
    codesignEnabled: true,

    maxCollaborators: 5,
    collaborationLimit: 5,

    maxPublishedTemplates: -1,
    templateRevenueShare: 0.70,
    availableStyles: 'all',
    templateAccess: 'all',

    audioInput: true,
    blueprintUpload: true,
    uploadsPerMonth: 200,
    firstPersonView: true,
    meshyFurniture: true,
    batchGeneration: true,
    batchSize: 5,
    buildingCodeCompliance: true,
    monetiseTemplates: true,
    creatorRevenueSplit: 70,
    prioritySupport: true,
    threeDSessionMinutes: 300,

    // AI model routing
    aiModelGeneration: 'claude-haiku-4-5-20251001',
    aiModelChat: 'claude-sonnet-4-6',
    aiModelEdits: 'claude-haiku-4-5-20251001',
    aiChatFallbackModel: 'claude-haiku-4-5-20251001',
    aiChatSoftCapPerDay: 50,
  },
};

export const TIER_PRICES = {
  creator: { monthly: 14.99, annual: 179.90 },
  pro: { monthly: 24.99, annual: 239.90 },
  architect: { monthly: 39.99, annual: 383.90 },
} as const;

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

export const ARCHITECT_LIMITS = {
  starter: 3,
  creator: 7,
  pro: 11,
  architect: 12,
} as const;