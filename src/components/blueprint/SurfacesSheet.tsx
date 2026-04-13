import { DS } from '../../theme/designSystem';
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Modal, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBlueprintStore } from '../../stores/blueprintStore';
import type { WallTexture, MaterialType, CeilingType } from '../../types/blueprint';

const SCREEN_H = Dimensions.get('window').height;

const WALL_TEXTURES: { id: WallTexture; label: string; color: string }[] = [
  { id: 'plain_white', label: 'Plain White', color: '#F5F5F5' },
  { id: 'plain_grey', label: 'Plain Grey', color: '#9A9A9A' },
  { id: 'plain_charcoal', label: 'Charcoal', color: '#3A3A3A' },
  { id: 'exposed_brick', label: 'Exposed Brick', color: '#8B5C3C' },
  { id: 'painted_brick', label: 'Painted Brick', color: '#C4A882' },
  { id: 'concrete', label: 'Concrete', color: '#808080' },
  { id: 'polished_concrete', label: 'Polished Concrete', color: '#A0A0A0' },
  { id: 'marble', label: 'Marble', color: '#E8E0D4' },
  { id: 'stone', label: 'Stone', color: '#8A7E6E' },
  { id: 'render', label: 'Render', color: '#D4C8A8' },
  { id: 'textured_plaster', label: 'Textured Plaster', color: '#C8BEA0' },
  { id: 'wood_panelling', label: 'Wood Panelling', color: '#8B6340' },
  { id: 'shiplap', label: 'Shiplap', color: '#D4C8A8' },
  { id: 'board_and_batten', label: 'Board & Batten', color: '#E0D4B8' },
  { id: 'glass', label: 'Glass', color: '#A8D4E8' },
  { id: 'mirror_panels', label: 'Mirror', color: '#C8D8E0' },
  { id: 'geometric_tiles', label: 'Geometric Tiles', color: '#D4D4D4' },
  { id: 'subway_tiles', label: 'Subway Tiles', color: '#E8E8E8' },
  { id: 'herringbone_tiles', label: 'Herringbone', color: '#C8B89A' },
  { id: 'wallpaper_stripe', label: 'Striped Wallpaper', color: '#D4C0A0' },
  { id: 'wallpaper_geometric', label: 'Geo Wallpaper', color: '#C0B090' },
];

const FLOOR_MATERIALS: { id: MaterialType; label: string; color: string }[] = [
  { id: 'hardwood', label: 'Hardwood', color: '#8B6340' },
  { id: 'oak', label: 'Oak', color: '#C8A464' },
  { id: 'walnut', label: 'Walnut', color: '#5A3820' },
  { id: 'engineered_wood', label: 'Engineered Wood', color: '#A07848' },
  { id: 'laminate', label: 'Laminate', color: '#B89060' },
  { id: 'herringbone_parquet', label: 'Herringbone', color: '#A08050' },
  { id: 'chevron_parquet', label: 'Chevron', color: '#987840' },
  { id: 'polished_concrete', label: 'Polished Concrete', color: '#A0A0A0' },
  { id: 'concrete', label: 'Concrete', color: '#888888' },
  { id: 'marble', label: 'Marble', color: '#E8E0D4' },
  { id: 'travertine', label: 'Travertine', color: '#D4C4A0' },
  { id: 'slate', label: 'Slate', color: '#606870' },
  { id: 'tile', label: 'Ceramic Tile', color: '#D8D0C0' },
  { id: 'terrazzo', label: 'Terrazzo', color: '#C8C0B0' },
  { id: 'carpet', label: 'Carpet', color: '#806858' },
  { id: 'cork', label: 'Cork', color: '#C8A870' },
  { id: 'bamboo', label: 'Bamboo', color: '#C0B880' },
  { id: 'vinyl', label: 'Vinyl', color: '#B0A890' },
  { id: 'resin', label: 'Poured Resin', color: '#90A0B0' },
  { id: 'rubber', label: 'Rubber', color: '#505050' },
];

const CEILING_TYPES: { id: CeilingType; label: string }[] = [
  { id: 'flat_white', label: 'Flat White' },
  { id: 'flat_dark', label: 'Flat Dark' },
  { id: 'coffered', label: 'Coffered' },
  { id: 'tray', label: 'Tray Ceiling' },
  { id: 'vaulted', label: 'Vaulted' },
  { id: 'exposed_beams', label: 'Exposed Beams' },
  { id: 'concrete', label: 'Concrete' },
  { id: 'wood_planks', label: 'Wood Planks' },
  { id: 'acoustic_panels', label: 'Acoustic Panels' },
  { id: 'barrel_vault', label: 'Barrel Vault' },
  { id: 'dropped', label: 'Dropped Ceiling' },
];

type SurfaceTab = 'walls' | 'floors' | 'ceilings';

function Swatch({ color, label, selected, onPress }: { color: string; label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ width: '30%', marginHorizontal: '1.5%', marginBottom: 12, alignItems: 'center' }}>
      <View style={{ width: 52, height: 52, borderRadius: 10, backgroundColor: color, borderWidth: selected ? 2 : 1, borderColor: selected ? DS.colors.primary : '#444', marginBottom: 4 }} />
      <Text numberOfLines={2} style={{ fontFamily: 'Inter_400Regular', fontSize: 9, color: selected ? DS.colors.primary : DS.colors.primaryDim, textAlign: 'center' }}>{label}</Text>
    </Pressable>
  );
}

interface Props { visible: boolean; onClose: () => void; }

export function SurfacesSheet({ visible, onClose }: Props) {
  const [tab, setTab] = useState<SurfaceTab>('walls');
  const insets = useSafeAreaInsets();
  const sheetHeight = Math.min(SCREEN_H * 0.65, 480);
  const translateY = useSharedValue(sheetHeight);

  const blueprint = useBlueprintStore((s) => s.blueprint);
  const selectedId = useBlueprintStore((s) => s.selectedId);
  const actions = useBlueprintStore((s) => s.actions);

  useEffect(() => {
    translateY.value = visible
      ? withSpring(0, { damping: 22, stiffness: 280 })
      : withTiming(sheetHeight, { duration: 250 });
  }, [visible, translateY]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  const selectedRoom = blueprint?.rooms.find((r) => r.id === selectedId);
  const selectedWall = blueprint?.walls.find((w) => w.id === selectedId);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <Pressable style={{ flex: 1, backgroundColor: DS.colors.overlay }} onPress={onClose} />
      <Animated.View style={[sheetStyle, { position: 'absolute', bottom: 0, left: 0, right: 0, height: sheetHeight, backgroundColor: DS.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: DS.colors.border }]}>
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: DS.colors.border }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 }}>
          <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 18, color: DS.colors.primary, flex: 1 }}>Surfaces</Text>
          <Pressable onPress={onClose} style={{ padding: 8 }}><Text style={{ color: DS.colors.primaryDim, fontSize: 18 }}>✕</Text></Pressable>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12, gap: 8 }}>
          {(['walls', 'floors', 'ceilings'] as SurfaceTab[]).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: tab === t ? DS.colors.primary : DS.colors.surfaceHigh, borderWidth: 1, borderColor: tab === t ? DS.colors.primary : DS.colors.border }}>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, textTransform: 'capitalize', color: tab === t ? DS.colors.background : DS.colors.primaryDim }}>{t}</Text>
            </Pressable>
          ))}
        </View>

        <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, paddingBottom: Math.max(20, insets.bottom + 16) }}>
          {tab === 'walls' && WALL_TEXTURES.map((item) => (
            <Swatch key={item.id} color={item.color} label={item.label}
              selected={selectedWall?.texture === item.id}
              onPress={() => {
                const wid = selectedWall?.id ?? blueprint?.walls[0]?.id;
                if (wid) actions.setWallTexture(wid, item.id);
              }}
            />
          ))}
          {tab === 'floors' && FLOOR_MATERIALS.map((item) => (
            <Swatch key={item.id} color={item.color} label={item.label}
              selected={selectedRoom?.floorMaterial === item.id}
              onPress={() => {
                const rid = selectedRoom?.id ?? blueprint?.rooms[0]?.id;
                if (rid) actions.setRoomFloor(rid, item.id);
              }}
            />
          ))}
          {tab === 'ceilings' && CEILING_TYPES.map((item) => (
            <Pressable key={item.id} onPress={() => {
              const rid = selectedRoom?.id ?? blueprint?.rooms[0]?.id;
              if (rid) actions.setRoomCeiling(rid, item.id);
            }} style={{ paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, marginBottom: 8, borderRadius: 16, borderWidth: 1, borderColor: selectedRoom?.ceilingType === item.id ? DS.colors.primary : DS.colors.border, backgroundColor: selectedRoom?.ceilingType === item.id ? DS.colors.primary + '20' : DS.colors.surfaceHigh }}>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: selectedRoom?.ceilingType === item.id ? DS.colors.primary : DS.colors.primaryDim }}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}
