import { supabase } from '../utils/supabaseClient';
import type { SimulationReport, BlueprintData } from '../types/blueprint';

export const simulationService = {
  async simulate(
    blueprint: BlueprintData,
    climateZone: string = 'temperate',
    hemisphere: 'north' | 'south' = 'north',
  ): Promise<SimulationReport> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/simulate-build`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ blueprint, climateZone, hemisphere }),
      });

      if (!response.ok) {
        const err = await response.json() as { error?: string };
        throw new Error(err.error ?? 'Simulation failed');
      }

      const raw = await response.json();
      if (!raw || typeof raw !== 'object' || !('report' in raw)) {
        throw new Error('Invalid simulation response');
      }
      return (raw as { report: SimulationReport }).report;
    } catch (err) {
      console.warn('[simulationService] simulate failed:', err);
      // Graceful fallback — return a placeholder report so callers don't crash
      return {
        available: false,
        error: err instanceof Error ? err.message : 'Simulation service temporarily unavailable',
        overall: 0,
        structural: 0,
        weather: 0,
        flow: 0,
        codeCompliance: 0,
        grade: 'F' as const,
        summary: 'Simulation service is currently unavailable. Your blueprint has been saved.',
        strengths: [],
        recommendations: [],
        weatherProfile: {
          solarGain: 'fair' as const,
          windResistance: 'fair' as const,
          rainProtection: 'fair' as const,
          thermalMass: 'fair' as const,
        },
        structuralProfile: {
          loadPath: 'fair' as const,
          spanIntegrity: 'fair' as const,
          foundationFit: 'fair' as const,
          shearWalls: 'fair' as const,
        },
        generatedAt: new Date().toISOString(),
      };
    }
  },
};
