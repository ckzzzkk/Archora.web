/**
 * Single client-side gateway to the shared climate knowledge module. App code
 * must import climate data from HERE, never deep-import supabase/ directly —
 * this is the one sanctioned crossing point (climateBriefs.ts is pure TS with
 * zero imports, the same dual-import contract as tierConstants.ts).
 */
export {
  CLIMATE_BRIEFS,
  buildClimatePromptSection,
  resolveFacing,
  toRelativeFacing,
} from '../../../supabase/functions/_shared/climateBriefs';
export type {
  ClimateBrief,
  ClimateZoneId,
  Hemisphere,
  RelativeFacing,
} from '../../../supabase/functions/_shared/climateBriefs';
