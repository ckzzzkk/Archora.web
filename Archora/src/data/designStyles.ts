import type { ArchStyle } from '../types';

export interface DesignStyle {
  id: ArchStyle;
  name: string;
  colours: string[];          // hex values
  colourNames: string[];
  furnitureDescription: string;
  materials: string[];
  characteristics: string[];
  previewGradient: [string, string];  // for card background
  primaryWallColour: string;          // default wall colour when applied
}

export const DESIGN_STYLES: DesignStyle[] = [
  {
    id: 'minimalist',
    name: 'Minimalist',
    colours: ['#F5F5F5', '#D0D0D0', '#1A1A1A', '#C8A87A'],
    colourNames: ['White', 'Light Grey', 'Black', 'Natural Wood'],
    furnitureDescription: 'Clean lines, no ornamentation, hidden storage',
    materials: ['Concrete', 'Glass', 'Light wood'],
    characteristics: ['Open space', 'Hidden storage', 'Neutral palette', 'Negative space'],
    previewGradient: ['#F5F5F5', '#E0E0E0'],
    primaryWallColour: '#F5F5F5',
  },
  {
    id: 'modern',
    name: 'Modern',
    colours: ['#FFFFFF', '#808080', '#1A1A1A', '#C0C8C8'],
    colourNames: ['White', 'Grey', 'Black', 'Chrome'],
    furnitureDescription: 'Sleek, geometric, smooth surfaces',
    materials: ['Glass', 'Steel', 'Lacquer'],
    characteristics: ['Open plan', 'Lots of light', 'Clean lines', 'Functional'],
    previewGradient: ['#FFFFFF', '#D8D8D8'],
    primaryWallColour: '#FFFFFF',
  },
  {
    id: 'scandinavian',
    name: 'Scandinavian',
    colours: ['#F5F2EE', '#E0D8C8', '#C8A87A', '#B8B8B8'],
    colourNames: ['White', 'Beige', 'Light Wood', 'Soft Grey'],
    furnitureDescription: 'Simple, functional, cosy with natural warmth',
    materials: ['Light wood', 'Wool', 'Cotton', 'Linen'],
    characteristics: ['Hygge', 'Natural light', 'Cosy textures', 'Functional beauty'],
    previewGradient: ['#F5F2EE', '#E8E0D0'],
    primaryWallColour: '#F5F2EE',
  },
  {
    id: 'industrial',
    name: 'Industrial',
    colours: ['#404040', '#8A5A3A', '#6A4828', '#1A1A1A'],
    colourNames: ['Charcoal', 'Rust', 'Brown', 'Black'],
    furnitureDescription: 'Raw, utilitarian, reclaimed materials',
    materials: ['Exposed brick', 'Steel', 'Reclaimed wood'],
    characteristics: ['High ceilings', 'Exposed pipes', 'Raw finishes', 'Open plan'],
    previewGradient: ['#484848', '#2A2A2A'],
    primaryWallColour: '#484848',
  },
  {
    id: 'bohemian',
    name: 'Bohemian',
    colours: ['#C05838', '#C8A028', '#3A7878', '#6A3878'],
    colourNames: ['Terracotta', 'Mustard', 'Teal', 'Purple'],
    furnitureDescription: 'Eclectic, layered, richly textured mix of eras',
    materials: ['Rattan', 'Macramé', 'Velvet', 'Brass'],
    characteristics: ['Plants', 'Layered patterns', 'Cosy chaos', 'Global influences'],
    previewGradient: ['#C05838', '#6A3878'],
    primaryWallColour: '#E0D0C0',
  },
  {
    id: 'luxury',
    name: 'Luxury',
    colours: ['#F0EAD8', '#C8A830', '#1A3058', '#2A6040'],
    colourNames: ['Cream', 'Gold', 'Deep Blue', 'Emerald'],
    furnitureDescription: 'Ornate, plush, statement pieces with presence',
    materials: ['Marble', 'Velvet', 'Brass', 'Silk'],
    characteristics: ['Symmetry', 'Grandeur', 'Quality materials', 'Statement lighting'],
    previewGradient: ['#F0EAD8', '#C8A830'],
    primaryWallColour: '#F0EAD8',
  },
  {
    id: 'rustic',
    name: 'Rustic',
    colours: ['#6A4020', '#F0EAD8', '#4A6040', '#A84828'],
    colourNames: ['Brown', 'Cream', 'Green', 'Rust'],
    furnitureDescription: 'Chunky, natural, aged with character',
    materials: ['Reclaimed wood', 'Stone', 'Iron'],
    characteristics: ['Farmhouse feel', 'Cosy', 'Natural imperfections', 'Warmth'],
    previewGradient: ['#C8A870', '#6A4020'],
    primaryWallColour: '#F0E8D8',
  },
  {
    id: 'coastal',
    name: 'Coastal',
    colours: ['#F5F5F0', '#3A78C8', '#D8C8A0', '#E87848'],
    colourNames: ['White', 'Blue', 'Sand', 'Coral'],
    furnitureDescription: 'Light, airy, casual and relaxed',
    materials: ['Whitewashed wood', 'Linen', 'Jute', 'Rattan'],
    characteristics: ['Bright', 'Open', 'Beach inspired', 'Natural textures'],
    previewGradient: ['#F5F5F0', '#3A78C8'],
    primaryWallColour: '#F5F5F0',
  },
  {
    id: 'japanese',
    name: 'Japanese',
    colours: ['#F5F2EE', '#C8A87A', '#1A1A1A', '#909080'],
    colourNames: ['White', 'Natural Wood', 'Black', 'Stone'],
    furnitureDescription: 'Low, minimal, purposeful — every object considered',
    materials: ['Bamboo', 'Paper', 'Stone', 'Unfinished wood'],
    characteristics: ['Wabi-sabi', 'Zen', 'Nature connection', 'Emptiness as beauty'],
    previewGradient: ['#F5F2EE', '#C8B890'],
    primaryWallColour: '#F5F2EE',
  },
  {
    id: 'art_deco',
    name: 'Art Deco',
    colours: ['#1A1A1A', '#C8A828', '#F0E8D0', '#2A6040'],
    colourNames: ['Black', 'Gold', 'Cream', 'Emerald'],
    furnitureDescription: 'Geometric, glamorous, bold with metallic accents',
    materials: ['Lacquer', 'Chrome', 'Velvet', 'Mirrors'],
    characteristics: ['Symmetry', 'Luxury', 'Geometric patterns', 'Bold lines'],
    previewGradient: ['#1A1A1A', '#C8A828'],
    primaryWallColour: '#1A1A1A',
  },
  {
    id: 'mid_century_modern',
    name: 'Mid Century Modern',
    colours: ['#D04820', '#2A8080', '#6A3818', '#F0E0C0'],
    colourNames: ['Orange', 'Teal', 'Walnut', 'Cream'],
    furnitureDescription: 'Organic shapes, tapered legs, retro warmth',
    materials: ['Walnut', 'Fibreglass', 'Wool', 'Teak'],
    characteristics: ['Retro', 'Functional', 'Bold accent colours', 'Nature meets industry'],
    previewGradient: ['#D04820', '#2A8080'],
    primaryWallColour: '#F0E0C0',
  },
  {
    id: 'eclectic',
    name: 'Eclectic',
    colours: ['#E8D0B0', '#607090', '#A05030', '#40605A'],
    colourNames: ['Warm Neutral', 'Blue', 'Rust', 'Teal'],
    furnitureDescription: 'Personal mix of periods and styles — curated not random',
    materials: ['Anything goes — mix and match'],
    characteristics: ['Personal', 'Curated', 'Unique', 'Collected over time'],
    previewGradient: ['#E8D0B0', '#607090'],
    primaryWallColour: '#F0E8E0',
  },
  {
    id: 'japandi',
    name: 'Japandi',
    colours: ['#F5F0E8', '#5C4A3A', '#8B9B7A', '#2C2820', '#D4C8B8'],
    colourNames: ['Washi White', 'Wenge', 'Moss Green', 'Sumi Black', 'Clay'],
    furnitureDescription: 'Low-profile seating, shoji-inspired screens, bonsai accents',
    materials: ['White oak', 'Washi paper', 'Bamboo', 'Linen'],
    characteristics: ['Wabi-sabi imperfection', 'Functional minimalism', 'Natural organic', 'Calm palette'],
    previewGradient: ['#F5F0E8', '#5C4A3A'],
    primaryWallColour: '#F5F0E8',
  },
  {
    id: 'contemporary',
    name: 'Contemporary',
    colours: ['#FAFAFA', '#4A4A4A', '#8B9B8A', '#C8C0B8', '#1A1A1A'],
    colourNames: ['White', 'Graphite', 'Sage', 'Greige', 'Black'],
    furnitureDescription: 'Sculptural furniture, curved sofas, statement lighting, art',
    materials: ['Terrazzo', 'Bouclé', 'Matte black metal', 'Natural stone'],
    characteristics: ['Current trends', 'Organic curves', 'Textural interest', 'Artwork focus'],
    previewGradient: ['#FAFAFA', '#4A4A4A'],
    primaryWallColour: '#FAFAFA',
  },
  {
    id: 'traditional',
    name: 'Traditional',
    colours: ['#F5ECD7', '#8B6F47', '#1B3A6B', '#C0392B', '#2C2C2C'],
    colourNames: ['Cream', 'Caramel', 'Navy', 'Burgundy', 'Charcoal'],
    furnitureDescription: 'Chesterfield sofas, wingback chairs, mahogany tables, Persian rugs',
    materials: ['Mahogany', 'Persian rugs', 'Damask fabric', 'Brass hardware'],
    characteristics: ['Symmetrical layout', 'Architectural moulding', 'Rich patterns', 'Timeless elegance'],
    previewGradient: ['#8B6F47', '#1B3A6B'],
    primaryWallColour: '#F5ECD7',
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    colours: ['#FFFFFF', '#3B82F6', '#C0714F', '#D4A96A', '#2D5016'],
    colourNames: ['White', 'Mediterranean Blue', 'Terracotta', 'Sand', 'Olive'],
    furnitureDescription: 'Mosaic tiled tables, wrought iron chairs, terracotta pots',
    materials: ['Terracotta', 'Mosaic tiles', 'Whitewash', 'Wrought iron'],
    characteristics: ['Courtyard feel', 'Arched openings', 'Mosaic patterns', 'Al fresco living'],
    previewGradient: ['#3B82F6', '#C0714F'],
    primaryWallColour: '#FFFFFF',
  },
];

export function getStyleById(id: string): DesignStyle | undefined {
  return DESIGN_STYLES.find((s) => s.id === id);
}

/** Styles accessible to Starter tier (first 3 in the list). */
export const STARTER_STYLES: ArchStyle[] = ['minimalist', 'modern', 'rustic'];

export function isStyleAccessible(styleId: string, availableStyles: string[] | 'all'): boolean {
  if (availableStyles === 'all') return true;
  return availableStyles.includes(styleId);
}

/** Alias for getStyleById — matches CLAUDE.md API */
export const getDesignStyleById = getStyleById;
