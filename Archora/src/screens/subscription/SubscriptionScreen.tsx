import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  SafeAreaView,
  Alert,
  Linking,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../utils/supabaseClient';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../stores/authStore';
import { BASE_COLORS } from '../../theme/colors';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import type { SubscriptionTier } from '../../types';
import { STRIPE_PRICE_IDS, TIER_LIMITS } from '../../utils/tierLimits';

type Props = NativeStackScreenProps<RootStackParamList, 'Subscription'>;

type BillingInterval = 'monthly' | 'annual';

const PRICES: Record<Exclude<SubscriptionTier, 'starter'>, { monthly: number; annual: number; annualTotal: number }> = {
  creator: { monthly: 14.99, annual: 11.99, annualTotal: 143.90 },
  pro: { monthly: 24.99, annual: 19.99, annualTotal: 239.90 },
  architect: { monthly: 39.99, annual: 31.99, annualTotal: 383.90 },
};

const FEATURES = [
  {
    label: 'Projects',
    starter: String(TIER_LIMITS.starter.maxProjects),
    creator: String(TIER_LIMITS.creator.maxProjects),
    pro: String(TIER_LIMITS.pro.maxProjects),
    architect: 'Unlimited',
  },
  {
    label: 'Rooms per project',
    starter: String(TIER_LIMITS.starter.maxRoomsPerProject),
    creator: String(TIER_LIMITS.creator.maxRoomsPerProject),
    pro: String(TIER_LIMITS.pro.maxRoomsPerProject),
    architect: 'Unlimited',
  },
  {
    label: 'Furniture per room',
    starter: String(TIER_LIMITS.starter.maxFurniturePerRoom),
    creator: String(TIER_LIMITS.creator.maxFurniturePerRoom),
    pro: String(TIER_LIMITS.pro.maxFurniturePerRoom),
    architect: 'Unlimited',
  },
  {
    label: 'AI generations / mo',
    starter: String(TIER_LIMITS.starter.aiGenerationsPerMonth),
    creator: String(TIER_LIMITS.creator.aiGenerationsPerMonth),
    pro: String(TIER_LIMITS.pro.aiGenerationsPerMonth),
    architect: 'Unlimited',
  },
  {
    label: 'Daily edit time',
    starter: '45 min',
    creator: 'Unlimited',
    pro: 'Unlimited',
    architect: 'Unlimited',
  },
  {
    label: 'Undo steps',
    starter: String(TIER_LIMITS.starter.maxUndoSteps),
    creator: String(TIER_LIMITS.creator.maxUndoSteps),
    pro: String(TIER_LIMITS.pro.maxUndoSteps),
    architect: 'Unlimited',
  },
  {
    label: 'Auto-save',
    starter: '✗',
    creator: '✓',
    pro: '✓',
    architect: '✓',
  },
  {
    label: 'Design styles',
    starter: String((TIER_LIMITS.starter.availableStyles as string[]).length),
    creator: '12',
    pro: '12',
    architect: '12',
  },
  {
    label: 'AR placement',
    starter: '✗',
    creator: `${TIER_LIMITS.creator.arSessionsPerMonth}/mo`,
    pro: 'Unlimited',
    architect: 'Unlimited',
  },
  {
    label: 'Export designs',
    starter: `${TIER_LIMITS.starter.exportsPerMonth}/mo`,
    creator: `${TIER_LIMITS.creator.exportsPerMonth}/mo`,
    pro: 'Unlimited',
    architect: 'Unlimited',
  },
  {
    label: 'First-person view',
    starter: '✗',
    creator: '✓',
    pro: '✓',
    architect: '✓',
  },
  {
    label: 'Publish templates',
    starter: '✗',
    creator: String(TIER_LIMITS.creator.maxPublishedTemplates),
    pro: 'Unlimited',
    architect: 'Unlimited',
  },
  {
    label: 'Template revenue share',
    starter: '✗',
    creator: `${Math.round(TIER_LIMITS.creator.templateRevenueShare * 100)}%`,
    pro: `${Math.round(TIER_LIMITS.pro.templateRevenueShare * 100)}%`,
    architect: `${Math.round(TIER_LIMITS.architect.templateRevenueShare * 100)}%`,
  },
  {
    label: 'VIP support',
    starter: '✗',
    creator: '✗',
    pro: '✗',
    architect: '✓',
  },
];

interface TierCardProps {
  tier: Exclude<SubscriptionTier, 'starter'>;
  billingInterval: BillingInterval;
  isCurrentTier: boolean;
  isHighlighted: boolean;
  onUpgrade: (tier: Exclude<SubscriptionTier, 'starter'>) => void;
}

function TierCard({ tier, billingInterval, isCurrentTier, isHighlighted, onUpgrade }: TierCardProps) {
  const { colors } = useTheme();
  const price = PRICES[tier];
  const displayPrice = billingInterval === 'annual' ? price.annual : price.monthly;
  const label = tier === 'creator' ? 'Creator' : tier === 'pro' ? 'Pro' : 'Architect';
  const accentColor = tier === 'architect' ? BASE_COLORS.warning : tier === 'pro' ? BASE_COLORS.success : colors.primary;

  const perks = tier === 'creator'
    ? ['20 projects', '100 AI generations/mo', '15 AR sessions', 'Auto-save', '12 design styles']
    : tier === 'pro'
    ? ['50 projects', '500 AI generations/mo', 'Unlimited AR', 'Custom textures', '12 design styles']
    : ['Unlimited everything', 'Unlimited AR', 'Custom furniture AI', 'Template revenue 80%', 'VIP support'];

  return (
    <View
      style={{
        borderRadius: 20,
        borderWidth: isHighlighted ? 2 : 1,
        borderColor: isHighlighted ? accentColor : BASE_COLORS.border,
        backgroundColor: BASE_COLORS.surfaceHigh,
        marginBottom: 16,
        overflow: 'hidden',
      }}
    >
      {/* Badge */}
      {isHighlighted && (
        <View style={{ backgroundColor: accentColor, paddingVertical: 6, alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#000' }}>
            {tier === 'creator' ? 'MOST POPULAR' : 'PROFESSIONAL'}
          </Text>
        </View>
      )}

      <View style={{ padding: 24 }}>
        <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 22, color: BASE_COLORS.textPrimary, marginBottom: 4 }}>
          {label}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 36, color: accentColor }}>
            ${displayPrice.toFixed(2)}
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: BASE_COLORS.textDim, marginLeft: 4 }}>
            /mo
          </Text>
        </View>

        {billingInterval === 'annual' && (
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: BASE_COLORS.textDim, marginBottom: 16 }}>
            ${price.annualTotal.toFixed(2)} billed annually · Save 20%
          </Text>
        )}

        <View style={{ marginTop: billingInterval === 'monthly' ? 12 : 0, marginBottom: 20, gap: 8 }}>
          {perks.map((perk) => (
            <View key={perk} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: accentColor, marginRight: 8, fontSize: 14 }}>✓</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: BASE_COLORS.textSecondary }}>
                {perk}
              </Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => !isCurrentTier && onUpgrade(tier)}
          style={{
            backgroundColor: isCurrentTier ? BASE_COLORS.border : accentColor,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: isCurrentTier ? BASE_COLORS.textDim : '#000' }}>
            {isCurrentTier ? 'Current Plan' : `Upgrade to ${label}`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function SubscriptionScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [billing, setBilling] = useState<BillingInterval>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const user = useAuthStore((s) => s.user);
  const tier = user?.subscriptionTier ?? 'starter';

  const toggleX = useSharedValue(0);
  const toggleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: toggleX.value }],
  }));

  const handleBillingToggle = (interval: BillingInterval) => {
    setBilling(interval);
    toggleX.value = withSpring(interval === 'annual' ? 100 : 0, { damping: 20, stiffness: 300 });
  };

  const handleUpgrade = async (newTier: Exclude<SubscriptionTier, 'starter'>) => {
    const priceId = STRIPE_PRICE_IDS[`${newTier}_${billing}` as keyof typeof STRIPE_PRICE_IDS];
    if (!priceId) {
      Alert.alert('Coming Soon', 'Upgrade not yet available — check back soon!');
      return;
    }
    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        Alert.alert('Sign in required', 'Please sign in to upgrade your plan.');
        return;
      }
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: { priceId },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (error) {
        console.error('[SubscriptionScreen] stripe-checkout error:', error);
        Alert.alert('Error', `Could not start checkout: ${error.message ?? 'Please try again.'}`);
        return;
      }
      if (!data?.url) {
        console.error('[SubscriptionScreen] stripe-checkout returned no URL:', data);
        Alert.alert('Error', 'Could not start checkout. Please try again.');
        return;
      }
      await Linking.openURL(data.url as string);
    } catch (err) {
      console.error('[SubscriptionScreen] unexpected error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      const { data, error } = await supabase.functions.invoke('stripe-portal', {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (error || !data?.url) {
        console.error('[SubscriptionScreen] stripe-portal error:', error);
        Alert.alert('Error', 'Could not open billing portal. Please try again.');
        return;
      }
      await Linking.openURL(data.url as string);
    } catch (err) {
      console.error('[SubscriptionScreen] manage subscription error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BASE_COLORS.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 }}>
          <Pressable onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textDim }}>
              ← Back
            </Text>
          </Pressable>
          <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 32, color: BASE_COLORS.textPrimary }}>
            Upgrade ASORIA
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <View style={{ backgroundColor: colors.primary + '33', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.primary }}>
                Current: {tier.charAt(0).toUpperCase() + tier.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Billing toggle */}
        <View style={{ paddingHorizontal: 24, marginVertical: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', backgroundColor: BASE_COLORS.surfaceHigh, borderRadius: 30, padding: 4, borderWidth: 1, borderColor: BASE_COLORS.border }}>
              <Pressable
                onPress={() => handleBillingToggle('monthly')}
                style={{ paddingHorizontal: 24, paddingVertical: 10, borderRadius: 26, backgroundColor: billing === 'monthly' ? BASE_COLORS.textPrimary : 'transparent' }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: billing === 'monthly' ? BASE_COLORS.background : BASE_COLORS.textDim }}>
                  Monthly
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleBillingToggle('annual')}
                style={{ paddingHorizontal: 24, paddingVertical: 10, borderRadius: 26, backgroundColor: billing === 'annual' ? BASE_COLORS.textPrimary : 'transparent', flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: billing === 'annual' ? BASE_COLORS.background : BASE_COLORS.textDim }}>
                  Annual
                </Text>
                <View style={{ backgroundColor: BASE_COLORS.success, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9, color: '#FFF' }}>SAVE 20%</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Tier cards */}
        <View style={{ paddingHorizontal: 24 }}>
          <TierCard
            tier="creator"
            billingInterval={billing}
            isCurrentTier={tier === 'creator'}
            isHighlighted={true}
            onUpgrade={handleUpgrade}
          />
          <TierCard
            tier="pro"
            billingInterval={billing}
            isCurrentTier={tier === 'pro'}
            isHighlighted={true}
            onUpgrade={handleUpgrade}
          />
          <TierCard
            tier="architect"
            billingInterval={billing}
            isCurrentTier={tier === 'architect'}
            isHighlighted={true}
            onUpgrade={handleUpgrade}
          />
        </View>

        {/* Manage subscription (shown for paying users) */}
        {tier !== 'starter' && (
          <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
            <Pressable
              onPress={() => { void handleManageSubscription(); }}
              disabled={isLoading}
              style={{
                borderWidth: 1,
                borderColor: BASE_COLORS.border,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textSecondary }}>
                Manage Subscription
              </Text>
            </Pressable>
          </View>
        )}

        {/* Starter note */}
        <View style={{ marginHorizontal: 24, padding: 16, backgroundColor: BASE_COLORS.surfaceHigh, borderRadius: 14, borderWidth: 1, borderColor: BASE_COLORS.border, marginBottom: 24 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: BASE_COLORS.textPrimary, marginBottom: 4 }}>
            Starter — Free
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: BASE_COLORS.textDim }}>
            3 projects · 4 rooms · 10 furniture items · 10 AI generations/mo · 3 design styles
          </Text>
        </View>

        {/* Feature comparison table */}
        <View style={{ marginHorizontal: 24 }}>
          <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 18, color: BASE_COLORS.textPrimary, marginBottom: 12 }}>
            Compare Plans
          </Text>

          {/* Table header */}
          <View style={{ flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BASE_COLORS.border }}>
            <Text style={{ flex: 2, fontFamily: 'Inter_600SemiBold', fontSize: 10, color: BASE_COLORS.textDim }}>FEATURE</Text>
            <Text style={{ flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 10, color: BASE_COLORS.textDim, textAlign: 'center' }}>FREE</Text>
            <Text style={{ flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 10, color: colors.primary, textAlign: 'center' }}>CREATOR</Text>
            <Text style={{ flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 10, color: BASE_COLORS.success, textAlign: 'center' }}>PRO</Text>
            <Text style={{ flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 10, color: BASE_COLORS.warning, textAlign: 'center' }}>ARCH</Text>
          </View>

          {FEATURES.map((row, i) => (
            <View
              key={row.label}
              style={{
                flexDirection: 'row',
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: BASE_COLORS.border + '44',
                backgroundColor: i % 2 === 0 ? 'transparent' : BASE_COLORS.surfaceHigh + '55',
              }}
            >
              <Text style={{ flex: 2, fontFamily: 'Inter_400Regular', fontSize: 11, color: BASE_COLORS.textSecondary }}>{row.label}</Text>
              <Text style={{ flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, color: BASE_COLORS.textDim, textAlign: 'center' }}>{row.starter}</Text>
              <Text style={{ flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.primary, textAlign: 'center' }}>{row.creator}</Text>
              <Text style={{ flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, color: BASE_COLORS.success, textAlign: 'center' }}>{row.pro}</Text>
              <Text style={{ flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, color: BASE_COLORS.warning, textAlign: 'center' }}>{row.architect}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}
