import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, Pressable, ScrollView, TextInput, Modal, FlatList, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS,
} from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';
import { useBlueprintStore } from '../../stores/blueprintStore';
import type { FurniturePiece } from '../../types/blueprint';
import { BASE_COLORS } from '../../theme/colors';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = SCREEN_H * 0.85;

const CATEGORIES = [
  { id: 'my_style', label: 'My Style', icon: '✦', items: [] as string[] },
  { id: 'seating', label: 'Seating', icon: '🛋', items: ['Sofa', 'Armchair', 'Dining Chair', 'Bar Stool', 'Ottoman', 'Bench', 'Recliner', 'Lounge Chair', 'Accent Chair', 'Chaise Lounge', 'Office Chair', 'Bean Bag', 'Swing Chair', 'Garden Chair', 'Hammock'] },
  { id: 'tables', label: 'Tables', icon: '▭', items: ['Dining Table', 'Coffee Table', 'Side Table', 'Console Table', 'Desk', 'Bedside Table', 'Bar Table', 'Outdoor Table', 'Folding Table', 'Round Table', 'Glass Table', 'Extendable Table'] },
  { id: 'bedroom', label: 'Bedroom', icon: '🛏', items: ['Bed', 'Wardrobe', 'Dresser', 'Nightstand', 'Vanity', 'Bed Frame', 'Headboard', 'Storage Bed', 'Bunk Bed', 'Daybed', 'Blanket Box', 'Bedroom Mirror', 'Bedroom Bench'] },
  { id: 'kitchen', label: 'Kitchen', icon: '⊡', items: ['Kitchen Island', 'Cabinet', 'Shelving Unit', 'Pantry', 'Breakfast Bar', 'Kitchen Trolley', 'Wine Rack', 'Spice Rack', 'Kitchen Counter', 'Pot Rack'] },
  { id: 'bathroom', label: 'Bathroom', icon: '⊕', items: ['Vanity Unit', 'Bathroom Cabinet', 'Towel Rail', 'Bath Tub', 'Shower Unit', 'Bathroom Shelf', 'Bathroom Mirror', 'Laundry Basket'] },
  { id: 'lighting', label: 'Lighting', icon: '◎', items: ['Floor Lamp', 'Table Lamp', 'Pendant Light', 'Chandelier', 'Wall Sconce', 'Ceiling Light', 'Strip Light', 'Spotlight', 'Desk Lamp'] },
  { id: 'storage', label: 'Storage', icon: '▤', items: ['Bookshelf', 'Display Cabinet', 'Filing Cabinet', 'Shoe Rack', 'Coat Rack', 'Toy Storage', 'Media Unit', 'Sideboard', 'Hall Table'] },
  { id: 'office', label: 'Office', icon: '⊞', items: ['Office Desk', 'Office Chair', 'Filing Cabinet', 'Bookshelf', 'Monitor Stand', 'Whiteboard', 'Meeting Table', 'Standing Desk'] },
  { id: 'outdoor', label: 'Outdoor', icon: '⌂', items: ['Garden Sofa', 'Sun Lounger', 'Garden Table', 'Planter', 'Garden Bench', 'Parasol', 'Outdoor Rug', 'Fire Pit', 'BBQ'] },
  { id: 'rugs', label: 'Rugs & Flooring', icon: '▭', items: ['Area Rug', 'Runner Rug', 'Round Rug', 'Bath Mat', 'Door Mat'] },
  { id: 'wall_decor', label: 'Wall Decor', icon: '⬚', items: ['Artwork Frame', 'Wall Mirror', 'Wall Shelf', 'Wall Clock', 'Wall Panel', 'Picture Ledge', 'Wall Light'] },
  { id: 'windows', label: 'Windows', icon: '⊟', items: ['Single Window', 'Double Window', 'Bay Window', 'Skylight', 'French Doors', 'Sliding Door', 'Bi-fold Door', 'Sash Window', 'Floor-to-Ceiling Window'] },
  { id: 'doors', label: 'Doors', icon: '▯', items: ['Interior Door', 'Exterior Door', 'Sliding Door', 'Barn Door', 'Glass Door', 'Double Door', 'Arched Door', 'Dutch Door'] },
  { id: 'structural', label: 'Structural', icon: '⌇', items: ['Column', 'Beam', 'Arch', 'Fireplace', 'Room Divider', 'Built-in Shelving', 'Coffered Ceiling', 'Alcove'] },
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
        backgroundColor: BASE_COLORS.surfaceHigh, borderRadius: 12, padding: 10,
        borderWidth: 1, borderColor: BASE_COLORS.border, alignItems: 'center',
        minHeight: 80, justifyContent: 'space-between',
      }]}>
        <Svg width={36} height={36} viewBox="0 0 36 36">
          <Rect x="4" y="8" width="28" height="20" rx="2" stroke={BASE_COLORS.textPrimary} strokeWidth="1.2" fill="none" opacity={0.6} />
          <Rect x="8" y="12" width="8" height="12" rx="1" stroke={BASE_COLORS.textPrimary} strokeWidth="0.8" fill="none" opacity={0.4} />
          <Rect x="20" y="14" width="8" height="10" rx="1" stroke={BASE_COLORS.textPrimary} strokeWidth="0.8" fill="none" opacity={0.4} />
        </Svg>
        <Text numberOfLines={2} style={{ fontFamily: 'Inter_400Regular', fontSize: 9, color: BASE_COLORS.textSecondary, textAlign: 'center', marginTop: 4 }}>
          {name}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

interface Props { visible: boolean; onClose: () => void; }

export function FurnitureLibrarySheet({ visible, onClose }: Props) {
  const [selectedCat, setSelectedCat] = useState('seating');
  const [search, setSearch] = useState('');
  const translateY = useSharedValue(SHEET_H);
  const blueprint = useBlueprintStore((s) => s.blueprint);
  const addFurniture = useBlueprintStore((s) => s.actions.addFurniture);

  useEffect(() => {
    translateY.value = visible
      ? withSpring(0, { damping: 22, stiffness: 280 })
      : withTiming(SHEET_H, { duration: 250 });
  }, [visible, translateY]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  const handleAdd = useCallback((name: string, category: string) => {
    if (!blueprint) return;
    const piece: FurniturePiece = {
      id: `fur_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name, category,
      roomId: blueprint.rooms[0]?.id ?? '',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      dimensions: { x: 1, y: 1, z: 1 },
      procedural: true,
    };
    addFurniture(piece);
    onClose();
  }, [blueprint, addFurniture, onClose]);

  const cat = CATEGORIES.find((c) => c.id === selectedCat);
  const items = (cat?.items ?? []).filter((i) => !search || i.toLowerCase().includes(search.toLowerCase()));

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose} />
      <Animated.View style={[sheetStyle, {
        position: 'absolute', bottom: 0, left: 0, right: 0, height: SHEET_H,
        backgroundColor: BASE_COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden',
      }]}>
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 6 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#444' }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 }}>
          <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 20, color: BASE_COLORS.textPrimary, flex: 1 }}>Furniture Library</Text>
          <Pressable onPress={onClose} style={{ padding: 8 }}><Text style={{ color: BASE_COLORS.textSecondary, fontSize: 18 }}>✕</Text></Pressable>
        </View>
        <View style={{ marginHorizontal: 20, marginBottom: 10 }}>
          <TextInput
            value={search} onChangeText={setSearch}
            placeholder="Search furniture..." placeholderTextColor={BASE_COLORS.textDim}
            style={{ backgroundColor: BASE_COLORS.surfaceHigh, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textPrimary, borderWidth: 1, borderColor: BASE_COLORS.border }}
          />
        </View>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <ScrollView style={{ width: 96, borderRightWidth: 1, borderRightColor: BASE_COLORS.border }} showsVerticalScrollIndicator={false}>
            {CATEGORIES.map((c) => (
              <Pressable key={c.id} onPress={() => setSelectedCat(c.id)} style={{ paddingVertical: 11, paddingHorizontal: 8, backgroundColor: selectedCat === c.id ? BASE_COLORS.surfaceHigh : 'transparent', borderRightWidth: selectedCat === c.id ? 2 : 0, borderRightColor: BASE_COLORS.textPrimary }}>
                <Text style={{ fontSize: 15, textAlign: 'center' }}>{c.icon}</Text>
                <Text numberOfLines={2} style={{ fontFamily: 'Inter_400Regular', fontSize: 8, color: selectedCat === c.id ? BASE_COLORS.textPrimary : BASE_COLORS.textSecondary, textAlign: 'center', marginTop: 3 }}>{c.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={{ flex: 1, paddingHorizontal: 8 }}>
            {selectedCat === 'my_style' ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 16, color: BASE_COLORS.textSecondary, textAlign: 'center', marginBottom: 8 }}>Your generated pieces{'\n'}appear here</Text>
                <Text style={{ fontSize: 32 }}>✦</Text>
              </View>
            ) : (
              <FlatList
                data={items} keyExtractor={(item) => item} numColumns={3}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => <ItemTile name={item} category={selectedCat} onAdd={handleAdd} />}
                ListEmptyComponent={<View style={{ alignItems: 'center', paddingTop: 40 }}><Text style={{ color: BASE_COLORS.textDim, fontFamily: 'Inter_400Regular' }}>No results</Text></View>}
              />
            )}
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}
