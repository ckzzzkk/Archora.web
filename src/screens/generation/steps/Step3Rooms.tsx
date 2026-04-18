import React from 'react';
import { DS } from '../../../theme/designSystem';
import { ArchText } from '../../../components/common/ArchText';
import { View, Pressable, Switch } from 'react-native';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useHaptics } from '../../../hooks/useHaptics';


interface Props {
  bedrooms: number;
  bathrooms: number;
  livingAreas: number;
  hasGarage: boolean;
  hasGarden: boolean;
  hasPool: boolean;
  poolSize: 'small' | 'medium' | 'large';
  hasHomeOffice: boolean;
  hasUtilityRoom: boolean;
  onBedroomsChange: (v: number) => void;
  onBathroomsChange: (v: number) => void;
  onLivingAreasChange: (v: number) => void;
  onGarageChange: (v: boolean) => void;
  onGardenChange: (v: boolean) => void;
  onPoolChange: (v: boolean) => void;
  onPoolSizeChange: (v: 'small' | 'medium' | 'large') => void;
  onHomeOfficeChange: (v: boolean) => void;
  onUtilityRoomChange: (v: boolean) => void;
  onNext: () => void;
}

function StepperButton({ children, onPress, disabled, accessibilityLabel }: { children: React.ReactNode; onPress: () => void; disabled?: boolean; accessibilityLabel?: string }) {
  const { light } = useHaptics();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPressIn={() => { if (!disabled) scale.value = withSpring(0.88, { damping: 10, stiffness: 500 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12, stiffness: 400 }); }}
      onPress={() => { if (!disabled) { light(); onPress(); } }}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View style={[animatedStyle, {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: disabled ? DS.colors.surface + '60' : DS.colors.surface,
        borderWidth: 1, borderColor: DS.colors.border,
        alignItems: 'center', justifyContent: 'center',
        opacity: disabled ? 0.5 : 1,
      }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

function Stepper({ label, value, onChange, min = 0, max = 20 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <View style={{ flexShrink: 1, marginRight: 8 }}>
        <ArchText variant="body" style={{ fontFamily: 'Inter_500Medium', fontSize: 16, color: DS.colors.primary }} numberOfLines={1}>{label}</ArchText>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <StepperButton
          onPress={() => value > min && onChange(value - 1)}
          disabled={value <= min}
          accessibilityLabel={`Decrease ${label}`}
        >
          <ArchText variant="body" style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 18, color: value <= min ? DS.colors.primaryGhost : DS.colors.primary }}>-</ArchText>
        </StepperButton>
        <ArchText variant="body" style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 20, color: DS.colors.primary, minWidth: 28, textAlign: 'center' }}>
          {value}
        </ArchText>
        <StepperButton
          onPress={() => value < max && onChange(value + 1)}
          disabled={value >= max}
          accessibilityLabel={`Increase ${label}`}
        >
          <ArchText variant="body" style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 18, color: value >= max ? DS.colors.primaryGhost : DS.colors.primary }}>+</ArchText>
        </StepperButton>
      </View>
    </View>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <View style={{ flexShrink: 1, marginRight: 8 }}>
        <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: DS.colors.primary }} numberOfLines={1}>{label}</ArchText>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: DS.colors.border, true: DS.colors.primary }}
        thumbColor={DS.colors.surface}
        accessibilityLabel={label}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        accessibilityHint="Double tap to toggle"
      />
    </View>
  );
}

const POOL_SIZES: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];

export function Step3Rooms(props: Props) {
  return (
    <Animated.View entering={FadeIn.duration(150)} style={{ paddingHorizontal: DS.spacing.lg, flex: 1 }}>
      <ArchText variant="body"
        style={{
          fontFamily: 'ArchitectsDaughter_400Regular',
          fontSize: 24,
          color: DS.colors.primary,
          marginBottom: 24,
        }}
      >
        How many rooms?
      </ArchText>

      <Stepper label="Bedrooms" value={props.bedrooms} onChange={props.onBedroomsChange} />
      <Stepper label="Bathrooms" value={props.bathrooms} onChange={props.onBathroomsChange} />
      <Stepper label="Living Areas" value={props.livingAreas} onChange={props.onLivingAreasChange} />

      <View style={{ height: 1, backgroundColor: DS.colors.border, marginVertical: 12 }} />

      <ToggleRow label="Garage" value={props.hasGarage} onChange={props.onGarageChange} />
      <ToggleRow label="Garden / Lawn" value={props.hasGarden} onChange={props.onGardenChange} />
      <ToggleRow label="Pool" value={props.hasPool} onChange={props.onPoolChange} />

      {props.hasPool && (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, marginLeft: 16 }}>
          {POOL_SIZES.map((s) => (
            <Pressable
              key={s}
              onPress={() => props.onPoolSizeChange(s)}
              style={{
                paddingHorizontal: 14, paddingVertical: 6, borderRadius: 50,
                borderWidth: 1,
                borderColor: props.poolSize === s ? DS.colors.primary : DS.colors.border,
                backgroundColor: props.poolSize === s ? `${DS.colors.primary}20` : 'transparent',
              }}
            >
              <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryDim, textTransform: 'capitalize' }}>
                {s}
              </ArchText>
            </Pressable>
          ))}
        </View>
      )}

      <ToggleRow label="Home Office" value={props.hasHomeOffice} onChange={props.onHomeOfficeChange} />
      <ToggleRow label="Utility Room" value={props.hasUtilityRoom} onChange={props.onUtilityRoomChange} />

      <View style={{ flex: 1 }} />

      <Pressable
        onPress={props.onNext}
        style={{
          backgroundColor: DS.colors.primary,
          borderRadius: 50,
          paddingVertical: 16,
          alignItems: 'center',
          marginTop: 20,
        }}
      >
        <ArchText variant="body" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: DS.colors.background }}>Next</ArchText>
      </Pressable>
    </Animated.View>
  );
}
