// src/screens/account/NavCustomiserScreen.tsx
import React from 'react';
import { View, Pressable, ScrollView, Switch } from 'react-native';
import { ArchText } from '../../components/common/ArchText';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAppearanceStore, MIN_VISIBLE_TABS, type TabKey } from '../../stores/appearanceStore';
import { useTierGate } from '../../hooks/useTierGate';
import { useUIStore } from '../../stores/uiStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'NavCustomiser'>;

const LABELS: Record<TabKey, string> = {
  Home: 'Home', Create: 'Create', Inspo: 'Inspiration', AR: 'AR', Account: 'Account',
};

export function NavCustomiserScreen({ navigation }: Props) {
  const C = useThemeColors();
  const { allowed, requiredTier } = useTierGate('appearanceCustomization');
  const showToast = useUIStore((s) => s.actions.showToast);

  const nav = useAppearanceStore((s) => s.nav);
  const reorderTabs = useAppearanceStore((s) => s.reorderTabs);
  const toggleTabHidden = useAppearanceStore((s) => s.toggleTabHidden);
  const setShowLabels = useAppearanceStore((s) => s.setShowLabels);

  const move = (index: number, dir: -1 | 1) => {
    const next = [...nav.order];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorderTabs(next);
  };

  const onToggleHidden = (tab: TabKey) => {
    const visible = nav.order.length - nav.hidden.length;
    if (!nav.hidden.includes(tab) && visible - 1 < MIN_VISIBLE_TABS) {
      showToast(`Keep at least ${MIN_VISIBLE_TABS} tabs visible`, 'warning');
      return;
    }
    toggleTabHidden(tab);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <View style={{ padding: 24, paddingTop: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <ArchText variant="body" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 28, color: C.primary }}>
          Nav Layout
        </ArchText>
        <Pressable onPress={() => navigation.goBack()}>
          <ArchText variant="body" style={{ color: C.primaryGhost, fontFamily: 'Inter_400Regular' }}>Done</ArchText>
        </Pressable>
      </View>

      {!allowed ? (
        <View style={{ padding: 24, gap: 12 }}>
          <ArchText variant="body" style={{ color: C.primaryDim, fontFamily: 'Inter_400Regular' }}>
            Customizing your navigation is a {requiredTier ?? 'Creator'} feature.
          </ArchText>
          <Pressable
            onPress={() => navigation.navigate('Subscription', { feature: 'appearanceCustomization' })}
            style={{ backgroundColor: C.accent, borderRadius: 50, paddingVertical: 14, alignItems: 'center' }}
          >
            <ArchText variant="body" style={{ color: C.background, fontFamily: 'Inter_600SemiBold' }}>Upgrade</ArchText>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <ArchText variant="body" style={{ color: C.primary, fontFamily: 'Inter_500Medium' }}>Show labels</ArchText>
            <Switch
              value={nav.showLabels}
              onValueChange={setShowLabels}
              trackColor={{ false: C.border, true: C.accent }}
              thumbColor={nav.showLabels ? C.background : C.primaryDim}
              accessibilityLabel="Show tab labels"
            />
          </View>

          {nav.order.map((tab, i) => {
            const hidden = nav.hidden.includes(tab);
            return (
              <View
                key={tab}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: C.surface, borderRadius: 20, padding: 14,
                  borderWidth: 1, borderColor: C.border, opacity: hidden ? 0.5 : 1,
                }}
              >
                <ArchText variant="body" style={{ color: C.primary, fontFamily: 'Inter_500Medium' }}>{LABELS[tab]}</ArchText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
                  <Pressable
                    onPress={() => move(i, -1)}
                    disabled={i === 0}
                    accessibilityRole="button"
                    accessibilityLabel={`Move ${LABELS[tab]} tab up`}
                    accessibilityState={{ disabled: i === 0 }}
                  >
                    <ArchText variant="body" style={{ color: i === 0 ? C.primaryGhost : C.primary, fontSize: 18 }}>↑</ArchText>
                  </Pressable>
                  <Pressable
                    onPress={() => move(i, 1)}
                    disabled={i === nav.order.length - 1}
                    accessibilityRole="button"
                    accessibilityLabel={`Move ${LABELS[tab]} tab down`}
                    accessibilityState={{ disabled: i === nav.order.length - 1 }}
                  >
                    <ArchText variant="body" style={{ color: i === nav.order.length - 1 ? C.primaryGhost : C.primary, fontSize: 18 }}>↓</ArchText>
                  </Pressable>
                  {tab === 'Account' ? (
                    <ArchText
                      variant="body"
                      style={{ color: C.primaryGhost, fontFamily: 'Inter_500Medium' }}
                    >
                      Always shown
                    </ArchText>
                  ) : (
                    <Pressable
                      onPress={() => onToggleHidden(tab)}
                      accessibilityRole="button"
                      accessibilityLabel={`${hidden ? 'Show' : 'Hide'} ${LABELS[tab]} tab`}
                    >
                      <ArchText variant="body" style={{ color: hidden ? C.primaryGhost : C.accent, fontFamily: 'Inter_500Medium' }}>
                        {hidden ? 'Hidden' : 'Shown'}
                      </ArchText>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
