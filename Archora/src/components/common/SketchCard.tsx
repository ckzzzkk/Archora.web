import React from 'react';
import { View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { DS } from '../../theme/designSystem';

interface Props {
  children:  React.ReactNode;
  onPress?:  () => void;
  style?:    ViewStyle;
  glowing?:  boolean;
  padding?:  number;
}

export function SketchCard({ children, style, glowing = false, padding = DS.spacing.lg }: Props) {
  return (
    <View
      style={[
        DS.shadow.medium,
        {
          backgroundColor: DS.colors.surface,
          borderRadius:    DS.radius.card,
          overflow:        'hidden',
          padding,
          borderWidth:     glowing ? 1 : 0,
          borderColor:     glowing ? 'rgba(240,237,232,0.15)' : 'transparent',
        },
        style,
      ]}
    >
      {glowing && (
        // Inner glow layer — a slightly lighter inner border inset
        <View
          pointerEvents="none"
          style={{
            position:     'absolute',
            top:          1, left: 1, right: 1, bottom: 1,
            borderRadius: DS.radius.card - 1,
            borderWidth:  1,
            borderColor:  'rgba(240,237,232,0.06)',
          }}
        />
      )}
      {children}
    </View>
  );
}
