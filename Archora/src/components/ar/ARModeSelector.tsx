import React from 'react';
import { View, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ArchText } from '../common/ArchText';
import { DS } from '../../theme/designSystem';
import { SUNRISE } from '../../theme/sunrise';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ARMode = 'scan' | 'place' | 'measure';

interface Props {
  current: ARMode;
  onChange: (mode: ARMode) => void;
}

const MODES: { key: ARMode; label: string }[] = [
  { key: 'scan',    label: 'Scan'    },
  { key: 'place',   label: 'Place'   },
  { key: 'measure', label: 'Measure' },
];

function ModeChip({ mode, active, onPress }: { mode: ARMode; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 18,
        paddingVertical: 9,
        borderRadius: 50,
        backgroundColor: active ? SUNRISE.glass.mediumBg : 'rgba(14, 11, 26, 0.70)',
        borderWidth: 1,
        borderColor: active ? SUNRISE.gold : SUNRISE.glass.navBorder,
      }}
    >
      <ArchText variant="body" style={{
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: active ? SUNRISE.gold : SUNRISE.inactiveTint,
      }}>
        {MODES.find(m => m.key === mode)?.label ?? mode}
      </ArchText>
    </Pressable>
  );
}

export function ARModeSelector({ current, onChange }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      position: 'absolute',
      top: insets.top + 56,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 20,
    }}>
      {MODES.map(({ key }) => (
        <ModeChip key={key} mode={key} active={current === key} onPress={() => onChange(key)} />
      ))}
    </View>
  );
}
