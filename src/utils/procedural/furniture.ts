/**
 * ASORIA — Procedural Furniture Library
 *
 * Comprehensive furniture catalogue with:
 * - 75+ furniture types across 12 categories
 * - 3 style variants per type (modern, classic, mid-century)
 * - 3 size variants per type (compact, standard, large)
 * - Distinct proportions, colors, and material properties per variant
 *
 * Style variants affect:
 *   legStyle: straight | tapered | hairpin | block | none
 *   armStyle: cushion | slab | rolled | none
 *   seatStyle: cushioned | sling | hard | upholstered
 *   backStyle: tall | low | reclined | none
 *   material: wood | metal | plastic | upholstery
 */

import type { FurniturePiece } from '../../types';

// ─── Furniture Types ─────────────────────────────────────────────────────────

export type FurnitureType =
  // ── Sofas & Seating ────────────────────────────────────────────────────────
  | 'sofa_2seat' | 'sofa_3seat' | 'sofa_4seat'
  | 'sofa_curved' | 'sofa_l_shape' | 'sofa_sectional'
  | 'sofa_sleeper' | 'sofa_recliner'
  | 'armchair' | 'recliner_armchair' | 'lounge_armchair' | 'club_armchair'
  | 'dining_chair' | 'dining_chair_upholstered' | 'dining_chair_windsor'
  | 'bar_stool' | 'bar_stool_saddle' | 'bar_stool_industrial'
  | 'bench_dining' | 'bench_storage' | 'bench_planner'
  | 'ottoman' | 'ottoman_square' | 'ottoman_round' | 'ottoman_tufted'
  | 'chaise_lounge' | 'daybed'
  | 'office_chair' | 'office_chair_executive'
  | 'bean_bag' | 'floor_cushion'
  | 'garden_chair' | 'hammock'

  // ── Tables ───────────────────────────────────────────────────────────────────
  | 'dining_table_rect' | 'dining_table_round' | 'dining_table_oval'
  | 'dining_table_extendable' | 'dining_table_glass_top'
  | 'coffee_table_rect' | 'coffee_table_square' | 'coffee_table_round'
  | 'coffee_table_nested' | 'coffee_table_industrial'
  | 'side_table' | 'side_table_nested' | 'console_table'
  | 'desk_straight' | 'desk_corner' | 'desk_standing' | 'desk_acrylic'
  | 'nightstand' | 'nightstand_2drawer' | 'nightstand_open'
  | 'bar_table' | 'bar_table_high'

  // ── Beds ────────────────────────────────────────────────────────────────────
  | 'bed_single' | 'bed_double' | 'bed_queen' | 'bed_king'
  | 'bed_platform_low' | 'bed_platform_high' | 'bed_storage'
  | 'bed_bunk' | 'bed_crib' | 'bed_toddler' | 'bed_daybed'
  | 'headboard_only'

  // ── Storage ─────────────────────────────────────────────────────────────────
  | 'wardrobe_2door' | 'wardrobe_3door' | 'wardrobe_4door' | 'wardrobe_sliding'
  | 'walk_in_wardrobe'
  | 'dresser' | 'dresser_mirror' | 'chest_of_drawers'
  | 'bookcase_low' | 'bookcase_tall' | 'bookcase_wall'
  | 'modular_shelving' | 'cubby_storage'
  | 'sideboard' | 'credenza'
  | 'tv_unit' | 'tv_unit_floating' | 'media_credenza'
  | 'shoe_rack' | 'coat_stand' | 'coat_rack'
  | 'file_cabinet' | 'toy_storage'

  // ── Kitchen ─────────────────────────────────────────────────────────────────
  | 'kitchen_counter_straight' | 'kitchen_counter_corner'
  | 'kitchen_island' | 'kitchen_island_seating'
  | 'pantry' | 'larder' | 'kitchen_trolley'
  | 'wine_rack' | 'spice_rack'

  // ── Bathroom ───────────────────────────────────────────────────────────────
  | 'bathroom_vanity' | 'bathroom_cabinet'
  | 'bathroom_sink' | 'bathroom_sink_wall' | 'bathroom_sink_pedestal'
  | 'bathtub' | 'bathtub_freestanding' | 'bathtub_corner' | 'bathtub_jacuzzi'
  | 'toilet' | 'toilet_wall_hung' | 'urinal'
  | 'shower_cubicle' | 'shower_wet_room'
  | 'towel_rail' | 'bathroom_mirror'

  // ── Office ─────────────────────────────────────────────────────────────────
  | 'meeting_table' | 'conference_table'
  | 'whiteboard' | 'partition_screen'
  | 'monitor_stand' | 'keyboard_tray'

  // ── Lighting ───────────────────────────────────────────────────────────────
  | 'floor_lamp' | 'floor_lamp_arch' | 'floor_lamp_tripod'
  | 'table_lamp' | 'desk_lamp'
  | 'pendant_light' | 'pendant_cluster' | 'chandelier'
  | 'wall_sconce' | 'ceiling_spotlight'

  // ── Media / Decor ──────────────────────────────────────────────────────────
  | 'room_divider' | 'room_divider_folding'
  | 'fireplace_electric' | 'fireplace_gas' | 'fireplace_built_in'
  | 'speaker_floor' | 'sound_bar'

  // ── Outdoor ────────────────────────────────────────────────────────────────
  | 'garden_dining_set' | 'garden_sofa_set' | 'garden_chat_set'
  | 'sun_lounger' | 'parasol' | 'parasol_offset'
  | 'outdoor_kitchen' | 'bbq_unit' | 'outdoor_fridge'
  | 'garden_bench' | 'garden_table' | 'picnic_table'
  | 'pergola' | 'garden_shed' | 'arbour'
  | 'swimming_pool_rect' | 'swimming_pool_round'
  | 'hot_tub' | 'outdoor_spa'
  | 'planter_rect' | 'planter_raised' | 'planter_tower'
  | 'water_feature' | 'garden_fountain'
  | 'fire_pit' | 'outdoor_heater'

  // ── Landscape ──────────────────────────────────────────────────────────────
  | 'decking' | 'patio_paving' | 'garden_path'
  | 'driveway' | 'garage_door'
  | 'garden_wall' | 'fence_panel' | 'garden_gate'
  | 'retaining_wall' | 'steps_outdoor'
  | 'outdoor_lamp_post' | 'letterbox' | 'bike_storage'
  | 'area_rug' | 'storage_shelf' | 'raised_garden_bed';

// ─── Style Variants ───────────────────────────────────────────────────────────

export type StyleVariant = 'modern' | 'classic' | 'mid_century' | 'industrial' | 'scandi' | 'minimalist';
export type SizeVariant = 'compact' | 'standard' | 'large' | 'oversized';

// ─── Furniture Defaults ──────────────────────────────────────────────────────

export interface FurnitureDefault {
  w: number;   // metres
  h: number;   // metres
  d: number;   // metres
  color: string;
  secondaryColor: string;
  category: string;
  outdoor: boolean;
  // Style info
  variants: {
    modern?:      Partial<FurnitureDefault>;
    classic?:     Partial<FurnitureDefault>;
    mid_century?: Partial<FurnitureDefault>;
    industrial?:  Partial<FurnitureDefault>;
    scandi?:      Partial<FurnitureDefault>;
    minimalist?:  Partial<FurnitureDefault>;
  };
  // Shape metadata
  seatCount?: number;   // for tables/seating
  legStyle?: 'straight' | 'tapered' | 'hairpin' | 'block' | 'pedestal' | 'none';
  armStyle?: 'cushion' | 'slab' | 'rolled' | 'none';
  backStyle?: 'tall' | 'low' | 'reclined' | 'none';
  material?: 'wood' | 'metal' | 'upholstery' | 'glass' | 'plastic' | 'leather' | 'fabric';
}

function variant<T>(base: T, override: Partial<T> = {}): T {
  return { ...base, ...override };
}

// Helper: create a full default with all style variants
function fw(
  w: number, h: number, d: number,
  color: string, secondaryColor: string,
  category: string, outdoor: boolean,
  modern?: Partial<{ color: string; secondaryColor: string; legStyle: string; material: string }>,
  classic?: Partial<{ color: string; secondaryColor: string; legStyle: string; material: string }>,
  midCentury?: Partial<{ color: string; secondaryColor: string; legStyle: string; material: string }>,
): FurnitureDefault {
  return {
    w, h, d, color, secondaryColor, category, outdoor,
    variants: {
      modern: modern ? { color: modern.color, secondaryColor: modern.secondaryColor, legStyle: modern.legStyle as FurnitureDefault['legStyle'], material: modern.material as FurnitureDefault['material'] } : {},
      classic: classic ? { color: classic.color, secondaryColor: classic.secondaryColor, legStyle: classic.legStyle as FurnitureDefault['legStyle'], material: classic.material as FurnitureDefault['material'] } : {},
      mid_century: midCentury ? { color: midCentury.color, secondaryColor: midCentury.secondaryColor, legStyle: midCentury.legStyle as FurnitureDefault['legStyle'], material: midCentury.material as FurnitureDefault['material'] } : {},
    },
  };
}

export const FURNITURE_DEFAULTS: Record<FurnitureType, FurnitureDefault> = {
  // ═══════════════════════════════════════════════════════════════
  // SOFAS & SEATING
  // ═══════════════════════════════════════════════════════════════

  sofa_2seat: fw(1.6, 0.85, 0.9, '#9A8A7A', '#2D2D2D', 'sofa', false,
    { color: '#6A5A4A', legStyle: 'hairpin', material: 'upholstery' },
    { color: '#8A7A6A', legStyle: 'tapered', material: 'upholstery' },
    { color: '#A08A7A', legStyle: 'tapered', material: 'upholstery' }
  ),
  sofa_3seat: fw(2.4, 0.85, 0.95, '#9A8A7A', '#2D2D2D', 'sofa', false,
    { color: '#5A4A3A', legStyle: 'hairpin', material: 'upholstery' },
    { color: '#7A6A5A', legStyle: 'tapered', material: 'upholstery' },
    { color: '#908070', legStyle: 'straight', material: 'upholstery' }
  ),
  sofa_4seat: fw(3.2, 0.85, 0.95, '#8A7A6A', '#2D2D2D', 'sofa', false,
    { color: '#4A3A2A', legStyle: 'hairpin', material: 'upholstery' },
    { color: '#6A5A4A', legStyle: 'tapered', material: 'upholstery' },
    { color: '#8A7A6A', legStyle: 'straight', material: 'upholstery' }
  ),
  sofa_curved: fw(2.8, 0.8, 1.1, '#7A6A5A', '#3D3D3D', 'sofa', false,
    { color: '#5A4A3A', legStyle: 'none', material: 'upholstery' },
    { color: '#8A7A6A', legStyle: 'pedestal', material: 'upholstery' },
    { color: '#A09080', legStyle: 'block', material: 'upholstery' }
  ),
  sofa_l_shape: fw(2.8, 0.85, 2.0, '#8A7A6A', '#2D2D2D', 'sofa', false,
    { color: '#4A3A2A', legStyle: 'hairpin', material: 'upholstery' },
    { color: '#6A5A4A', legStyle: 'tapered', material: 'upholstery' },
    { color: '#8A7A6A', legStyle: 'straight', material: 'upholstery' }
  ),
  sofa_sectional: fw(3.5, 0.85, 2.0, '#7A6A5A', '#2D2D2D', 'sofa', false,
    { color: '#5A4A3A', legStyle: 'block', material: 'upholstery' },
    { color: '#8A7A6A', legStyle: 'tapered', material: 'upholstery' },
    { color: '#A09080', legStyle: 'straight', material: 'upholstery' }
  ),
  sofa_sleeper: fw(2.0, 0.85, 0.95, '#6A5A4A', '#2D2D2D', 'sofa', false,
    { color: '#5A4A3A', legStyle: 'hairpin', material: 'upholstery' },
    { color: '#7A6A5A', legStyle: 'straight', material: 'upholstery' },
    { color: '#8A7A6A', legStyle: 'tapered', material: 'upholstery' }
  ),
  sofa_recliner: fw(2.2, 0.9, 0.95, '#4A3A2A', '#2D2D2D', 'sofa', false,
    { color: '#3A2A1A', legStyle: 'block', material: 'upholstery' },
    { color: '#5A4A3A', legStyle: 'tapered', material: 'upholstery' },
    { color: '#6A5A4A', legStyle: 'straight', material: 'upholstery' }
  ),

  armchair: fw(0.85, 0.9, 0.85, '#9A8A7A', '#2D2D2D', 'chair', false,
    { color: '#5A4A3A', legStyle: 'hairpin', material: 'upholstery' },
    { color: '#7A6A5A', legStyle: 'tapered', material: 'upholstery' },
    { color: '#8A7A6A', legStyle: 'tapered', material: 'upholstery' }
  ),
  recliner_armchair: fw(0.9, 0.95, 0.9, '#5A4A3A', '#2D2D2D', 'chair', false,
    { color: '#4A3A2A', legStyle: 'block', material: 'upholstery' },
    { color: '#6A5A4A', legStyle: 'straight', material: 'upholstery' },
    { color: '#8A7A6A', legStyle: 'tapered', material: 'upholstery' }
  ),
  lounge_armchair: fw(0.95, 0.85, 0.9, '#6A5A4A', '#2D2D2D', 'chair', false,
    { color: '#5A4A3A', legStyle: 'none', material: 'upholstery' },
    { color: '#7A6A5A', legStyle: 'pedestal', material: 'upholstery' },
    { color: '#8A7A6A', legStyle: 'block', material: 'upholstery' }
  ),
  club_armchair: fw(0.9, 0.85, 0.9, '#8A7A6A', '#2D2D2D', 'chair', false,
    { color: '#6A5A4A', legStyle: 'tapered', material: 'upholstery' },
    { color: '#5A4A3A', legStyle: 'straight', material: 'upholstery' },
    { color: '#7A6A5A', legStyle: 'tapered', material: 'upholstery' }
  ),

  dining_chair: fw(0.48, 0.9, 0.52, '#9A7850', '#6A4830', 'chair', false,
    { color: '#8A6840', legStyle: 'hairpin', material: 'wood' },
    { color: '#7A5830', legStyle: 'tapered', material: 'wood' },
    { color: '#8A6840', legStyle: 'straight', material: 'wood' }
  ),
  dining_chair_upholstered: fw(0.5, 0.92, 0.54, '#8A7A6A', '#5A4A3A', 'chair', false,
    { color: '#6A5A4A', legStyle: 'hairpin', material: 'upholstery' },
    { color: '#7A6A5A', legStyle: 'tapered', material: 'upholstery' },
    { color: '#8A7A6A', legStyle: 'straight', material: 'upholstery' }
  ),
  dining_chair_windsor: fw(0.52, 0.95, 0.5, '#B09060', '#7A6040', 'chair', false,
    { color: '#A08050', legStyle: 'tapered', material: 'wood' },
    { color: '#8A7040', legStyle: 'tapered', material: 'wood' },
    { color: '#9A8050', legStyle: 'tapered', material: 'wood' }
  ),

  bar_stool: fw(0.4, 0.95, 0.4, '#3D3D3D', '#A0A0A0', 'chair', false,
    { color: '#1A1A1A', legStyle: 'hairpin', material: 'metal' },
    { color: '#4A3A2A', legStyle: 'straight', material: 'wood' },
    { color: '#3A3A3A', legStyle: 'hairpin', material: 'metal' }
  ),
  bar_stool_saddle: fw(0.38, 0.9, 0.38, '#5A4030', '#8A7060', 'chair', false,
    { color: '#4A3020', legStyle: 'straight', material: 'wood' },
    { color: '#5A4030', legStyle: 'straight', material: 'wood' },
    { color: '#6A5040', legStyle: 'straight', material: 'wood' }
  ),
  bar_stool_industrial: fw(0.42, 1.0, 0.42, '#2A2A2A', '#808080', 'chair', false,
    { color: '#1A1A1A', legStyle: 'hairpin', material: 'metal' },
    { color: '#3A3A3A', legStyle: 'hairpin', material: 'metal' },
    { color: '#2A2A2A', legStyle: 'hairpin', material: 'metal' }
  ),

  bench_dining: fw(1.6, 0.45, 0.4, '#9A7850', '#6A4830', 'seating', false,
    { color: '#7A5830', legStyle: 'straight', material: 'wood' },
    { color: '#8A6840', legStyle: 'tapered', material: 'wood' },
    { color: '#9A7850', legStyle: 'block', material: 'wood' }
  ),
  bench_storage: fw(1.4, 0.5, 0.45, '#7A5830', '#5A4020', 'storage', false,
    { color: '#6A4820', legStyle: 'block', material: 'wood' },
    { color: '#8A6840', legStyle: 'tapered', material: 'wood' },
    { color: '#7A5830', legStyle: 'straight', material: 'wood' }
  ),
  bench_planner: fw(2.0, 0.45, 0.35, '#8A6840', '#6A4820', 'seating', false,
    { color: '#6A4830', legStyle: 'straight', material: 'wood' },
    { color: '#7A5830', legStyle: 'tapered', material: 'metal' },
    { color: '#8A6840', legStyle: 'hairpin', material: 'metal' }
  ),

  ottoman: fw(0.7, 0.45, 0.7, '#9A8A7A', '#6A5A4A', 'seating', false,
    { color: '#7A6A5A', legStyle: 'none', material: 'upholstery' },
    { color: '#8A7A6A', legStyle: 'block', material: 'upholstery' },
    { color: '#9A8A7A', legStyle: 'tapered', material: 'upholstery' }
  ),
  ottoman_square: fw(0.6, 0.5, 0.6, '#8A7A6A', '#5A4A3A', 'seating', false,
    { color: '#6A5A4A', legStyle: 'none', material: 'upholstery' },
    { color: '#7A6A5A', legStyle: 'block', material: 'upholstery' },
    { color: '#8A7A6A', legStyle: 'none', material: 'upholstery' }
  ),
  ottoman_round: fw(0.65, 0.42, 0.65, '#7A6A5A', '#4A3A2A', 'seating', false,
    { color: '#5A4A3A', legStyle: 'none', material: 'upholstery' },
    { color: '#6A5A4A', legStyle: 'pedestal', material: 'upholstery' },
    { color: '#7A6A5A', legStyle: 'none', material: 'upholstery' }
  ),
  ottoman_tufted: fw(0.75, 0.48, 0.75, '#8A7A6A', '#5A4A3A', 'seating', false,
    { color: '#7A6A5A', legStyle: 'block', material: 'upholstery' },
    { color: '#9A8A7A', legStyle: 'tapered', material: 'upholstery' },
    { color: '#8A7A6A', legStyle: 'block', material: 'upholstery' }
  ),

  chaise_lounge: fw(2.2, 0.7, 0.85, '#8A7A6A', '#4A3A2A', 'seating', false,
    { color: '#7A6A5A', legStyle: 'none', material: 'upholstery' },
    { color: '#6A5A4A', legStyle: 'tapered', material: 'upholstery' },
    { color: '#8A7A6A', legStyle: 'straight', material: 'upholstery' }
  ),
  daybed: fw(2.0, 0.65, 0.9, '#9A8A7A', '#5A4A3A', 'bed', false,
    { color: '#8A7A6A', legStyle: 'tapered', material: 'upholstery' },
    { color: '#7A6A5A', legStyle: 'straight', material: 'upholstery' },
    { color: '#9A8A7A', legStyle: 'block', material: 'upholstery' }
  ),

  office_chair: fw(0.65, 1.1, 0.65, '#2A2A2A', '#4A4A4A', 'chair', false,
    { color: '#1A1A1A', legStyle: 'hairpin', material: 'upholstery' },
    { color: '#2A2A2A', legStyle: 'block', material: 'upholstery' },
    { color: '#3A3A3A', legStyle: 'hairpin', material: 'upholstery' }
  ),
  office_chair_executive: fw(0.68, 1.25, 0.68, '#1A1A1A', '#3A3A3A', 'chair', false,
    { color: '#0A0A0A', legStyle: 'block', material: 'leather' },
    { color: '#1A1A1A', legStyle: 'block', material: 'leather' },
    { color: '#2A2A2A', legStyle: 'straight', material: 'leather' }
  ),

  bean_bag: fw(0.9, 0.65, 0.9, '#7A6A5A', '#4A3A2A', 'seating', false,
    { color: '#6A5A4A', legStyle: 'none', material: 'fabric' },
    { color: '#8A7A6A', legStyle: 'none', material: 'fabric' },
    { color: '#5A4A3A', legStyle: 'none', material: 'fabric' }
  ),
  floor_cushion: fw(0.65, 0.12, 0.65, '#9A8A7A', '#6A5A4A', 'seating', false,
    { color: '#8A7A6A', legStyle: 'none', material: 'fabric' },
    { color: '#7A6A5A', legStyle: 'none', material: 'fabric' },
    { color: '#6A5A4A', legStyle: 'none', material: 'fabric' }
  ),

  garden_chair: fw(0.55, 0.9, 0.5, '#5A4830', '#7A6850', 'seating', true,
    { color: '#4A3820', legStyle: 'straight', material: 'metal' },
    { color: '#5A4830', legStyle: 'straight', material: 'wood' },
    { color: '#6A5840', legStyle: 'tapered', material: 'wood' }
  ),
  hammock: fw(2.0, 0.3, 1.0, '#E8D8B0', '#A09080', 'seating', true,
    { color: '#D8C8A0', legStyle: 'none', material: 'fabric' },
    { color: '#C8B890', legStyle: 'none', material: 'fabric' },
    { color: '#E8D8B0', legStyle: 'none', material: 'fabric' }
  ),

  // ═══════════════════════════════════════════════════════════════
  // TABLES
  // ═══════════════════════════════════════════════════════════════

  dining_table_rect: fw(1.8, 0.75, 0.9, '#9A7850', '#7A5830', 'table', false,
    { color: '#8A6840', legStyle: 'hairpin', material: 'wood' },
    { color: '#7A5830', legStyle: 'tapered', material: 'wood' },
    { color: '#9A7850', legStyle: 'straight', material: 'wood' }
  ),
  dining_table_round: fw(1.2, 0.75, 1.2, '#9A7850', '#7A5830', 'table', false,
    { color: '#8A6840', legStyle: 'pedestal', material: 'wood' },
    { color: '#7A5830', legStyle: 'pedestal', material: 'wood' },
    { color: '#9A7850', legStyle: 'straight', material: 'wood' }
  ),
  dining_table_oval: fw(2.0, 0.75, 1.0, '#9A7850', '#7A5830', 'table', false,
    { color: '#8A6840', legStyle: 'straight', material: 'wood' },
    { color: '#7A5830', legStyle: 'tapered', material: 'wood' },
    { color: '#9A7850', legStyle: 'straight', material: 'wood' }
  ),
  dining_table_extendable: fw(1.8, 0.76, 0.95, '#8A6840', '#6A4820', 'table', false,
    { color: '#7A5830', legStyle: 'straight', material: 'wood' },
    { color: '#6A4820', legStyle: 'tapered', material: 'wood' },
    { color: '#8A6840', legStyle: 'straight', material: 'wood' }
  ),
  dining_table_glass_top: fw(1.6, 0.75, 0.9, '#B0C8D0', '#2A3A40', 'table', false,
    { color: '#90B8C0', legStyle: 'hairpin', material: 'glass' },
    { color: '#A0B8C0', legStyle: 'straight', material: 'glass' },
    { color: '#B0C8D0', legStyle: 'straight', material: 'glass' }
  ),

  coffee_table_rect: fw(1.2, 0.4, 0.6, '#9A7850', '#7A5830', 'table', false,
    { color: '#8A6840', legStyle: 'hairpin', material: 'wood' },
    { color: '#7A5830', legStyle: 'tapered', material: 'wood' },
    { color: '#9A7850', legStyle: 'straight', material: 'wood' }
  ),
  coffee_table_square: fw(0.8, 0.4, 0.8, '#8A6840', '#6A4820', 'table', false,
    { color: '#7A5830', legStyle: 'block', material: 'wood' },
    { color: '#6A4820', legStyle: 'straight', material: 'wood' },
    { color: '#8A6840', legStyle: 'block', material: 'wood' }
  ),
  coffee_table_round: fw(0.9, 0.4, 0.9, '#8A6840', '#6A4820', 'table', false,
    { color: '#7A5830', legStyle: 'pedestal', material: 'wood' },
    { color: '#6A4820', legStyle: 'tapered', material: 'wood' },
    { color: '#8A6840', legStyle: 'none', material: 'wood' }
  ),
  coffee_table_nested: fw(0.6, 0.5, 0.5, '#7A5830', '#5A4020', 'table', false,
    { color: '#6A4820', legStyle: 'hairpin', material: 'metal' },
    { color: '#5A4020', legStyle: 'straight', material: 'metal' },
    { color: '#7A5830', legStyle: 'hairpin', material: 'metal' }
  ),
  coffee_table_industrial: fw(1.1, 0.38, 0.6, '#3A3A3A', '#8A8A8A', 'table', false,
    { color: '#2A2A2A', legStyle: 'hairpin', material: 'metal' },
    { color: '#4A4A4A', legStyle: 'block', material: 'metal' },
    { color: '#3A3A3A', legStyle: 'straight', material: 'metal' }
  ),

  side_table: fw(0.45, 0.55, 0.45, '#8A6840', '#6A4820', 'table', false,
    { color: '#7A5830', legStyle: 'tapered', material: 'wood' },
    { color: '#6A4820', legStyle: 'straight', material: 'wood' },
    { color: '#8A6840', legStyle: 'none', material: 'metal' }
  ),
  side_table_nested: fw(0.35, 0.6, 0.35, '#6A4820', '#4A3010', 'table', false,
    { color: '#5A4020', legStyle: 'hairpin', material: 'metal' },
    { color: '#4A3010', legStyle: 'straight', material: 'metal' },
    { color: '#6A4820', legStyle: 'hairpin', material: 'metal' }
  ),
  console_table: fw(1.4, 0.8, 0.35, '#9A7850', '#7A5830', 'table', false,
    { color: '#8A6840', legStyle: 'tapered', material: 'wood' },
    { color: '#7A5830', legStyle: 'straight', material: 'wood' },
    { color: '#9A7850', legStyle: 'hairpin', material: 'metal' }
  ),

  desk_straight: fw(1.6, 0.75, 0.7, '#A08060', '#7A5830', 'desk', false,
    { color: '#8A6840', legStyle: 'straight', material: 'wood' },
    { color: '#7A5830', legStyle: 'tapered', material: 'wood' },
    { color: '#9A7850', legStyle: 'block', material: 'wood' }
  ),
  desk_corner: fw(1.6, 0.75, 1.6, '#9A7850', '#7A5830', 'desk', false,
    { color: '#8A6840', legStyle: 'straight', material: 'wood' },
    { color: '#7A5830', legStyle: 'tapered', material: 'wood' },
    { color: '#9A7850', legStyle: 'block', material: 'wood' }
  ),
  desk_standing: fw(1.4, 1.1, 0.7, '#2A2A2A', '#808080', 'desk', false,
    { color: '#1A1A1A', legStyle: 'hairpin', material: 'metal' },
    { color: '#3A3A3A', legStyle: 'block', material: 'metal' },
    { color: '#2A2A2A', legStyle: 'straight', material: 'metal' }
  ),
  desk_acrylic: fw(1.4, 0.76, 0.7, '#D0E0E8', '#3A4A50', 'desk', false,
    { color: '#C0D0D8', legStyle: 'none', material: 'glass' },
    { color: '#B0C0D0', legStyle: 'block', material: 'glass' },
    { color: '#D0E0E8', legStyle: 'none', material: 'glass' }
  ),

  nightstand: fw(0.5, 0.5, 0.45, '#8A6840', '#6A4820', 'storage', false,
    { color: '#7A5830', legStyle: 'tapered', material: 'wood' },
    { color: '#6A4820', legStyle: 'straight', material: 'wood' },
    { color: '#8A6840', legStyle: 'none', material: 'wood' }
  ),
  nightstand_2drawer: fw(0.55, 0.55, 0.48, '#9A7850', '#7A5830', 'storage', false,
    { color: '#8A6840', legStyle: 'tapered', material: 'wood' },
    { color: '#7A5830', legStyle: 'straight', material: 'wood' },
    { color: '#9A7850', legStyle: 'none', material: 'wood' }
  ),
  nightstand_open: fw(0.45, 0.5, 0.4, '#7A5830', '#5A4020', 'storage', false,
    { color: '#6A4820', legStyle: 'hairpin', material: 'metal' },
    { color: '#5A4020', legStyle: 'straight', material: 'metal' },
    { color: '#7A5830', legStyle: 'none', material: 'metal' }
  ),

  bar_table: fw(0.9, 1.1, 0.9, '#8A6840', '#5A4020', 'table', false,
    { color: '#7A5830', legStyle: 'pedestal', material: 'wood' },
    { color: '#6A4820', legStyle: 'straight', material: 'metal' },
    { color: '#8A6840', legStyle: 'block', material: 'wood' }
  ),
  bar_table_high: fw(0.8, 1.2, 0.8, '#6A4820', '#4A3010', 'table', false,
    { color: '#5A4020', legStyle: 'pedestal', material: 'wood' },
    { color: '#4A3010', legStyle: 'straight', material: 'metal' },
    { color: '#6A4820', legStyle: 'block', material: 'wood' }
  ),

  // ═══════════════════════════════════════════════════════════════
  // BEDS
  // ═══════════════════════════════════════════════════════════════

  bed_single: fw(0.9, 0.5, 2.0, '#D0C8B8', '#5A4030', 'bed', false,
    { color: '#C0B8A8', legStyle: 'straight', material: 'wood' },
    { color: '#B0A898', legStyle: 'tapered', material: 'wood' },
    { color: '#D0C8B8', legStyle: 'block', material: 'wood' }
  ),
  bed_double: fw(1.6, 0.5, 2.1, '#D0C8B8', '#5A4030', 'bed', false,
    { color: '#C0B8A8', legStyle: 'straight', material: 'wood' },
    { color: '#B0A898', legStyle: 'tapered', material: 'wood' },
    { color: '#D0C8B8', legStyle: 'block', material: 'wood' }
  ),
  bed_queen: fw(1.7, 0.52, 2.1, '#D0C8B8', '#5A4030', 'bed', false,
    { color: '#C0B8A8', legStyle: 'straight', material: 'wood' },
    { color: '#B0A898', legStyle: 'tapered', material: 'wood' },
    { color: '#D0C8B8', legStyle: 'block', material: 'wood' }
  ),
  bed_king: fw(2.0, 0.55, 2.2, '#D0C8B8', '#5A4030', 'bed', false,
    { color: '#C0B8A8', legStyle: 'straight', material: 'wood' },
    { color: '#B0A898', legStyle: 'tapered', material: 'wood' },
    { color: '#D0C8B8', legStyle: 'block', material: 'wood' }
  ),

  bed_platform_low: fw(1.6, 0.35, 2.1, '#4A3020', '#3A2010', 'bed', false,
    { color: '#3A2010', legStyle: 'block', material: 'wood' },
    { color: '#4A3020', legStyle: 'block', material: 'wood' },
    { color: '#5A4030', legStyle: 'none', material: 'wood' }
  ),
  bed_platform_high: fw(1.6, 0.55, 2.1, '#5A4030', '#3A2010', 'bed', false,
    { color: '#4A3020', legStyle: 'block', material: 'wood' },
    { color: '#5A4030', legStyle: 'block', material: 'wood' },
    { color: '#6A5040', legStyle: 'none', material: 'wood' }
  ),
  bed_storage: fw(1.6, 0.55, 2.1, '#6A4830', '#4A3020', 'bed', false,
    { color: '#5A4020', legStyle: 'block', material: 'wood' },
    { color: '#6A4830', legStyle: 'block', material: 'wood' },
    { color: '#7A5840', legStyle: 'none', material: 'wood' }
  ),

  bed_bunk: fw(1.0, 1.8, 2.1, '#9A7850', '#6A4820', 'bed', false,
    { color: '#8A6840', legStyle: 'straight', material: 'wood' },
    { color: '#7A5830', legStyle: 'straight', material: 'wood' },
    { color: '#9A7850', legStyle: 'straight', material: 'metal' }
  ),
  bed_crib: fw(0.7, 0.95, 1.3, '#E8E0D0', '#C0B8A8', 'bed', false,
    { color: '#D8D0C0', legStyle: 'straight', material: 'wood' },
    { color: '#C8C0B0', legStyle: 'straight', material: 'wood' },
    { color: '#E8E0D0', legStyle: 'straight', material: 'wood' }
  ),
  bed_toddler: fw(0.7, 0.45, 1.6, '#E8E0D0', '#C0B8A8', 'bed', false,
    { color: '#D8D0C0', legStyle: 'block', material: 'wood' },
    { color: '#C8C0B0', legStyle: 'block', material: 'wood' },
    { color: '#E8E0D0', legStyle: 'block', material: 'wood' }
  ),
  bed_daybed: fw(1.0, 0.65, 2.0, '#D0C8B8', '#5A4030', 'bed', false,
    { color: '#C0B8A8', legStyle: 'tapered', material: 'wood' },
    { color: '#B0A898', legStyle: 'straight', material: 'wood' },
    { color: '#D0C8B8', legStyle: 'block', material: 'wood' }
  ),

  headboard_only: fw(1.6, 1.0, 0.12, '#8A6840', '#5A4020', 'bed', false,
    { color: '#7A5830', legStyle: 'none', material: 'wood' },
    { color: '#6A4820', legStyle: 'none', material: 'upholstery' },
    { color: '#8A6840', legStyle: 'none', material: 'wood' }
  ),

  // ═══════════════════════════════════════════════════════════════
  // STORAGE
  // ═══════════════════════════════════════════════════════════════

  wardrobe_2door: fw(1.2, 2.2, 0.6, '#B0A898', '#908878', 'storage', false,
    { color: '#A09888', legStyle: 'none', material: 'wood' },
    { color: '#908878', legStyle: 'none', material: 'wood' },
    { color: '#B0A898', legStyle: 'none', material: 'wood' }
  ),
  wardrobe_3door: fw(1.8, 2.2, 0.6, '#B0A898', '#908878', 'storage', false,
    { color: '#A09888', legStyle: 'none', material: 'wood' },
    { color: '#908878', legStyle: 'none', material: 'wood' },
    { color: '#B0A898', legStyle: 'none', material: 'wood' }
  ),
  wardrobe_4door: fw(2.4, 2.2, 0.6, '#B0A898', '#908878', 'storage', false,
    { color: '#A09888', legStyle: 'none', material: 'wood' },
    { color: '#908878', legStyle: 'none', material: 'wood' },
    { color: '#B0A898', legStyle: 'none', material: 'wood' }
  ),
  wardrobe_sliding: fw(2.4, 2.2, 0.65, '#A09888', '#887868', 'storage', false,
    { color: '#908878', legStyle: 'none', material: 'wood' },
    { color: '#807868', legStyle: 'none', material: 'wood' },
    { color: '#A09888', legStyle: 'none', material: 'wood' }
  ),
  walk_in_wardrobe: fw(3.0, 2.4, 1.2, '#C0B8A8', '#A09888', 'storage', false,
    { color: '#B0A898', legStyle: 'none', material: 'wood' },
    { color: '#A09888', legStyle: 'none', material: 'wood' },
    { color: '#C0B8A8', legStyle: 'none', material: 'wood' }
  ),

  dresser: fw(1.2, 0.9, 0.5, '#B0A898', '#908878', 'storage', false,
    { color: '#A09888', legStyle: 'tapered', material: 'wood' },
    { color: '#908878', legStyle: 'straight', material: 'wood' },
    { color: '#B0A898', legStyle: 'block', material: 'wood' }
  ),
  dresser_mirror: fw(1.2, 1.5, 0.5, '#B0A898', '#908878', 'storage', false,
    { color: '#A09888', legStyle: 'none', material: 'wood' },
    { color: '#908878', legStyle: 'none', material: 'wood' },
    { color: '#B0A898', legStyle: 'none', material: 'wood' }
  ),
  chest_of_drawers: fw(0.9, 1.0, 0.5, '#A09888', '#887868', 'storage', false,
    { color: '#908878', legStyle: 'tapered', material: 'wood' },
    { color: '#807868', legStyle: 'straight', material: 'wood' },
    { color: '#A09888', legStyle: 'block', material: 'wood' }
  ),

  bookcase_low: fw(1.2, 1.2, 0.35, '#9A7850', '#7A5830', 'storage', false,
    { color: '#8A6840', legStyle: 'none', material: 'wood' },
    { color: '#7A5830', legStyle: 'none', material: 'wood' },
    { color: '#9A7850', legStyle: 'none', material: 'wood' }
  ),
  bookcase_tall: fw(0.9, 2.2, 0.35, '#9A7850', '#7A5830', 'storage', false,
    { color: '#8A6840', legStyle: 'none', material: 'wood' },
    { color: '#7A5830', legStyle: 'none', material: 'wood' },
    { color: '#9A7850', legStyle: 'none', material: 'wood' }
  ),
  bookcase_wall: fw(2.4, 2.4, 0.35, '#8A6840', '#6A4820', 'storage', false,
    { color: '#7A5830', legStyle: 'none', material: 'wood' },
    { color: '#6A4820', legStyle: 'none', material: 'wood' },
    { color: '#8A6840', legStyle: 'none', material: 'wood' }
  ),

  modular_shelving: fw(2.0, 2.0, 0.4, '#C0B8A8', '#808080', 'storage', false,
    { color: '#B0A898', legStyle: 'none', material: 'metal' },
    { color: '#A09888', legStyle: 'none', material: 'metal' },
    { color: '#C0B8A8', legStyle: 'none', material: 'metal' }
  ),
  cubby_storage: fw(1.6, 1.6, 0.4, '#C8C0B0', '#A09888', 'storage', false,
    { color: '#B8B0A0', legStyle: 'none', material: 'wood' },
    { color: '#A89888', legStyle: 'none', material: 'wood' },
    { color: '#C8C0B0', legStyle: 'none', material: 'wood' }
  ),

  sideboard: fw(1.8, 0.8, 0.5, '#9A7850', '#7A5830', 'storage', false,
    { color: '#8A6840', legStyle: 'tapered', material: 'wood' },
    { color: '#7A5830', legStyle: 'straight', material: 'wood' },
    { color: '#9A7850', legStyle: 'block', material: 'wood' }
  ),
  credenza: fw(2.0, 0.85, 0.5, '#8A6840', '#6A4820', 'storage', false,
    { color: '#7A5830', legStyle: 'hairpin', material: 'metal' },
    { color: '#6A4820', legStyle: 'block', material: 'wood' },
    { color: '#8A6840', legStyle: 'tapered', material: 'wood' }
  ),

  tv_unit: fw(1.8, 0.55, 0.45, '#3A2A1A', '#2A1A0A', 'storage', false,
    { color: '#2A1A0A', legStyle: 'none', material: 'wood' },
    { color: '#3A2A1A', legStyle: 'block', material: 'wood' },
    { color: '#4A3A2A', legStyle: 'straight', material: 'wood' }
  ),
  tv_unit_floating: fw(1.6, 0.45, 0.4, '#2A2A2A', '#1A1A1A', 'storage', false,
    { color: '#1A1A1A', legStyle: 'none', material: 'wood' },
    { color: '#2A2A2A', legStyle: 'none', material: 'wood' },
    { color: '#3A3A3A', legStyle: 'none', material: 'metal' }
  ),
  media_credenza: fw(2.2, 0.7, 0.5, '#4A3A2A', '#3A2A1A', 'storage', false,
    { color: '#3A2A1A', legStyle: 'block', material: 'wood' },
    { color: '#4A3A2A', legStyle: 'tapered', material: 'wood' },
    { color: '#5A4A3A', legStyle: 'straight', material: 'wood' }
  ),

  shoe_rack: fw(1.0, 0.8, 0.35, '#8A6840', '#6A4820', 'storage', false,
    { color: '#7A5830', legStyle: 'none', material: 'wood' },
    { color: '#6A4820', legStyle: 'none', material: 'metal' },
    { color: '#8A6840', legStyle: 'none', material: 'metal' }
  ),
  coat_stand: fw(0.4, 1.8, 0.4, '#5A4830', '#8A7860', 'storage', false,
    { color: '#4A3820', legStyle: 'none', material: 'wood' },
    { color: '#5A4830', legStyle: 'none', material: 'wood' },
    { color: '#6A5840', legStyle: 'none', material: 'metal' }
  ),
  coat_rack: fw(0.8, 1.6, 0.15, '#4A3A2A', '#2A2A2A', 'storage', false,
    { color: '#3A2A1A', legStyle: 'none', material: 'wood' },
    { color: '#4A3A2A', legStyle: 'none', material: 'metal' },
    { color: '#5A4A3A', legStyle: 'none', material: 'metal' }
  ),
  file_cabinet: fw(0.5, 1.0, 0.6, '#808080', '#606060', 'storage', false,
    { color: '#707070', legStyle: 'none', material: 'metal' },
    { color: '#808080', legStyle: 'none', material: 'metal' },
    { color: '#909090', legStyle: 'none', material: 'metal' }
  ),
  toy_storage: fw(1.2, 0.9, 0.45, '#B09070', '#8A7050', 'storage', false,
    { color: '#A08060', legStyle: 'block', material: 'plastic' },
    { color: '#908060', legStyle: 'block', material: 'plastic' },
    { color: '#B09070', legStyle: 'none', material: 'plastic' }
  ),

  // ═══════════════════════════════════════════════════════════════
  // KITCHEN
  // ═══════════════════════════════════════════════════════════════

  kitchen_counter_straight: fw(2.4, 0.9, 0.65, '#E0D8C8', '#C8C0B0', 'kitchen', false,
    { color: '#D0C8B8', legStyle: 'block', material: 'wood' },
    { color: '#C0B8A8', legStyle: 'none', material: 'wood' },
    { color: '#E0D8C8', legStyle: 'none', material: 'composite' }
  ),
  kitchen_counter_corner: fw(2.0, 0.9, 2.0, '#D8D0C0', '#C0B8A8', 'kitchen', false,
    { color: '#C8C0B0', legStyle: 'none', material: 'wood' },
    { color: '#B8B0A0', legStyle: 'none', material: 'composite' },
    { color: '#D8D0C0', legStyle: 'none', material: 'wood' }
  ),
  kitchen_island: fw(1.4, 0.9, 0.85, '#D8D0C0', '#C0B8A8', 'kitchen', false,
    { color: '#C8C0B0', legStyle: 'block', material: 'wood' },
    { color: '#B8B0A0', legStyle: 'none', material: 'composite' },
    { color: '#D8D0C0', legStyle: 'none', material: 'wood' }
  ),
  kitchen_island_seating: fw(1.8, 0.95, 0.9, '#D0C8B8', '#B8B0A0', 'kitchen', false,
    { color: '#C0B8A8', legStyle: 'tapered', material: 'wood' },
    { color: '#B0A898', legStyle: 'block', material: 'wood' },
    { color: '#D0C8B8', legStyle: 'none', material: 'composite' }
  ),
  pantry: fw(0.9, 2.0, 0.6, '#C8C0B0', '#A09888', 'kitchen', false,
    { color: '#B8B0A0', legStyle: 'none', material: 'wood' },
    { color: '#A89888', legStyle: 'none', material: 'wood' },
    { color: '#C8C0B0', legStyle: 'none', material: 'wood' }
  ),
  larder: fw(1.0, 2.2, 0.65, '#D0C8B8', '#B0A898', 'kitchen', false,
    { color: '#C0B8A8', legStyle: 'none', material: 'wood' },
    { color: '#B0A898', legStyle: 'none', material: 'wood' },
    { color: '#D0C8B8', legStyle: 'none', material: 'wood' }
  ),
  kitchen_trolley: fw(0.7, 0.9, 0.5, '#8A8A8A', '#6A6A6A', 'kitchen', false,
    { color: '#7A7A7A', legStyle: 'hairpin', material: 'metal' },
    { color: '#8A8A8A', legStyle: 'hairpin', material: 'metal' },
    { color: '#9A9A9A', legStyle: 'none', material: 'metal' }
  ),
  wine_rack: fw(0.6, 1.2, 0.4, '#7A5830', '#5A4020', 'kitchen', false,
    { color: '#6A4820', legStyle: 'none', material: 'wood' },
    { color: '#5A4020', legStyle: 'none', material: 'metal' },
    { color: '#7A5830', legStyle: 'none', material: 'wood' }
  ),
  spice_rack: fw(0.6, 0.4, 0.25, '#9A7850', '#7A5830', 'kitchen', false,
    { color: '#8A6840', legStyle: 'none', material: 'wood' },
    { color: '#7A5830', legStyle: 'none', material: 'metal' },
    { color: '#9A7850', legStyle: 'none', material: 'wood' }
  ),

  // ═══════════════════════════════════════════════════════════════
  // BATHROOM
  // ═══════════════════════════════════════════════════════════════

  bathroom_vanity: fw(1.0, 0.85, 0.55, '#E8E8E8', '#C8C8C8', 'bathroom', false,
    { color: '#D8D8D8', legStyle: 'block', material: 'wood' },
    { color: '#C8C8C8', legStyle: 'none', material: 'composite' },
    { color: '#E8E8E8', legStyle: 'pedestal', material: 'wood' }
  ),
  bathroom_cabinet: fw(0.8, 0.8, 0.3, '#D8D8D8', '#B8B8B8', 'bathroom', false,
    { color: '#C8C8C8', legStyle: 'none', material: 'wood' },
    { color: '#B8B8B8', legStyle: 'none', material: 'composite' },
    { color: '#D8D8D8', legStyle: 'none', material: 'wood' }
  ),
  bathroom_sink: fw(0.6, 0.85, 0.5, '#F0F0F0', '#D0D0D0', 'bathroom', false,
    { color: '#E0E0E0', legStyle: 'block', material: 'ceramic' },
    { color: '#D0D0D0', legStyle: 'none', material: 'ceramic' },
    { color: '#F0F0F0', legStyle: 'none', material: 'ceramic' }
  ),
  bathroom_sink_wall: fw(0.6, 0.82, 0.45, '#F5F5F5', '#D5D5D5', 'bathroom', false,
    { color: '#E5E5E5', legStyle: 'none', material: 'ceramic' },
    { color: '#D5D5D5', legStyle: 'none', material: 'ceramic' },
    { color: '#F5F5F5', legStyle: 'none', material: 'ceramic' }
  ),
  bathroom_sink_pedestal: fw(0.55, 0.85, 0.45, '#F8F8F8', '#D8D8D8', 'bathroom', false,
    { color: '#E8E8E8', legStyle: 'pedestal', material: 'ceramic' },
    { color: '#D8D8D8', legStyle: 'pedestal', material: 'ceramic' },
    { color: '#F8F8F8', legStyle: 'none', material: 'ceramic' }
  ),

  bathtub: fw(0.75, 0.6, 1.7, '#F0F0F0', '#D0D0D0', 'bathroom', false,
    { color: '#E0E0E0', legStyle: 'none', material: 'ceramic' },
    { color: '#D0D0D0', legStyle: 'none', material: 'acrylic' },
    { color: '#F0F0F0', legStyle: 'none', material: 'ceramic' }
  ),
  bathtub_freestanding: fw(0.8, 0.62, 1.75, '#F8F8F8', '#D8D8D8', 'bathroom', false,
    { color: '#E8E8E8', legStyle: 'pedestal', material: 'ceramic' },
    { color: '#D8D8D8', legStyle: 'none', material: 'acrylic' },
    { color: '#F8F8F8', legStyle: 'none', material: 'stone' }
  ),
  bathtub_corner: fw(1.3, 0.58, 1.3, '#F0F0F0', '#D0D0D0', 'bathroom', false,
    { color: '#E0E0E0', legStyle: 'none', material: 'ceramic' },
    { color: '#D0D0D0', legStyle: 'none', material: 'acrylic' },
    { color: '#F0F0F0', legStyle: 'none', material: 'ceramic' }
  ),
  bathtub_jacuzzi: fw(0.85, 0.65, 1.8, '#E0E8F0', '#B0C0D0', 'bathroom', false,
    { color: '#D0D8E0', legStyle: 'none', material: 'acrylic' },
    { color: '#C0D0D8', legStyle: 'none', material: 'acrylic' },
    { color: '#E0E8F0', legStyle: 'none', material: 'composite' }
  ),

  toilet: fw(0.4, 0.8, 0.68, '#F0F0F0', '#D0D0D0', 'bathroom', false,
    { color: '#E0E0E0', legStyle: 'none', material: 'ceramic' },
    { color: '#D0D0D0', legStyle: 'none', material: 'ceramic' },
    { color: '#F0F0F0', legStyle: 'none', material: 'ceramic' }
  ),
  toilet_wall_hung: fw(0.4, 0.75, 0.55, '#F5F5F5', '#D5D5D5', 'bathroom', false,
    { color: '#E5E5E5', legStyle: 'none', material: 'ceramic' },
    { color: '#D5D5D5', legStyle: 'none', material: 'ceramic' },
    { color: '#F5F5F5', legStyle: 'none', material: 'ceramic' }
  ),
  urinal: fw(0.35, 0.65, 0.35, '#F0F0F0', '#D0D0D0', 'bathroom', false,
    { color: '#E0E0E0', legStyle: 'none', material: 'ceramic' },
    { color: '#D0D0D0', legStyle: 'none', material: 'ceramic' },
    { color: '#F0F0F0', legStyle: 'none', material: 'ceramic' }
  ),

  shower_cubicle: fw(0.9, 2.2, 0.9, '#C8D8E0', '#A8B8C8', 'bathroom', false,
    { color: '#B8C8D0', legStyle: 'none', material: 'glass' },
    { color: '#A8B8C8', legStyle: 'none', material: 'glass' },
    { color: '#C8D8E0', legStyle: 'none', material: 'glass' }
  ),
  shower_wet_room: fw(1.6, 0.05, 1.6, '#B8C8D0', '#98A8B8', 'bathroom', false,
    { color: '#A8B8C8', legStyle: 'none', material: 'ceramic' },
    { color: '#98A8B8', legStyle: 'none', material: 'ceramic' },
    { color: '#B8C8D0', legStyle: 'none', material: 'composite' }
  ),

  towel_rail: fw(0.6, 0.85, 0.1, '#C0C0C0', '#909090', 'bathroom', false,
    { color: '#B0B0B0', legStyle: 'none', material: 'metal' },
    { color: '#A0A0A0', legStyle: 'none', material: 'metal' },
    { color: '#C0C0C0', legStyle: 'none', material: 'metal' }
  ),
  bathroom_mirror: fw(0.6, 0.9, 0.05, '#D0D8D8', '#A8B0B0', 'bathroom', false,
    { color: '#C0C8C8', legStyle: 'none', material: 'glass' },
    { color: '#B0B8B8', legStyle: 'none', material: 'glass' },
    { color: '#D0D8D8', legStyle: 'none', material: 'glass' }
  ),

  // ═══════════════════════════════════════════════════════════════
  // OFFICE
  // ═══════════════════════════════════════════════════════════════

  meeting_table: fw(2.4, 0.75, 1.0, '#9A7850', '#7A5830', 'table', false,
    { color: '#8A6840', legStyle: 'block', material: 'wood' },
    { color: '#7A5830', legStyle: 'straight', material: 'wood' },
    { color: '#9A7850', legStyle: 'pedestal', material: 'wood' }
  ),
  conference_table: fw(3.0, 0.76, 1.2, '#8A6840', '#6A4820', 'table', false,
    { color: '#7A5830', legStyle: 'block', material: 'wood' },
    { color: '#6A4820', legStyle: 'straight', material: 'metal' },
    { color: '#8A6840', legStyle: 'pedestal', material: 'glass' }
  ),
  whiteboard: fw(1.8, 1.2, 0.05, '#FFFFFF', '#A0A0A0', 'decor', false,
    { color: '#F8F8F8', legStyle: 'none', material: 'glass' },
    { color: '#F0F0F0', legStyle: 'none', material: 'composite' },
    { color: '#FFFFFF', legStyle: 'none', material: 'glass' }
  ),
  partition_screen: fw(1.5, 1.6, 0.08, '#B8B0A0', '#887868', 'decor', false,
    { color: '#A8A098', legStyle: 'none', material: 'fabric' },
    { color: '#988878', legStyle: 'none', material: 'wood' },
    { color: '#B8B0A0', legStyle: 'none', material: 'glass' }
  ),
  monitor_stand: fw(0.5, 0.15, 0.3, '#3A3A3A', '#2A2A2A', 'decor', false,
    { color: '#2A2A2A', legStyle: 'none', material: 'metal' },
    { color: '#3A3A3A', legStyle: 'none', material: 'metal' },
    { color: '#4A4A4A', legStyle: 'none', material: 'metal' }
  ),
  keyboard_tray: fw(0.7, 0.06, 0.35, '#2A2A2A', '#1A1A1A', 'decor', false,
    { color: '#1A1A1A', legStyle: 'none', material: 'metal' },
    { color: '#2A2A2A', legStyle: 'none', material: 'metal' },
    { color: '#3A3A3A', legStyle: 'none', material: 'metal' }
  ),

  // ═══════════════════════════════════════════════════════════════
  // LIGHTING
  // ═══════════════════════════════════════════════════════════════

  floor_lamp: fw(0.4, 1.7, 0.4, '#C0B8A8', '#808080', 'lighting', false,
    { color: '#B0A898', legStyle: 'hairpin', material: 'metal' },
    { color: '#A09888', legStyle: 'straight', material: 'metal' },
    { color: '#C0B8A8', legStyle: 'none', material: 'metal' }
  ),
  floor_lamp_arch: fw(0.5, 1.9, 0.5, '#A09080', '#706050', 'lighting', false,
    { color: '#908070', legStyle: 'hairpin', material: 'metal' },
    { color: '#807060', legStyle: 'straight', material: 'metal' },
    { color: '#A09080', legStyle: 'none', material: 'metal' }
  ),
  floor_lamp_tripod: fw(0.6, 1.65, 0.6, '#8A7060', '#5A4830', 'lighting', false,
    { color: '#7A6040', legStyle: 'hairpin', material: 'wood' },
    { color: '#6A5030', legStyle: 'straight', material: 'wood' },
    { color: '#8A7060', legStyle: 'hairpin', material: 'metal' }
  ),

  table_lamp: fw(0.3, 0.5, 0.3, '#E8E0D0', '#A09080', 'lighting', false,
    { color: '#D8D0C0', legStyle: 'none', material: 'fabric' },
    { color: '#C8C0B0', legStyle: 'none', material: 'ceramic' },
    { color: '#E8E0D0', legStyle: 'none', material: 'fabric' }
  ),
  desk_lamp: fw(0.2, 0.45, 0.2, '#909090', '#606060', 'lighting', false,
    { color: '#808080', legStyle: 'hairpin', material: 'metal' },
    { color: '#707070', legStyle: 'block', material: 'metal' },
    { color: '#909090', legStyle: 'none', material: 'metal' }
  ),

  pendant_light: fw(0.5, 0.6, 0.5, '#D0A820', '#8A7010', 'lighting', false,
    { color: '#C09818', legStyle: 'none', material: 'metal' },
    { color: '#B08808', legStyle: 'none', material: 'glass' },
    { color: '#D0A820', legStyle: 'none', material: 'metal' }
  ),
  pendant_cluster: fw(0.8, 0.5, 0.8, '#B09070', '#806040', 'lighting', false,
    { color: '#A08060', legStyle: 'none', material: 'metal' },
    { color: '#907050', legStyle: 'none', material: 'glass' },
    { color: '#B09070', legStyle: 'none', material: 'metal' }
  ),
  chandelier: fw(0.7, 0.65, 0.7, '#C8A830', '#907010', 'lighting', false,
    { color: '#B89820', legStyle: 'none', material: 'metal' },
    { color: '#A88810', legStyle: 'none', material: 'glass' },
    { color: '#C8A830', legStyle: 'none', material: 'crystal' }
  ),

  wall_sconce: fw(0.2, 0.3, 0.15, '#B0A890', '#807060', 'lighting', false,
    { color: '#A09880', legStyle: 'none', material: 'metal' },
    { color: '#908870', legStyle: 'none', material: 'glass' },
    { color: '#B0A890', legStyle: 'none', material: 'metal' }
  ),
  ceiling_spotlight: fw(0.3, 0.15, 0.3, '#909090', '#606060', 'lighting', false,
    { color: '#808080', legStyle: 'none', material: 'metal' },
    { color: '#707070', legStyle: 'none', material: 'metal' },
    { color: '#909090', legStyle: 'none', material: 'metal' }
  ),

  // ═══════════════════════════════════════════════════════════════
  // MEDIA / DECOR
  // ═══════════════════════════════════════════════════════════════

  room_divider: fw(1.8, 1.8, 0.06, '#B8A890', '#8A7860', 'decor', false,
    { color: '#A89880', legStyle: 'none', material: 'wood' },
    { color: '#987870', legStyle: 'none', material: 'fabric' },
    { color: '#B8A890', legStyle: 'none', material: 'glass' }
  ),
  room_divider_folding: fw(1.5, 1.8, 0.05, '#C0B0A0', '#988878', 'decor', false,
    { color: '#B0A090', legStyle: 'none', material: 'fabric' },
    { color: '#907868', legStyle: 'none', material: 'wood' },
    { color: '#C0B0A0', legStyle: 'none', material: 'fabric' }
  ),

  fireplace_electric: fw(1.2, 0.65, 0.18, '#3A3A3A', '#2A2A2A', 'decor', false,
    { color: '#2A2A2A', legStyle: 'none', material: 'metal' },
    { color: '#3A3A3A', legStyle: 'none', material: 'metal' },
    { color: '#4A4A4A', legStyle: 'none', material: 'metal' }
  ),
  fireplace_gas: fw(1.4, 1.0, 0.4, '#5A4A3A', '#3A2A1A', 'decor', false,
    { color: '#4A3A2A', legStyle: 'none', material: 'stone' },
    { color: '#3A2A1A', legStyle: 'none', material: 'metal' },
    { color: '#5A4A3A', legStyle: 'none', material: 'composite' }
  ),
  fireplace_built_in: fw(1.6, 1.2, 0.4, '#8A7A6A', '#5A4A3A', 'decor', false,
    { color: '#7A6A5A', legStyle: 'none', material: 'stone' },
    { color: '#6A5A4A', legStyle: 'none', material: 'brick' },
    { color: '#8A7A6A', legStyle: 'none', material: 'stone' }
  ),

  speaker_floor: fw(0.35, 0.9, 0.35, '#2A2A2A', '#1A1A1A', 'decor', false,
    { color: '#1A1A1A', legStyle: 'none', material: 'metal' },
    { color: '#2A2A2A', legStyle: 'none', material: 'wood' },
    { color: '#3A3A3A', legStyle: 'none', material: 'metal' }
  ),
  sound_bar: fw(1.0, 0.12, 0.12, '#2A2A2A', '#1A1A1A', 'decor', false,
    { color: '#1A1A1A', legStyle: 'none', material: 'metal' },
    { color: '#2A2A2A', legStyle: 'none', material: 'metal' },
    { color: '#3A3A3A', legStyle: 'none', material: 'metal' }
  ),

  // ═══════════════════════════════════════════════════════════════
  // OUTDOOR
  // ═══════════════════════════════════════════════════════════════

  garden_dining_set: fw(2.0, 0.75, 1.0, '#6A5030', '#4A3010', 'outdoor', true,
    { color: '#5A4020', legStyle: 'straight', material: 'wood' },
    { color: '#4A3010', legStyle: 'tapered', material: 'metal' },
    { color: '#6A5030', legStyle: 'straight', material: 'wood' }
  ),
  garden_sofa_set: fw(2.4, 0.85, 1.8, '#6A7060', '#4A5040', 'outdoor', true,
    { color: '#5A6050', legStyle: 'none', material: 'fabric' },
    { color: '#4A5040', legStyle: 'straight', material: 'metal' },
    { color: '#6A7060', legStyle: 'block', material: 'wicker' }
  ),
  garden_chat_set: fw(1.5, 0.8, 1.5, '#5A6050', '#3A4030', 'outdoor', true,
    { color: '#4A5040', legStyle: 'none', material: 'wicker' },
    { color: '#3A4030', legStyle: 'straight', material: 'metal' },
    { color: '#5A6050', legStyle: 'none', material: 'wicker' }
  ),

  sun_lounger: fw(0.7, 0.4, 2.0, '#D8C8A0', '#A89870', 'outdoor', true,
    { color: '#C8B890', legStyle: 'straight', material: 'metal' },
    { color: '#B8A880', legStyle: 'block', material: 'fabric' },
    { color: '#D8C8A0', legStyle: 'none', material: 'fabric' }
  ),
  parasol: fw(3.0, 2.8, 3.0, '#E8D8B0', '#C0A870', 'outdoor', true,
    { color: '#D8C8A0', legStyle: 'none', material: 'fabric' },
    { color: '#C0A870', legStyle: 'none', material: 'metal' },
    { color: '#E8D8B0', legStyle: 'none', material: 'fabric' }
  ),
  parasol_offset: fw(3.5, 2.6, 1.0, '#D0C0A0', '#B0A070', 'outdoor', true,
    { color: '#C0B090', legStyle: 'none', material: 'metal' },
    { color: '#B0A070', legStyle: 'none', material: 'metal' },
    { color: '#D0C0A0', legStyle: 'none', material: 'fabric' }
  ),

  outdoor_kitchen: fw(2.4, 0.95, 0.8, '#606060', '#404040', 'outdoor', true,
    { color: '#505050', legStyle: 'none', material: 'metal' },
    { color: '#404040', legStyle: 'none', material: 'metal' },
    { color: '#606060', legStyle: 'none', material: 'composite' }
  ),
  bbq_unit: fw(1.2, 1.0, 0.6, '#3A3A3A', '#2A2A2A', 'outdoor', true,
    { color: '#2A2A2A', legStyle: 'block', material: 'metal' },
    { color: '#3A3A3A', legStyle: 'none', material: 'metal' },
    { color: '#4A4A4A', legStyle: 'none', material: 'metal' }
  ),
  outdoor_fridge: fw(0.7, 0.95, 0.7, '#505050', '#303030', 'outdoor', true,
    { color: '#404040', legStyle: 'none', material: 'metal' },
    { color: '#303030', legStyle: 'none', material: 'metal' },
    { color: '#505050', legStyle: 'none', material: 'metal' }
  ),

  garden_bench: fw(1.5, 0.88, 0.6, '#6A5040', '#4A3010', 'outdoor', true,
    { color: '#5A4020', legStyle: 'straight', material: 'wood' },
    { color: '#4A3010', legStyle: 'tapered', material: 'metal' },
    { color: '#6A5040', legStyle: 'tapered', material: 'wood' }
  ),
  garden_table: fw(1.8, 0.75, 0.95, '#7A5830', '#5A4020', 'outdoor', true,
    { color: '#6A4820', legStyle: 'tapered', material: 'wood' },
    { color: '#5A4020', legStyle: 'straight', material: 'metal' },
    { color: '#7A5830', legStyle: 'straight', material: 'wood' }
  ),
  picnic_table: fw(1.8, 0.72, 1.5, '#6A5030', '#4A3000', 'outdoor', true,
    { color: '#5A4010', legStyle: 'straight', material: 'wood' },
    { color: '#4A3000', legStyle: 'straight', material: 'metal' },
    { color: '#6A5030', legStyle: 'straight', material: 'wood' }
  ),

  pergola: fw(4.0, 2.5, 3.0, '#C0A870', '#8A7040', 'outdoor', true,
    { color: '#B09860', legStyle: 'none', material: 'wood' },
    { color: '#A08850', legStyle: 'none', material: 'metal' },
    { color: '#C0A870', legStyle: 'none', material: 'wood' }
  ),
  garden_shed: fw(2.4, 2.2, 1.8, '#5A6840', '#3A4820', 'outdoor', true,
    { color: '#4A5820', legStyle: 'none', material: 'wood' },
    { color: '#3A4820', legStyle: 'none', material: 'metal' },
    { color: '#5A6840', legStyle: 'none', material: 'wood' }
  ),
  arbour: fw(1.8, 2.2, 0.8, '#6A7050', '#4A5030', 'outdoor', true,
    { color: '#5A6040', legStyle: 'none', material: 'wood' },
    { color: '#4A5030', legStyle: 'none', material: 'wood' },
    { color: '#6A7050', legStyle: 'none', material: 'wood' }
  ),

  swimming_pool_rect: fw(4.0, 0.15, 8.0, '#4090B0', '#20809070', 'outdoor', true,
    { color: '#308090B0', legStyle: 'none', material: 'composite' },
    { color: '#2080A0', legStyle: 'none', material: 'tile' },
    { color: '#4090B0', legStyle: 'none', material: 'liner' }
  ),
  swimming_pool_round: fw(4.0, 0.15, 4.0, '#4090B0', '#208080A0', 'outdoor', true,
    { color: '#308090A0', legStyle: 'none', material: 'composite' },
    { color: '#208080A0', legStyle: 'none', material: 'liner' },
    { color: '#4090B0', legStyle: 'none', material: 'tile' }
  ),

  hot_tub: fw(2.0, 0.9, 2.0, '#508090A0', '#30607080', 'outdoor', true,
    { color: '#40708090', legStyle: 'none', material: 'composite' },
    { color: '#30607080', legStyle: 'none', material: 'wood' },
    { color: '#508090A0', legStyle: 'none', material: 'composite' }
  ),
  outdoor_spa: fw(2.2, 0.95, 2.2, '#40708090', '#30507080', 'outdoor', true,
    { color: '#30607090', legStyle: 'none', material: 'composite' },
    { color: '#20506080', legStyle: 'none', material: 'composite' },
    { color: '#40708090', legStyle: 'none', material: 'stone' }
  ),

  planter_rect: fw(0.6, 0.8, 0.6, '#7A6050', '#5A4020', 'outdoor', true,
    { color: '#6A5030', legStyle: 'none', material: 'ceramic' },
    { color: '#5A4020', legStyle: 'none', material: 'terracotta' },
    { color: '#7A6050', legStyle: 'none', material: 'fiberglass' }
  ),
  planter_raised: fw(1.0, 0.65, 0.6, '#6A4830', '#4A3010', 'outdoor', true,
    { color: '#5A4020', legStyle: 'none', material: 'wood' },
    { color: '#4A3010', legStyle: 'none', material: 'composite' },
    { color: '#6A4830', legStyle: 'none', material: 'wood' }
  ),
  planter_tower: fw(0.4, 1.2, 0.4, '#8A7060', '#6A5040', 'outdoor', true,
    { color: '#7A6040', legStyle: 'none', material: 'fiberglass' },
    { color: '#6A5040', legStyle: 'none', material: 'ceramic' },
    { color: '#8A7060', legStyle: 'none', material: 'plastic' }
  ),

  water_feature: fw(1.2, 0.8, 1.2, '#608090', '#407080', 'outdoor', true,
    { color: '#507080', legStyle: 'none', material: 'stone' },
    { color: '#407080', legStyle: 'none', material: 'ceramic' },
    { color: '#608090', legStyle: 'none', material: 'stone' }
  ),
  garden_fountain: fw(1.0, 1.2, 1.0, '#708890', '#506070', 'outdoor', true,
    { color: '#607080', legStyle: 'none', material: 'stone' },
    { color: '#506070', legStyle: 'none', material: 'ceramic' },
    { color: '#708890', legStyle: 'none', material: 'stone' }
  ),

  fire_pit: fw(0.9, 0.55, 0.9, '#5A4830', '#3A2810', 'outdoor', true,
    { color: '#4A3810', legStyle: 'none', material: 'stone' },
    { color: '#3A2810', legStyle: 'none', material: 'metal' },
    { color: '#5A4830', legStyle: 'none', material: 'stone' }
  ),
  outdoor_heater: fw(0.5, 1.6, 0.5, '#4A4A4A', '#2A2A2A', 'outdoor', true,
    { color: '#3A3A3A', legStyle: 'none', material: 'metal' },
    { color: '#2A2A2A', legStyle: 'none', material: 'metal' },
    { color: '#4A4A4A', legStyle: 'none', material: 'metal' }
  ),

  // ═══════════════════════════════════════════════════════════════
  // LANDSCAPE
  // ═══════════════════════════════════════════════════════════════

  decking: fw(4.0, 0.02, 3.0, '#B09060', '#907040', 'landscaping', true,
    { color: '#A08050', legStyle: 'none', material: 'wood' },
    { color: '#907040', legStyle: 'none', material: 'composite' },
    { color: '#B09060', legStyle: 'none', material: 'wood' }
  ),
  patio_paving: fw(4.0, 0.06, 4.0, '#A09080', '#807060', 'landscaping', true,
    { color: '#908070', legStyle: 'none', material: 'stone' },
    { color: '#807060', legStyle: 'none', material: 'concrete' },
    { color: '#A09080', legStyle: 'none', material: 'stone' }
  ),
  garden_path: fw(1.0, 0.04, 4.0, '#9A8878', '#7A6858', 'landscaping', true,
    { color: '#8A7858', legStyle: 'none', material: 'gravel' },
    { color: '#7A6858', legStyle: 'none', material: 'stone' },
    { color: '#9A8878', legStyle: 'none', material: 'pavers' }
  ),

  driveway: fw(3.0, 0.08, 6.0, '#808080', '#606060', 'landscaping', true,
    { color: '#707070', legStyle: 'none', material: 'concrete' },
    { color: '#606060', legStyle: 'none', material: 'asphalt' },
    { color: '#808080', legStyle: 'none', material: 'pavers' }
  ),
  garage_door: fw(2.4, 2.1, 0.05, '#C0B8A8', '#909090', 'landscaping', true,
    { color: '#B0A898', legStyle: 'none', material: 'metal' },
    { color: '#909090', legStyle: 'none', material: 'metal' },
    { color: '#C0B8A8', legStyle: 'none', material: 'wood' }
  ),

  garden_wall: fw(3.0, 1.2, 0.22, '#A09080', '#807060', 'landscaping', true,
    { color: '#908070', legStyle: 'none', material: 'brick' },
    { color: '#807060', legStyle: 'none', material: 'stone' },
    { color: '#A09080', legStyle: 'none', material: 'block' }
  ),
  fence_panel: fw(1.8, 1.2, 0.05, '#8A7060', '#6A5030', 'landscaping', true,
    { color: '#7A6040', legStyle: 'none', material: 'wood' },
    { color: '#6A5030', legStyle: 'none', material: 'wood' },
    { color: '#8A7060', legStyle: 'none', material: 'vinyl' }
  ),
  garden_gate: fw(1.0, 1.2, 0.06, '#7A6050', '#5A4020', 'landscaping', true,
    { color: '#6A5030', legStyle: 'none', material: 'wood' },
    { color: '#5A4020', legStyle: 'none', material: 'metal' },
    { color: '#7A6050', legStyle: 'none', material: 'wood' }
  ),

  retaining_wall: fw(4.0, 1.0, 0.35, '#8A8878', '#6A6858', 'landscaping', true,
    { color: '#7A7858', legStyle: 'none', material: 'stone' },
    { color: '#6A6858', legStyle: 'none', material: 'block' },
    { color: '#8A8878', legStyle: 'none', material: 'concrete' }
  ),
  steps_outdoor: fw(1.2, 0.6, 0.9, '#9A8878', '#7A6858', 'landscaping', true,
    { color: '#8A7858', legStyle: 'none', material: 'stone' },
    { color: '#7A6858', legStyle: 'none', material: 'concrete' },
    { color: '#9A8878', legStyle: 'none', material: 'pavers' }
  ),

  outdoor_lamp_post: fw(0.12, 2.8, 0.12, '#606060', '#404040', 'outdoor', true,
    { color: '#505050', legStyle: 'none', material: 'metal' },
    { color: '#404040', legStyle: 'none', material: 'metal' },
    { color: '#606060', legStyle: 'none', material: 'metal' }
  ),
  letterbox: fw(0.3, 0.45, 0.25, '#C8C0B0', '#A8A0908', 'outdoor', true,
    { color: '#B8B0A0', legStyle: 'none', material: 'metal' },
    { color: '#A8A090', legStyle: 'none', material: 'metal' },
    { color: '#C8C0B0', legStyle: 'none', material: 'metal' }
  ),
  bike_storage: fw(1.2, 1.5, 0.65, '#707878', '#505858', 'outdoor', true,
    { color: '#606868', legStyle: 'none', material: 'metal' },
    { color: '#505858', legStyle: 'none', material: 'metal' },
    { color: '#707878', legStyle: 'none', material: 'metal' }
  ),

  area_rug: fw(2.5, 0.02, 1.8, '#C8B8A0', '#A89880', 'decor', false,
    { color: '#B0A090', legStyle: 'none', material: 'fabric' },
    { color: '#A09080', legStyle: 'none', material: 'upholstery' },
    { color: '#C8B8A0', legStyle: 'none', material: 'fabric' }
  ),

  storage_shelf: fw(0.9, 1.8, 0.4, '#8A7850', '#6A5830', 'storage', false,
    { color: '#7A6830', legStyle: 'straight', material: 'metal' },
    { color: '#8A7850', legStyle: 'straight', material: 'wood' },
    { color: '#9A8860', legStyle: 'straight', material: 'wood' }
  ),

  raised_garden_bed: fw(2.0, 0.45, 1.0, '#6A5030', '#4A3018', 'landscape', true,
    { color: '#5A4020', legStyle: 'none', material: 'wood' },
    { color: '#6A5030', legStyle: 'none', material: 'wood' },
    { color: '#5A4020', legStyle: 'none', material: 'wood' }
  ),
};

// ─── Helper ───────────────────────────────────────────────────────────────────

export function getFurnitureDefaults(
  type: FurnitureType,
  style?: StyleVariant,
): FurnitureDefault {
  const base = FURNITURE_DEFAULTS[type];
  if (!style || !base.variants[style]) return base;
  return {
    ...base,
    ...base.variants[style],
  };
}

// ─── Room type → suggested furniture ──────────────────────────────────────────

export const ROOM_FURNITURE_SUGGESTIONS: Record<string, FurnitureType[]> = {
  living_room:  ['sofa_3seat', 'sofa_2seat', 'sofa_curved', 'armchair', 'coffee_table_rect', 'coffee_table_round', 'tv_unit', 'bookcase_tall', 'floor_lamp', 'side_table', 'area_rug'],
  master_bedroom: ['bed_king', 'wardrobe_4door', 'nightstand_2drawer', 'dresser_mirror', 'floor_lamp', 'bench_storage'],
  kids_room:    ['bed_bunk', 'desk_straight', 'bookcase_tall', 'toy_storage', 'bean_bag'],
  nursery:      ['bed_crib', 'chest_of_drawers', 'toy_storage', 'nightstand_open'],
  kitchen:      ['kitchen_counter_straight', 'kitchen_island', 'dining_table_rect', 'dining_chair', 'bar_stool'],
  dining_room:  ['dining_table_rect', 'dining_table_round', 'dining_chair', 'dining_chair_upholstered', 'sideboard'],
  office:       ['desk_straight', 'desk_corner', 'office_chair_executive', 'bookcase_tall', 'floor_lamp'],
  bathroom:     ['bathroom_vanity', 'toilet', 'bathtub_freestanding', 'towel_rail'],
  ensuite:      ['bathroom_sink_wall', 'toilet_wall_hung', 'shower_cubicle', 'bathroom_mirror'],
  garage:       ['bike_storage', 'storage_shelf'],
  outdoor:      ['garden_dining_set', 'sun_lounger', 'parasol', 'garden_bench'],
  garden:       ['garden_bench', 'planter_rect', 'raised_garden_bed', 'garden_fountain'],
};

// ─── Furniture catalogue grouped by category ────────────────────────────────────

export const FURNITURE_CATALOGUE: Record<string, FurnitureType[]> = {
  'Sofas & Sectionals': [
    'sofa_2seat', 'sofa_3seat', 'sofa_4seat', 'sofa_curved', 'sofa_l_shape', 'sofa_sectional', 'sofa_sleeper', 'sofa_recliner',
  ],
  'Armchairs & Lounge': [
    'armchair', 'recliner_armchair', 'lounge_armchair', 'club_armchair', 'chaise_lounge', 'ottoman', 'ottoman_round', 'daybed',
  ],
  'Dining Chairs & Stools': [
    'dining_chair', 'dining_chair_upholstered', 'dining_chair_windsor',
    'bar_stool', 'bar_stool_saddle', 'bar_stool_industrial',
  ],
  'Benches & Ottomans': [
    'bench_dining', 'bench_storage', 'bench_planner',
    'ottoman', 'ottoman_square', 'ottoman_round', 'ottoman_tufted',
    'floor_cushion', 'bean_bag',
  ],
  'Dining Tables': [
    'dining_table_rect', 'dining_table_round', 'dining_table_oval', 'dining_table_extendable', 'dining_table_glass_top',
  ],
  'Coffee & Side Tables': [
    'coffee_table_rect', 'coffee_table_square', 'coffee_table_round', 'coffee_table_nested', 'coffee_table_industrial',
    'side_table', 'side_table_nested', 'console_table',
  ],
  'Desks & Workstations': [
    'desk_straight', 'desk_corner', 'desk_standing', 'desk_acrylic',
    'nightstand', 'nightstand_2drawer', 'nightstand_open',
  ],
  'Beds & Sleeping': [
    'bed_single', 'bed_double', 'bed_queen', 'bed_king',
    'bed_platform_low', 'bed_platform_high', 'bed_storage',
    'bed_bunk', 'bed_crib', 'bed_toddler', 'bed_daybed', 'headboard_only',
  ],
  'Wardrobes & Storage': [
    'wardrobe_2door', 'wardrobe_3door', 'wardrobe_4door', 'wardrobe_sliding', 'walk_in_wardrobe',
    'dresser', 'dresser_mirror', 'chest_of_drawers',
    'bookcase_low', 'bookcase_tall', 'bookcase_wall', 'modular_shelving', 'cubby_storage',
    'sideboard', 'credenza',
  ],
  'Media & TV Units': [
    'tv_unit', 'tv_unit_floating', 'media_credenza', 'speaker_floor', 'sound_bar',
  ],
  'Kitchen & Bar': [
    'kitchen_counter_straight', 'kitchen_counter_corner', 'kitchen_island', 'kitchen_island_seating',
    'pantry', 'larder', 'kitchen_trolley', 'wine_rack',
    'bar_table', 'bar_table_high',
  ],
  'Bathroom Fixtures': [
    'bathroom_vanity', 'bathroom_cabinet', 'bathroom_sink', 'bathroom_sink_wall', 'bathroom_sink_pedestal',
    'bathtub', 'bathtub_freestanding', 'bathtub_corner', 'bathtub_jacuzzi',
    'toilet', 'toilet_wall_hung', 'urinal',
    'shower_cubicle', 'shower_wet_room',
    'towel_rail', 'bathroom_mirror',
  ],
  'Lighting': [
    'floor_lamp', 'floor_lamp_arch', 'floor_lamp_tripod',
    'table_lamp', 'desk_lamp',
    'pendant_light', 'pendant_cluster', 'chandelier',
    'wall_sconce', 'ceiling_spotlight',
  ],
  'Decor & Room Dividers': [
    'room_divider', 'room_divider_folding',
    'fireplace_electric', 'fireplace_gas', 'fireplace_built_in',
    'whiteboard', 'partition_screen', 'monitor_stand',
    'area_rug',
  ],
  'Outdoor Seating': [
    'garden_dining_set', 'garden_sofa_set', 'garden_chat_set',
    'sun_lounger', 'garden_chair', 'hammock',
  ],
  'Outdoor Tables & Structures': [
    'garden_table', 'garden_bench', 'picnic_table',
    'parasol', 'parasol_offset',
    'outdoor_kitchen', 'bbq_unit', 'outdoor_fridge',
    'pergola', 'garden_shed', 'arbour',
  ],
  'Pool & Spa': [
    'swimming_pool_rect', 'swimming_pool_round',
    'hot_tub', 'outdoor_spa',
  ],
  'Garden & Planters': [
    'planter_rect', 'planter_raised', 'planter_tower',
    'water_feature', 'garden_fountain', 'fire_pit', 'outdoor_heater',
  ],
  'Outdoor Structures': [
    'decking', 'patio_paving', 'garden_path',
    'driveway', 'garage_door',
    'garden_wall', 'fence_panel', 'garden_gate', 'retaining_wall', 'steps_outdoor',
    'outdoor_lamp_post', 'letterbox', 'bike_storage',
    'storage_shelf', 'raised_garden_bed',
  ],
};

// ─── Style variants ─────────────────────────────────────────────────────────

export const STYLE_VARIANTS: { id: StyleVariant; label: string; description: string }[] = [
  { id: 'modern',      label: 'Modern',      description: 'Clean lines, hairpin legs, minimal form' },
  { id: 'classic',      label: 'Classic',     description: 'Tapered wooden legs, traditional upholstery' },
  { id: 'mid_century',  label: 'Mid-Century', description: 'Tapered legs, walnut tones, sculpted forms' },
  { id: 'industrial',   label: 'Industrial',  description: 'Black metal, concrete, raw materials' },
  { id: 'scandi',      label: 'Scandi',      description: 'Light oak, muted textiles, cosy minimalism' },
  { id: 'minimalist',  label: 'Minimalist',  description: 'White/grey, slab arms, hidden storage' },
];

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createFurniturePiece(
  id: string,
  type: FurnitureType,
  roomId: string,
  position: { x: number; y: number; z: number },
  rotation = 0,
  styleVariant: StyleVariant = 'modern',
): FurniturePiece {
  const defaults = getFurnitureDefaults(type, styleVariant);
  return {
    id,
    name: type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    category: type,
    roomId,
    position,
    rotation: { x: 0, y: rotation, z: 0 },
    dimensions: { x: defaults.w, y: defaults.h, z: defaults.d },
    procedural: true,
    styleVariant,
  };
}

// Aliases for backward compatibility
export const FURNITURE_DEFAULTS_LEGACY: Record<string, { w: number; h: number; d: number; color: string; category: string; outdoor: boolean }> = {
  sofa:            { w: 2.0,  h: 0.85, d: 0.9,  color: '#8A7A6A', category: 'sofa',     outdoor: false },
  chair:           { w: 0.7,  h: 0.95, d: 0.7,  color: '#8A7A6A', category: 'chair',    outdoor: false },
  dining_table:    { w: 1.6,  h: 0.75, d: 0.9,  color: '#9A7850', category: 'table',    outdoor: false },
  dining_chair_legacy: { w: 0.5, h: 0.9, d: 0.5, color: '#8A7A6A', category: 'chair', outdoor: false },
  bed_double_legacy:   { w: 1.6, h: 0.5, d: 2.0, color: '#D0C8B8', category: 'bed',  outdoor: false },
  bed_single_legacy:   { w: 0.9, h: 0.5, d: 2.0, color: '#D0C8B8', category: 'bed',  outdoor: false },
  desk_legacy:         { w: 1.4, h: 0.75,d: 0.6, color: '#A08060', category: 'desk', outdoor: false },
  wardrobe_legacy:     { w: 1.8, h: 2.2, d: 0.6, color: '#B0A890', category: 'storage', outdoor: false },
  coffee_table_legacy: { w: 1.1, h: 0.4, d: 0.6, color: '#9A7850', category: 'table',  outdoor: false },
  tv_stand_legacy:     { w: 1.5, h: 0.55,d: 0.45, color: '#5A4838', category: 'storage', outdoor: false },
  bookshelf_legacy:    { w: 0.9, h: 1.8, d: 0.3, color: '#9A7850', category: 'storage', outdoor: false },
  kitchen_counter_legacy: { w: 2.4, h: 0.9, d: 0.6, color: '#D8D0C0', category: 'kitchen', outdoor: false },
  kitchen_island_legacy: { w: 1.2, h: 0.9, d: 0.8, color: '#D8D0C0', category: 'kitchen', outdoor: false },
  bathroom_sink_legacy: { w: 0.6, h: 0.85,d: 0.5, color: '#E8E8E8', category: 'bathroom', outdoor: false },
  bathtub_legacy:       { w: 0.75,h: 0.6, d: 1.7, color: '#E8E8E8', category: 'bathroom', outdoor: false },
  toilet_legacy:       { w: 0.4, h: 0.8, d: 0.65, color: '#E8E8E8', category: 'bathroom', outdoor: false },
};