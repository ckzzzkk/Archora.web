import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BASE_COLORS } from '../../theme/colors';

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
            backgroundColor: BASE_COLORS.background,
            padding: 24,
          }}
        >
          <Text style={{ fontSize: 16, color: BASE_COLORS.error, marginBottom: 8, textAlign: 'center' }}>
            Something went wrong
          </Text>
          {__DEV__ && (
            <Text style={{ fontSize: 11, color: BASE_COLORS.textSecondary, textAlign: 'center', marginBottom: 8 }}>
              {this.state.error?.message ?? 'Unknown error'}
            </Text>
          )}
          {__DEV__ && (
            <Text style={{ fontSize: 10, color: BASE_COLORS.textDim, textAlign: 'center', marginBottom: 20 }}>
              {this.state.error?.stack?.slice(0, 400) ?? ''}
            </Text>
          )}
          <TouchableOpacity
            onPress={this.reset}
            style={{
              borderWidth: 1,
              borderColor: BASE_COLORS.border,
              borderRadius: 8,
              paddingHorizontal: 24,
              paddingVertical: 10,
            }}
          >
            <Text style={{ color: BASE_COLORS.textPrimary }}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
