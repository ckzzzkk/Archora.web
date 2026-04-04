import { DS } from '../../theme/designSystem';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import Animated, { FadeIn, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import type { MaterialType } from '../../types';

const MATERIALS: { type: MaterialType; label: string; color: string; pattern: string }[] = [
  { type: 'hardwood',  label: 'Hardwood',  color: '#8B5E3C', pattern: '▦' },
  { type: 'tile',      label: 'Tile',      color: '#C8C8C8', pattern: '⊞' },
  { type: 'carpet',    label: 'Carpet',    color: '#7A6A8A', pattern: '▩' },
  { type: 'concrete',  label: 'Concrete',  color: '#888888', pattern: '▪' },
  { type: 'marble',    label: 'Marble',    color: '#D8D0C8', pattern: '◈' },
  { type: 'vinyl',     label: 'Vinyl',     color: '#A09080', pattern: '▤' },
  { type: 'stone',     label: 'Stone',     color: '#706860', pattern: '◆' },
  { type: 'parquet',   label: 'Parquet',   color: '#9C6E3C', pattern: '▦' },
];

interface TexturePickerProps {
  value: MaterialType;
  onChange: (material: MaterialType) => void;
  label?: string;
}

export function TexturePicker({ value, onChange, label = 'Floor Material' }: TexturePickerProps) {
  const { colors } = useTheme();
  const { light } = useHaptics();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const selected = MATERIALS.find((m) => m.type === value) ?? MATERIALS[0];

  return (
    <>
      <View style={{ marginBottom: 12 }}>
        <Text
          style={{
            fontFamily: 'JetBrainsMono_400Regular',
            fontSize: 10,
            color: DS.colors.primaryDim,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          {label}
        </Text>

        <TouchableOpacity
          onPress={() => { light(); setOpen(true); }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: DS.colors.surface,
            borderWidth: 1,
            borderColor: DS.colors.border,
            borderRadius: 8,
            padding: 10,
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              backgroundColor: selected.color,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}
          >
            <Text style={{ fontSize: 14, color: DS.colors.background }}>{selected.pattern}</Text>
          </View>
          <Text style={{ flex: 1, color: DS.colors.primary, fontFamily: 'Inter_400Regular', fontSize: 14 }}>
            {selected.label}
          </Text>
          <Text style={{ color: DS.colors.primaryGhost, fontSize: 12 }}>▾</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: DS.colors.overlay }}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        />
        <Animated.View
          entering={SlideInDown.springify().damping(24)}
          exiting={SlideOutDown.duration(200)}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: DS.colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            paddingBottom: Math.max(40, insets.bottom + 20),
          }}
        >
          <Text
            style={{
              fontFamily: 'ArchitectsDaughter_400Regular',
              fontSize: 18,
              color: DS.colors.primary,
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            Choose Material
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {MATERIALS.map((mat) => {
              const isActive = mat.type === value;
              return (
                <TouchableOpacity
                  key={mat.type}
                  onPress={() => { light(); onChange(mat.type); setOpen(false); }}
                  style={{
                    width: '22%',
                    alignItems: 'center',
                    padding: 8,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: isActive ? colors.primary : DS.colors.border,
                    backgroundColor: isActive ? colors.primary + '15' : DS.colors.surfaceHigh,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      backgroundColor: mat.color,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <Text style={{ fontSize: 20, color: DS.colors.background }}>{mat.pattern}</Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: 'Inter_400Regular',
                      fontSize: 10,
                      color: isActive ? colors.primary : DS.colors.primaryDim,
                      textAlign: 'center',
                    }}
                  >
                    {mat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Modal>
    </>
  );
}
