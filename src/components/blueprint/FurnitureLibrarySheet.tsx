import { DS } from '../../theme/designSystem';
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, Pressable, ScrollView, TextInput, Modal, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS,
} from 'react-native-reanimated';
import Svg, { Rect, Circle, Line, Path } from 'react-native-svg';
import { useTierGate } from '../../hooks/useTierGate';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { FURNITURE_DEFAULTS, STYLE_VARIANTS, FURNITURE_CATALOGUE } from '../../utils/procedural/furniture';
import type { FurnitureDef } from '../../hooks/useFurniturePlacement';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = SCREEN_H * 0.88;

// ── Furniture type → SVG icon path ─────────────────────────────────────────────
type IconKind = 'sofa' | 'chair' | 'table' | 'bed' | 'wardrobe' | 'desk' | 'lamp'
  | 'bath' | 'shower' | 'toilet' | 'plant' | 'rug' | 'shelf' | 'tv' | 'bookcase'
  | 'outdoor' | 'divider' | 'fireplace' | 'pool' | 'structure' | 'decor';

const ICON_PATHS: Record<IconKind, string> = {
  sofa:     'M4 22 Q4 14 10 14 L26 14 Q32 14 32 22 L32 26 L4 26 Z M6 26 L6 30 M30 26 L30 30 M8 14 L8 10 Q8 8 12 8 M28 14 L28 10 Q28 8 24 8',
  chair:    'M10 28 L10 18 L26 18 L26 28 Z M10 18 L10 12 L26 12 L26 18 M8 12 Q8 8 16 8 Q24 8 28 12',
  table:    'M4 16 L32 16 L30 20 L6 20 Z M8 20 L8 30 M28 20 L28 30 M12 20 L12 30 M24 20 L24 30',
  bed:      'M4 26 L32 26 L32 28 L4 28 Z M4 14 L32 14 L32 26 L4 26 Z M10 10 Q10 8 14 8 L22 8 Q26 8 26 10',
  wardrobe: 'M6 8 L30 8 L30 30 L6 30 Z M6 12 L30 12 M16 8 L16 30 M14 18 L18 18',
  desk:     'M4 24 L32 24 L30 28 L6 28 Z M4 16 L8 16 L8 28 M28 16 L32 16 L32 28 M14 16 L14 28',
  lamp:     'M16 4 L16 16 M12 16 L20 16 L18 20 L14 20 Z M14 20 L14 28 M18 20 L18 28',
  bath:     'M4 22 L28 22 Q30 22 30 20 L30 16 Q30 14 28 14 L8 14 Q6 14 6 16 L6 20 Q6 22 8 22 M10 26 L10 28 M26 26 L26 28',
  shower:   'M16 4 L16 12 M12 12 Q12 8 16 8 Q20 8 20 12 M14 12 L14 20 M18 12 L18 20 M12 20 L20 20 M10 20 L26 20',
  toilet:   'M12 8 L20 8 L22 16 L22 24 L10 24 L10 20 L10 16 Z M10 24 L24 24 L24 28 L10 28 Z',
  plant:    'M16 28 L16 18 M10 18 Q10 12 16 10 Q22 12 22 18 M12 20 L16 14 L20 20 M8 28 Q8 20 16 18 Q24 20 24 28',
  rug:      'M4 12 Q4 8 10 8 L26 8 Q32 8 32 12 L32 24 Q32 28 26 28 L10 28 Q4 28 4 24 Z M8 14 L28 14 M14 14 L14 24',
  shelf:    'M4 8 L32 8 L30 30 L6 30 Z M6 18 L30 18 M6 24 L30 24',
  tv:       'M4 12 L32 12 L32 24 L28 24 L28 28 L8 28 L8 24 L4 24 Z M12 16 L12 22 M14 20 L20 20',
  bookcase: 'M4 6 L32 6 L30 30 L6 30 Z M6 14 L30 14 M6 22 L30 22 M6 28 L30 28',
  outdoor:  'M4 26 L32 26 L32 28 L4 28 Z M4 14 L32 14 L32 22 L28 22 L28 26 L8 26 L8 22 L4 22 Z M14 8 Q16 6 18 8',
  divider:  'M4 8 L4 28 M16 10 L16 28 M28 8 L28 28 M2 14 L6 14 M14 14 L18 14 M26 14 L30 14',
  fireplace:'M6 26 L30 26 L30 28 L6 28 Z M6 8 L30 8 L28 26 L8 26 Z M14 16 L18 16 L18 20 L14 20 Z M12 20 Q16 24 20 20',
  pool:     'M4 10 L32 10 L32 26 L4 26 Z M8 14 L28 14 M8 20 L28 20 M14 10 L14 26 M22 10 L22 26',
  structure:'M16 4 L16 12 M8 12 L24 12 L28 28 L4 28 Z M12 12 L12 20 M20 12 L20 20',
  decor:    'M16 6 Q20 10 20 16 Q20 24 16 28 Q12 24 12 16 Q12 10 16 6 M16 12 Q18 14 18 18 Q18 22 16 24',
};

const CATEGORY_ICONS: Record<string, IconKind> = {
  seating: 'sofa', tables: 'table', bedroom: 'bed', kitchen: 'table',
  bathroom: 'bath', lighting: 'lamp', storage: 'shelf', office: 'desk',
  outdoor: 'outdoor', decor: 'decor', rugs: 'rug', structural: 'structure',
  plants: 'plant', media: 'tv', wall_decor: 'divider',
};

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectFurniture?: (def: FurnitureDef) => void;
}

function FurnitureIcon({ kind, size = 32, color = DS.colors.primary }: { kind: IconKind; size?: number; color?: string }) {
  const d = ICON_PATHS[kind] ?? ICON_PATHS.decor;
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36">
      <Path d={d} stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
    </Svg>
  );
}

interface Piece {
  type: string;
  label: string;
  icon: IconKind;
  category: string;
}

function buildCataloguePieces(): Piece[] {
  const pieces: Piece[] = [];
  const iconMap: Record<string, IconKind> = {
    sofa: 'sofa', sofa_2seat: 'sofa', sofa_3seat: 'sofa', sofa_4seat: 'sofa',
    sofa_curved: 'sofa', sofa_l_shape: 'sofa', sofa_sectional: 'sofa',
    armchair: 'chair', recliner_armchair: 'chair', lounge_armchair: 'chair', club_armchair: 'chair',
    dining_chair: 'chair', dining_chair_upholstered: 'chair', dining_chair_windsor: 'chair',
    bar_stool: 'chair', bar_stool_saddle: 'chair', bar_stool_industrial: 'chair',
    bench_dining: 'chair', bench_storage: 'chair', bench_planner: 'chair',
    ottoman: 'sofa', ottoman_square: 'sofa', ottoman_round: 'sofa', ottoman_tufted: 'sofa',
    chaise_lounge: 'sofa', daybed: 'bed',
    office_chair: 'chair', office_chair_executive: 'chair',
    bean_bag: 'sofa', floor_cushion: 'sofa',
    dining_table_rect: 'table', dining_table_round: 'table', dining_table_oval: 'table',
    coffee_table_rect: 'table', coffee_table_square: 'table', coffee_table_round: 'table',
    side_table: 'table', console_table: 'table',
    desk_straight: 'desk', desk_corner: 'desk', desk_standing: 'desk',
    nightstand: 'table', nightstand_2drawer: 'table',
    bed_single: 'bed', bed_double: 'bed', bed_queen: 'bed', bed_king: 'bed',
    bed_platform_low: 'bed', bed_bunk: 'bed', bed_crib: 'bed', bed_toddler: 'bed',
    wardrobe_2door: 'wardrobe', wardrobe_3door: 'wardrobe', wardrobe_sliding: 'wardrobe',
    walk_in_wardrobe: 'wardrobe', dresser: 'wardrobe', chest_of_drawers: 'wardrobe',
    bookcase_low: 'bookcase', bookcase_tall: 'bookcase', modular_shelving: 'shelf',
    tv_unit: 'tv', tv_unit_floating: 'tv',
    floor_lamp: 'lamp', table_lamp: 'lamp', pendant_light: 'lamp',
    bathroom_vanity: 'bath', bathtub: 'bath', toilet: 'toilet', shower_cubicle: 'shower',
    kitchen_counter_straight: 'table', kitchen_island: 'table', kitchen_island_seating: 'table',
    room_divider: 'divider', room_divider_folding: 'divider',
    fireplace_electric: 'fireplace', electric_fireplace: 'fireplace',
    swimming_pool_rect: 'pool', swimming_pool_round: 'pool', hot_tub: 'pool',
    garden_dining_set: 'outdoor', garden_sofa_set: 'outdoor', garden_bench: 'outdoor',
    sun_lounger: 'outdoor', pergola: 'structure', garden_shed: 'structure',
    planter_rect: 'plant', planter_raised: 'plant', planter_small: 'plant',
    area_rug: 'rug',
  };

  const labelMap: Record<string, string> = {
    sofa_2seat: '2-Seat Sofa', sofa_3seat: '3-Seat Sofa', sofa_4seat: '4-Seat Sofa',
    sofa_curved: 'Curved Sofa', sofa_l_shape: 'L-Shape Sofa', sofa_sectional: 'Sectional',
    sofa_sleeper: 'Sleeper Sofa', sofa_recliner: 'Recliner',
    armchair: 'Armchair', recliner_armchair: 'Recliner', lounge_armchair: 'Lounge Chair',
    club_armchair: 'Club Chair',
    dining_chair: 'Dining Chair', dining_chair_upholstered: 'Upholstered Chair',
    dining_chair_windsor: 'Windsor Chair',
    bar_stool: 'Bar Stool', bar_stool_saddle: 'Saddle Stool', bar_stool_industrial: 'Industrial Stool',
    bench_dining: 'Dining Bench', bench_storage: 'Storage Bench', bench_planner: 'Planner Bench',
    ottoman: 'Ottoman', ottoman_square: 'Square Ottoman', ottoman_round: 'Round Ottoman',
    ottoman_tufted: 'Tufted Ottoman',
    chaise_lounge: 'Chaise Lounge', daybed: 'Daybed',
    office_chair: 'Office Chair', office_chair_executive: 'Executive Chair',
    bean_bag: 'Bean Bag', floor_cushion: 'Floor Cushion',
    dining_table_rect: 'Rectangular Table', dining_table_round: 'Round Table',
    dining_table_oval: 'Oval Table', dining_table_extendable: 'Extendable Table',
    coffee_table_rect: 'Rect. Coffee Table', coffee_table_square: 'Square Coffee Table',
    coffee_table_round: 'Round Coffee Table', coffee_table_nested: 'Nested Table',
    coffee_table_industrial: 'Industrial Table',
    side_table: 'Side Table', side_table_nested: 'Nested Side Table', console_table: 'Console Table',
    desk_straight: 'Straight Desk', desk_corner: 'Corner Desk', desk_standing: 'Standing Desk',
    nightstand: 'Nightstand', nightstand_2drawer: '2-Drawer Nightstand',
    bed_single: 'Single Bed', bed_double: 'Double Bed', bed_queen: 'Queen Bed', bed_king: 'King Bed',
    bed_platform_low: 'Low Platform Bed', bed_platform_high: 'High Platform Bed',
    bed_bunk: 'Bunk Bed', bed_crib: 'Crib', bed_toddler: 'Toddler Bed', bed_daybed: 'Daybed',
    wardrobe_2door: '2-Door Wardrobe', wardrobe_3door: '3-Door Wardrobe', wardrobe_4door: '4-Door Wardrobe',
    wardrobe_sliding: 'Sliding Wardrobe', walk_in_wardrobe: 'Walk-In Wardrobe',
    dresser: 'Dresser', dresser_mirror: 'Mirror Dresser', chest_of_drawers: 'Chest of Drawers',
    bookcase_low: 'Low Bookcase', bookcase_tall: 'Tall Bookcase', modular_shelving: 'Modular Shelving',
    tv_unit: 'TV Unit', tv_unit_floating: 'Floating TV Shelf',
    floor_lamp: 'Floor Lamp', table_lamp: 'Table Lamp', pendant_light: 'Pendant Light',
    bathroom_vanity: 'Bathroom Vanity', bathroom_sink: 'Bathroom Sink',
    bathtub: 'Bathtub', bathtub_freestanding: 'Freestanding Bath', corner_bath: 'Corner Bath',
    toilet: 'Toilet', shower_cubicle: 'Shower Cubicle',
    kitchen_counter_straight: 'Kitchen Counter', kitchen_counter_corner: 'Corner Counter',
    kitchen_island: 'Kitchen Island', kitchen_island_seating: 'Island with Seating',
    room_divider: 'Room Divider', room_divider_folding: 'Folding Divider',
    fireplace_electric: 'Electric Fireplace',
    swimming_pool_rect: 'Rectangular Pool', swimming_pool_round: 'Round Pool',
    hot_tub: 'Hot Tub',
    garden_dining_set: 'Garden Dining Set', garden_sofa_set: 'Garden Sofa Set',
    garden_bench: 'Garden Bench', sun_lounger: 'Sun Lounger',
    pergola: 'Pergola', garden_shed: 'Garden Shed',
    planter_rect: 'Rectangular Planter', planter_raised: 'Raised Planter', planter_small: 'Small Planter',
    area_rug: 'Area Rug',
  };

  for (const [type, def] of Object.entries(FURNITURE_DEFAULTS)) {
    pieces.push({
      type,
      label: labelMap[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      icon: iconMap[type] ?? 'decor',
      category: def.category,
    });
  }
  return pieces;
}

const ALL_PIECES = buildCataloguePieces();

const CATEGORY_KEYS = [
  { id: 'all', label: 'All', icon: '◈' },
  { id: 'seating', label: 'Seating', icon: '🛋' },
  { id: 'table', label: 'Tables', icon: '▭' },
  { id: 'bed', label: 'Beds', icon: '🛏' },
  { id: 'storage', label: 'Storage', icon: '▤' },
  { id: 'kitchen', label: 'Kitchen', icon: '⊡' },
  { id: 'bathroom', label: 'Bath', icon: '⊕' },
  { id: 'lighting', label: 'Light', icon: '◎' },
  { id: 'outdoor', label: 'Outdoor', icon: '⌂' },
  { id: 'decor', label: 'Decor', icon: '◇' },
];

const STYLE_PILLS = [
  { id: 'default', label: 'Default' },
  { id: 'modern', label: 'Modern' },
  { id: 'classic', label: 'Classic' },
  { id: 'mid_century', label: 'Mid-Century' },
  { id: 'industrial', label: 'Industrial' },
  { id: 'scandi', label: 'Scandi' },
];

function ItemTile({
  piece, styleVariant, onAdd,
}: {
  piece: Piece;
  styleVariant: string;
  onAdd: (type: string, label: string, variant: string) => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const handlePress = () => {
    scale.value = withSpring(0.9, { damping: 18, stiffness: 420 }, () => {
      scale.value = withSpring(1, { damping: 18, stiffness: 420 });
      runOnJS(onAdd)(piece.type, piece.label, styleVariant);
    });
  };
  return (
    <Pressable onPress={handlePress} style={{ width: '31%', marginBottom: 8, marginHorizontal: '1%' }}>
      <Animated.View style={[animStyle, {
        backgroundColor: DS.colors.surface,
        borderRadius: DS.radius.card,
        padding: 10,
        borderWidth: 1,
        borderColor: DS.colors.borderLight,
        alignItems: 'center',
        minHeight: 88,
        justifyContent: 'space-between',
        shadowColor: DS.colors.ink,
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 0,
        elevation: 3,
      }]}>
        <FurnitureIcon kind={piece.icon} size={36} color={DS.colors.accent} />
        <Text
          numberOfLines={2}
          style={{
            fontFamily: DS.font.regular,
            fontSize: 9,
            color: DS.colors.primaryDim,
            textAlign: 'center',
            marginTop: 4,
            lineHeight: 12,
          }}
        >
          {piece.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function FurnitureLibrarySheet({ visible, onClose, onSelectFurniture }: Props) {
  const [selectedCat, setSelectedCat] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('default');
  const translateY = useSharedValue(SHEET_H);

  useEffect(() => {
    translateY.value = visible
      ? withSpring(0, { damping: 22, stiffness: 280 })
      : withTiming(SHEET_H, { duration: 250 });
  }, [visible, translateY]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  const handleAdd = useCallback((type: string, label: string, variant: string) => {
    if (!onSelectFurniture) return;
    const defaults = FURNITURE_DEFAULTS[type as keyof typeof FURNITURE_DEFAULTS];
    const finalColor = variant !== 'default' && defaults?.variants?.[variant as keyof typeof defaults.variants]?.color
      ? defaults.variants[variant as keyof typeof defaults.variants]!.color!
      : defaults?.color ?? '#8A7A6A';

    const def: FurnitureDef = {
      type,
      name: label,
      category: defaults?.category ?? 'furniture',
      dimensions: {
        width: defaults?.w ?? 1,
        height: defaults?.h ?? 1,
        depth: defaults?.d ?? 1,
      },
      defaultColor: finalColor,
    };
    onSelectFurniture(def);
    onClose();
  }, [onSelectFurniture, onClose]);

  const filtered = ALL_PIECES.filter((p) => {
    if (selectedCat !== 'all' && p.category !== selectedCat) return false;
    if (search && !p.label.toLowerCase().includes(search.toLowerCase()) && !p.type.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <Pressable style={{ flex: 1, backgroundColor: DS.colors.overlay }} onPress={onClose} />
      <Animated.View style={[sheetStyle, {
        position: 'absolute', bottom: 0, left: 0, right: 0, height: SHEET_H,
        backgroundColor: DS.colors.surface,
        borderTopLeftRadius: DS.radius.modal,
        borderTopRightRadius: DS.radius.modal,
        borderTopWidth: 2,
        borderTopColor: DS.colors.ink,
        overflow: 'hidden',
        shadowColor: DS.colors.ink,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 16,
      }]}>
        {/* Handle */}
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 6 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: DS.colors.borderLight }} />
        </View>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 }}>
          <Text style={{ fontFamily: DS.font.heading, fontSize: 20, color: DS.colors.primary, flex: 1 }}>
            Furniture Library
          </Text>
          <Pressable onPress={onClose} style={{ padding: 8 }}>
            <Text style={{ color: DS.colors.primaryDim, fontSize: 18 }}>✕</Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={{ marginHorizontal: 20, marginBottom: 10 }}>
          <TextInput
            value={search} onChangeText={setSearch}
            placeholder="Search furniture..." placeholderTextColor={DS.colors.primaryGhost}
            style={{
              backgroundColor: DS.colors.surfaceHigh,
              borderRadius: DS.radius.input,
              paddingHorizontal: 14,
              paddingVertical: 10,
              fontFamily: DS.font.regular,
              fontSize: 14,
              color: DS.colors.primary,
              borderWidth: 1,
              borderColor: DS.colors.border,
            }}
          />
        </View>

        {/* Style variant pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, marginBottom: 10, gap: 8 }}
        >
          {STYLE_PILLS.map((pill) => (
            <Pressable
              key={pill.id}
              onPress={() => setSelectedStyle(pill.id)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: DS.radius.chip,
                backgroundColor: selectedStyle === pill.id ? DS.colors.accent : DS.colors.surfaceHigh,
                borderWidth: 1,
                borderColor: selectedStyle === pill.id ? DS.colors.accent : DS.colors.borderLight,
              }}
            >
              <Text style={{
                fontFamily: DS.font.medium,
                fontSize: 11,
                color: selectedStyle === pill.id ? DS.colors.background : DS.colors.primaryDim,
              }}>
                {pill.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Category tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={{ borderBottomWidth: 1, borderBottomColor: DS.colors.borderLight, marginBottom: 10 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 4 }}
        >
          {CATEGORY_KEYS.map((c) => (
            <Pressable key={c.id} onPress={() => setSelectedCat(c.id)} style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: DS.radius.chip,
              backgroundColor: selectedCat === c.id ? DS.colors.surfaceHigh : 'transparent',
              borderWidth: selectedCat === c.id ? 1 : 0,
              borderColor: DS.colors.border,
            }}>
              <Text style={{ fontSize: 13 }}>{c.icon}</Text>
              <Text style={{
                fontFamily: DS.font.regular,
                fontSize: 9,
                color: selectedCat === c.id ? DS.colors.primary : DS.colors.primaryDim,
                marginTop: 2,
              }}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Grid */}
        <View style={{ flex: 1, paddingHorizontal: 8 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 20 }}>
              {filtered.map((piece) => (
                <ItemTile
                  key={piece.type}
                  piece={piece}
                  styleVariant={selectedStyle}
                  onAdd={handleAdd}
                />
              ))}
              {filtered.length === 0 && (
                <View style={{ width: '100%', alignItems: 'center', paddingTop: 40 }}>
                  <Text style={{ color: DS.colors.primaryGhost, fontFamily: DS.font.regular, fontSize: 13 }}>
                    No furniture found
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
}
