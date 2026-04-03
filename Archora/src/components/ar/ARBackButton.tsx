import React from 'react';
import { Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DS } from '../../theme/designSystem';
import { SUNRISE } from '../../theme/sunrise';

interface Props {
  onPress: () => void;
}

export function ARBackButton({ onPress }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      onPress={onPress}
      style={{
        position: 'absolute',
        top: insets.top + 8,
        left: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: SUNRISE.glass.prominentBg,
        borderWidth: 1,
        borderColor: SUNRISE.glass.prominentBorder,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Path d="M19 12H5" stroke={DS.colors.primary} strokeWidth="2" strokeLinecap="round" />
        <Path d="M10 7L5 12L10 17" stroke={DS.colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
    </Pressable>
  );
}
