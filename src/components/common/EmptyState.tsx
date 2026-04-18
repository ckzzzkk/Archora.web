import React from 'react';
import { View, Pressable } from 'react-native';
import Svg, { Circle, Path, Line, Rect, Polyline } from 'react-native-svg';
import { OvalButton } from './OvalButton';
import { ArchText } from './ArchText';
import { DS } from '../../theme/designSystem';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  /** 'projects' | 'favorites' | 'search' | 'notifications' | 'error' | 'default' */
  variant?: 'projects' | 'favorites' | 'search' | 'notifications' | 'error' | 'default';
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

function ProjectsIllustration() {
  return (
    <Svg width={96} height={80} viewBox="0 0 96 80">
      {/* House outline */}
      <Polyline points="8,48 48,12 88,48" stroke={DS.colors.border} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="16" y="48" width="64" height="28" stroke={DS.colors.border} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <Rect x="38" y="60" width="20" height="16" stroke={DS.colors.border} strokeWidth="1.2" fill="none" />
      <Rect x="22" y="54" width="12" height="10" stroke={DS.colors.border} strokeWidth="1.1" fill="none" />
      <Rect x="62" y="54" width="12" height="10" stroke={DS.colors.border} strokeWidth="1.1" fill="none" />
      {/* Compass rose */}
      <Circle cx="82" cy="16" r="8" stroke={DS.colors.border} strokeWidth="1" fill="none" strokeDasharray="2 2" />
      <Path d="M82 10 L83.5 14 L82 13 L80.5 14 Z" fill={DS.colors.border} />
      <Circle cx="82" cy="16" r="2" fill={DS.colors.border} />
    </Svg>
  );
}

function FavoritesIllustration() {
  return (
    <Svg width={80} height={80} viewBox="0 0 80 80">
      {/* Heart outline */}
      <Path
        d="M40 68 C16 48 8 32 8 24 C8 14 16 8 26 8 C32 8 37 11 40 16 C43 11 48 8 54 8 C64 8 72 14 72 24 C72 32 64 48 40 68Z"
        stroke={DS.colors.border}
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Small compass */}
      <Circle cx="58" cy="16" r="6" stroke={DS.colors.border} strokeWidth="1" fill="none" strokeDasharray="2 2" />
      <Path d="M58 11 L59 14 L58 13 L57 14 Z" fill={DS.colors.border} />
    </Svg>
  );
}

function SearchIllustration() {
  return (
    <Svg width={80} height={80} viewBox="0 0 80 80">
      {/* Magnifying glass */}
      <Circle cx="34" cy="34" r="18" stroke={DS.colors.border} strokeWidth="1.8" fill="none" />
      <Path d="M48 48 L64 64" stroke={DS.colors.border} strokeWidth="2.5" strokeLinecap="round" />
      {/* House inside */}
      <Polyline points="28,30 34,22 40,30" stroke={DS.colors.border} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="27" y="30" width="14" height="10" stroke={DS.colors.border} strokeWidth="1.1" fill="none" />
    </Svg>
  );
}

function NotificationsIllustration() {
  return (
    <Svg width={80} height={80} viewBox="0 0 80 80">
      {/* Bell */}
      <Path
        d="M32 16 C32 8 40 4 40 4 C40 4 48 8 48 16 L48 40 L56 52 L24 52 L32 40 Z"
        stroke={DS.colors.border}
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M32 52 C32 58 36 60 40 60 C44 60 48 58 48 52" stroke={DS.colors.border} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <Circle cx="40" cy="16" r="2" fill={DS.colors.border} />
      {/* Small notification dot */}
      <Circle cx="52" cy="20" r="4" stroke={DS.colors.border} strokeWidth="1" fill="none" />
      <Path d="M50 20 L51 21 M52 19 L53 20" stroke={DS.colors.border} strokeWidth="0.8" />
    </Svg>
  );
}

function DefaultIllustration() {
  return (
    <Svg width={80} height={80} viewBox="0 0 80 80">
      <Circle cx="40" cy="40" r="28" stroke={DS.colors.border} strokeWidth="1.5" fill="none" />
      <Polyline points="24,44 36,32 48,44" stroke={DS.colors.border} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="40" cy="26" r="4" stroke={DS.colors.border} strokeWidth="1.2" fill="none" />
      {/* Compass rose */}
      <Circle cx="60" cy="60" r="8" stroke={DS.colors.border} strokeWidth="1" fill="none" strokeDasharray="2 2" />
      <Path d="M60 54 L61.5 58 L60 57 L58.5 58 Z" fill={DS.colors.border} />
    </Svg>
  );
}

function getIllustration(variant: EmptyStateProps['variant']) {
  switch (variant) {
    case 'projects':       return <ProjectsIllustration />;
    case 'favorites':     return <FavoritesIllustration />;
    case 'search':        return <SearchIllustration />;
    case 'notifications': return <NotificationsIllustration />;
    default:              return <DefaultIllustration />;
  }
}

export function EmptyState({
  title,
  subtitle,
  variant = 'default',
  actionLabel,
  onAction,
  compact = false,
}: EmptyStateProps) {
  return (
    <View
      style={{
        flex: compact ? 0 : 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: compact ? 24 : 40,
      }}
    >
      <View style={{ marginBottom: 20 }}>
        {getIllustration(variant)}
      </View>

      <ArchText
        variant="body"
        style={{
          fontFamily: DS.font.heading,
          fontSize: compact ? 18 : 22,
          color: DS.colors.primary,
          textAlign: 'center',
          marginBottom: subtitle ? 8 : actionLabel ? 16 : 0,
        }}
      >
        {title}
      </ArchText>

      {subtitle ? (
        <ArchText
          variant="body"
          style={{
            fontFamily: DS.font.regular,
            fontSize: 14,
            color: DS.colors.primaryDim,
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: actionLabel ? 24 : 0,
          }}
        >
          {subtitle}
        </ArchText>
      ) : null}

      {actionLabel && onAction ? (
        <OvalButton label={actionLabel} variant="filled" onPress={onAction} />
      ) : null}
    </View>
  );
}
