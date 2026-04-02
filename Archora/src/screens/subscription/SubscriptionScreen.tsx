import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Alert,
  Linking,
} from 'react-native';
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { subscriptionService } from '../../services/subscriptionService';
import { useAuthStore } from '../../stores/authStore';
import { ArchText } from '../../components/common/ArchText';
import { OvalButton } from '../../components/common/OvalButton';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { DS } from '../../theme/designSystem';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import type { SubscriptionTier } from '../../types';
import { STRIPE_PRICE_IDS, TIER_LIMITS } from '../../utils/tierLimits';

type Props = NativeStackScreenProps<RootStackParamList, 'Subscription'>;

type BillingInterval = 'monthly' | 'annual';

const PRICES: Record<Exclude<SubscriptionTier, 'starter'>, { monthly: number; annual: number; annualTotal: number }> = {
  creator:   { monthly: 14.99, annual: 11.99, annualTotal: 143.90  },
  pro:       { monthly: 24.99, annual: 19.99, annualTotal: 239.90  },
  architect: { monthly: 39.99, annual: 31.99, annualTotal: 383.90  },
};

const FEATURES = [
  { label: 'Projects',               starter: String(TIER_LIMITS.starter.maxProjects),                              creator: String(TIER_LIMITS.creator.maxProjects),                              pro: String(TIER_LIMITS.pro.maxProjects),                    architect: '∞'          },
  { label: 'Rooms / project',        starter: String(TIER_LIMITS.starter.maxRoomsPerProject),                       creator: String(TIER_LIMITS.creator.maxRoomsPerProject),                       pro: String(TIER_LIMITS.pro.maxRoomsPerProject),              architect: '∞'          },
  { label: 'Furniture / room',       starter: String(TIER_LIMITS.starter.maxFurniturePerRoom),                      creator: String(TIER_LIMITS.creator.maxFurniturePerRoom),                      pro: String(TIER_LIMITS.pro.maxFurniturePerRoom),             architect: '∞'          },
  { label: 'AI generations / mo',    starter: String(TIER_LIMITS.starter.aiGenerationsPerMonth),                    creator: String(TIER_LIMITS.creator.aiGenerationsPerMonth),                    pro: String(TIER_LIMITS.pro.aiGenerationsPerMonth),           architect: '∞'          },
  { label: 'Daily edit time',        starter: '45 min',                                                              creator: '∞',                                                                   pro: '∞',                                                    architect: '∞'          },
  { label: 'Undo steps',             starter: String(TIER_LIMITS.starter.maxUndoSteps),                             creator: String(TIER_LIMITS.creator.maxUndoSteps),                             pro: String(TIER_LIMITS.pro.maxUndoSteps),                    architect: '∞'          },
  { label: 'Auto-save',              starter: '–',                                                                   creator: '✓',                                                                   pro: '✓',                                                    architect: '✓'          },
  { label: 'Design styles',          starter: String((TIER_LIMITS.starter.availableStyles as string[]).length),     creator: '12',                                                                  pro: '12',                                                   architect: '12'         },
  { label: 'AR placement',           starter: '–',                                                                   creator: `${TIER_LIMITS.creator.arSessionsPerMonth}/mo`,                       pro: '∞',                                                    architect: '∞'          },
  { label: 'Exports / mo',           starter: `${TIER_LIMITS.starter.exportsPerMonth}`,                             creator: `${TIER_LIMITS.creator.exportsPerMonth}`,                             pro: '∞',                                                    architect: '∞'          },
  { label: 'Publish templates',      starter: '–',                                                                   creator: String(TIER_LIMITS.creator.maxPublishedTemplates),                    pro: '∞',                                                    architect: '∞'          },
  { label: 'Revenue share',          starter: '–',                                                                   creator: `${Math.round(TIER_LIMITS.creator.templateRevenueShare * 100)}%`,     pro: `${Math.round(TIER_LIMITS.pro.templateRevenueShare * 100)}%`,   architect: `${Math.round(TIER_LIMITS.architect.templateRevenueShare * 100)}%` },
  { label: 'VIP support',            starter: '–',                                                                   creator: '–',                                                                   pro: '–',                                                    architect: '✓'          },
];

const TIER_ACCENT: Record<Exclude<SubscriptionTier, 'starter'>, string> = {
  creator:   DS.colors.primary,
  pro:       DS.colors.success,
  architect: DS.colors.warning,
};

const TIER_LABEL: Record<Exclude<SubscriptionTier, 'starter'>, string> = {
  creator:   'Creator',
  pro:       'Pro',
  architect: 'Architect',
};

const TIER_PERKS: Record<Exclude<SubscriptionTier, 'starter'>, string[]> = {
  creator:   [`${TIER_LIMITS.creator.maxProjects} projects`, `${TIER_LIMITS.creator.aiGenerationsPerMonth} AI designs/mo`, `${TIER_LIMITS.creator.arSessionsPerMonth} AR sessions`, 'Auto-save', '12 design styles'],
  pro:       ['50 projects', '500 AI designs/mo', 'Unlimited AR', 'Custom textures', 'AI image reference'],
  architect: ['Unlimited everything', 'Custom AI furniture', 'CAD export', '70% template revenue', 'VIP support'],
};

function StarterCard({ isCurrent }: { isCurrent: boolean }) {
  return (
    <View style={{
      borderRadius: 20,
      borderWidth: isCurrent ? 2 : 1,
      borderColor: isCurrent ? DS.colors.primary : DS.colors.border,
      backgroundColor: DS.colors.surface,
      marginBottom: DS.spacing.md,
      overflow: 'hidden',
    }}>
      {isCurrent && (
        <View style={{ backgroundColor: DS.colors.primary, paddingVertical: 6, alignItems: 'center' }}>
          <ArchText variant="body" style={{ fontFamily: DS.font.bold, fontSize: 11, color: DS.colors.background, letterSpacing: 1.5 }}>
            CURRENT PLAN
          </ArchText>
        </View>
      )}
      <View style={{ padding: DS.spacing.lg }}>
        <ArchText variant="heading" style={{ fontSize: 22, marginBottom: DS.spacing.xs }}>Starter</ArchText>
        <ArchText variant="body" style={{ fontFamily: DS.font.bold, fontSize: 36, color: DS.colors.primary, marginBottom: DS.spacing.md }}>
          Free
        </ArchText>
        <View style={{ gap: DS.spacing.xs, marginBottom: DS.spacing.md }}>
          {['3 projects', '10 AI designs/mo', '3 design styles'].map((perk) => (
            <View key={perk} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ArchText variant="body" style={{ fontSize: 13, color: DS.colors.primaryGhost, marginRight: 8 }}>✓</ArchText>
              <ArchText variant="body" style={{ fontSize: 13, color: DS.colors.primaryDim }}>{perk}</ArchText>
            </View>
          ))}
        </View>
        <View style={{ backgroundColor: DS.colors.border, borderRadius: 50, paddingVertical: 14, alignItems: 'center' }}>
          <ArchText variant="body" style={{ fontFamily: DS.font.medium, fontSize: 14, color: DS.colors.primaryGhost }}>
            {isCurrent ? 'Current Plan' : "You're on Free"}
          </ArchText>
        </View>
      </View>
    </View>
  );
}

function TierCard({
  tier, billing, isCurrent, isHighlighted, onUpgrade, disabled,
}: {
  tier: Exclude<SubscriptionTier, 'starter'>;
  billing: BillingInterval;
  isCurrent: boolean;
  isHighlighted: boolean;
  onUpgrade: (t: Exclude<SubscriptionTier, 'starter'>) => void;
  disabled: boolean;
}) {
  const price = PRICES[tier];
  const accent = TIER_ACCENT[tier];
  const displayPrice = billing === 'annual' ? price.annual : price.monthly;
  const perks = TIER_PERKS[tier];
  const label = TIER_LABEL[tier];

  return (
    <View style={{
      borderRadius: 20,
      borderWidth: isHighlighted ? 2 : 1,
      borderColor: isHighlighted ? accent : DS.colors.border,
      backgroundColor: DS.colors.surface,
      marginBottom: DS.spacing.md,
      overflow: 'hidden',
    }}>
      {isHighlighted && (
        <View style={{ backgroundColor: accent, paddingVertical: 6, alignItems: 'center' }}>
          <ArchText variant="body" style={{ fontFamily: DS.font.bold, fontSize: 11, color: DS.colors.background, letterSpacing: 1.5 }}>
            {tier === 'creator' ? 'MOST POPULAR' : 'PROFESSIONAL'}
          </ArchText>
        </View>
      )}
      {isCurrent && !isHighlighted && (
        <View style={{ backgroundColor: DS.colors.border, paddingVertical: 6, alignItems: 'center' }}>
          <ArchText variant="body" style={{ fontFamily: DS.font.bold, fontSize: 11, color: DS.colors.primaryDim, letterSpacing: 1.5 }}>
            CURRENT PLAN
          </ArchText>
        </View>
      )}

      <View style={{ padding: DS.spacing.lg }}>
        <ArchText variant="heading" style={{ fontSize: 22, marginBottom: DS.spacing.xs }}>{label}</ArchText>

        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: DS.spacing.xs }}>
          <ArchText variant="body" style={{ fontFamily: DS.font.bold, fontSize: 36, color: accent }}>
            ${displayPrice.toFixed(2)}
          </ArchText>
          <ArchText variant="body" style={{ fontSize: 13, color: DS.colors.primaryGhost, marginLeft: 4 }}>/mo</ArchText>
        </View>

        {billing === 'annual' && (
          <ArchText variant="body" style={{ fontSize: 12, color: DS.colors.primaryDim, marginBottom: DS.spacing.md }}>
            ${price.annualTotal.toFixed(2)} billed annually · Save 20%
          </ArchText>
        )}

        <View style={{ gap: DS.spacing.xs, marginTop: billing === 'monthly' ? DS.spacing.sm : 0, marginBottom: DS.spacing.md }}>
          {perks.map((perk) => (
            <View key={perk} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ArchText variant="body" style={{ fontSize: 13, color: accent, marginRight: 8 }}>✓</ArchText>
              <ArchText variant="body" style={{ fontSize: 13, color: DS.colors.primaryDim }}>{perk}</ArchText>
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => !isCurrent && onUpgrade(tier)}
          disabled={disabled || isCurrent}
          style={{
            backgroundColor: isCurrent ? DS.colors.border : accent,
            borderRadius: 50,
            paddingVertical: 14,
            alignItems: 'center',
          }}
        >
          <ArchText variant="body" style={{
            fontFamily: DS.font.bold,
            fontSize: 15,
            color: isCurrent ? DS.colors.primaryGhost : DS.colors.background,
          }}>
            {isCurrent ? 'Current Plan' : `Upgrade to ${label}`}
          </ArchText>
        </Pressable>
      </View>
    </View>
  );
}

export function SubscriptionScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [billing, setBilling] = useState<BillingInterval>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const user = useAuthStore((s) => s.user);
  const tier = user?.subscriptionTier ?? 'starter';

  // Billing toggle animation
  const pillX = useSharedValue(0);
  const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: pillX.value }] }));

  const handleBillingToggle = (interval: BillingInterval) => {
    setBilling(interval);
    pillX.value = withSpring(interval === 'annual' ? 1 : 0, { damping: 20, stiffness: 300 });
  };

  const handleUpgrade = async (newTier: Exclude<SubscriptionTier, 'starter'>) => {
    setIsLoading(true);
    try {
      const priceId = STRIPE_PRICE_IDS[`${newTier}_${billing}` as keyof typeof STRIPE_PRICE_IDS];
      if (!priceId) {
        Alert.alert('Not available', 'Upgrade not yet available — check back soon');
        return;
      }
      const { url } = await subscriptionService.createCheckout(newTier, billing);
      if (url) await Linking.openURL(url);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not start checkout');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const { url } = await subscriptionService.getPortalUrl();
      if (url) await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Could not open subscription management');
    } finally {
      setIsLoading(false);
    }
  };

  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);

  return (
    <View style={{ flex: 1, backgroundColor: DS.colors.background }}>
      <ScreenHeader
        title="Upgrade ASORIA"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: DS.spacing.lg, paddingBottom: 48 }}
      >
        {/* Current tier badge */}
        <View style={{ flexDirection: 'row', marginBottom: DS.spacing.xl }}>
          <View style={{
            paddingHorizontal: DS.spacing.md,
            paddingVertical: DS.spacing.xs,
            borderRadius: 50,
            borderWidth: 1,
            borderColor: DS.colors.border,
          }}>
            <ArchText variant="body" style={{ fontFamily: DS.font.mono, fontSize: 11, color: DS.colors.primaryDim, letterSpacing: 1 }}>
              {tierLabel.toUpperCase()}
            </ArchText>
          </View>
        </View>

        {/* Billing toggle */}
        <View style={{ alignItems: 'center', marginBottom: DS.spacing.xl }}>
          <View style={{
            flexDirection: 'row',
            backgroundColor: DS.colors.surface,
            borderRadius: 50,
            padding: 4,
            borderWidth: 1,
            borderColor: DS.colors.border,
          }}>
            <Pressable
              onPress={() => handleBillingToggle('monthly')}
              style={{
                paddingHorizontal: DS.spacing.lg,
                paddingVertical: DS.spacing.sm,
                borderRadius: 50,
                backgroundColor: billing === 'monthly' ? DS.colors.primary : 'transparent',
              }}
            >
              <ArchText variant="body" style={{
                fontFamily: DS.font.medium,
                fontSize: 14,
                color: billing === 'monthly' ? DS.colors.background : DS.colors.primaryDim,
              }}>
                Monthly
              </ArchText>
            </Pressable>
            <Pressable
              onPress={() => handleBillingToggle('annual')}
              style={{
                paddingHorizontal: DS.spacing.lg,
                paddingVertical: DS.spacing.sm,
                borderRadius: 50,
                flexDirection: 'row',
                alignItems: 'center',
                gap: DS.spacing.xs,
                backgroundColor: billing === 'annual' ? DS.colors.primary : 'transparent',
              }}
            >
              <ArchText variant="body" style={{
                fontFamily: DS.font.medium,
                fontSize: 14,
                color: billing === 'annual' ? DS.colors.background : DS.colors.primaryDim,
              }}>
                Annual
              </ArchText>
              <View style={{ backgroundColor: DS.colors.success, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 50 }}>
                <ArchText variant="body" style={{ fontFamily: DS.font.bold, fontSize: 9, color: DS.colors.background }}>
                  SAVE 20%
                </ArchText>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Tier cards */}
        <StarterCard isCurrent={tier === 'starter'} />
        <TierCard tier="creator"   billing={billing} isCurrent={tier === 'creator'}   isHighlighted onUpgrade={handleUpgrade}   disabled={isLoading} />
        <TierCard tier="pro"       billing={billing} isCurrent={tier === 'pro'}       isHighlighted={false} onUpgrade={handleUpgrade} disabled={isLoading} />
        <TierCard tier="architect" billing={billing} isCurrent={tier === 'architect'} isHighlighted={false} onUpgrade={handleUpgrade} disabled={isLoading} />

        {/* Manage subscription for paying users */}
        {tier !== 'starter' && (
          <View style={{ marginBottom: DS.spacing.lg }}>
            <OvalButton
              label={isLoading ? 'Loading…' : 'Manage Subscription'}
              variant="outline"
              fullWidth
              onPress={() => { void handleManageSubscription(); }}
            />
          </View>
        )}

        {/* Feature comparison table */}
        <ArchText variant="heading" style={{ fontSize: 18, marginBottom: DS.spacing.sm }}>
          Compare Plans
        </ArchText>

        {/* Table header */}
        <View style={{
          flexDirection: 'row',
          paddingVertical: DS.spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: DS.colors.border,
          marginBottom: DS.spacing.xs,
        }}>
          <ArchText variant="body" style={{ flex: 2, fontFamily: DS.font.medium, fontSize: 10, color: DS.colors.primaryGhost, letterSpacing: 1, textTransform: 'uppercase' }}>Feature</ArchText>
          <ArchText variant="body" style={{ flex: 1, fontFamily: DS.font.mono, fontSize: 9, color: DS.colors.primaryGhost, textAlign: 'center' }}>FREE</ArchText>
          <ArchText variant="body" style={{ flex: 1, fontFamily: DS.font.mono, fontSize: 9, color: DS.colors.primary, textAlign: 'center' }}>CRTV</ArchText>
          <ArchText variant="body" style={{ flex: 1, fontFamily: DS.font.mono, fontSize: 9, color: DS.colors.success, textAlign: 'center' }}>PRO</ArchText>
          <ArchText variant="body" style={{ flex: 1, fontFamily: DS.font.mono, fontSize: 9, color: DS.colors.warning, textAlign: 'center' }}>ARCH</ArchText>
        </View>

        {FEATURES.map((row, i) => (
          <View
            key={row.label}
            style={{
              flexDirection: 'row',
              paddingVertical: DS.spacing.sm,
              borderBottomWidth: 1,
              borderBottomColor: i % 2 === 0 ? DS.colors.border : 'transparent',
              backgroundColor: i % 2 !== 0 ? '#FFFFFF06' : 'transparent',
            }}
          >
            <ArchText variant="body" style={{ flex: 2, fontSize: 11, color: DS.colors.primaryDim }}>{row.label}</ArchText>
            <ArchText variant="body" style={{ flex: 1, fontFamily: DS.font.mono, fontSize: 11, color: DS.colors.primaryGhost, textAlign: 'center' }}>{row.starter}</ArchText>
            <ArchText variant="body" style={{ flex: 1, fontFamily: DS.font.mono, fontSize: 11, color: DS.colors.primary, textAlign: 'center' }}>{row.creator}</ArchText>
            <ArchText variant="body" style={{ flex: 1, fontFamily: DS.font.mono, fontSize: 11, color: DS.colors.success, textAlign: 'center' }}>{row.pro}</ArchText>
            <ArchText variant="body" style={{ flex: 1, fontFamily: DS.font.mono, fontSize: 11, color: DS.colors.warning, textAlign: 'center' }}>{row.architect}</ArchText>
          </View>
        ))}

        <View style={{ height: DS.spacing.xl }} />
        <ArchText variant="body" style={{ textAlign: 'center', fontSize: 11, color: DS.colors.primaryGhost }}>
          All plans include 7-day free trial · Cancel anytime
        </ArchText>
      </ScrollView>
    </View>
  );
}
