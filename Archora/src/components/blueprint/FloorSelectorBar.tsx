import React, { useRef } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTierGate } from '../../hooks/useTierGate';
import { TIER_LIMITS } from '../../utils/tierLimits';
import { useAuthStore } from '../../stores/authStore';
import { BASE_COLORS } from '../../theme/colors';
import type { FloorData } from '../../types/blueprint';

interface Props {
  floors: FloorData[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onCopyFloor: (index: number) => void;
  onDeleteFloor: (index: number) => void;
  onStaircasePrompt: () => void;
}

function FloorPill({
  floor,
  active,
  onPress,
  onLongPress,
}: {
  floor: FloorData;
  active: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={() => {
        scale.value = withSpring(0.9, { damping: 12 }, () => { scale.value = withSpring(1, { damping: 14 }); });
        onPress();
      }}
      onLongPress={onLongPress}
    >
      <Animated.View
        style={[
          animStyle,
          {
            minWidth: 44,
            height: 36,
            borderRadius: 10,
            paddingHorizontal: 12,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 6,
            backgroundColor: active ? BASE_COLORS.textPrimary + '20' : BASE_COLORS.surfaceHigh,
            borderWidth: 1,
            borderColor: active ? BASE_COLORS.textPrimary : BASE_COLORS.border,
          },
        ]}
      >
        <Text
          style={{
            fontFamily: 'JetBrainsMono_400Regular',
            fontSize: 12,
            color: active ? BASE_COLORS.textPrimary : BASE_COLORS.textDim,
          }}
        >
          {floor.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function FloorSelectorBar({
  floors,
  currentIndex,
  onSelect,
  onAdd,
  onCopyFloor,
  onDeleteFloor,
  onStaircasePrompt,
}: Props) {
  const user = useAuthStore((s) => s.user);
  const tier = user?.subscriptionTier ?? 'starter';
  const maxFloors = TIER_LIMITS[tier].maxFloors;
  const canAddFloor = floors.length < maxFloors;

  const [contextFloorIndex, setContextFloorIndex] = React.useState<number | null>(null);

  const handleAddFloor = () => {
    if (!canAddFloor) {
      // Show a toast — the workspace screen handles upgrade nav
      onAdd(); // parent will handle the tier gate check
      return;
    }
    const wasFirstFloor = floors.length === 1;
    onAdd();
    if (wasFirstFloor) {
      onStaircasePrompt();
    }
  };

  return (
    <View
      style={{
        backgroundColor: BASE_COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: BASE_COLORS.border,
        paddingVertical: 8,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center' }}
      >
        <Text
          style={{
            fontFamily: 'JetBrainsMono_400Regular',
            fontSize: 9,
            color: BASE_COLORS.textDim,
            marginRight: 10,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Floor
        </Text>

        {floors.map((floor, i) => (
          <FloorPill
            key={floor.id}
            floor={floor}
            active={i === currentIndex}
            onPress={() => onSelect(i)}
            onLongPress={() => setContextFloorIndex(i)}
          />
        ))}

        {/* Add floor button */}
        <Pressable
          onPress={handleAddFloor}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: BASE_COLORS.surfaceHigh,
            borderWidth: 1,
            borderColor: canAddFloor ? BASE_COLORS.border : BASE_COLORS.border + '60',
            borderStyle: 'dashed',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 16,
              color: canAddFloor ? BASE_COLORS.textSecondary : BASE_COLORS.textDim,
            }}
          >
            {canAddFloor ? '+' : '🔒'}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Floor context menu */}
      {contextFloorIndex !== null && (
        <Pressable
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          onPress={() => setContextFloorIndex(null)}
        >
          <View
            style={{
              position: 'absolute',
              top: 8,
              left: 16 + contextFloorIndex * 58,
              backgroundColor: BASE_COLORS.surfaceHigh,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: BASE_COLORS.border,
              padding: 4,
              zIndex: 100,
              shadowColor: '#000',
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Pressable
              style={{ paddingHorizontal: 16, paddingVertical: 10 }}
              onPress={() => {
                onCopyFloor(contextFloorIndex);
                setContextFloorIndex(null);
              }}
            >
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: BASE_COLORS.textPrimary }}>
                Copy Floor
              </Text>
            </Pressable>
            {floors.length > 1 && (
              <Pressable
                style={{ paddingHorizontal: 16, paddingVertical: 10 }}
                onPress={() => {
                  onDeleteFloor(contextFloorIndex);
                  setContextFloorIndex(null);
                }}
              >
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#E05555' }}>
                  Delete Floor
                </Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      )}
    </View>
  );
}
