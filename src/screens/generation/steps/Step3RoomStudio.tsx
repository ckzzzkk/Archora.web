import React, { useState } from 'react';
import {
  View, ScrollView, Modal, Pressable, TextInput,
  Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DS } from '../../../theme/designSystem';
import { ArchText } from '../../../components/common/ArchText';
import { useHaptics } from '../../../hooks/useHaptics';
import { HOUSE_ARCHETYPES } from '../../../data/houseArchetypes';

const { width: SCREEN_W } = Dimensions.get('window');

/** Size presets for each room type */
const SIZE_PRESETS: Record<string, Array<{ label: string; width: number; depth: number }>> = {
  bedroom: [
    { label: 'Small', width: 2.4, depth: 3.0 },
    { label: 'Medium', width: 3.0, depth: 3.5 },
    { label: 'Large', width: 4.0, depth: 4.5 },
  ],
  bathroom: [
    { label: 'Small', width: 1.5, depth: 2.2 },
    { label: 'Medium', width: 2.0, depth: 2.5 },
    { label: 'Large', width: 2.5, depth: 3.0 },
  ],
  living_room: [
    { label: 'Small', width: 3.5, depth: 4.0 },
    { label: 'Medium', width: 5.0, depth: 5.0 },
    { label: 'Large', width: 6.0, depth: 7.0 },
  ],
  kitchen: [
    { label: 'Small', width: 2.4, depth: 3.0 },
    { label: 'Medium', width: 3.0, depth: 4.0 },
    { label: 'Large', width: 4.0, depth: 5.0 },
  ],
  dining_room: [
    { label: 'Small', width: 2.8, depth: 3.0 },
    { label: 'Medium', width: 3.5, depth: 4.0 },
    { label: 'Large', width: 4.0, depth: 5.0 },
  ],
  office: [
    { label: 'Small', width: 2.1, depth: 2.5 },
    { label: 'Medium', width: 3.0, depth: 3.0 },
    { label: 'Large', width: 4.0, depth: 4.0 },
  ],
  garage: [
    { label: 'Small', width: 3.0, depth: 5.0 },
    { label: 'Medium', width: 3.5, depth: 6.0 },
    { label: 'Large', width: 6.0, depth: 6.0 },
  ],
  laundry: [
    { label: 'Small', width: 1.5, depth: 2.0 },
    { label: 'Medium', width: 2.0, depth: 2.5 },
    { label: 'Large', width: 2.5, depth: 3.0 },
  ],
};

type SizePreset = 'small' | 'medium' | 'large' | 'custom';
type LayoutStyle = 'traditional' | 'open_plan' | 'mixed';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Initial room sizes (roomType → dimensions) */
  roomSizes: Record<string, { width: number; depth: number }>;
  /** Layout style hint */
  layoutStyle: LayoutStyle | null;
  /** Selected archetype ID */
  archetypeId: string | null;
  /** Callback when room sizes change */
  onRoomSizesChange: (sizes: Record<string, { width: number; depth: number }>) => void;
  /** Callback when layout style changes */
  onLayoutStyleChange: (style: LayoutStyle) => void;
  /** Callback when archetype changes */
  onArchetypeChange: (id: string | null) => void;
}

function SizeChip({
  label, selected, onPress,
}: { label: string; selected: boolean; onPress: () => void }) {
  const { light } = useHaptics();
  return (
    <Pressable
      onPress={() => { light(); onPress(); }}
      style={{
        paddingHorizontal: 14, paddingVertical: 6,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: selected ? DS.colors.primary : DS.colors.border,
        backgroundColor: selected ? `${DS.colors.primary}20` : 'transparent',
      }}
    >
      <ArchText variant="body"
        style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryDim }}
      >
        {label}
      </ArchText>
    </Pressable>
  );
}

function RoomSizeRow({
  roomLabel,
  type,
  size,
  onChange,
}: {
  roomLabel: string;
  type: string;
  size: { width: number; depth: number };
  onChange: (s: { width: number; depth: number }) => void;
}) {
  const presets = SIZE_PRESETS[type] ?? SIZE_PRESETS['bedroom'];
  const currentArea = size.width * size.depth;

  function matchPreset(): SizePreset {
    for (const p of presets) {
      if (Math.abs(p.width - size.width) < 0.05 && Math.abs(p.depth - size.depth) < 0.05) {
        return p.label.toLowerCase() as SizePreset;
      }
    }
    return 'custom';
  }

  const [active, setActive] = useState<SizePreset>(matchPreset());

  function applyPreset(p: SizePreset) {
    setActive(p);
    if (p === 'custom') return;
    const preset = presets.find(x => x.label.toLowerCase() === p);
    if (preset) onChange({ width: preset.width, depth: preset.depth });
  }

  return (
    <View style={{ marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <ArchText variant="body"
          style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: DS.colors.primary }}
        >
          {roomLabel}
        </ArchText>
        <ArchText variant="body"
          style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 12, color: DS.colors.primaryGhost }}
        >
          {size.width.toFixed(1)} × {size.depth.toFixed(1)}m = {currentArea.toFixed(1)}m²
        </ArchText>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {(['small', 'medium', 'large'] as SizePreset[]).map(p => (
          <SizeChip
            key={p}
            label={p.charAt(0).toUpperCase() + p.slice(1)}
            selected={active === p}
            onPress={() => applyPreset(p)}
          />
        ))}
        <Pressable
          onPress={() => applyPreset('custom')}
          style={{
            paddingHorizontal: 14, paddingVertical: 6,
            borderRadius: 50,
            borderWidth: 1,
            borderColor: active === 'custom' ? DS.colors.primary : DS.colors.border,
            backgroundColor: active === 'custom' ? `${DS.colors.primary}20` : 'transparent',
          }}
        >
          <ArchText variant="body"
            style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryDim }}
          >
            Custom
          </ArchText>
        </Pressable>
      </View>

      {active === 'custom' && (
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
          <View style={{ flex: 1 }}>
            <ArchText variant="body" style={{ fontSize: 11, color: DS.colors.primaryGhost, marginBottom: 4 }}>Width (m)</ArchText>
            <TextInput
              value={String(size.width)}
              onChangeText={t => {
                const w = parseFloat(t) || 0;
                onChange({ width: w, depth: size.depth });
              }}
              keyboardType="decimal-pad"
              style={{
                backgroundColor: DS.colors.surface, borderRadius: 50,
                paddingHorizontal: 14, paddingVertical: 8,
                fontFamily: 'JetBrainsMono_400Regular', fontSize: 14,
                color: DS.colors.primary, borderWidth: 1, borderColor: DS.colors.border,
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <ArchText variant="body" style={{ fontSize: 11, color: DS.colors.primaryGhost, marginBottom: 4 }}>Depth (m)</ArchText>
            <TextInput
              value={String(size.depth)}
              onChangeText={t => {
                const d = parseFloat(t) || 0;
                onChange({ width: size.width, depth: d });
              }}
              keyboardType="decimal-pad"
              style={{
                backgroundColor: DS.colors.surface, borderRadius: 50,
                paddingHorizontal: 14, paddingVertical: 8,
                fontFamily: 'JetBrainsMono_400Regular', fontSize: 14,
                color: DS.colors.primary, borderWidth: 1, borderColor: DS.colors.border,
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
}

function LayoutStyleSelector({
  value, onChange,
}: { value: LayoutStyle; onChange: (s: LayoutStyle) => void }) {
  const { light } = useHaptics();
  const options: Array<{ value: LayoutStyle; label: string; desc: string }> = [
    { value: 'traditional', label: 'Traditional', desc: 'Separate rooms, hallways' },
    { value: 'open_plan', label: 'Open Plan', desc: 'Open living, kitchen, dining' },
    { value: 'mixed', label: 'Mixed', desc: 'Best of both worlds' },
  ];
  return (
    <View style={{ marginBottom: 24 }}>
      <ArchText variant="body"
        style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: DS.colors.primary, marginBottom: 12 }}
      >
        Layout Feel
      </ArchText>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {options.map(o => (
          <Pressable
            key={o.value}
            onPress={() => { light(); onChange(o.value); }}
            style={{
              flex: 1,
              paddingVertical: 12, paddingHorizontal: 10,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: value === o.value ? DS.colors.primary : DS.colors.border,
              backgroundColor: value === o.value ? `${DS.colors.primary}12` : 'transparent',
            }}
          >
            <ArchText variant="body"
              style={{
                fontFamily: 'Inter_600SemiBold', fontSize: 12,
                color: value === o.value ? DS.colors.primary : DS.colors.primaryDim,
                marginBottom: 2,
              }}
            >
              {o.label}
            </ArchText>
            <ArchText variant="body"
              style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: DS.colors.primaryGhost }}
            >
              {o.desc}
            </ArchText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function Step3RoomStudio(props: Props) {
  const insets = useSafeAreaInsets();
  const { medium } = useHaptics();

  // Local state for room sizes, synced to props
  const [roomSizes, setRoomSizes] = useState<Record<string, { width: number; depth: number }>>(props.roomSizes);
  const [layoutStyle, setLayoutStyle] = useState<LayoutStyle>(props.layoutStyle ?? 'mixed');
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(props.archetypeId);

  const archetypes = HOUSE_ARCHETYPES;

  function handleApply() {
    props.onRoomSizesChange(roomSizes);
    props.onLayoutStyleChange(layoutStyle);
    props.onArchetypeChange(selectedArchetype);
    props.onClose();
  }

  function handleArchetypeSelect(id: string) {
    setSelectedArchetype(id);
    const arch = archetypes.find(a => a.id === id);
    if (!arch) return;
    // Apply archetype's typical room sizes
    setRoomSizes(prev => ({ ...prev, ...arch.typicalRoomSizes }));
    setLayoutStyle(arch.layoutStyle);
  }

  // Filter archetypes by floor count and show variety
  const featuredArchetypes = archetypes.filter(a =>
    ['3bed-semi', '3bed-contemporary-open', '4bed-detached-executive', '2bed-bungalow', '4bed-detached-executive', 'narrow-4bed-townhouse', '3bed-townhouse', '5bed-detached-mansion'].includes(a.id)
  );

  return (
    <Modal visible={props.visible} animationType="none" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={props.onClose} />

        <Animated.View
          entering={SlideInDown.springify().damping(22).stiffness(280)}
          style={{
            backgroundColor: DS.colors.surfaceHigh,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: SCREEN_W * 1.6,
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            {/* Drag handle */}
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: DS.colors.border }} />
            </View>

            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 }}>
              <View>
                <ArchText variant="body"
                  style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 20, color: DS.colors.primary }}
                >
                  Room Studio
                </ArchText>
                <ArchText variant="body"
                  style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: DS.colors.primaryGhost }}
                >
                  Pro / Architect
                </ArchText>
              </View>
              <Pressable
                onPress={props.onClose}
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: DS.colors.surface, alignItems: 'center', justifyContent: 'center' }}
              >
                <ArchText variant="body" style={{ color: DS.colors.primary, fontSize: 18 }}>✕</ArchText>
              </Pressable>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 20 }}
              showsVerticalScrollIndicator={false}
            >
              {/* ─── Bedroom presets ─── */}
              <ArchText variant="body"
                style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: DS.colors.primary, marginBottom: 12, marginTop: 8 }}
              >
                Bedroom Presets
              </ArchText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[
                    { label: 'Studio', beds: 0 },
                    { label: '1 Bed', beds: 1 },
                    { label: '2 Bed', beds: 2 },
                    { label: '3 Bed', beds: 3 },
                    { label: '4 Bed', beds: 4 },
                    { label: '5 Bed', beds: 5 },
                  ].map(p => (
                    <Pressable
                      key={p.label}
                      onPress={() => {
                        medium();
                        // Select a matching archetype if available
                        const match = archetypes.find(a => a.bedrooms === p.beds && a.id === selectedArchetype);
                        if (!match) {
                          const alt = archetypes.find(a => a.bedrooms === p.beds);
                          if (alt) handleArchetypeSelect(alt.id);
                        }
                      }}
                      style={{
                        paddingHorizontal: 16, paddingVertical: 10,
                        borderRadius: 50,
                        backgroundColor: DS.colors.surface,
                        borderWidth: 1, borderColor: DS.colors.border,
                      }}
                    >
                      <ArchText variant="body"
                        style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryDim }}
                      >
                        {p.label}
                      </ArchText>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              {/* ─── Reference Archetypes ─── */}
              <ArchText variant="body"
                style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: DS.colors.primary, marginBottom: 10 }}
              >
                Reference Layouts
              </ArchText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {featuredArchetypes.map(arch => (
                    <Pressable
                      key={arch.id}
                      onPress={() => { medium(); handleArchetypeSelect(arch.id); }}
                      style={{
                        width: 140,
                        paddingVertical: 12, paddingHorizontal: 12,
                        borderRadius: 16,
                        backgroundColor: selectedArchetype === arch.id ? `${DS.colors.primary}15` : DS.colors.surface,
                        borderWidth: 1.5,
                        borderColor: selectedArchetype === arch.id ? DS.colors.primary : DS.colors.border,
                      }}
                    >
                      {/* Mini floor plan preview */}
                      <View style={{
                        width: '100%', height: 60,
                        backgroundColor: `${DS.colors.primary}10`,
                        borderRadius: 8, marginBottom: 8,
                        overflow: 'hidden',
                      }}>
                        <View style={{ position: 'absolute', inset: 4 }}>
                          {/* Approximate zone visualization */}
                          <View style={{
                            position: 'absolute',
                            left: `${(arch.zones.find(z => z.type === 'hallway')?.x ?? 0) * 100}%`,
                            top: `${(arch.zones.find(z => z.type === 'hallway')?.y ?? 0) * 100}%`,
                            width: `${(arch.zones.find(z => z.type === 'hallway')?.w ?? 0.1) * 100}%`,
                            height: `${(arch.zones.find(z => z.type === 'hallway')?.h ?? 0.1) * 100}%`,
                            backgroundColor: `${DS.colors.primary}30`,
                            borderRadius: 2,
                          }} />
                          <View style={{
                            position: 'absolute',
                            left: `${(arch.zones.find(z => z.type === 'living_room')?.x ?? 0) * 100}%`,
                            top: `${(arch.zones.find(z => z.type === 'living_room')?.y ?? 0) * 100}%`,
                            width: `${(arch.zones.find(z => z.type === 'living_room')?.w ?? 0.3) * 100}%`,
                            height: `${(arch.zones.find(z => z.type === 'living_room')?.h ?? 0.3) * 100}%`,
                            backgroundColor: `${DS.colors.primary}60`,
                            borderRadius: 2,
                          }} />
                          <View style={{
                            position: 'absolute',
                            left: `${(arch.zones.find(z => z.type === 'bedroom')?.x ?? 0.5) * 100}%`,
                            top: `${(arch.zones.find(z => z.type === 'bedroom')?.y ?? 0.5) * 100}%`,
                            width: `${(arch.zones.find(z => z.type === 'bedroom')?.w ?? 0.2) * 100}%`,
                            height: `${(arch.zones.find(z => z.type === 'bedroom')?.h ?? 0.3) * 100}%`,
                            backgroundColor: DS.colors.primary,
                            borderRadius: 2, opacity: 0.8,
                          }} />
                        </View>
                      </View>
                      <ArchText variant="body"
                        style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: DS.colors.primary, marginBottom: 2 }}
                        numberOfLines={1}
                      >
                        {arch.name}
                      </ArchText>
                      <ArchText variant="body"
                        style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: DS.colors.primaryGhost }}
                        numberOfLines={2}
                      >
                        {arch.description.slice(0, 60)}...
                      </ArchText>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              {/* ─── Layout Style ─── */}
              <LayoutStyleSelector value={layoutStyle} onChange={setLayoutStyle} />

              {/* ─── Room Sizes ─── */}
              <ArchText variant="body"
                style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: DS.colors.primary, marginBottom: 14 }}
              >
                Room Sizes
              </ArchText>

              {(['bedroom', 'bathroom', 'living_room', 'kitchen', 'dining_room', 'office', 'garage', 'laundry'] as const).map(type => {
                const defaults = SIZE_PRESETS[type]?.[1] ?? { width: 3, depth: 3 };
                const current = roomSizes[type] ?? defaults;
                const labels: Record<string, string> = {
                  bedroom: 'Bedroom', bathroom: 'Bathroom', living_room: 'Living Room',
                  kitchen: 'Kitchen', dining_room: 'Dining Room', office: 'Office',
                  garage: 'Garage', laundry: 'Laundry',
                };
                return (
                  <RoomSizeRow
                    key={type}
                    roomLabel={labels[type]}
                    type={type}
                    size={current}
                    onChange={s => setRoomSizes(prev => ({ ...prev, [type]: s }))}
                  />
                );
              })}

              {/* Apply button */}
              <Pressable
                onPress={handleApply}
                style={{
                  backgroundColor: DS.colors.primary,
                  borderRadius: 50,
                  paddingVertical: 16,
                  alignItems: 'center',
                  marginTop: 8,
                }}
              >
                <ArchText variant="body"
                  style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: DS.colors.background }}
                >
                  Apply to Brief
                </ArchText>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}
