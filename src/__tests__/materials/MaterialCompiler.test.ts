// src/__tests__/materials/MaterialCompiler.test.ts
import { MaterialCompiler } from '../../materials/MaterialCompiler';

describe('MaterialCompiler', () => {
  it('should compile material for skia renderer', () => {
    const paint = MaterialCompiler.compile('wood_red_oak', 'skia');
    expect(paint).toBeDefined();
    expect(paint.color).toBe('#984A2B');
  });

  it('should compile material for threejs renderer', () => {
    const mat = MaterialCompiler.compile('wood_red_oak', 'threejs');
    expect(mat).toBeDefined();
    expect(mat.color).toBe('#984A2B');
    expect(mat.roughness).toBe(0.7);
  });

  it('should return stone material with secondary color', () => {
    const mat = MaterialCompiler.compile('stone_marble', 'threejs');
    expect(mat.color).toBe('#F0EDE8');
  });

  it('should invalidate cache', () => {
    MaterialCompiler.invalidate('wood_red_oak');
    // No error = success
  });

  it('should get material definition', () => {
    const def = MaterialCompiler.getMaterial('stone_granite');
    expect(def?.name).toBe('Granite');
    expect(def?.stoneType).toBe('granite');
  });
});
