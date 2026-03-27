import React from 'react';
import { Text } from 'react-native';
import type { TextStyle } from 'react-native';
import { DS } from '../../theme/designSystem';

type Variant = 'heading' | 'body' | 'mono' | 'label' | 'caption';

interface Props {
  children:  string | React.ReactNode;
  variant:   Variant;
  size?:     keyof typeof DS.fontSize;
  color?:    string;
  align?:    'left' | 'center' | 'right';
  style?:    TextStyle;
}

const VARIANT_DEFAULTS: Record<Variant, {
  fontFamily: string;
  fontSize:   number;
  color:      string;
  lineHeight?: number;
}> = {
  heading: {
    fontFamily: DS.font.heading,
    fontSize:   DS.fontSize.xxl,
    color:      DS.colors.primary,
  },
  body: {
    fontFamily: DS.font.regular,
    fontSize:   DS.fontSize.md,
    color:      DS.colors.primary,
    lineHeight: DS.fontSize.md * 1.5,
  },
  mono: {
    fontFamily: DS.font.mono,
    fontSize:   DS.fontSize.sm,
    color:      DS.colors.primaryDim,
  },
  label: {
    fontFamily: DS.font.medium,
    fontSize:   DS.fontSize.sm,
    color:      DS.colors.primaryDim,
  },
  caption: {
    fontFamily: DS.font.regular,
    fontSize:   DS.fontSize.xs,
    color:      DS.colors.primaryGhost,
  },
};

export function ArchText({ children, variant, size, color, align = 'left', style }: Props) {
  const defaults = VARIANT_DEFAULTS[variant];

  return (
    <Text
      style={[
        {
          fontFamily:         defaults.fontFamily,
          fontSize:           size !== undefined ? DS.fontSize[size] : defaults.fontSize,
          color:              color ?? defaults.color,
          textAlign:          align,
          lineHeight:         defaults.lineHeight,
          includeFontPadding: false,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
