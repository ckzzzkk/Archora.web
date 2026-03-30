import React from 'react';
import { View, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DS } from '../../theme/designSystem';
import { ArchText } from './ArchText';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function ScreenHeader({ title, onBack, rightAction }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        backgroundColor: DS.colors.background,
        paddingTop: insets.top + 8,
        paddingHorizontal: DS.spacing.lg,
        paddingBottom: DS.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Left: back button or spacer */}
      <View style={{ width: 40 }}>
        {onBack != null && (
          <Pressable
            onPress={onBack}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: DS.colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            hitSlop={8}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path
                d="M19 12H5M12 5l-7 7 7 7"
                stroke={DS.colors.primary}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </Pressable>
        )}
      </View>

      {/* Center: title */}
      <ArchText variant="heading" style={{ fontSize: 22, flex: 1, textAlign: 'center' }}>
        {title}
      </ArchText>

      {/* Right: action or spacer */}
      <View style={{ width: 40, alignItems: 'flex-end' }}>
        {rightAction}
      </View>
    </View>
  );
}
