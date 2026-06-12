import type { SimulationReport, BlueprintData, ClimateZone } from '../types/blueprint';
import { simulateEnvironment, toSimulationReport } from '../utils/environment';

/**
 * Blueprint simulation — runs the deterministic environment engine locally.
 * Previously this called the simulate-build edge function (an AI call with
 * 30s+ latency and quota cost); the engine produces the same SimulationReport
 * shape instantly, offline, and reproducibly. The climateZone/hemisphere
 * params override blueprint metadata when provided (workspace passes
 * metadata values; older blueprints fall back to temperate/north).
 */
export const simulationService = {
  async simulate(
    blueprint: BlueprintData,
    climateZone: string = 'temperate',
    hemisphere: 'north' | 'south' = 'north',
  ): Promise<SimulationReport> {
    try {
      // Respect explicit caller context without mutating the caller's object.
      const bp: BlueprintData = {
        ...blueprint,
        metadata: {
          ...blueprint.metadata,
          climateZone: (blueprint.metadata?.climateZone ?? climateZone) as ClimateZone,
          hemisphere: blueprint.metadata?.hemisphere ?? hemisphere,
        },
      };
      return toSimulationReport(simulateEnvironment(bp), bp);
    } catch (err) {
      console.warn('[simulationService] simulate failed:', err);
      // Graceful fallback — return a placeholder report so callers don't crash
      return {
        available: false,
        error: err instanceof Error ? err.message : 'Simulation temporarily unavailable',
        overall: 0,
        structural: 0,
        weather: 0,
        flow: 0,
        codeCompliance: 0,
        grade: 'F' as const,
        summary: 'Simulation is currently unavailable. Your blueprint has been saved.',
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
