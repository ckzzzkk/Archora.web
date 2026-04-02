import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  RefreshControl,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { FeedCard } from '../../components/social/FeedCard';
import { CompassRoseLoader } from '../../components/common/CompassRoseLoader';
import { ArchText } from '../../components/common/ArchText';
import { OvalButton } from '../../components/common/OvalButton';
import { useFeed } from '../../hooks/useFeed';
import { useHaptics } from '../../hooks/useHaptics';
import { useUIStore } from '../../stores/uiStore';
import { DS } from '../../theme/designSystem';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface ChipConfig {
  label: string;
  buildingType?: string;
  trendingOrNew?: 'trending' | 'new';
}

const CHIPS: ChipConfig[] = [
  { label: 'All' },
  { label: 'Houses', buildingType: 'house' },
  { label: 'Apartments', buildingType: 'apartment' },
  { label: 'Offices', buildingType: 'office' },
  { label: 'Studios', buildingType: 'studio' },
  { label: 'Commercial', buildingType: 'commercial' },
  { label: 'Trending', trendingOrNew: 'trending' },
  { label: 'New', trendingOrNew: 'new' },
];

function FilterChipsRow({
  activeChip,
  onChipPress,
}: {
  activeChip: string;
  onChipPress: (chip: ChipConfig) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: DS.spacing.lg,
        paddingBottom: DS.spacing.sm,
        gap: DS.spacing.xs,
      }}
    >
      {CHIPS.map((chip) => {
        const active = activeChip === chip.label;
        return (
          <Pressable
            key={chip.label}
            onPress={() => onChipPress(chip)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 999,
              borderWidth: 1.5,
              borderColor: active ? DS.colors.primary : DS.colors.border,
              backgroundColor: active ? 'rgba(200,200,200,0.12)' : 'transparent',
            }}
          >
            <ArchText variant="body" style={{
              fontFamily: DS.font.medium,
              fontSize: 12,
              color: active ? DS.colors.primary : DS.colors.primaryDim,
            }}>
              {chip.label}
            </ArchText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function FeedEmptyState() {
  const navigation = useNavigation<Nav>();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      {/* Drafting compass SVG */}
      <Svg width={64} height={64} viewBox="0 0 48 48" style={{ marginBottom: DS.spacing.md }}>
        <Circle cx="24" cy="24" r="20" stroke={DS.colors.border} strokeWidth="1.5" fill="none" />
        <Path d="M24 8 L22 20 L26 20 Z" stroke={DS.colors.primaryGhost} strokeWidth="1.2" fill="none" strokeLinejoin="round" />
        <Path d="M24 40 L22 28 L26 28 Z" stroke={DS.colors.primaryGhost} strokeWidth="1.2" fill="none" strokeLinejoin="round" />
        <Circle cx="24" cy="24" r="3" stroke={DS.colors.primaryDim} strokeWidth="1.2" fill="none" />
      </Svg>
      <ArchText variant="heading" style={{ fontSize: 22, textAlign: 'center', marginBottom: DS.spacing.xs }}>
        No designs yet
      </ArchText>
      <ArchText variant="body" style={{ fontSize: DS.fontSize.sm, color: DS.colors.primaryDim, textAlign: 'center', marginBottom: DS.spacing.xl }}>
        Be the first to share your blueprint.
      </ArchText>
      <OvalButton
        label="Create a Design"
        variant="filled"
        onPress={() => navigation.navigate('Generation')}
      />
    </View>
  );
}

interface MasonryItemProps {
  item: import('../../types').Template;
  index: number;
  onPress: (id: string) => void;
}

function MasonryItem({ item, index, onPress }: MasonryItemProps) {
  const height = index % 2 === 0 ? 200 : 260;
  return (
    <FeedCard
      template={item}
      index={index}
      height={height}
      onPress={() => onPress(item.id)}
    />
  );
}

export function FeedScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { light } = useHaptics();
  const showToast = useUIStore((s) => s.actions.showToast);

  const {
    templates,
    isLoading,
    isRefreshing,
    isFetchingMore,
    hasMore,
    loadError,
    filter,
    setFilter,
    refresh,
    fetchMore,
  } = useFeed();

  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeChip, setActiveChip] = useState('All');

  // Entry animations
  const headerOp = useSharedValue(0);
  const headerY  = useSharedValue(-16);
  const bodyOp   = useSharedValue(0);

  React.useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    headerOp.value = withTiming(1, { duration: 300, easing: ease });
    headerY.value  = withTiming(0, { duration: 300, easing: ease });
    bodyOp.value   = withDelay(150, withTiming(1, { duration: 300, easing: ease }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOp.value, transform: [{ translateY: headerY.value }] }));
  const bodyStyle   = useAnimatedStyle(() => ({ opacity: bodyOp.value }));

  // Search bar collapse
  const searchBarHeight = useSharedValue(0);
  const searchBarStyle = useAnimatedStyle(() => ({
    height: searchBarHeight.value,
    overflow: 'hidden',
  }));

  const toggleSearch = useCallback(() => {
    light();
    const next = !searchVisible;
    setSearchVisible(next);
    searchBarHeight.value = withSpring(next ? 52 : 0, { damping: 16, stiffness: 200 });
    if (!next) {
      setSearchText('');
      setFilter({ ...filter, search: undefined });
    }
  }, [searchVisible, searchBarHeight, light, filter, setFilter]);

  const handleChip = useCallback((chip: ChipConfig) => {
    light();
    setActiveChip(chip.label);
    setFilter({
      buildingType: chip.buildingType,
      trendingOrNew: chip.trendingOrNew,
      search: searchText || undefined,
    });
  }, [light, setFilter, searchText]);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
    setFilter({ ...filter, search: text || undefined });
  }, [filter, setFilter]);

  const handleItemPress = useCallback((templateId: string) => {
    navigation.navigate('TemplateDetail', { templateId });
  }, [navigation]);

  const handleEndReached = useCallback(() => {
    if (hasMore && !isFetchingMore) void fetchMore();
  }, [hasMore, isFetchingMore, fetchMore]);

  const renderItem = useCallback(({
    item, index,
  }: { item: import('../../types').Template; index: number }) =>
    <MasonryItem item={item} index={index} onPress={handleItemPress} />,
    [handleItemPress],
  );

  const keyExtractor = useCallback((item: import('../../types').Template) => item.id, []);

  return (
    <View style={{ flex: 1, backgroundColor: DS.colors.background }}>
      {/* ── Header ── */}
      <Animated.View style={[{
        paddingTop: insets.top + 16,
        paddingHorizontal: DS.spacing.lg,
        paddingBottom: DS.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }, headerStyle]}>
        <ArchText variant="heading" style={{ fontSize: 28 }}>Inspo</ArchText>
        <View style={{ flexDirection: 'row', gap: DS.spacing.xs }}>
          {/* Search */}
          <Pressable
            onPress={toggleSearch}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: searchVisible ? DS.colors.primary : DS.colors.surface,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path
                d="M21 21L15 15M17 11C17 14.3137 14.3137 17 11 17C7.68629 17 5 14.3137 5 11C5 7.68629 7.68629 5 11 5C14.3137 5 17 7.68629 17 11Z"
                stroke={searchVisible ? DS.colors.background : DS.colors.primaryDim}
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </Svg>
          </Pressable>
          {/* Bell */}
          <Pressable
            onPress={() => showToast('Notifications coming soon')}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: DS.colors.surface,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path
                d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                stroke={DS.colors.primaryDim}
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>
        </View>
      </Animated.View>

      <Animated.View style={bodyStyle}>
        {/* ── Search bar ── */}
        <Animated.View style={[searchBarStyle, { paddingHorizontal: DS.spacing.lg, marginBottom: DS.spacing.xs }]}>
          <View style={{
            height: 44,
            backgroundColor: DS.colors.surface,
            borderRadius: 22,
            paddingHorizontal: DS.spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <Svg width={14} height={14} viewBox="0 0 24 24" style={{ marginRight: 8 }}>
              <Path
                d="M21 21L15 15M17 11C17 14.3137 14.3137 17 11 17C7.68629 17 5 14.3137 5 11C5 7.68629 7.68629 5 11 5C14.3137 5 17 7.68629 17 11Z"
                stroke={DS.colors.primaryGhost}
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </Svg>
            <TextInput
              value={searchText}
              onChangeText={handleSearch}
              placeholder="Search designs..."
              placeholderTextColor={DS.colors.primaryGhost}
              autoFocus={searchVisible}
              style={{
                flex: 1,
                fontFamily: DS.font.regular,
                fontSize: DS.fontSize.sm,
                color: DS.colors.primary,
              }}
            />
          </View>
        </Animated.View>

        {/* ── Filter chips ── */}
        <FilterChipsRow activeChip={activeChip} onChipPress={handleChip} />
      </Animated.View>

      {/* ── Content ── */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <CompassRoseLoader size="medium" />
        </View>
      ) : loadError ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <ArchText variant="heading" style={{ fontSize: 20, textAlign: 'center', marginBottom: DS.spacing.md }}>
            Couldn&apos;t load designs
          </ArchText>
          <OvalButton label="Retry" variant="outline" onPress={() => { void refresh(); }} />
        </View>
      ) : templates.length === 0 ? (
        <FeedEmptyState />
      ) : (
        <FlashList
          data={templates}
          numColumns={2}
          // @ts-expect-error -- FlashList v2 prop not in types
          estimatedItemSize={230}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => { void refresh(); }}
              tintColor={DS.colors.primary}
            />
          }
          style={{ padding: 8 }}
          ListFooterComponent={
            isFetchingMore ? (
              <View style={{ padding: DS.spacing.md, alignItems: 'center' }}>
                <CompassRoseLoader size="small" />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
