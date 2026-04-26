// src/__tests__/materials/materialLibrary.test.ts
import { materialLibrary, getMaterial, getMaterialsByCategory } from '../../materials/materialLibrary';

describe('materialLibrary', () => {
  it('should have 54 materials (per spec)', () => {
    expect(materialLibrary.length).toBe(54);
  });

  it('should have all wood species', () => {
    const woods = getMaterialsByCategory('floor').filter(m => m.subcategory === 'wood');
    expect(woods.length).toBeGreaterThanOrEqual(8);
  });

  it('should return material by id', () => {
    const mat = getMaterial('wood_red_oak');
    expect(mat?.name).toBe('Red Oak');
    expect(mat?.color).toBe('#984A2B');
  });

  it('should return undefined for unknown id', () => {
    expect(getMaterial('unknown')).toBeUndefined();
  });

  it('should have stone materials with secondary colors', () => {
    const marble = getMaterial('stone_marble');
    expect(marble?.colorSecondary).toBeTruthy();
  });
});
