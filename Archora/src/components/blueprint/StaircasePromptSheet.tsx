import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Svg, { Path, Line, Rect } from 'react-native-svg';
import { BASE_COLORS } from '../../theme/colors';
import type { StaircaseType } from '../../types/blueprint';

interface Props {
  visible: boolean;
  floorCount: number;
  onSelect: (type: StaircaseType) => void;
  onAddElevator: () => void;
  onDismiss: () => void;
}

function StaircaseIcon({ type, color }: { type: StaircaseType; color: string }) {
  if (type === 'straight') {
    return (
      <Svg width={48} height={48} viewBox="0 0 48 48">
        <Rect x="4" y="36" width="10" height="8" stroke={color} strokeWidth="1.5" fill="none" />
        <Rect x="14" y="28" width="10" height="16" stroke={color} strokeWidth="1.5" fill="none" />
        <Rect x="24" y="20" width="10" height="24" stroke={color} strokeWidth="1.5" fill="none" />
        <Rect x="34" y="12" width="10" height="32" stroke={color} strokeWidth="1.5" fill="none" />
        <Line x1="4" y1="36" x2="44" y2="12" stroke={color} strokeWidth="1" strokeDasharray="2 2" opacity={0.5} />
      </Svg>
    );
  }
  if (type === 'l_shape') {
    return (
      <Svg width={48} height={48} viewBox="0 0 48 48">
        <Rect x="4" y="28" width="8" height="8" stroke={color} strokeWidth="1.5" fill="none" />
        <Rect x="12" y="28" width="8" height="12" stroke={color} strokeWidth="1.5" fill="none" />
        <Rect x="20" y="20" width="8" height="20" stroke={color} strokeWidth="1.5" fill="none" />
        <Rect x="20" y="12" width="24" height="8" stroke={color} strokeWidth="1.5" fill="none" />
        <Rect x="28" y="4" width="16" height="8" stroke={color} strokeWidth="1.5" fill="none" />
      </Svg>
    );
  }
  // spiral
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48">
      <Path
        d="M 24 24 m -14 0 a 14 14 0 1 1 28 0 a 10 10 0 1 1 -20 0 a 6 6 0 1 1 12 0"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
      <Path d="M 10 24 L 14 20 L 14 28 Z" fill={color} opacity={0.7} />
    </Svg>
  );
}

function OptionCard({
  type,
  label,
  onPress,
}: {
  type: StaircaseType;
  label: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={() => {
        scale.value = withSpring(0.92, { damping: 12 }, () => { scale.value = withSpring(1, { damping: 14 }); });
        onPress();
      }}
    >
      <Animated.View
        style={[
          animStyle,
          {
            width: 90,
            height: 110,
            borderRadius: 14,
            backgroundColor: BASE_COLORS.surfaceHigh,
            borderWidth: 1,
            borderColor: BASE_COLORS.border,
            alignItems: 'center',
            justifyContent: 'center',
            marginHorizontal: 6,
          },
        ]}
      >
        <StaircaseIcon type={type} color={BASE_COLORS.textSecondary} />
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 11,
            color: BASE_COLORS.textSecondary,
            marginTop: 8,
            textAlign: 'center',
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function StaircasePromptSheet({ visible, floorCount, onSelect, onAddElevator, onDismiss }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        onPress={onDismiss}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View
            style={{
              backgroundColor: BASE_COLORS.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 24,
              borderTopWidth: 1,
              borderColor: BASE_COLORS.border,
            }}
          >
            <Text
              style={{
                fontFamily: 'ArchitectsDaughter_400Regular',
                fontSize: 20,
                color: BASE_COLORS.textPrimary,
                textAlign: 'center',
                marginBottom: 6,
              }}
            >
              Add a Staircase?
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 13,
                color: BASE_COLORS.textSecondary,
                textAlign: 'center',
                marginBottom: 24,
              }}
            >
              Connect your new floor to the one below
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 20 }}>
              <OptionCard type="straight" label="Straight" onPress={() => onSelect('straight')} />
              <OptionCard type="l_shape" label="L-Shape" onPress={() => onSelect('l_shape')} />
              <OptionCard type="spiral" label="Spiral" onPress={() => onSelect('spiral')} />
            </View>

            {floorCount >= 3 && (
              <Pressable
                onPress={onAddElevator}
                style={{
                  backgroundColor: BASE_COLORS.surfaceHigh,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: BASE_COLORS.border,
                }}
              >
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: BASE_COLORS.textSecondary }}>
                  + Add Elevator Shaft
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={onDismiss}
              style={{ alignItems: 'center', paddingVertical: 12 }}
            >
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: BASE_COLORS.textDim }}>
                Skip for now
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
