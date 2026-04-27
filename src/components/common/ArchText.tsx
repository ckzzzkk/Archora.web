import React from 'react';
import { Text } from 'react-native';
import type { TextStyle } from 'react-native';
import { DS } from '../../theme/designSystem';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption' | 'mono';

interface Props {
  children:     string | React.ReactNode;
  variant:      Variant;
  color?:       string;
  align?:       'left' | 'center' | 'right';
  style?:       TextStyle;
  numberOfLines?: number;
}

const VARIANT_DEFAULTS: Record<Variant, {
  fontFamily: string;
  fontSize:   number;
  color:      string;
  lineHeight?: number;
  letterSpacing?: number;
  textTransform?: 'uppercase' | 'none';
}> = {
  display: {
    fontFamily:  DS.font.heading,
    fontSize:    DS.fontSize.hero,
    color:       DS.colors.ink,
    lineHeight:  DS.fontSize.hero * 1.05,
    letterSpacing: 0.01,
  },
  title: {
    fontFamily:  DS.font.heading,
    fontSize:    DS.fontSize.xxl,
    color:       DS.colors.ink,
    lineHeight:  DS.fontSize.xxl * 1.1,
    letterSpacing: 0.01,
  },
  heading: {
    fontFamily:  DS.font.heading,
    fontSize:    DS.fontSize.xl,
    color:       DS.colors.ink,
    lineHeight:  DS.fontSize.xl * 1.15,
    letterSpacing: 0.01,
  },
  body: {
    fontFamily:  DS.font.regular,
    fontSize:    DS.fontSize.md,
    color:       DS.colors.ink,
    lineHeight:  DS.fontSize.md * 1.5,
  },
  label: {
    fontFamily:  DS.font.mono,
    fontSize:    DS.fontSize.xs,
    color:       DS.colors.mutedForeground,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  caption: {
    fontFamily:  DS.font.regular,
    fontSize:    DS.fontSize.xs,
    color:       DS.colors.mutedForeground,
    lineHeight:  DS.fontSize.xs * 1.4,
  },
  mono: {
    fontFamily:  DS.font.mono,
    fontSize:    DS.fontSize.sm,
    color:       DS.colors.primaryDim,
  },
};

export function ArchText({
  children,
  variant,
  color,
  align = 'left',
  style,
  numberOfLines,
}: Props) {
  const defaults = VARIANT_DEFAULTS[variant];

  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          fontFamily:         defaults.fontFamily,
          fontSize:           defaults.fontSize,
          color:              color ?? defaults.color,
          textAlign:          align,
          lineHeight:         defaults.lineHeight,
          letterSpacing:      defaults.letterSpacing,
          textTransform:      defaults.textTransform,
          includeFontPadding: false,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
