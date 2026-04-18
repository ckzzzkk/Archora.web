import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { ArchText } from '../../../components/common/ArchText';
import { OvalButton } from '../../../components/common/OvalButton';
import { DS } from '../../../theme/designSystem';
import type { ArchitectCardData } from '../../../data/architectProfiles';
import { ARCHITECT_CARDS, TIER_ARCHITECT_COUNT } from '../../../data/architectProfiles';
import type { SubscriptionTier } from '../../../types';

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onContinue: () => void;
  onUseDefault: () => void;
  userTier: SubscriptionTier;
}

const TIER_ORDER: SubscriptionTier[] = ['starter', 'creator', 'pro', 'architect'];

function ArchitectCard({
  architect,
  selected,
  locked,
  tierRequired,
  onSelect,
}: {
  architect: ArchitectCardData;
  selected: boolean;
  locked: boolean;
  tierRequired: SubscriptionTier;
  onSelect: () => void;
}) {
  const iconMap: Record<string, string> = {
    'frank-lloyd-wright': '🏠',
    'zaha-hadid': '⚡',
    'tadao-ando': '🧱',
    'norman-foster': '🔧',
    'le-corbusier': '⚙️',
    'peter-zumthor': '🌿',
    'bjarke-ingels': '🏔️',
    'kengo-kuma': '🎋',
    'santiago-calatrava': '🦢',
    'alain-carle': '❄️',
    'louis-kahn': '💡',
    'rem-koolhaas': '🌆',
  };

  const icon = iconMap[architect.id] ?? '🏛️';

  return (
    <Pressable
      onPress={locked ? undefined : onSelect}
      style={{
        flex: 1,
        minWidth: 140,
        backgroundColor: locked ? `${DS.colors.surface}60` : DS.colors.surface,
        borderRadius: 20,
        padding: 16,
        borderWidth: 2,
        borderColor: selected ? DS.colors.accent : DS.colors.border,
        opacity: locked ? 0.5 : 1,
      }}
    >
      {selected && (
        <View style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: 10, backgroundColor: DS.colors.accent, alignItems: 'center', justifyContent: 'center' }}>
          <ArchText variant="body" style={{ color: '#000', fontSize: 12, fontWeight: '700' }}>✓</ArchText>
        </View>
      )}
      {locked && (
        <View style={{ position: 'absolute', top: 10, right: 10 }}>
          <ArchText variant="body" style={{ fontSize: 10, color: DS.colors.warning }}>🔒</ArchText>
        </View>
      )}

      <ArchText variant="body" style={{ fontSize: 24, marginBottom: 8 }}>{icon}</ArchText>
      <ArchText variant="body" style={{ fontFamily: DS.font.medium, fontSize: 13, color: DS.colors.primary, marginBottom: 2 }}>
        {architect.name.split(' ').slice(0, 2).join(' ')}
      </ArchText>
      <ArchText variant="body" style={{ fontSize: 10, color: DS.colors.primaryGhost, marginBottom: 8 }}>
        {architect.era.split(',')[0]}
      </ArchText>
      <ArchText variant="body" style={{ fontSize: 11, color: DS.colors.accent, fontStyle: 'italic', marginBottom: 8 }}>
        "{architect.tagline}"
      </ArchText>
      <ArchText variant="body" style={{ fontSize: 10, color: DS.colors.primaryDim, lineHeight: 14 }} numberOfLines={3}>
        {architect.spatialSignature}
      </ArchText>
      {locked && (
        <View style={{ marginTop: 8, backgroundColor: `${DS.colors.warning}22`, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' }}>
          <ArchText variant="body" style={{ fontSize: 9, color: DS.colors.warning, fontFamily: DS.font.medium }}>
            {tierRequired.charAt(0).toUpperCase() + tierRequired.slice(1)}+
          </ArchText>
        </View>
      )}
    </Pressable>
  );
}

const ARCHITECT_TIER_MAP: Record<string, SubscriptionTier> = {
  'frank-lloyd-wright': 'starter',
  'zaha-hadid': 'starter',
  'tadao-ando': 'starter',
  'norman-foster': 'creator',
  'le-corbusier': 'creator',
  'peter-zumthor': 'creator',
  'bjarke-ingels': 'creator',
  'kengo-kuma': 'pro',
  'alain-carle': 'pro',
  'louis-kahn': 'pro',
  'santiago-calatrava': 'pro',
  'rem-koolhaas': 'architect',
};

function isTierUnlocked(architectTier: SubscriptionTier, userTier: SubscriptionTier): boolean {
  const archIdx = TIER_ORDER.indexOf(architectTier);
  const userIdx = TIER_ORDER.indexOf(userTier);
  return userIdx >= archIdx;
}

export function Step0Architect({ selectedId, onSelect, onContinue, onUseDefault, userTier }: Props) {
  const visibleArchitects = ARCHITECT_CARDS.slice(0, TIER_ARCHITECT_COUNT[userTier]);

  return (
    <View style={{ flex: 1, paddingHorizontal: 20 }}>
      <ArchText variant="heading" style={{ fontSize: 22, color: DS.colors.primary, marginBottom: 8, marginTop: 8 }}>
        Architect Philosophy
      </ArchText>
      <ArchText variant="body" style={{ fontSize: 14, color: DS.colors.primaryDim, marginBottom: 20, lineHeight: 20 }}>
        Every great building starts with an idea. Which architect's thinking should guide your design?
      </ArchText>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          {ARCHITECT_CARDS.map((architect) => {
            const tierRequired = ARCHITECT_TIER_MAP[architect.id] ?? 'starter';
            const locked = !isTierUnlocked(tierRequired, userTier);
            return (
              <ArchitectCard
                key={architect.id}
                architect={architect}
                selected={selectedId === architect.id}
                locked={locked}
                tierRequired={tierRequired}
                onSelect={() => onSelect(architect.id)}
              />
            );
          })}
        </View>
      </ScrollView>

      <View style={{ paddingTop: 12, paddingBottom: 8, gap: 12 }}>
        {selectedId && (
          <OvalButton
            label="Use Selected Architect"
            onPress={onContinue}
            variant="filled"
            fullWidth
          />
        )}
        <Pressable onPress={onUseDefault} style={{ alignItems: 'center' }}>
          <ArchText variant="body" style={{ fontSize: 13, color: DS.colors.primaryGhost }}>
            Use blended philosophy — no specific architect
          </ArchText>
        </Pressable>
      </View>
    </View>
  );
}