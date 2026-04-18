import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Pressable } from 'react-native';
import Svg, { Circle, Path, Line, Rect } from 'react-native-svg';
import { ArchText } from './ArchText';
import { OvalButton } from './OvalButton';
import { DS } from '../../theme/designSystem';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
    if (__DEV__) {
      console.error('[ErrorBoundary]', error, info);
    }
  }

  reset = () => this.setState({ hasError: false, error: null });

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: DS.colors.background,
            padding: 32,
          }}
        >
          {/* Sketchy line-art illustration */}
          <Svg width={80} height={80} viewBox="0 0 80 80" style={{ marginBottom: 24 }}>
            {/* House outline */}
            <Path
              d="M12 40 L40 16 L68 40"
              stroke={DS.colors.border}
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M8 42 L8 66 L72 66 L72 42"
              stroke={DS.colors.border}
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
            />
            {/* Window */}
            <Rect x="32" y="44" width="16" height="16" stroke={DS.colors.border} strokeWidth="1.2" fill="none" />
            <Line x1="40" y1="44" x2="40" y2="60" stroke={DS.colors.border} strokeWidth="1" />
            <Line x1="32" y1="52" x2="48" y2="52" stroke={DS.colors.border} strokeWidth="1" />
            {/* Cracks in walls */}
            <Path
              d="M20 50 L24 46 L22 42"
              stroke={DS.colors.primaryGhost}
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
            />
            <Path
              d="M60 55 L56 58 L58 62"
              stroke={DS.colors.primaryGhost}
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
            />
            {/* Compass rose (our brand mark) */}
            <Circle cx="66" cy="18" r="8" stroke={DS.colors.primaryGhost} strokeWidth="1" fill="none" strokeDasharray="2 2" />
            <Path d="M66 12 L67.5 16 L66 15 L64.5 16 Z" fill={DS.colors.primaryGhost} />
          </Svg>

          <ArchText
            variant="body"
            style={{
              fontFamily: DS.font.heading,
              fontSize: 22,
              color: DS.colors.primary,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            Something went wrong
          </ArchText>

          <ArchText
            variant="body"
            style={{
              fontFamily: DS.font.regular,
              fontSize: 14,
              color: DS.colors.primaryDim,
              textAlign: 'center',
              lineHeight: 20,
              marginBottom: 32,
            }}
          >
            We ran into an issue. Please try again and if it keeps happening, let us know.
          </ArchText>

          <View style={{ width: '100%', alignItems: 'center', gap: 12 }}>
            <OvalButton
              label="Try Again"
              variant="filled"
              onPress={this.reset}
            />
          </View>

          {__DEV__ && this.state.error && (
            <View style={{ marginTop: 24, padding: 12, backgroundColor: DS.colors.surface, borderRadius: 8, width: '100%' }}>
              <ArchText
                variant="body"
                style={{
                  fontFamily: DS.font.mono,
                  fontSize: 10,
                  color: DS.colors.error,
                }}
                numberOfLines={3}
              >
                {this.state.error.message}
              </ArchText>
            </View>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

// Helper component for inline error states (not full-screen)
export function FriendlyErrorState({
  title = 'Something went wrong',
  message = 'We ran into an issue. Please try again.',
  onRetry,
  compact = false,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}) {
  return (
    <View style={{
      flex: compact ? 0 : 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: compact ? 24 : 40,
    }}>
      <Svg width={compact ? 48 : 64} height={compact ? 48 : 64} viewBox="0 0 80 80" style={{ marginBottom: 16 }}>
        <Circle cx="40" cy="40" r="28" stroke={DS.colors.border} strokeWidth="1.5" fill="none" />
        <Path d="M28 28 L52 52 M52 28 L28 52" stroke={DS.colors.primaryDim} strokeWidth="2" strokeLinecap="round" />
      </Svg>
      <ArchText
        variant="body"
        style={{
          fontFamily: DS.font.heading,
          fontSize: compact ? 16 : 20,
          color: DS.colors.primary,
          textAlign: 'center',
          marginBottom: 6,
        }}
      >
        {title}
      </ArchText>
      {!compact && (
        <ArchText
          variant="body"
          style={{
            fontFamily: DS.font.regular,
            fontSize: 13,
            color: DS.colors.primaryDim,
            textAlign: 'center',
            lineHeight: 18,
            marginBottom: onRetry ? 20 : 0,
          }}
        >
          {message}
        </ArchText>
      )}
      {onRetry && (
        <OvalButton
          label="Try Again"
          variant="outline"
          size="small"
          onPress={onRetry}
        />
      )}
    </View>
  );
}
