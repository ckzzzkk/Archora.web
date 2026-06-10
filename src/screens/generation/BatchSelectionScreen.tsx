import React, { useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay, FadeIn,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { DS } from '../../theme/designSystem';
import { BASE_COLORS } from '../../theme/colors';
import { ArchText } from '../../components/common/ArchText';
import { GridBackground } from '../../components/common/GridBackground';
import { OvalButton } from '../../components/common/OvalButton';
import { useGenerationBatchStore } from '../../stores/generationBatchStore';
import { useBlueprintStore } from '../../stores/blueprintStore';
import { useSession } from '../../auth/useSession';
import type { RootStackParamList } from '../../navigation/types';
import type { BlueprintData, Wall } from '../../types/blueprint';
import type { SubscriptionTier } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BatchSelection'>;

/** Renders a blueprint's walls as a scaled mini floor plan so variations are visibly distinct. */
function FloorPlanThumbnail({ walls }: { walls: Wall[] }) {
  if (walls.length === 0) {
    return <View style={{ flex: 1, backgroundColor: '#1A2535' }} />;
  }

  // Bounding box across all wall endpoints
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const w of walls) {
    minX = Math.min(minX, w.start.x, w.end.x);
    minY = Math.min(minY, w.start.y, w.end.y);
    maxX = Math.max(maxX, w.start.x, w.end.x);
    maxY = Math.max(maxY, w.start.y, w.end.y);
  }

  const VB_W = 140, VB_H = 100, PAD = 12;
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const scale = Math.min((VB_W - PAD * 2) / spanX, (VB_H - PAD * 2) / spanY);
  // Centre the plan within the viewBox
  const offsetX = (VB_W - spanX * scale) / 2;
  const offsetY = (VB_H - spanY * scale) / 2;
  const tx = (x: number) => offsetX + (x - minX) * scale;
  const ty = (y: number) => offsetY + (y - minY) * scale;

  const d = walls
    .map((w) => `M${tx(w.start.x).toFixed(1)} ${ty(w.start.y).toFixed(1)} L${tx(w.end.x).toFixed(1)} ${ty(w.end.y).toFixed(1)}`)
    .join(' ');

  return (
    <View style={{ flex: 1, backgroundColor: '#1A2535', overflow: 'hidden' }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Path d={d} stroke={DS.colors.primary} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
    </View>
  );
}

function VariationCard({
  blueprint, index, selected, onPress,
}: {
  blueprint: BlueprintData;
  index: number;
  selected: boolean;
  onPress: () => void;
}) {
  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    const delay = index * 80;
    translateY.value = withDelay(delay, withSpring(0, { damping: 16, stiffness: 120 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const rooms = blueprint.rooms?.length ?? 0;
  const area = blueprint.metadata?.totalArea ?? 0;
  const style = blueprint.metadata?.style ?? '';

  return (
    <Animated.View style={[enterStyle, { width: '50%', padding: 6 }]}>
      <Pressable
        onPress={onPress}
        style={{
          backgroundColor: DS.colors.surface,
          borderRadius: DS.radius.card,
          overflow: 'hidden',
          borderWidth: selected ? 3 : 1,
          borderColor: selected ? DS.colors.accent : DS.colors.border,
        }}
      >
        <View style={{ height: 120 }}>
          <FloorPlanThumbnail walls={blueprint.walls ?? []} />
        </View>
        <View style={{ padding: 12 }}>
          <ArchText variant="body" style={{ fontFamily: DS.font.heading, fontSize: 15, color: DS.colors.primary }}>
            Variation {index + 1}
          </ArchText>
          <ArchText variant="caption" style={{ fontFamily: DS.font.mono, fontSize: 10, color: DS.colors.primaryDim, marginTop: 6, textTransform: 'uppercase' }}>
            {rooms} rooms · {Math.round(area)} m² · {style}
          </ArchText>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function BatchSelectionScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const candidates = useGenerationBatchStore((s) => s.candidates);
  const batchActions = useGenerationBatchStore((s) => s.actions);
  const blueprintActions = useBlueprintStore((s) => s.actions);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const tier = (user?.subscriptionTier ?? 'starter') as SubscriptionTier;

  const handleClose = () => {
    batchActions.clear();
    navigation.navigate('Main');
  };

  const handleChoose = async () => {
    const chosen = candidates[selectedIndex];
    if (!chosen) return;
    await blueprintActions.loadBlueprint(chosen, tier);
    batchActions.clear();
    navigation.navigate('Workspace', { projectId: chosen.id });
  };

  // Defensive: nothing staged (e.g. deep-linked) — bounce back to Main
  if (candidates.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: DS.colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <GridBackground />
        <ArchText variant="body" style={{ color: DS.colors.primaryDim, textAlign: 'center', marginBottom: DS.spacing.lg }}>
          No designs to choose from.
        </ArchText>
        <OvalButton label="back to home" onPress={handleClose} variant="outline" />
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(150)} style={{ flex: 1, backgroundColor: DS.colors.background, paddingTop: insets.top }}>
      <GridBackground />

      <View style={{ paddingHorizontal: DS.spacing.lg, paddingTop: DS.spacing.md, paddingBottom: DS.spacing.sm }}>
        <Pressable onPress={handleClose} hitSlop={12} style={{ alignSelf: 'flex-start', marginBottom: DS.spacing.sm }}>
          <ArchText variant="body" style={{ color: DS.colors.primaryDim, fontSize: 22 }}>✕</ArchText>
        </Pressable>
        <ArchText variant="heading">choose your design</ArchText>
        <ArchText variant="caption" style={{ color: DS.colors.primaryDim, marginTop: DS.spacing.xs }}>
          {candidates.length} variations generated — pick the one you like
        </ArchText>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: DS.spacing.sm, paddingBottom: DS.spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {candidates.map((bp, i) => (
            <VariationCard
              key={bp.id ?? i}
              blueprint={bp}
              index={i}
              selected={selectedIndex === i}
              onPress={() => setSelectedIndex(i)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: DS.spacing.lg, paddingBottom: insets.bottom + DS.spacing.lg, paddingTop: DS.spacing.sm }}>
        <OvalButton
          label="open this design"
          onPress={handleChoose}
          variant="outline"
          size="large"
          fullWidth
        />
      </View>
    </Animated.View>
  );
}
