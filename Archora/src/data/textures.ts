export interface TextureDefinition {
  id: string;
  name: string;
  category: 'wall' | 'floor';
  subcategory: string;
  colorHex: string;
  patternDescription: string;
  roughness: number;  // 0-1 for Three.js material
  metalness: number;  // 0-1 for Three.js material
}

export const WALL_TEXTURES: TextureDefinition[] = [
  // Plain colours
  { id: 'plain_white',         name: 'Plain White',         category: 'wall', subcategory: 'plain', colorHex: '#F5F5F5', patternDescription: 'Smooth flat white paint', roughness: 0.9, metalness: 0 },
  { id: 'plain_cream',         name: 'Cream',               category: 'wall', subcategory: 'plain', colorHex: '#F5F0E8', patternDescription: 'Warm cream paint', roughness: 0.9, metalness: 0 },
  { id: 'plain_warm_grey',     name: 'Warm Grey',           category: 'wall', subcategory: 'plain', colorHex: '#B8B0A8', patternDescription: 'Warm greige paint', roughness: 0.9, metalness: 0 },
  { id: 'plain_cool_grey',     name: 'Cool Grey',           category: 'wall', subcategory: 'plain', colorHex: '#A8B0B8', patternDescription: 'Cool blue-grey paint', roughness: 0.9, metalness: 0 },
  { id: 'plain_charcoal',      name: 'Charcoal',            category: 'wall', subcategory: 'plain', colorHex: '#3C3C3C', patternDescription: 'Deep charcoal paint', roughness: 0.9, metalness: 0 },
  { id: 'plain_navy',          name: 'Navy',                category: 'wall', subcategory: 'plain', colorHex: '#1B2A4A', patternDescription: 'Deep navy paint', roughness: 0.9, metalness: 0 },
  { id: 'plain_forest_green',  name: 'Forest Green',        category: 'wall', subcategory: 'plain', colorHex: '#2D4A2D', patternDescription: 'Deep forest green paint', roughness: 0.9, metalness: 0 },
  { id: 'plain_terracotta',    name: 'Terracotta',          category: 'wall', subcategory: 'plain', colorHex: '#C0603A', patternDescription: 'Warm terracotta paint', roughness: 0.9, metalness: 0 },
  { id: 'plain_blush_pink',    name: 'Blush Pink',          category: 'wall', subcategory: 'plain', colorHex: '#E8C8C0', patternDescription: 'Soft blush pink paint', roughness: 0.9, metalness: 0 },
  { id: 'plain_sage',          name: 'Sage',                category: 'wall', subcategory: 'plain', colorHex: '#8A9E7A', patternDescription: 'Muted sage green paint', roughness: 0.9, metalness: 0 },
  { id: 'plain_mustard',       name: 'Mustard',             category: 'wall', subcategory: 'plain', colorHex: '#C8A030', patternDescription: 'Warm mustard paint', roughness: 0.9, metalness: 0 },
  { id: 'plain_black',         name: 'Black',               category: 'wall', subcategory: 'plain', colorHex: '#1A1A1A', patternDescription: 'Matte black paint', roughness: 0.9, metalness: 0 },
  // Brick
  { id: 'exposed_brick',       name: 'Exposed Brick Red',   category: 'wall', subcategory: 'brick', colorHex: '#A04030', patternDescription: 'Red clay bricks with mortar joints', roughness: 1.0, metalness: 0 },
  { id: 'exposed_brick_grey',  name: 'Exposed Brick Grey',  category: 'wall', subcategory: 'brick', colorHex: '#706860', patternDescription: 'Grey engineering bricks with mortar', roughness: 1.0, metalness: 0 },
  { id: 'whitewashed_brick',   name: 'Whitewashed Brick',   category: 'wall', subcategory: 'brick', colorHex: '#E8E0D8', patternDescription: 'Lime-washed brick with subtle texture', roughness: 0.95, metalness: 0 },
  // Concrete
  { id: 'concrete',            name: 'Concrete Raw',        category: 'wall', subcategory: 'concrete', colorHex: '#8C8880', patternDescription: 'Raw poured concrete with form marks', roughness: 0.95, metalness: 0 },
  { id: 'polished_concrete',   name: 'Concrete Polished',   category: 'wall', subcategory: 'concrete', colorHex: '#A0A0A0', patternDescription: 'Smooth polished concrete surface', roughness: 0.3, metalness: 0.05 },
  { id: 'concrete_board_formed', name: 'Concrete Board Formed', category: 'wall', subcategory: 'concrete', colorHex: '#909080', patternDescription: 'Textured board-formed concrete with grain lines', roughness: 1.0, metalness: 0 },
  // Marble
  { id: 'marble_white',        name: 'Marble White',        category: 'wall', subcategory: 'marble', colorHex: '#F0EDE8', patternDescription: 'White Carrara marble with grey veining', roughness: 0.1, metalness: 0.05 },
  { id: 'marble_grey',         name: 'Marble Grey',         category: 'wall', subcategory: 'marble', colorHex: '#B0AEB0', patternDescription: 'Silver grey marble with white veining', roughness: 0.15, metalness: 0.05 },
  { id: 'marble_black',        name: 'Marble Black',        category: 'wall', subcategory: 'marble', colorHex: '#2A2A2A', patternDescription: 'Black Nero marble with gold veining', roughness: 0.1, metalness: 0.1 },
  { id: 'travertine',          name: 'Travertine',          category: 'wall', subcategory: 'stone', colorHex: '#D4C8B0', patternDescription: 'Warm travertine with natural pitting', roughness: 0.8, metalness: 0 },
  { id: 'limestone',           name: 'Limestone',           category: 'wall', subcategory: 'stone', colorHex: '#C8C0A8', patternDescription: 'Smooth limestone blocks', roughness: 0.85, metalness: 0 },
  { id: 'sandstone',           name: 'Sandstone',           category: 'wall', subcategory: 'stone', colorHex: '#C8A870', patternDescription: 'Sandy-coloured sedimentary stone', roughness: 0.95, metalness: 0 },
  // Wood panelling
  { id: 'wood_panelling_light', name: 'Wood Panelling Light', category: 'wall', subcategory: 'wood', colorHex: '#C8A87A', patternDescription: 'Light oak vertical panels', roughness: 0.7, metalness: 0 },
  { id: 'wood_panelling_dark',  name: 'Wood Panelling Dark',  category: 'wall', subcategory: 'wood', colorHex: '#5A3820', patternDescription: 'Dark walnut vertical panels', roughness: 0.75, metalness: 0 },
  { id: 'shiplap_white',       name: 'Shiplap White',       category: 'wall', subcategory: 'wood', colorHex: '#F0EDE8', patternDescription: 'White painted horizontal shiplap boards', roughness: 0.85, metalness: 0 },
  { id: 'shiplap_grey',        name: 'Shiplap Grey',        category: 'wall', subcategory: 'wood', colorHex: '#B0ADA8', patternDescription: 'Grey painted shiplap boards', roughness: 0.85, metalness: 0 },
  { id: 'board_and_batten_white', name: 'Board and Batten White', category: 'wall', subcategory: 'wood', colorHex: '#F5F2EE', patternDescription: 'White board-and-batten vertical cladding', roughness: 0.85, metalness: 0 },
  { id: 'board_and_batten_black', name: 'Board and Batten Black', category: 'wall', subcategory: 'wood', colorHex: '#1E1E1E', patternDescription: 'Black board-and-batten vertical cladding', roughness: 0.85, metalness: 0 },
  // Tiles
  { id: 'subway_tiles',        name: 'Subway Tiles White',  category: 'wall', subcategory: 'tile', colorHex: '#F5F5F0', patternDescription: '75×150mm white subway tiles with grey grout', roughness: 0.2, metalness: 0.02 },
  { id: 'subway_tiles_grey',   name: 'Subway Tiles Grey',   category: 'wall', subcategory: 'tile', colorHex: '#9A9A9A', patternDescription: '75×150mm grey subway tiles', roughness: 0.25, metalness: 0.02 },
  { id: 'herringbone_tiles',   name: 'Herringbone Tiles',   category: 'wall', subcategory: 'tile', colorHex: '#E8E0D0', patternDescription: 'Herringbone pattern glazed tiles', roughness: 0.2, metalness: 0.02 },
  { id: 'geometric_tiles',     name: 'Geometric Tiles',     category: 'wall', subcategory: 'tile', colorHex: '#DCEADC', patternDescription: 'Repeating geometric tile pattern', roughness: 0.3, metalness: 0.02 },
  { id: 'moroccan_tiles',      name: 'Moroccan Tiles',      category: 'wall', subcategory: 'tile', colorHex: '#3A6080', patternDescription: 'Colourful Zellige-style Moroccan tiles', roughness: 0.3, metalness: 0.05 },
  { id: 'terrazzo_tiles',      name: 'Terrazzo',            category: 'wall', subcategory: 'tile', colorHex: '#D8D0C8', patternDescription: 'Terrazzo composite with stone chips', roughness: 0.25, metalness: 0.02 },
  // Wallpaper
  { id: 'wallpaper_stripe',    name: 'Wallpaper Stripe',    category: 'wall', subcategory: 'wallpaper', colorHex: '#E8E0D0', patternDescription: 'Classic stripe pattern wallpaper', roughness: 0.9, metalness: 0 },
  { id: 'wallpaper_floral',    name: 'Wallpaper Floral',    category: 'wall', subcategory: 'wallpaper', colorHex: '#C8D8C0', patternDescription: 'Botanical floral print wallpaper', roughness: 0.9, metalness: 0 },
  { id: 'wallpaper_geometric', name: 'Wallpaper Geometric', category: 'wall', subcategory: 'wallpaper', colorHex: '#C0C8D8', patternDescription: 'Bold geometric pattern wallpaper', roughness: 0.9, metalness: 0 },
  { id: 'wallpaper_textured',  name: 'Wallpaper Textured',  category: 'wall', subcategory: 'wallpaper', colorHex: '#E0D8CC', patternDescription: 'Embossed textured grasscloth-style wallpaper', roughness: 0.95, metalness: 0 },
  // Glass / metal
  { id: 'glass',               name: 'Glass Clear',         category: 'wall', subcategory: 'glass', colorHex: '#D0E8F0', patternDescription: 'Clear glazed glass panel', roughness: 0.05, metalness: 0.1 },
  { id: 'glass_frosted',       name: 'Glass Frosted',       category: 'wall', subcategory: 'glass', colorHex: '#E0EEF4', patternDescription: 'Frosted privacy glass', roughness: 0.3, metalness: 0.05 },
  { id: 'mirror_panels',       name: 'Mirror',              category: 'wall', subcategory: 'glass', colorHex: '#D8E8E8', patternDescription: 'Full mirror panel', roughness: 0.02, metalness: 0.9 },
  { id: 'stainless_steel',     name: 'Stainless Steel',     category: 'wall', subcategory: 'metal', colorHex: '#C0C8C8', patternDescription: 'Brushed stainless steel cladding', roughness: 0.3, metalness: 0.9 },
  // Cladding
  { id: 'timber_cladding',     name: 'Timber Cladding',     category: 'wall', subcategory: 'cladding', colorHex: '#9A7040', patternDescription: 'Horizontal timber weatherboard cladding', roughness: 0.9, metalness: 0 },
  { id: 'cedar_cladding',      name: 'Cedar Cladding',      category: 'wall', subcategory: 'cladding', colorHex: '#B07850', patternDescription: 'Red cedar vertical cladding', roughness: 0.85, metalness: 0 },
  { id: 'render_white',        name: 'Render White',        category: 'wall', subcategory: 'render', colorHex: '#F0EDE8', patternDescription: 'Smooth white sand-cement render', roughness: 0.9, metalness: 0 },
  { id: 'render_grey',         name: 'Render Grey',         category: 'wall', subcategory: 'render', colorHex: '#B8B4AE', patternDescription: 'Smooth grey render', roughness: 0.9, metalness: 0 },
  { id: 'stone_random',        name: 'Stone Random',        category: 'wall', subcategory: 'stone', colorHex: '#907860', patternDescription: 'Random-coursed natural stone', roughness: 1.0, metalness: 0 },
  { id: 'stone_coursed',       name: 'Stone Coursed',       category: 'wall', subcategory: 'stone', colorHex: '#988070', patternDescription: 'Coursed ashlar stone blocks', roughness: 0.95, metalness: 0 },
  { id: 'bamboo_wall',         name: 'Bamboo',              category: 'wall', subcategory: 'natural', colorHex: '#C8B870', patternDescription: 'Woven bamboo panel cladding', roughness: 0.8, metalness: 0 },
  { id: 'cork_wall',           name: 'Cork',                category: 'wall', subcategory: 'natural', colorHex: '#C0A070', patternDescription: 'Natural cork tile wall covering', roughness: 0.95, metalness: 0 },
];

export const FLOOR_MATERIALS: TextureDefinition[] = [
  // Hardwoods
  { id: 'oak_hardwood',        name: 'Oak Hardwood',        category: 'floor', subcategory: 'hardwood', colorHex: '#C89050', patternDescription: 'Light oak hardwood planks with grain', roughness: 0.6, metalness: 0 },
  { id: 'walnut_hardwood',     name: 'Walnut Hardwood',     category: 'floor', subcategory: 'hardwood', colorHex: '#6A3820', patternDescription: 'Rich walnut hardwood with grain', roughness: 0.65, metalness: 0 },
  { id: 'pine_hardwood',       name: 'Pine Hardwood',       category: 'floor', subcategory: 'hardwood', colorHex: '#D4A860', patternDescription: 'Pale pine boards with knots', roughness: 0.7, metalness: 0 },
  { id: 'maple_hardwood',      name: 'Maple Hardwood',      category: 'floor', subcategory: 'hardwood', colorHex: '#E0C090', patternDescription: 'Light maple planks', roughness: 0.6, metalness: 0 },
  { id: 'dark_hardwood',       name: 'Dark Hardwood',       category: 'floor', subcategory: 'hardwood', colorHex: '#3A2010', patternDescription: 'Dark espresso stained hardwood', roughness: 0.65, metalness: 0 },
  { id: 'bleached_oak',        name: 'Bleached Oak',        category: 'floor', subcategory: 'hardwood', colorHex: '#E8DCC8', patternDescription: 'White-washed bleached oak planks', roughness: 0.65, metalness: 0 },
  { id: 'herringbone_oak',     name: 'Herringbone Oak',     category: 'floor', subcategory: 'hardwood', colorHex: '#C09050', patternDescription: 'Oak blocks in herringbone pattern', roughness: 0.65, metalness: 0 },
  { id: 'chevron_oak',         name: 'Chevron Oak',         category: 'floor', subcategory: 'hardwood', colorHex: '#C09050', patternDescription: 'Oak blocks in chevron V-pattern', roughness: 0.65, metalness: 0 },
  // Engineered / laminate
  { id: 'engineered_light',    name: 'Engineered Light',    category: 'floor', subcategory: 'engineered', colorHex: '#D4B878', patternDescription: 'Light engineered wood flooring', roughness: 0.55, metalness: 0 },
  { id: 'engineered_dark',     name: 'Engineered Dark',     category: 'floor', subcategory: 'engineered', colorHex: '#5A3218', patternDescription: 'Dark engineered wood flooring', roughness: 0.55, metalness: 0 },
  { id: 'laminate_light',      name: 'Laminate Light',      category: 'floor', subcategory: 'laminate', colorHex: '#D8C090', patternDescription: 'Light oak-effect laminate', roughness: 0.5, metalness: 0 },
  { id: 'laminate_dark',       name: 'Laminate Dark',       category: 'floor', subcategory: 'laminate', colorHex: '#4A2818', patternDescription: 'Dark walnut-effect laminate', roughness: 0.5, metalness: 0 },
  // Concrete
  { id: 'polished_concrete',   name: 'Polished Concrete',   category: 'floor', subcategory: 'concrete', colorHex: '#A8A8A8', patternDescription: 'High-gloss polished concrete', roughness: 0.1, metalness: 0.05 },
  { id: 'raw_concrete',        name: 'Raw Concrete',        category: 'floor', subcategory: 'concrete', colorHex: '#909090', patternDescription: 'Untreated poured concrete floor', roughness: 0.95, metalness: 0 },
  { id: 'resin',               name: 'Resin',               category: 'floor', subcategory: 'concrete', colorHex: '#E0E0DC', patternDescription: 'Seamless poured resin floor', roughness: 0.05, metalness: 0.02 },
  // Marble / stone
  { id: 'white_marble',        name: 'White Marble',        category: 'floor', subcategory: 'marble', colorHex: '#F0EDE8', patternDescription: 'White Carrara marble tiles', roughness: 0.1, metalness: 0.05 },
  { id: 'grey_marble',         name: 'Grey Marble',         category: 'floor', subcategory: 'marble', colorHex: '#B0AEB0', patternDescription: 'Grey marble slabs', roughness: 0.12, metalness: 0.05 },
  { id: 'black_marble',        name: 'Black Marble',        category: 'floor', subcategory: 'marble', colorHex: '#2A2A2A', patternDescription: 'Nero marble with gold veining', roughness: 0.1, metalness: 0.1 },
  { id: 'travertine',          name: 'Travertine',          category: 'floor', subcategory: 'stone', colorHex: '#D4C8B0', patternDescription: 'Travertine tiles with natural holes', roughness: 0.75, metalness: 0 },
  { id: 'slate',               name: 'Slate',               category: 'floor', subcategory: 'stone', colorHex: '#506060', patternDescription: 'Natural cleft slate tiles', roughness: 0.9, metalness: 0 },
  { id: 'sandstone',           name: 'Sandstone',           category: 'floor', subcategory: 'stone', colorHex: '#C8A870', patternDescription: 'Sandstone flagstones', roughness: 0.9, metalness: 0 },
  // Ceramic
  { id: 'white_ceramic',       name: 'White Ceramic',       category: 'floor', subcategory: 'ceramic', colorHex: '#F0F0EE', patternDescription: 'Gloss white ceramic tiles', roughness: 0.15, metalness: 0.02 },
  { id: 'grey_ceramic',        name: 'Grey Ceramic',        category: 'floor', subcategory: 'ceramic', colorHex: '#A0A0A0', patternDescription: 'Mid-grey ceramic tiles', roughness: 0.2, metalness: 0.02 },
  { id: 'black_ceramic',       name: 'Black Ceramic',       category: 'floor', subcategory: 'ceramic', colorHex: '#222222', patternDescription: 'Matte black ceramic tiles', roughness: 0.4, metalness: 0.02 },
  { id: 'encaustic_tiles',     name: 'Encaustic Tiles',     category: 'floor', subcategory: 'ceramic', colorHex: '#9A7060', patternDescription: 'Handmade patterned encaustic cement tiles', roughness: 0.75, metalness: 0 },
  { id: 'terrazzo',            name: 'Terrazzo',            category: 'floor', subcategory: 'ceramic', colorHex: '#D8D0C8', patternDescription: 'Terrazzo with stone chip aggregate', roughness: 0.25, metalness: 0.02 },
  { id: 'hexagon_tiles',       name: 'Hexagon Tiles',       category: 'floor', subcategory: 'ceramic', colorHex: '#E8E4DC', patternDescription: 'White hexagonal mosaic tiles', roughness: 0.3, metalness: 0.02 },
  // Soft
  { id: 'carpet_grey',         name: 'Carpet Grey',         category: 'floor', subcategory: 'soft', colorHex: '#909090', patternDescription: 'Short-pile grey carpet', roughness: 1.0, metalness: 0 },
  { id: 'carpet_cream',        name: 'Carpet Cream',        category: 'floor', subcategory: 'soft', colorHex: '#E0D8CC', patternDescription: 'Plush cream carpet', roughness: 1.0, metalness: 0 },
  // Specialty
  { id: 'cork',                name: 'Cork',                category: 'floor', subcategory: 'specialty', colorHex: '#C0A070', patternDescription: 'Natural cork tile flooring', roughness: 0.9, metalness: 0 },
  { id: 'rubber_floor',        name: 'Rubber',              category: 'floor', subcategory: 'specialty', colorHex: '#404040', patternDescription: 'Studded rubber safety flooring', roughness: 0.8, metalness: 0 },
  { id: 'vinyl',               name: 'Vinyl',               category: 'floor', subcategory: 'specialty', colorHex: '#C8C0B0', patternDescription: 'Wood-effect luxury vinyl plank', roughness: 0.4, metalness: 0 },
];

export const ALL_TEXTURES: TextureDefinition[] = [...WALL_TEXTURES, ...FLOOR_MATERIALS];

/** Alias for ALL_TEXTURES — matches CLAUDE.md spec */
export const TEXTURES: TextureDefinition[] = ALL_TEXTURES;

export function getTextureById(id: string): TextureDefinition | undefined {
  return ALL_TEXTURES.find((t) => t.id === id);
}

export function getWallTextures(): TextureDefinition[] {
  return WALL_TEXTURES;
}

export function getFloorTextures(): TextureDefinition[] {
  return FLOOR_MATERIALS;
}
