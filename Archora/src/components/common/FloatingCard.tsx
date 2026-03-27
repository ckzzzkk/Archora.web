import React, { useEffect } from 'react';
import { View, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { DS } from '../../theme/designSystem';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_THRESHOLD = 80;

interface Props {
  children:      React.ReactNode;
  /** Fractional height of screen, e.g. 0.6 */
  heightFraction?: number;
  onDismiss?:    () => void;
  visible?:      boolean;
}

export function FloatingCard({
  children,
  heightFraction = 0.62,
  onDismiss,
  visible = true,
}: Props) {
  const cardHeight = SCREEN_HEIGHT * heightFraction;
  const translateY = useSharedValue(cardHeight);

  useEffect(() => {
    translateY.value = visible
      ? withSpring(0,          { damping: 22, stiffness: 200 })
      : withSpring(cardHeight, { damping: 22, stiffness: 200 });
  }, [visible, cardHeight, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_THRESHOLD) {
        translateY.value = withSpring(cardHeight, { damping: 20, stiffness: 300 }, () => {
          if (onDismiss) runOnJS(onDismiss)();
        });
      } else {
        translateY.value = withSpring(0, { damping: 22, stiffness: 300 });
      }
    });

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Backdrop */}
      <Pressable
        onPress={onDismiss}
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: DS.colors.overlay,
        }}
      />

      {/* Card */}
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            animStyle,
            DS.shadow.large,
            {
              position:            'absolute',
              bottom:              0,
              left:                0,
              right:               0,
              height:              cardHeight,
              backgroundColor:     DS.colors.surface,
              borderTopLeftRadius: DS.radius.modal,
              borderTopRightRadius:DS.radius.modal,
              overflow:            'hidden',
            },
          ]}
        >
          {/* Drag handle */}
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View style={{
              width:           36,
              height:          4,
              borderRadius:    2,
              backgroundColor: DS.colors.border,
            }} />
          </View>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
