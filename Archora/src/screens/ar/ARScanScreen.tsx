import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { HeaderLogoMark } from '../../components/common/HeaderLogoMark';
import { BASE_COLORS } from '../../theme/colors';

export function ARScanScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 }}>
        <HeaderLogoMark size={32} />
        <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 28, color: BASE_COLORS.textPrimary, marginLeft: 10 }}>
          AR Scan
        </Text>
      </View>
      {/* Content placeholder */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 18, color: colors.textSecondary }}>
          Coming soon
        </Text>
      </View>
    </View>
  );
}
