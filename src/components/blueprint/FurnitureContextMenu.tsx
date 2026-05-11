import { DS } from '../../theme/designSystem';
import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import type { FurniturePiece } from '../../types/blueprint';

interface Props {
  visible: boolean;
  position: { x: number; y: number };
  item: FurniturePiece | null;
  onCopy: () => void;
  onCut: () => void;
  onDelete: () => void;
  onProperties: () => void;
  onClose: () => void;
}

const MENU_ITEMS = [
  { id: 'copy',       label: 'Copy',       icon: '⧉' },
  { id: 'cut',        label: 'Cut',        icon: '✂' },
  { id: 'delete',     label: 'Delete',     icon: '✕', danger: true },
  { id: 'properties', label: 'Properties', icon: 'ℹ' },
] as const;

export function FurnitureContextMenu({ visible, position, item, onCopy, onCut, onDelete, onProperties, onClose }: Props) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 120 });
      scale.value = withSpring(1, { damping: 14, stiffness: 200 });
    } else {
      opacity.value = withTiming(0, { duration: 100 });
      scale.value = withTiming(0.85, { duration: 100 });
    }
  }, [visible, opacity, scale]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible || !item) return null;
  const { name, id } = item;

  const handlers: Record<string, () => void> = {
    copy: onCopy,
    cut: onCut,
    delete: onDelete,
    properties: onProperties,
  };

  return (
    <>
      {/* Dismiss overlay */}
      <Pressable
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        onPress={onClose}
      />

      <Animated.View
        style={[
          animStyle,
          {
            position: 'absolute',
            left: Math.min(position.x, 280),
            top: Math.max(position.y - 180, 10),
            backgroundColor: DS.colors.surfaceHigh,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: DS.colors.border,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOpacity: 0.4,
            shadowRadius: 10,
            elevation: 10,
            minWidth: 160,
            zIndex: 200,
          },
        ]}
      >
        <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: DS.colors.border }}>
          <Text style={{ fontFamily: DS.font.medium, fontSize: 12, color: DS.colors.primaryDim }} numberOfLines={1}>
            {name}
          </Text>
        </View>

        {MENU_ITEMS.map((menuItem) => (
          <Pressable
            key={menuItem.id}
            onPress={() => {
              handlers[menuItem.id]?.();
              onClose();
            }}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              paddingVertical: 11,
              gap: 10,
              backgroundColor: pressed ? DS.colors.primary + '10' : 'transparent',
            })}
          >
            <Text style={{ fontSize: 14, color: 'danger' in menuItem && menuItem.danger ? '#E05555' : DS.colors.primaryDim, width: 18 }}>
              {menuItem.icon}
            </Text>
            <Text style={{ fontFamily: DS.font.regular, fontSize: 14, color: 'danger' in menuItem && menuItem.danger ? '#E05555' : DS.colors.primary }}>
              {menuItem.label}
            </Text>
          </Pressable>
        ))}
      </Animated.View>
    </>
  );
}
