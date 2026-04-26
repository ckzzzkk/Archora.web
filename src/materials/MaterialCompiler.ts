// src/materials/MaterialCompiler.ts
import type { Material, PipelineTier } from './types';
import { getMaterial } from './materialLibrary';

// Cache for compiled outputs
const paintCache = new Map<string, unknown>();
const materialCache = new Map<string, unknown>();

export class MaterialCompiler {
  /**
   * Compile material for Skia or Three.js rendering.
   * Returns a Skia Paint-compatible object or Three.js material properties.
   */
  static compile(materialId: string, renderer: 'skia' | 'threejs'): SkiaPaintOutput | ThreeMaterialOutput {
    const cacheKey = `${materialId}:${renderer}`;
    const cache = renderer === 'skia' ? paintCache : materialCache;

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey) as SkiaPaintOutput | ThreeMaterialOutput;
    }

    const material = getMaterial(materialId);
    if (!material) {
      return renderer === 'skia'
        ? { color: '#808080', pattern: 'solid', patternScale: 1.0, roughness: 0.9, metalness: 0 }
        : { color: '#808080', roughness: 0.9, metalness: 0 };
    }

    const tier = this.resolveTier(material);
    const output = renderer === 'skia'
      ? this.buildSkiaPaint(material, tier)
      : this.buildThreeMaterial(material, tier);

    cache.set(cacheKey, output);
    return output;
  }

  static getMaterial(id: string): Material | undefined {
    return getMaterial(id);
  }

  static invalidate(materialId: string): void {
    paintCache.delete(`${materialId}:skia`);
    materialCache.delete(`${materialId}:threejs`);
  }

  private static resolveTier(material: Material): PipelineTier {
    if (material.albedoUrl && material.aiPrompts) return 'hybrid';
    if (material.albedoUrl) return 'textured';
    if (material.aiPrompts) return 'ai';
    return 'procedural';
  }

  private static buildSkiaPaint(material: Material, tier: PipelineTier): SkiaPaintOutput {
    const baseColor = material.color;
    const secondaryColor = material.colorSecondary;

    return {
      color: baseColor,
      secondaryColor,
      pattern: material.pattern,
      patternScale: material.patternScale ?? 1.0,
      roughness: material.roughness,
      metalness: material.metalness,
    };
  }

  private static buildThreeMaterial(material: Material, tier: PipelineTier): ThreeMaterialOutput {
    const base: ThreeMaterialOutput = {
      color: material.color,
      roughness: material.roughness,
      metalness: material.metalness,
    };

    if (tier === 'textured' || tier === 'hybrid') {
      if (material.albedoUrl) base.albedoUrl = material.albedoUrl;
      if (material.normalUrl) base.normalUrl = material.normalUrl;
      if (material.displacementUrl) base.displacementUrl = material.displacementUrl;
      if (material.roughnessUrl) base.roughnessUrl = material.roughnessUrl;
    }

    return base;
  }
}

export interface SkiaPaintOutput {
  color: string;
  secondaryColor?: string;
  pattern: string;
  patternScale: number;
  roughness: number;
  metalness: number;
  albedoUrl?: string;
  normalUrl?: string;
}

export interface ThreeMaterialOutput {
  color: string;
  roughness: number;
  metalness: number;
  albedoUrl?: string;
  normalUrl?: string;
  displacementUrl?: string;
  roughnessUrl?: string;
}
