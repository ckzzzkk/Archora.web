import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import type { PublishTemplateScreenProps } from '../../navigation/types';
import { inspoService } from '../../services/inspoService';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useTierGate } from '../../hooks/useTierGate';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { CompassRoseLoader } from '../../components/common/CompassRoseLoader';
import { BASE_COLORS } from '../../theme/colors';

const BUILDING_TYPES = ['house', 'apartment', 'office', 'studio', 'other'] as const;
const STYLES = ['minimalist', 'modern', 'rustic', 'industrial', 'scandinavian', 'bohemian', 'art_deco', 'coastal', 'traditional', 'mid_century', 'japandi', 'eclectic'] as const;

function BackArrow({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M19 12 H5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M10 7 L5 12 L10 17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function ChipButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: active ? colors.primary : BASE_COLORS.border,
        backgroundColor: active ? `${colors.primary}22` : 'transparent',
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text style={{
        fontFamily: 'Inter_500Medium',
        fontSize: 13,
        color: active ? colors.primary : BASE_COLORS.textSecondary,
        textTransform: 'capitalize',
      }}>
        {label.replace(/_/g, ' ')}
      </Text>
    </Pressable>
  );
}

export function PublishTemplateScreen({ navigation, route }: PublishTemplateScreenProps) {
  const { projectId } = route.params;
  const { colors } = useTheme();
  const { medium, light } = useHaptics();
  const user = useAuthStore((s) => s.user);
  const showToast = useUIStore((s) => s.actions.showToast);

  const publishGate = useTierGate('publishTemplates');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [buildingType, setBuildingType] = useState<string>('house');
  const [style, setStyle] = useState<string>('modern');
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState('4.99');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const canPublish = publishGate.allowed;
  const isArchitect = user?.subscriptionTier === 'architect';

  const handlePublish = async () => {
    if (!user) return;
    if (!canPublish) {
      navigation.navigate('Subscription', { feature: 'publishTemplates' });
      return;
    }
    if (!name.trim()) {
      showToast('Please enter a template name', 'error');
      return;
    }
    if (!agreed) {
      showToast('Please accept the publishing agreements', 'error');
      return;
    }
    if (isPaid && !isArchitect) {
      navigation.navigate('Subscription', { feature: 'publishTemplates' });
      return;
    }
    const parsedPrice = isPaid ? parseFloat(price) : 0;
    if (isPaid && (isNaN(parsedPrice) || parsedPrice < 0.99 || parsedPrice > 49.99)) {
      showToast('Price must be between $0.99 and $49.99', 'error');
      return;
    }

    medium();
    btnScale.value = withSequence(withSpring(0.95), withSpring(1));
    setLoading(true);

    try {
      await inspoService.publishTemplate({
        userId: user.id,
        projectId,
        name: name.trim(),
        description: description.trim() || undefined,
        price: parsedPrice,
        buildingType,
        style,
      });

      showToast('Template published!', 'success');
      navigation.goBack();
    } catch {
      showToast('Failed to publish template. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!canPublish) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BASE_COLORS.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 24, color: BASE_COLORS.textPrimary, textAlign: 'center', marginBottom: 12 }}>
            Upgrade to Publish
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: BASE_COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 28 }}>
            Publishing templates is available on Creator and Architect plans.
          </Text>
          <Pressable
            onPress={() => navigation.navigate('Subscription', { feature: 'publishTemplates' })}
            style={{ backgroundColor: colors.primary, borderRadius: 50, paddingVertical: 14, paddingHorizontal: 32 }}
          >
            <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 16, color: BASE_COLORS.background }}>
              View Plans
            </Text>
          </Pressable>
          <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textDim }}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BASE_COLORS.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BASE_COLORS.border }}>
          <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 14 }}>
            <BackArrow color={BASE_COLORS.textPrimary} />
          </Pressable>
          <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 20, color: BASE_COLORS.textPrimary, flex: 1 }}>
            Publish Design
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
          {/* Name */}
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: BASE_COLORS.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Template Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="My Awesome Design"
            placeholderTextColor={BASE_COLORS.textDim}
            maxLength={80}
            style={{
              backgroundColor: BASE_COLORS.surface,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: BASE_COLORS.border,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontFamily: 'Inter_400Regular',
              fontSize: 15,
              color: BASE_COLORS.textPrimary,
              marginBottom: 20,
            }}
          />

          {/* Description */}
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: BASE_COLORS.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Description (optional)
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your design..."
            placeholderTextColor={BASE_COLORS.textDim}
            multiline
            numberOfLines={4}
            maxLength={500}
            style={{
              backgroundColor: BASE_COLORS.surface,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: BASE_COLORS.border,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontFamily: 'Inter_400Regular',
              fontSize: 15,
              color: BASE_COLORS.textPrimary,
              minHeight: 90,
              textAlignVertical: 'top',
              marginBottom: 20,
            }}
          />

          {/* Building type */}
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: BASE_COLORS.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Building Type
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}>
            {BUILDING_TYPES.map((t) => (
              <ChipButton key={t} label={t} active={buildingType === t} onPress={() => { light(); setBuildingType(t); }} />
            ))}
          </View>

          {/* Style */}
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: BASE_COLORS.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Style
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}>
            {STYLES.map((s) => (
              <ChipButton key={s} label={s} active={style === s} onPress={() => { light(); setStyle(s); }} />
            ))}
          </View>

          {/* Pricing */}
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: BASE_COLORS.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Pricing
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: isPaid ? 12 : 24 }}>
            {(['free', 'paid'] as const).map((option) => {
              const active = (option === 'paid') === isPaid;
              return (
                <Pressable
                  key={option}
                  onPress={() => { light(); setIsPaid(option === 'paid'); }}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: active ? colors.primary : BASE_COLORS.border,
                    backgroundColor: active ? `${colors.primary}18` : 'transparent',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: active ? colors.primary : BASE_COLORS.textSecondary, textTransform: 'capitalize' }}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {isPaid && (
            <View style={{ marginBottom: 20 }}>
              {!isArchitect && (
                <View style={{ backgroundColor: `${colors.warning ?? '#F59E0B'}18`, borderRadius: 8, padding: 12, marginBottom: 12 }}>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: BASE_COLORS.textSecondary }}>
                    Paid templates require an Architect plan.{' '}
                    <Text
                      onPress={() => navigation.navigate('Subscription', { feature: 'publishTemplates' })}
                      style={{ color: colors.primary }}
                    >
                      Upgrade
                    </Text>
                  </Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: BASE_COLORS.surface, borderRadius: 10, borderWidth: 1, borderColor: BASE_COLORS.border, paddingHorizontal: 14, paddingVertical: 12 }}>
                <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 16, color: BASE_COLORS.textPrimary, marginRight: 4 }}>$</Text>
                <TextInput
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                  placeholder="4.99"
                  placeholderTextColor={BASE_COLORS.textDim}
                  style={{ flex: 1, fontFamily: 'JetBrainsMono_400Regular', fontSize: 16, color: BASE_COLORS.textPrimary }}
                />
              </View>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: BASE_COLORS.textDim, marginTop: 6 }}>
                You earn {isArchitect ? '80%' : '70%'} of each sale
              </Text>
            </View>
          )}

          {/* Agreements */}
          <Pressable
            onPress={() => { light(); setAgreed(!agreed); }}
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 28 }}
          >
            <View style={{
              width: 20, height: 20, borderRadius: 5,
              borderWidth: 1.5,
              borderColor: agreed ? colors.primary : BASE_COLORS.border,
              backgroundColor: agreed ? colors.primary : 'transparent',
              marginTop: 1,
              alignItems: 'center', justifyContent: 'center',
            }}>
              {agreed && <Text style={{ color: '#fff', fontSize: 13, lineHeight: 14 }}>✓</Text>}
            </View>
            <Text style={{ flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, color: BASE_COLORS.textSecondary, lineHeight: 20 }}>
              I confirm this design is my own original work and I have the right to publish it on Archora. I agree to the community guidelines.
            </Text>
          </Pressable>

          {/* Publish button */}
          <Animated.View style={btnStyle}>
            <Pressable
              onPress={handlePublish}
              disabled={loading}
              style={{
                backgroundColor: loading ? BASE_COLORS.border : colors.primary,
                borderRadius: 50,
                paddingVertical: 16,
                alignItems: 'center',
                marginBottom: 32,
              }}
            >
              {loading ? (
                <CompassRoseLoader size="small" />
              ) : (
                <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 17, color: BASE_COLORS.background }}>
                  Publish Template
                </Text>
              )}
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
