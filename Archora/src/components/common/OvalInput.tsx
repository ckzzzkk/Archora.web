import React from 'react';
import { View, TextInput, Pressable } from 'react-native';
import type { KeyboardTypeOptions, ReturnKeyTypeOptions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { DS } from '../../theme/designSystem';

interface OvalInputProps {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  onRightIconPress?: () => void;
  editable?: boolean;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
  autoComplete?: string;
}

export function OvalInput({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  leftIcon,
  rightIcon,
  error,
  onRightIconPress,
  editable = true,
  returnKeyType,
  onSubmitEditing,
}: OvalInputProps) {
  const focused = useSharedValue(0);
  const hasError = !!error;

  const containerStyle = useAnimatedStyle(() => ({
    borderColor: hasError
      ? DS.colors.error
      : interpolateColor(focused.value, [0, 1], [DS.colors.border, DS.colors.accent]),
  }));

  return (
    <View>
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: DS.colors.surface,
            borderRadius: DS.radius.oval,
            borderWidth: 1,
            height: 52,
            paddingHorizontal: DS.spacing.md,
            gap: DS.spacing.sm,
          },
          containerStyle,
        ]}
      >
        {leftIcon != null && (
          <View style={{ opacity: 0.5 }}>{leftIcon}</View>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={DS.colors.primaryGhost}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => {
            focused.value = withTiming(1, { duration: 200 });
          }}
          onBlur={() => {
            focused.value = withTiming(0, { duration: 200 });
          }}
          style={{
            flex: 1,
            fontFamily: DS.font.regular,
            fontSize: DS.fontSize.md,
            color: DS.colors.primary,
            includeFontPadding: false,
            paddingVertical: 0,
          }}
        />
        {rightIcon != null && (
          <Pressable onPress={onRightIconPress} hitSlop={8}>
            <View style={{ opacity: 0.6 }}>{rightIcon}</View>
          </Pressable>
        )}
      </Animated.View>
      {hasError && (
        <View style={{ paddingHorizontal: DS.spacing.md, marginTop: 4 }}>
          <Animated.Text
            style={{
              fontFamily: DS.font.regular,
              fontSize: DS.fontSize.sm,
              color: DS.colors.error,
            }}
          >
            {error}
          </Animated.Text>
        </View>
      )}
    </View>
  );
}
