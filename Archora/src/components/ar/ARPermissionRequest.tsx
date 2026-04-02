import React from 'react';
import { View, Pressable } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { ArchText } from '../common/ArchText';
import { DS } from '../../theme/designSystem';

interface Props {
  onRequest: () => void;
}

function CameraIllustration() {
  return (
    <Svg width={120} height={120} viewBox="0 0 120 120">
      <Rect x="10" y="30" width="100" height="70" rx="4" stroke={DS.colors.border} strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
      <Line x1="10" y1="85" x2="110" y2="85" stroke={DS.colors.border} strokeWidth="1" />
      <Rect x="40" y="48" width="40" height="28" rx="5" stroke={DS.colors.primary} strokeWidth="2" fill="none" />
      <Circle cx="60" cy="62" r="8" stroke={DS.colors.primary} strokeWidth="2" fill="none" />
      <Circle cx="60" cy="62" r="3" stroke={DS.colors.primary} strokeWidth="1.5" fill="none" />
      <Rect x="52" y="44" width="16" height="6" rx="3" stroke={DS.colors.primary} strokeWidth="1.5" fill="none" />
      <Line x1="20" y1="62" x2="38" y2="62" stroke={DS.colors.primaryDim} strokeWidth="1" strokeDasharray="2 2" />
      <Line x1="82" y1="62" x2="100" y2="62" stroke={DS.colors.primaryDim} strokeWidth="1" strokeDasharray="2 2" />
      <Path d="M10 50 L10 30 L30 30" stroke={DS.colors.primary} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Path d="M90 30 L110 30 L110 50" stroke={DS.colors.primary} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Path d="M10 80 L10 100 L30 100" stroke={DS.colors.primary} strokeWidth="2" fill="none" strokeLinecap="round" />
      <Path d="M90 100 L110 100 L110 80" stroke={DS.colors.primary} strokeWidth="2" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function ARPermissionRequest({ onRequest }: Props) {
  return (
    <View style={{ flex: 1, backgroundColor: DS.colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <CameraIllustration />
      <ArchText variant="body" style={{
        fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 26,
        color: DS.colors.primary, textAlign: 'center', marginTop: 28, marginBottom: 12,
      }}>
        Camera Access
      </ArchText>
      <ArchText variant="body" style={{
        fontFamily: 'Inter_400Regular', fontSize: 15, color: DS.colors.primaryDim,
        textAlign: 'center', lineHeight: 24, marginBottom: 12,
      }}>
        ASORIA needs your camera to scan rooms, place furniture in your space, and measure distances.
      </ArchText>
      <ArchText variant="body" style={{
        fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryGhost,
        textAlign: 'center', lineHeight: 20, marginBottom: 40,
      }}>
        No video is stored or sent to our servers. Camera data is processed on-device only.
      </ArchText>
      <Pressable
        onPress={onRequest}
        style={{ backgroundColor: DS.colors.primary, paddingHorizontal: 40, paddingVertical: 16, borderRadius: 50, width: '100%', alignItems: 'center' }}
      >
        <ArchText variant="body" style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 17, color: DS.colors.background }}>
          Allow Camera
        </ArchText>
      </Pressable>
    </View>
  );
}
