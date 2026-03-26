import React from 'react';
import { View, Text, Pressable, Switch } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { BASE_COLORS } from '../../../theme/colors';

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

function Stepper({ label, value, onChange, min = 0, max = 20 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 16, color: BASE_COLORS.textPrimary }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Pressable
          onPress={() => value > min && onChange(value - 1)}
          style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: BASE_COLORS.surface, borderWidth: 1, borderColor: BASE_COLORS.border,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 18, color: BASE_COLORS.textPrimary }}>-</Text>
        </Pressable>
        <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 20, color: BASE_COLORS.textPrimary, minWidth: 28, textAlign: 'center' }}>
          {value}
        </Text>
        <Pressable
          onPress={() => value < max && onChange(value + 1)}
          style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: BASE_COLORS.surface, borderWidth: 1, borderColor: BASE_COLORS.border,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 18, color: BASE_COLORS.textPrimary }}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: BASE_COLORS.textPrimary }}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: BASE_COLORS.border, true: BASE_COLORS.textPrimary }}
        thumbColor={BASE_COLORS.surface}
      />
    </View>
  );
}

const POOL_SIZES: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];

export function Step3Rooms(props: Props) {
  return (
    <Animated.View entering={FadeIn.duration(150)} style={{ paddingHorizontal: 20, flex: 1 }}>
      <Text
        style={{
          fontFamily: 'ArchitectsDaughter_400Regular',
          fontSize: 24,
          color: BASE_COLORS.textPrimary,
          marginBottom: 24,
        }}
      >
        How many rooms?
      </Text>

      <Stepper label="Bedrooms" value={props.bedrooms} onChange={props.onBedroomsChange} />
      <Stepper label="Bathrooms" value={props.bathrooms} onChange={props.onBathroomsChange} />
      <Stepper label="Living Areas" value={props.livingAreas} onChange={props.onLivingAreasChange} />

      <View style={{ height: 1, backgroundColor: BASE_COLORS.border, marginVertical: 12 }} />

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
                borderColor: props.poolSize === s ? BASE_COLORS.textPrimary : BASE_COLORS.border,
                backgroundColor: props.poolSize === s ? `${BASE_COLORS.textPrimary}20` : 'transparent',
              }}
            >
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: BASE_COLORS.textSecondary, textTransform: 'capitalize' }}>
                {s}
              </Text>
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
          backgroundColor: BASE_COLORS.textPrimary,
          borderRadius: 50,
          paddingVertical: 16,
          alignItems: 'center',
          marginTop: 20,
        }}
      >
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: BASE_COLORS.background }}>Next</Text>
      </Pressable>
    </Animated.View>
  );
}
