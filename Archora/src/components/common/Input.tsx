import { DS } from '../../theme/designSystem';
import React, { useState } from 'react';
import { TextInput, View, Text, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolateColor } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  returnKeyType?: 'done' | 'next' | 'search' | 'send';
  onSubmitEditing?: () => void;
  editable?: boolean;
  maxLength?: number;
  rightElement?: React.ReactNode;
  testID?: string;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  secureTextEntry,
  multiline,
  numberOfLines,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
  returnKeyType = 'done',
  onSubmitEditing,
  editable = true,
  maxLength,
  rightElement,
  testID,
}: InputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  const handleFocus = () => {
    setFocused(true);
    focusAnim.value = withTiming(1, { duration: 200 });
  };

  const handleBlur = () => {
    setFocused(false);
    focusAnim.value = withTiming(0, { duration: 200 });
  };

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? DS.colors.error
      : interpolateColor(focusAnim.value, [0, 1], [DS.colors.border, colors.primary]),
  }));

  return (
    <View style={{ width: '100%', marginBottom: 16 }}>
      {label ? (
        <Text
          className="text-xs font-medium tracking-widest uppercase mb-1"
          style={{ color: DS.colors.primaryDim, fontFamily: 'JetBrainsMono_400Regular' }}
        >
          {label}
        </Text>
      ) : null}

      <Animated.View
        style={[
          borderStyle,
          {
            borderWidth: 1,
            borderRadius: 6,
            backgroundColor: DS.colors.surface,
            opacity: editable ? 1 : 0.5,
            flexDirection: 'row',
            alignItems: 'center',
            overflow: 'hidden',
          },
        ]}
      >
        <TextInput
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={DS.colors.primaryGhost}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          editable={editable}
          maxLength={maxLength}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{
            flex: 1,
            color: DS.colors.primary,
            fontFamily: 'Inter_400Regular',
            fontSize: 15,
            paddingHorizontal: 14,
            paddingVertical: 12,
            minHeight: multiline ? 80 : undefined,
            textAlignVertical: multiline ? 'top' : 'center',
          }}
        />
        {rightElement ? (
          <View style={{ paddingRight: 12 }}>{rightElement}</View>
        ) : null}
      </Animated.View>

      {error ? (
        <Text
          className="text-xs mt-1"
          style={{ color: DS.colors.error, fontFamily: 'Inter_400Regular' }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
