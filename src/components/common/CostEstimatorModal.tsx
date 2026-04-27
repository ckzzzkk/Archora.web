import React, { useMemo, useEffect } from 'react';
import { View, Pressable, ScrollView, Modal, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArchText } from './ArchText';
import { DS } from '../../theme/designSystem';
import { useBlueprintStore } from '../../stores/blueprintStore';
import type { CostLineItem } from '../../utils/costEstimator';
import {
  generateCostEstimate,
  formatCurrency,
  LABOUR_MULTIPLIER,
  CONTINGENCY_PCT,
} from '../../utils/costEstimator';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_SPRING = { damping: 22, stiffness: 280 } as const;

interface CostEstimatorModalProps {
  visible: boolean;
  onClose: () => void;
}

function CategoryIcon({ category }: { category: CostLineItem['category'] }) {
  const icons: Record<CostLineItem['category'], string> = {
    flooring: '🪵',
    walls: '🧱',
    ceiling: '🏗',
    exterior: '🏭',
    fixtures: '🚿',
    labour: '👷',
    contingency: '📋',
  };
  return <>{icons[category] ?? '📦'}</>;
}

function CostRow({ item }: { item: CostLineItem }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: DS.colors.border,
    }}>
      <View style={{ width: 28, alignItems: 'center' }}>
        <ArchText variant="body" style={{ fontSize: 16 }}><CategoryIcon category={item.category} /></ArchText>
      </View>
      <View style={{ flex: 1 }}>
        <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: DS.colors.primary }} numberOfLines={1}>
          {item.description}
        </ArchText>
        <ArchText variant="body" style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: DS.colors.primaryDim }}>
          {item.quantity > 1 ? `${item.quantity.toFixed(1)} m² @ ` : ''}{formatCurrency(item.unitPrice)}/m²
        </ArchText>
      </View>
      <ArchText variant="body" style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 13, color: DS.colors.primary }}>
        {formatCurrency(item.total)}
      </ArchText>
    </View>
  );
}

function SummaryRow({ label, amount, highlight = false }: { label: string; amount: number; highlight?: boolean }) {
  return (
    <View style={{
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingVertical: 8,
    }}>
      <ArchText variant="body" style={{
        fontFamily: 'Inter_400Regular', fontSize: 14,
        color: highlight ? DS.colors.success : DS.colors.primary,
      }}>
        {label}
      </ArchText>
      <ArchText variant="body" style={{
        fontFamily: highlight ? 'ArchitectsDaughter_400Regular' : 'JetBrainsMono_400Regular',
        fontSize: highlight ? 18 : 14,
        color: highlight ? DS.colors.success : DS.colors.primary,
      }}>
        {formatCurrency(amount)}
      </ArchText>
    </View>
  );
}

export function CostEstimatorModal({ visible, onClose }: CostEstimatorModalProps) {
  const insets = useSafeAreaInsets();
  const blueprint = useBlueprintStore((s) => s.blueprint);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  const estimate = useMemo(() => {
    if (!blueprint) return null;
    return generateCostEstimate(blueprint);
  }, [blueprint]);

  useEffect(() => {
    if (visible && estimate) {
      backdropOpacity.value = withSpring(1, SHEET_SPRING);
      translateY.value = withSpring(0, SHEET_SPRING);
    } else {
      backdropOpacity.value = withSpring(0, SHEET_SPRING);
      translateY.value = withSpring(SCREEN_HEIGHT, SHEET_SPRING);
    }
  }, [visible, estimate]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  if (!estimate) return null;

  const grouped = {
    flooring: estimate.lineItems.filter(l => l.category === 'flooring'),
    walls: estimate.lineItems.filter(l => l.category === 'walls'),
    ceiling: estimate.lineItems.filter(l => l.category === 'ceiling'),
    exterior: estimate.lineItems.filter(l => l.category === 'exterior'),
    fixtures: estimate.lineItems.filter(l => l.category === 'fixtures'),
  };

  return (
    <>
      <Animated.View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', opacity: backdropOpacity }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>
      <Animated.View
        style={[
          sheetStyle,
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: DS.colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 16,
            paddingBottom: insets.bottom + 16,
            maxHeight: '88%',
          },
        ]}
      >
        {/* Drag handle */}
        <View style={{ alignItems: 'center', marginBottom: 12 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: DS.colors.border }} />
        </View>

        {/* Header */}
        <View style={{ paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View>
            <ArchText variant="body" style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 20, color: DS.colors.primary }}>
              Cost Estimate
            </ArchText>
            <ArchText variant="body" style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 10, color: DS.colors.primaryDim, marginTop: 2 }}>
              {estimate.totalAreaM2} m² total floor area · {formatCurrency(estimate.costPerM2)}/m²
            </ArchText>
          </View>
          <Pressable
            onPress={onClose}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: DS.colors.surfaceHigh, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: DS.colors.border }}
          >
            <ArchText variant="body" style={{ color: DS.colors.primaryDim, fontSize: 14 }}>✕</ArchText>
          </Pressable>
        </View>

        <ScrollView style={{ paddingHorizontal: 20 }} contentContainerStyle={{ paddingBottom: 16 }}>
          {(['flooring', 'walls', 'ceiling', 'exterior', 'fixtures'] as const).map(cat => {
            const items = grouped[cat];
            if (items.length === 0) return null;
            return (
              <View key={cat}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, marginBottom: 6 }}>
                  <ArchText variant="body" style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: DS.colors.primaryDim, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {cat}
                  </ArchText>
                  <View style={{ flex: 1, height: 1, backgroundColor: DS.colors.border }} />
                </View>
                {items.map((item, i) => <CostRow key={i} item={item} />)}
              </View>
            );
          })}

          {/* Summary */}
          <View style={{ marginTop: 20, paddingTop: 16, borderTopWidth: 1.5, borderTopColor: DS.colors.primary, gap: 4 }}>
            <SummaryRow label="Materials" amount={estimate.subtotalMaterials} />
            <SummaryRow label={`Labour (${Math.round(LABOUR_MULTIPLIER * 100)}%)`} amount={estimate.subtotalLabour} />
            <SummaryRow label={`Contingency (${CONTINGENCY_PCT * 100}%)`} amount={estimate.contingency} />
            <View style={{ height: 8 }} />
            <SummaryRow label="Grand Total" amount={estimate.grandTotal} highlight />
          </View>

          <ArchText variant="body" style={{
            fontFamily: 'Inter_400Regular', fontSize: 10, color: DS.colors.primaryDim,
            textAlign: 'center', marginTop: 16, lineHeight: 14,
          }}>
            Estimates are indicative only. Final costs depend on location,
            contractor, and material choices. Includes {CONTINGENCY_PCT * 100}% contingency buffer.
          </ArchText>
        </ScrollView>
      </Animated.View>
      </>
    );
  }
