import { DS } from '../../theme/designSystem';
import { SUNRISE } from '../../theme/sunrise';
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, Pressable, ScrollView, TextInput, Modal, FlatList, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS,
} from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';
import { useTierGate } from '../../hooks/useTierGate';
import { useRoomAutoComplete } from '../../hooks/useRoomAutoComplete';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { FURNITURE_DEFAULTS } from '../../utils/procedural/furniture';
import type { FurnitureDef } from '../../hooks/useFurniturePlacement';

interface FurnitureSuggestion {
  furnitureType: string;
  position: string;
  reason: string;
}

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = SCREEN_H * 0.85;

const CATEGORIES = [
  { id: 'my_style', label: 'My Style', icon: '✦', items: [] as string[] },
  { id: 'seating', label: 'Seating', icon: '🛋', items: ['Sofa', 'Armchair', 'Dining Chair', 'Bar Stool', 'Ottoman', 'Bench', 'Recliner', 'Lounge Chair', 'Accent Chair', 'Chaise Lounge', 'Office Chair', 'Bean Bag', 'Swing Chair', 'Garden Chair', 'Hammock', 'Curved Sofa', 'L-Shaped Sofa', 'Sectional Sofa'] },
  { id: 'tables', label: 'Tables', icon: '▭', items: ['Dining Table', 'Coffee Table', 'Side Table', 'Console Table', 'Desk', 'Bedside Table', 'Bar Table', 'Outdoor Table', 'Folding Table', 'Round Dining Table', 'Oval Dining Table', 'Glass Table', 'Extendable Table', 'Bar Unit', 'Kitchen Island Seating'] },
  { id: 'bedroom', label: 'Bedroom', icon: '🛏', items: ['Bed', 'King Bed', 'Platform Bed', 'Wardrobe', 'Walk-In Wardrobe', 'Dresser', 'Nightstand', 'Vanity Desk', 'Bed Frame', 'Headboard', 'Bunk Bed', 'Crib', 'Toddler Bed', 'Changing Table', 'Daybed', 'Blanket Box', 'Bedroom Mirror', 'Bedroom Bench'] },
  { id: 'kitchen', label: 'Kitchen', icon: '⊡', items: ['Kitchen Island', 'Cabinet', 'Shelving Unit', 'Pantry', 'Breakfast Bar', 'Kitchen Trolley', 'Wine Rack', 'Spice Rack', 'Kitchen Counter', 'Pot Rack'] },
  { id: 'bathroom', label: 'Bathroom', icon: '⊕', items: ['Vanity Unit', 'Bathroom Cabinet', 'Towel Rail', 'Freestanding Bath', 'Corner Bath', 'Shower Unit', 'Bathroom Shelf', 'Bathroom Mirror', 'Laundry Basket'] },
  { id: 'lighting', label: 'Lighting', icon: '◎', items: ['Floor Lamp', 'Table Lamp', 'Pendant Light', 'Chandelier', 'Wall Sconce', 'Ceiling Light', 'Strip Light', 'Spotlight', 'Desk Lamp', 'Outdoor Light Post'] },
  { id: 'storage', label: 'Storage', icon: '▤', items: ['Bookshelf', 'Full Wall Bookcase', 'Modular Shelving', 'Display Cabinet', 'Filing Cabinet', 'Shoe Rack', 'Coat Rack', 'Toy Storage', 'TV Media Unit', 'Floating TV Shelf', 'Sideboard', 'Hall Table', 'Bicycle Storage'] },
  { id: 'office', label: 'Office', icon: '⊞', items: ['Home Office Desk', 'Corner Desk', 'Office Chair', 'Filing Cabinet', 'Bookshelf', 'Monitor Stand', 'Whiteboard', 'Meeting Table', 'Standing Desk'] },
  { id: 'outdoor', label: 'Outdoor', icon: '⌂', items: ['Garden Sofa Set', 'Sun Lounger', 'Garden Dining Set', 'Parasol', 'Outdoor Kitchen', 'Pergola', 'Garden Shed', 'Swimming Pool', 'Hot Tub', 'Planter Large', 'Planter Small', 'Garden Bench', 'Swing Set', 'Trampoline', 'Sandpit', 'Garden Path', 'Driveway', 'Garage Door', 'Garden Wall', 'Fence Panel', 'Gate', 'Deck Area', 'Steps', 'Retaining Wall', 'Raised Garden Bed', 'Water Feature', 'Fountain', 'Letterbox', 'Gate Post', 'Outdoor Light Post', 'Bicycle Storage'] },
  { id: 'decor', label: 'Decor', icon: '◈', items: ['Indoor Plant', 'Indoor Tree', 'Potted Plant', 'Hanging Plant', 'Succulent', 'Vertical Garden', 'Area Rug', 'Runner Rug', 'Round Rug', 'Ceiling Light', 'Pendant Light', 'Chandelier', 'Table Lamp', 'Floor Lamp', 'Wall Sconce', 'Artwork Frame', 'Wall Mirror', 'Wall Clock', 'Vase', 'Sculpture', 'Candles', 'Photo Frame'] },
  { id: 'rugs', label: 'Rugs & Flooring', icon: '▭', items: ['Area Rug', 'Runner Rug', 'Round Rug', 'Bath Mat', 'Door Mat'] },
  { id: 'wall_decor', label: 'Wall Decor', icon: '⬚', items: ['Artwork Frame', 'Wall Mirror', 'Wall Shelf', 'Wall Clock', 'Wall Panel', 'Picture Ledge', 'Wall Light'] },
  { id: 'windows', label: 'Windows', icon: '⊟', items: ['Single Window', 'Double Window', 'Bay Window', 'Skylight', 'French Doors', 'Sliding Door', 'Bi-fold Door', 'Sash Window', 'Floor-to-Ceiling Window'] },
  { id: 'doors', label: 'Doors', icon: '▯', items: ['Interior Door', 'Exterior Door', 'Sliding Door', 'Barn Door', 'Glass Door', 'Double Door', 'Arched Door', 'Dutch Door'] },
  { id: 'media', label: 'Media', icon: '⬜', items: ['TV Media Unit', 'Floating TV Shelf', 'Fireplace Unit', 'Electric Fireplace', 'Room Divider', 'Sound Bar', 'Speaker'] },
  { id: 'structural', label: 'Structural', icon: '⌇', items: ['Column', 'Beam', 'Arch', 'Fireplace', 'Room Divider', 'Built-in Shelving', 'Coffered Ceiling', 'Alcove', 'Spiral Staircase', 'L-Staircase'] },
  { id: 'plants', label: 'Plants', icon: '❧', items: ['Indoor Tree', 'Potted Plant', 'Hanging Plant', 'Succulent', 'Herb Garden', 'Vertical Garden', 'Outdoor Tree', 'Hedge', 'Planter'] },
  { id: 'appliances', label: 'Appliances', icon: '⊛', items: ['Fridge', 'Oven', 'Hob', 'Dishwasher', 'Microwave', 'Coffee Machine', 'Washing Machine', 'Dryer', 'Wine Cooler'] },
  { id: 'bath_fixtures', label: 'Bath Fixtures', icon: '⊗', items: ['Sink', 'Toilet', 'Bath', 'Shower', 'Taps', 'Bidet', 'Jacuzzi'] },
  { id: 'textiles', label: 'Textiles', icon: '≋', items: ['Curtains', 'Blinds', 'Cushions', 'Throw', 'Bed Linen', 'Tablecloth', 'Chair Cover'] },
  { id: 'decorative', label: 'Decorative', icon: '◇', items: ['Vase', 'Sculpture', 'Candles', 'Books', 'Photo Frame', 'Tray', 'Bowl', 'Clock', 'Globe'] },
];

interface ItemTileProps { name: string; category: string; onAdd: (n: string, c: string) => void; }

function ItemTile({ name, category, onAdd }: ItemTileProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const handlePress = () => {
    scale.value = withSpring(0.92, {}, () => { scale.value = withSpring(1); });
    runOnJS(onAdd)(name, category);
  };
  return (
    <Pressable onPress={handlePress} style={{ width: '31%', marginBottom: 8, marginHorizontal: '1%' }}>
      <Animated.View style={[animStyle, {
        backgroundColor: DS.colors.surfaceHigh, borderRadius: 12, padding: 10,
        borderWidth: 1, borderColor: DS.colors.border, alignItems: 'center',
        minHeight: 80, justifyContent: 'space-between',
      }]}>
        <Svg width={36} height={36} viewBox="0 0 36 36">
          <Rect x="4" y="8" width="28" height="20" rx="2" stroke={DS.colors.primary} strokeWidth="1.2" fill="none" opacity={0.6} />
          <Rect x="8" y="12" width="8" height="12" rx="1" stroke={DS.colors.primary} strokeWidth="0.8" fill="none" opacity={0.4} />
          <Rect x="20" y="14" width="8" height="10" rx="1" stroke={DS.colors.primary} strokeWidth="0.8" fill="none" opacity={0.4} />
        </Svg>
        <Text numberOfLines={2} style={{ fontFamily: 'Inter_400Regular', fontSize: 9, color: DS.colors.primaryDim, textAlign: 'center', marginTop: 4 }}>
          {name}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectFurniture?: (def: FurnitureDef) => void;
}

/** Map a display name to a FurnitureType key from FURNITURE_DEFAULTS (best-effort) */
function nameToFurnitureType(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function FurnitureLibrarySheet({ visible, onClose, onSelectFurniture }: Props) {
  const [selectedCat, setSelectedCat] = useState('seating');
  const [search, setSearch] = useState('');
  const translateY = useSharedValue(SHEET_H);
  const { allowed: commercialAllowed } = useTierGate('commercialBuildings');
  const { allowed: customFurnitureAllowed } = useTierGate('customFurniture');

  const selectedId = useBlueprintStore((s) => s.selectedId);
  const blueprint = useBlueprintStore((s) => s.blueprint);
  const { suggestForRoom } = useRoomAutoComplete(blueprint);

  const selectedRoom = selectedId && blueprint?.rooms ? blueprint.rooms.find((r) => r.id === selectedId) ?? null : null;
  const suggestions: FurnitureSuggestion[] = selectedRoom ? suggestForRoom(selectedRoom.id) : [];

  useEffect(() => {
    translateY.value = visible
      ? withSpring(0, { damping: 22, stiffness: 280 })
      : withTiming(SHEET_H, { duration: 250 });
  }, [visible, translateY]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  const handleAdd = useCallback((name: string, category: string) => {
    // Resolve dimensions from FURNITURE_DEFAULTS; fall back to 1×1×1
    const typeKey = nameToFurnitureType(name);
    const defaults = (FURNITURE_DEFAULTS as Record<string, { w: number; h: number; d: number; color: string; category: string }>)[typeKey];

    const def: FurnitureDef = {
      type: typeKey,
      name,
      category,
      dimensions: {
        width:  defaults?.w ?? 1,
        height: defaults?.h ?? 1,
        depth:  defaults?.d ?? 1,
      },
      defaultColor: defaults?.color ?? '#8A7A6A',
    };

    if (onSelectFurniture) {
      onSelectFurniture(def);
    }
    onClose();
  }, [onSelectFurniture, onClose]);

  const suggestionToDisplayName = (s: FurnitureSuggestion): string | null => {
    const typeMap: Record<string, string> = {
      toilet: 'Toilet', bathroom_sink: 'Vanity Unit', bathtub: 'Freestanding Bath', shower: 'Shower Unit',
      kitchen_sink: 'Kitchen Island', kitchen_counter: 'Kitchen Counter',
      sofa: 'Sofa', armchair: 'Armchair', coffee_table: 'Coffee Table',
      bed_double: 'Bed', king_bed: 'King Bed',
      desk: 'Desk', chair: 'Office Chair',
    };
    return typeMap[s.furnitureType] ?? null;
  };

  const handleSuggestionPress = useCallback((s: FurnitureSuggestion) => {
    const displayName = suggestionToDisplayName(s);
    if (!displayName || !onSelectFurniture) return;
    const typeKey = nameToFurnitureType(displayName);
    const defaults = (FURNITURE_DEFAULTS as Record<string, { w: number; h: number; d: number; color: string; category: string }>)[typeKey];
    const def: FurnitureDef = {
      type: typeKey,
      name: displayName,
      category: 'suggested',
      dimensions: {
        width:  defaults?.w ?? 1,
        height: defaults?.h ?? 1,
        depth:  defaults?.d ?? 1,
      },
      defaultColor: defaults?.color ?? '#8A7A6A',
    };
    onSelectFurniture(def);
    onClose();
  }, [onSelectFurniture, onClose]);

  const cat = CATEGORIES.find((c) => c.id === selectedCat);
  const items = (cat?.items ?? []).filter((i) => !search || i.toLowerCase().includes(search.toLowerCase()));

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <Pressable style={{ flex: 1, backgroundColor: DS.colors.overlay }} onPress={onClose} />
      <Animated.View style={[sheetStyle, {
        position: 'absolute', bottom: 0, left: 0, right: 0, height: SHEET_H,
        backgroundColor: SUNRISE.glass.prominentBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderTopColor: SUNRISE.sheetTopBorder, overflow: 'hidden',
      }]}>
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 6 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: SUNRISE.sheetHandle }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 }}>
          <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 20, color: DS.colors.primary, flex: 1 }}>Furniture Library</Text>
          <Pressable onPress={onClose} style={{ padding: 8 }}><Text style={{ color: DS.colors.primaryDim, fontSize: 18 }}>✕</Text></Pressable>
        </View>
        <View style={{ marginHorizontal: 20, marginBottom: 10 }}>
          <TextInput
            value={search} onChangeText={setSearch}
            placeholder="Search furniture..." placeholderTextColor={DS.colors.primaryGhost}
            style={{ backgroundColor: DS.colors.surfaceHigh, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontFamily: 'Inter_400Regular', fontSize: 14, color: DS.colors.primary, borderWidth: 1, borderColor: DS.colors.border }}
          />
        </View>
        {suggestions.length > 0 && selectedRoom && (
          <View style={{ paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: DS.colors.border, marginBottom: 10 }}>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 10, color: DS.colors.primaryDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Suggested for {selectedRoom.name}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {suggestions.map((s) => {
                const displayName = suggestionToDisplayName(s);
                if (!displayName) return null;
                const iconMap: Record<string, string> = {
                  toilet: '🚽', bathtub: '🛁', bathroom_sink: '🧴', shower: '🚿',
                  kitchen_sink: '🍳', kitchen_counter: '🍽',
                  sofa: '🛋', armchair: '🪑', coffee_table: '🟫',
                  bed_double: '🛏', king_bed: '🛏',
                  desk: '🖥', chair: '🪑',
                };
                return (
                  <Pressable
                    key={s.furnitureType}
                    onPress={() => handleSuggestionPress(s)}
                    style={{
                      backgroundColor: `${DS.colors.success}18`,
                      borderColor: DS.colors.success,
                      borderWidth: 1,
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      alignItems: 'center',
                      minWidth: 80,
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>{iconMap[s.furnitureType] ?? '🪑'}</Text>
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: DS.colors.primary, marginTop: 2 }}>{displayName}</Text>
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 8, color: DS.colors.primaryGhost, marginTop: 1, textAlign: 'center' }} numberOfLines={2}>{s.reason}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <ScrollView style={{ width: 96, borderRightWidth: 1, borderRightColor: DS.colors.border }} showsVerticalScrollIndicator={false}>
            {CATEGORIES.map((c) => (
              <Pressable key={c.id} onPress={() => setSelectedCat(c.id)} style={{ paddingVertical: 11, paddingHorizontal: 8, backgroundColor: selectedCat === c.id ? DS.colors.surfaceHigh : 'transparent', borderRightWidth: selectedCat === c.id ? 2 : 0, borderRightColor: DS.colors.primary }}>
                <Text style={{ fontSize: 15, textAlign: 'center' }}>{c.icon}</Text>
                <Text numberOfLines={2} style={{ fontFamily: 'Inter_400Regular', fontSize: 8, color: selectedCat === c.id ? DS.colors.primary : DS.colors.primaryDim, textAlign: 'center', marginTop: 3 }}>{c.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={{ flex: 1, paddingHorizontal: 8 }}>
            {selectedCat === 'my_style' ? (
              customFurnitureAllowed ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 16, color: DS.colors.primaryDim, textAlign: 'center', marginBottom: 8 }}>Your generated pieces{'\n'}appear here</Text>
                  <Text style={{ fontSize: 32 }}>✦</Text>
                </View>
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, gap: 10 }}>
                  <Text style={{ fontSize: 28 }}>🔒</Text>
                  <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 15, color: DS.colors.primary, textAlign: 'center' }}>Architect Only</Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: DS.colors.primaryGhost, textAlign: 'center' }}>Generate custom furniture pieces with AI on the Architect plan.</Text>
                </View>
              )
            ) : selectedCat === 'structural' && !commercialAllowed ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, gap: 10 }}>
                <Text style={{ fontSize: 28 }}>🔒</Text>
                <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 15, color: DS.colors.primary, textAlign: 'center' }}>Architect Only</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: DS.colors.primaryGhost, textAlign: 'center' }}>Structural elements — columns, beams, fireplaces — require the Architect plan.</Text>
              </View>
            ) : (
              <FlatList
                data={items} keyExtractor={(item) => item} numColumns={3}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => <ItemTile name={item} category={selectedCat} onAdd={handleAdd} />}
                ListEmptyComponent={<View style={{ alignItems: 'center', paddingTop: 40 }}><Text style={{ color: DS.colors.primaryGhost, fontFamily: 'Inter_400Regular' }}>No results</Text></View>}
              />
            )}
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}
