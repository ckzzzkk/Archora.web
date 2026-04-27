import { DS } from '../../theme/designSystem';
import React, { useEffect } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Svg, { Path, Line, Rect } from 'react-native-svg';
import type { StaircaseType } from '../../types/blueprint';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SHEET_SPRING = { damping: 22, stiffness: 280 } as const;

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
            backgroundColor: DS.colors.surfaceHigh,
            borderWidth: 1,
            borderColor: DS.colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            marginHorizontal: 6,
          },
        ]}
      >
        <StaircaseIcon type={type} color={DS.colors.primaryDim} />
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 11,
            color: DS.colors.primaryDim,
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
  const translateY = useSharedValue(SCREEN_HEIGHT);

  useEffect(() => {
    translateY.value = withSpring(visible ? 0 : SCREEN_HEIGHT, SHEET_SPRING);
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  return (
    <>
      <Pressable
        style={{ position: 'absolute', inset: 0, backgroundColor: DS.colors.overlay }}
        onPress={onDismiss}
      />
      <Animated.View
        style={[
          animatedStyle,
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          },
        ]}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View
            style={{
              backgroundColor: DS.colors.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 24,
              borderTopWidth: 1,
              borderColor: DS.colors.border,
            }}
          >
            <Text
              style={{
                fontFamily: 'ArchitectsDaughter_400Regular',
                fontSize: 20,
                color: DS.colors.primary,
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
                color: DS.colors.primaryDim,
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
                  backgroundColor: DS.colors.surfaceHigh,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: DS.colors.border,
                }}
              >
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryDim }}>
                  + Add Elevator Shaft
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={onDismiss}
              style={{ alignItems: 'center', paddingVertical: 12 }}
            >
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryGhost }}>
                Skip for now
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Animated.View>
    </>
  );
}
