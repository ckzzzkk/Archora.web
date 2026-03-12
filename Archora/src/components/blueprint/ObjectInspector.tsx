import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { BASE_COLORS } from '../../theme/colors';
import type { Wall, Room, FurniturePiece } from '../../types';

export function ObjectInspector() {
  const blueprint = useBlueprintStore((s) => s.blueprint);
  const selectedId = useBlueprintStore((s) => s.selectedId);
  const actions = useBlueprintStore((s) => s.actions);
  const { colors } = useTheme();
  const { light } = useHaptics();

  const translateY = useSharedValue(200);
  const panY = useSharedValue(0);
  const savedPanY = useSharedValue(0);

  React.useEffect(() => {
    translateY.value = withSpring(selectedId ? 0 : 200, { damping: 18, stiffness: 180 });
  }, [selectedId]);

  const panGesture = Gesture.Pan()
    .onStart(() => { savedPanY.value = panY.value; })
    .onUpdate((e) => { panY.value = Math.max(0, e.translationY); })
    .onEnd((e) => {
      if (e.translationY > 80) {
        actions.setSelectedId(null);
      }
      panY.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value + panY.value }],
  }));

  if (!selectedId || !blueprint) return null;

  const wall = blueprint.walls.find((w) => w.id === selectedId);
  const room = blueprint.rooms.find((r) => r.id === selectedId);
  const furniture = blueprint.furniture.find((f) => f.id === selectedId);

  const handleDelete = () => {
    light();
    if (wall) actions.deleteWall(selectedId);
    if (room) actions.deleteRoom(selectedId);
    if (furniture) actions.deleteFurniture(selectedId);
  };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[
        animatedStyle,
        {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: BASE_COLORS.surfaceHigh,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderTopWidth: 1,
          borderTopColor: BASE_COLORS.border,
          padding: 20,
          paddingBottom: 40,
          minHeight: 200,
        },
      ]}>
        {/* Drag handle */}
        <View style={{ width: 36, height: 4, backgroundColor: BASE_COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />

        {/* Object name */}
        <View style={{
          backgroundColor: colors.primary,
          alignSelf: 'flex-start',
          paddingHorizontal: 12,
          paddingVertical: 4,
          borderRadius: 4,
          marginBottom: 16,
        }}>
          <Text style={{
            fontFamily: 'JetBrainsMono_400Regular',
            fontSize: 11,
            color: BASE_COLORS.background,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            {wall ? 'Wall' : room ? 'Room' : 'Furniture'}
          </Text>
        </View>

        {wall && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 20, color: BASE_COLORS.textPrimary }}>
              Wall
            </Text>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: BASE_COLORS.textDim, marginBottom: 4 }}>START X</Text>
                <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 14, color: BASE_COLORS.textPrimary }}>{wall.start.x.toFixed(2)}m</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: BASE_COLORS.textDim, marginBottom: 4 }}>START Y</Text>
                <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 14, color: BASE_COLORS.textPrimary }}>{wall.start.y.toFixed(2)}m</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: BASE_COLORS.textDim, marginBottom: 4 }}>HEIGHT</Text>
                <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 14, color: BASE_COLORS.textPrimary }}>{wall.height.toFixed(1)}m</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: BASE_COLORS.textDim, marginBottom: 4 }}>THICKNESS</Text>
                <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 14, color: BASE_COLORS.textPrimary }}>{wall.thickness.toFixed(2)}m</Text>
              </View>
            </View>
          </View>
        )}

        {room && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 20, color: BASE_COLORS.textPrimary }}>
              {room.name}
            </Text>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: BASE_COLORS.textDim, marginBottom: 4 }}>AREA</Text>
                <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 14, color: BASE_COLORS.textPrimary }}>{room.area.toFixed(1)}m²</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: BASE_COLORS.textDim, marginBottom: 4 }}>CEILING</Text>
                <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 14, color: BASE_COLORS.textPrimary }}>{room.ceilingHeight.toFixed(1)}m</Text>
              </View>
            </View>
            <View>
              <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: BASE_COLORS.textDim, marginBottom: 4 }}>FLOOR MATERIAL</Text>
              <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 14, color: BASE_COLORS.textPrimary, textTransform: 'capitalize' }}>{room.floorMaterial.replace(/_/g, ' ')}</Text>
            </View>
          </View>
        )}

        {furniture && (
          <View style={{ gap: 12 }}>
            <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 20, color: BASE_COLORS.textPrimary }}>
              {furniture.name}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {(['x', 'y', 'z'] as const).map((axis) => (
                <View key={axis} style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, color: BASE_COLORS.textDim, marginBottom: 4 }}>
                    {axis.toUpperCase()} DIM
                  </Text>
                  <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 14, color: BASE_COLORS.textPrimary }}>
                    {furniture.dimensions[axis].toFixed(2)}m
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Delete */}
        <Pressable
          onPress={handleDelete}
          style={{
            marginTop: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: `${BASE_COLORS.error}15`,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: `${BASE_COLORS.error}40`,
          }}
        >
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: BASE_COLORS.error }}>
            Delete Object
          </Text>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}
