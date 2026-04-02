import { DS } from '../../theme/designSystem';
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';

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
            padding: 24,
          }}
        >
          <Text style={{ fontSize: 16, color: DS.colors.error, marginBottom: 8, textAlign: 'center' }}>
            Something went wrong
          </Text>
          {__DEV__ && (
            <Text style={{ fontSize: 11, color: DS.colors.primaryDim, textAlign: 'center', marginBottom: 8 }}>
              {this.state.error?.message ?? 'Unknown error'}
            </Text>
          )}
          {__DEV__ && (
            <Text style={{ fontSize: 10, color: DS.colors.primaryGhost, textAlign: 'center', marginBottom: 20 }}>
              {this.state.error?.stack?.slice(0, 400) ?? ''}
            </Text>
          )}
          <Pressable
            onPress={this.reset}
            style={{
              borderWidth: 1,
              borderColor: DS.colors.border,
              borderRadius: 50,
              paddingHorizontal: 24,
              paddingVertical: 10,
            }}
          >
            <Text style={{ color: DS.colors.primary }}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
