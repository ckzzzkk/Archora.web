import { DS } from '../../theme/designSystem';
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Modal, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { useSession } from '../../auth/useSession';
import { useHaptics } from '../../hooks/useHaptics';
import { DESIGN_STYLES, isStyleAccessible, STARTER_STYLES } from '../../data/designStyles';
import { TIER_LIMITS } from '../../utils/tierLimits';
import type { ArchStyle } from '../../types';
import type { RootStackParamList } from '../../navigation/types';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = SCREEN_H * 0.75;

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function StyleSelectorSheet({ visible, onClose }: Props) {
  const translateY = useSharedValue(SHEET_H);
  const { light, medium } = useHaptics();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { user } = useSession();
  const tier = user?.subscriptionTier ?? 'starter';

  const applyStyle = useBlueprintStore((s) => s.actions.applyStyle);
  const currentStyle = useBlueprintStore((s) => s.blueprint?.metadata.style);

  const [selectedId, setSelectedId] = useState<ArchStyle | null>(
    (currentStyle as ArchStyle) ?? null
  );

  useEffect(() => {
    translateY.value = visible
      ? withSpring(0, { damping: 22, stiffness: 280 })
      : withTiming(SHEET_H, { duration: 250 });
  }, [visible, translateY]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleSelect = (styleId: ArchStyle) => {
    const availableStyles = TIER_LIMITS[tier].availableStyles;
    const accessible = isStyleAccessible(styleId, availableStyles);
    if (!accessible) {
      navigation.navigate('Subscription', { feature: 'Design Styles' });
      return;
    }
    light();
    setSelectedId(styleId);
  };

  const handleApply = () => {
    if (!selectedId) return;
    const style = DESIGN_STYLES.find((s) => s.id === selectedId);
    if (!style) return;
    medium();
    applyStyle(selectedId, style.primaryWallColour);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <Pressable
        style={{ flex: 1, backgroundColor: DS.colors.overlay }}
        onPress={onClose}
      />
      <Animated.View
        style={[
          sheetStyle,
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: SHEET_H,
            backgroundColor: 'rgba(240, 237, 232, 0.10)',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTopWidth: 1,
            borderTopColor: DS.colors.border,
            overflow: 'hidden',
          },
        ]}
      >
        {/* Handle */}
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 6 }}>
          <View
            style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(240, 237, 232, 0.25)' }}
          />
        </View>

        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontFamily: 'ArchitectsDaughter_400Regular',
              fontSize: 20,
              color: DS.colors.primary,
              flex: 1,
            }}
          >
            Design Style
          </Text>
          <Pressable onPress={onClose} style={{ padding: 8 }}>
            <Text style={{ color: DS.colors.primaryDim, fontSize: 18 }}>✕</Text>
          </Pressable>
        </View>

        {/* Style grid */}
        <ScrollView
          horizontal={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        >
          <View
            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}
          >
            {DESIGN_STYLES.map((style) => {
              const accessible = isStyleAccessible(style.id, TIER_LIMITS[tier].availableStyles);
              const isSelected = selectedId === style.id;

              return (
                <Pressable
                  key={style.id}
                  onPress={() => handleSelect(style.id)}
                  style={{
                    width: '47%',
                    borderRadius: 14,
                    overflow: 'hidden',
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected ? DS.colors.warning : DS.colors.border,
                    opacity: accessible ? 1 : 0.6,
                  }}
                >
                  {/* Gradient preview */}
                  <View
                    style={{
                      height: 64,
                      flexDirection: 'row',
                    }}
                  >
                    {style.colours.slice(0, 5).map((colour, i) => (
                      <View
                        key={i}
                        style={{ flex: 1, backgroundColor: colour }}
                      />
                    ))}
                  </View>

                  <View
                    style={{
                      padding: 10,
                      backgroundColor: DS.colors.surfaceHigh,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'ArchitectsDaughter_400Regular',
                          fontSize: 13,
                          color: DS.colors.primary,
                        }}
                      >
                        {style.name}
                      </Text>
                      {!accessible && (
                        <Text style={{ fontSize: 12 }}>🔒</Text>
                      )}
                      {isSelected && accessible && (
                        <Text style={{ fontSize: 12, color: DS.colors.warning }}>✓</Text>
                      )}
                    </View>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: 'Inter_400Regular',
                        fontSize: 10,
                        color: DS.colors.primaryGhost,
                        marginTop: 2,
                      }}
                    >
                      {style.characteristics[0]}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Apply button */}
        {selectedId && isStyleAccessible(selectedId, TIER_LIMITS[tier].availableStyles) && (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: 20,
              backgroundColor: DS.colors.surface,
              borderTopWidth: 1,
              borderTopColor: DS.colors.border,
            }}
          >
            <Pressable
              onPress={handleApply}
              style={{
                backgroundColor: DS.colors.primary,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inter_700Bold',
                  fontSize: 15,
                  color: DS.colors.background,
                }}
              >
                Apply{' '}
                {DESIGN_STYLES.find((s) => s.id === selectedId)?.name ?? ''} Style
              </Text>
            </Pressable>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}
