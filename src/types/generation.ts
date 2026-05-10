import type { ClimateZone } from './blueprint';

export interface GenerationPayload {
  buildingType: 'house' | 'apartment' | 'office' | 'studio' | 'villa' | 'commercial';
  plotSize: number;
  plotUnit: 'm2' | 'ft2';
  bedrooms: number;
  bathrooms: number;
  livingAreas: number;
  hasGarage: boolean;
  hasGarden: boolean;
  hasPool: boolean;
  poolSize?: 'small' | 'medium' | 'large';
  hasHomeOffice: boolean;
  hasUtilityRoom: boolean;
  style: string;
  referenceImageUrl?: string;
  additionalNotes: string;
  transcript?: string;
  climateZone?: ClimateZone;
  hemisphere?: 'north' | 'south';
  architectId?: string;
  /** Number of floors. Defaults to 1. Pro/Architect tiers: 1–20 */
  floors?: number;
  /** Optional explicit plot dimensions in metres. Takes priority over plotSize when both are set. */
  explicitPlotWidth?: number;
  explicitPlotDepth?: number;
  /** Per-room size overrides. Key = room type, value = dimensions in metres. */
  roomSizes?: Record<string, { width: number; depth: number }>;
  /** Layout style hint — instructs the AI on preferred room arrangement style. */
  layoutStyle?: 'traditional' | 'open_plan' | 'mixed';
  /** Selected house archetype ID from the reference library. */
  archetypeId?: string;
}

export type GenerationStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type QuestionCategory = 'qualification' | 'lifestyle' | 'future' | 'sustainability' | 'measurement' | 'budget' | 'architect_philosophy';

export interface ConsultationSummary {
  tier: 'starter' | 'creator' | 'pro' | 'architect';
  architectId: string | null;
  projectType: 'new' | 'renovation' | 'extension' | 'exploring';
  siteStatus: 'owned' | 'under_contract' | 'looking' | 'apartment';
  timeline: 'urgent' | '6_months' | '1_year' | 'exploring';
  budgetRange: 'under_150k' | '150k_300k' | '300k_500k' | '500k_plus' | 'flexible' | 'unsure';
  householdSize: number;
  householdDescription: string; // "couple, both work from home, 2 young children"
  dailyRoutine: string; // synthesized from lifestyle questions
  entertainingFrequency: 'daily' | 'weekly' | 'monthly' | 'rarely';
  keyFrustrations: string[];
  futurePlans: string[];
  sustainabilityInterest: 'none' | 'some' | 'high';
  accessibilityNeeds: boolean;
  materialPreferences: string[];
  measurementStatus: 'unverified' | 'approximate' | 'verified';
  architectInsights: string[]; // philosophy-calibrated notes
}
