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
}

export type GenerationStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
