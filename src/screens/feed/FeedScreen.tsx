import React, { useState, useCallback, useMemo, memo } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  RefreshControl,
  Dimensions,
  Text,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { FeedCard } from '../../components/social/FeedCard';
import { CompassRoseLoader } from '../../components/common/CompassRoseLoader';
import { SkeletonLoader } from '../../components/common/SkeletonLoader';
import { MasonryCardSkeleton } from '../../components/common/SkeletonLoader';
import { ArchText } from '../../components/common/ArchText';
import { OvalButton } from '../../components/common/OvalButton';
import { NotificationPanel } from '../../components/dashboard/NotificationPanel';
import { useFeed } from '../../hooks/useFeed';
import { useHaptics } from '../../hooks/useHaptics';
import { useNotifications } from '../../hooks/useNotifications';
import { useUIStore } from '../../stores/uiStore';
import { useThemeColors } from '../../hooks/useThemeColors';
import { DS } from '../../theme/designSystem';
import type { RootStackParamList } from '../../navigation/types';
import type { Template } from '../../types';

const SCREEN_W = Dimensions.get('window').width;
const CARD_W = SCREEN_W * 0.52;

type Nav = NativeStackNavigationProp<RootStackParamList>;

function TrendingCarousel({
  templates,
  onPress,
  C,
}: {
  templates: Template[];
  onPress: (id: string) => void;
  C: ReturnType<typeof useThemeColors>;
}) {
  const trending = useMemo(
    () => templates
      .filter((t) => (t.likeCount ?? 0) > 0)
      .sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0))
      .slice(0, 8),
    [templates],
  );

  if (trending.length === 0) return null;

  return (
    <View style={{ marginBottom: DS.spacing.md }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: DS.spacing.lg, marginBottom: DS.spacing.sm,
      }}>
        <ArchText variant="body" style={{
          fontFamily: DS.font.semibold, fontSize: 13,
          color: '#FFEE8C', letterSpacing: 0.5, marginRight: 6,
        }}>
          ✦ Trending
        </ArchText>
        <ArchText variant="body" style={{ fontSize: 12, color: C.primaryGhost }}>
          this week
        </ArchText>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: DS.spacing.lg, gap: DS.spacing.sm }}
      >
        {trending.map((t, idx) => (
          <Pressable
            key={t.id}
            onPress={() => onPress(t.id)}
            style={{
              width: CARD_W,
              borderRadius: DS.radius.card, // 24px — oval-first design system
              backgroundColor: C.surface,
              borderWidth: 1,
              borderColor: idx === 0 ? '#FFEE8C40' : C.border,
              overflow: 'hidden',
            }}
          >
            {/* Color thumbnail */}
            <View style={{
              height: 100,
              backgroundColor: C.surface,
              borderBottomWidth: 1,
              borderBottomColor: C.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Svg width={72} height={56} viewBox="0 0 72 56">
                <Path
                  d="M4,28 L36,4 L68,28 L68,52 L4,52 Z"
                  stroke={idx === 0 ? '#FFEE8C' : '#C9FFFD'}
                  strokeWidth={1.4} fill="none" strokeLinejoin="round"
                  opacity={0.8}
                />
                <Path
                  d="M20,52 L20,34 L30,34 L30,52"
                  stroke={idx === 0 ? '#FFEE8C' : '#C9FFFD'}
                  strokeWidth={1.2} fill="none"
                />
                <Path
                  d="M42,52 L42,38 L60,38 L60,52"
                  stroke={idx === 0 ? '#FFEE8C' : '#C9FFFD'}
                  strokeWidth={1.2} fill="none"
                />
              </Svg>
              {idx === 0 && (
                <View style={{
                  position: 'absolute', top: 8, right: 8,
                  backgroundColor: '#FFEE8C',
                  borderRadius: 50, paddingHorizontal: 8, paddingVertical: 3,
                }}>
                  <ArchText variant="body" style={{ fontSize: 9, color: '#1A1800', fontFamily: DS.font.bold }}>
                    #1
                  </ArchText>
                </View>
              )}
            </View>
            <View style={{ padding: DS.spacing.sm }}>
              <ArchText
                variant="body"
                numberOfLines={1}
                style={{ fontSize: 13, fontFamily: DS.font.semibold, color: C.primary, marginBottom: 4 }}
              >
                {t.title ?? 'Untitled'}
              </ArchText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Svg width={10} height={10} viewBox="0 0 24 24">
                  <Path
                    d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                    stroke={'#FF8C9A'} strokeWidth={1.5} fill="none"
                  />
                </Svg>
                <ArchText variant="body" style={{ fontSize: 11, color: C.primaryDim, fontFamily: DS.font.mono }}>
                  {t.likeCount ?? 0}
                </ArchText>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

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
  const C = useThemeColors();
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
            accessibilityLabel={chip.label}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityHint="Double tap to filter by this category"
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 999,
              borderWidth: 1.5,
              borderColor: active ? C.primary : C.border,
              backgroundColor: active ? C.accentGlow : 'transparent',
            }}
          >
            <View style={{ flexShrink: 1 }}>
              <ArchText variant="body" style={{
                fontFamily: DS.font.medium,
                fontSize: 12,
                color: active ? C.primary : C.primaryDim,
              }} numberOfLines={1}>
                {chip.label}
              </ArchText>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/**
 * FeedSkeletonGrid — skeleton loaders shown while feed is loading.
 * Renders 6 skeleton cards in a 2-column masonry layout to match FlashList.
 */
function FeedSkeletonGrid() {
  // Alternate heights to mimic masonry layout
  const heights = [200, 260, 200, 260, 200, 260];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: 8 }}>
      {heights.map((h, i) => (
        <View key={i} style={{ width: '47%' }}>
          <MasonryCardSkeleton height={h} />
        </View>
      ))}
    </View>
  );
}

function FeedEmptyState() {
  const C = useThemeColors();
  const navigation = useNavigation<Nav>();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      {/* Blueprint-style house illustration */}
      <Svg width={96} height={80} viewBox="0 0 96 80" style={{ marginBottom: DS.spacing.lg }}>
        {/* House outline */}
        <Path d="M8 48 L48 12 L88 48" stroke={C.border} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Rect x="16" y="48" width="64" height="28" stroke={C.border} strokeWidth="1.6" fill="none" />
        <Rect x="38" y="60" width="20" height="16" stroke={C.border} strokeWidth="1.2" fill="none" />
        <Rect x="22" y="54" width="12" height="10" stroke={C.border} strokeWidth="1.1" fill="none" />
        <Rect x="62" y="54" width="12" height="10" stroke={C.border} strokeWidth="1.1" fill="none" />
        {/* Grid lines in background */}
        <Line x1="0" y1="76" x2="96" y2="76" stroke={C.border} strokeWidth="0.6" opacity="0.4" />
        <Line x1="0" y1="68" x2="20" y2="68" stroke={C.border} strokeWidth="0.6" opacity="0.3" />
        <Line x1="76" y1="68" x2="96" y2="68" stroke={C.border} strokeWidth="0.6" opacity="0.3" />
        {/* Compass rose */}
        <Circle cx="80" cy="16" r="8" stroke={C.border} strokeWidth="1" fill="none" strokeDasharray="2 2" />
        <Path d="M80 10 L81.5 14 L80 13 L78.5 14 Z" fill={C.border} />
        <Circle cx="80" cy="16" r="2" fill={C.border} />
      </Svg>
      <ArchText variant="heading" style={{ fontSize: 22, color: C.primary, textAlign: 'center', marginBottom: DS.spacing.xs }}>
        Your canvas awaits
      </ArchText>
      <ArchText variant="body" style={{ fontSize: DS.fontSize.sm, color: C.primaryDim, textAlign: 'center', lineHeight: 20, marginBottom: DS.spacing.xl }}>
        No designs shared yet.{'\n'}Be the first to inspire the community.
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

const MasonryItem = memo(function MasonryItem({ item, index, onPress }: MasonryItemProps) {
  const height = index % 2 === 0 ? 200 : 260;
  return (
    <FeedCard
      template={item}
      index={index}
      height={height}
      onPress={() => onPress(item.id)}
    />
  );
});

export function FeedScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { light } = useHaptics();
  const C = useThemeColors();
  const showToast = useUIStore((s) => s.actions.showToast);
  const [showNotifications, setShowNotifications] = useState(false);
  const { unreadCount } = useNotifications();

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

  const renderItem = useCallback(({ item, index }: { item: import('../../types').Template; index: number }) => (
    <MasonryItem item={item} index={index} onPress={handleItemPress} />
  ), [handleItemPress]);

  const keyExtractor = useCallback((item: import('../../types').Template) => item.id, []);

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      {/* Header */}
      <Animated.View style={[{
        paddingTop: insets.top + 16,
        paddingHorizontal: DS.spacing.lg,
        paddingBottom: DS.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }, headerStyle]}>
        <ArchText variant="heading" style={{ fontSize: 28, color: C.primary }}>Inspo</ArchText>
        <View style={{ flexDirection: 'row', gap: DS.spacing.xs }}>
          {/* Search */}
          <Pressable
            onPress={toggleSearch}
            accessibilityLabel="Search designs"
            accessibilityRole="button"
            accessibilityHint="Toggles the search bar"
            style={{
              width: 44, height: 44, borderRadius: 20,
              backgroundColor: searchVisible ? C.primary : C.surface,
              borderWidth: 1, borderColor: C.border,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path
                d="M21 21L15 15M17 11C17 14.3137 14.3137 17 11 17C7.68629 17 5 14.3137 5 11C5 7.68629 7.68629 5 11 5C14.3137 5 17 7.68629 17 11Z"
                stroke={searchVisible ? C.background : C.primaryDim}
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </Svg>
          </Pressable>
          {/* Bell */}
          <Pressable
            onPress={() => setShowNotifications(true)}
            accessibilityLabel={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            accessibilityRole="button"
            accessibilityHint="Opens the notifications panel"
            style={{
              width: 44, height: 44, borderRadius: 20,
              backgroundColor: C.surface,
              borderWidth: 1, borderColor: unreadCount > 0 ? C.success : C.border,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path
                d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                stroke={C.primaryDim}
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            {/* Unread badge */}
            {unreadCount > 0 && (
              <View style={{
                position: 'absolute',
                top: 4, right: 4,
                minWidth: 16, height: 16,
                borderRadius: 8,
                backgroundColor: '#E85D5D',
                alignItems: 'center', justifyContent: 'center',
                paddingHorizontal: 4,
              }}>
                <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 9, color: '#fff', fontWeight: '700' }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </Animated.View>

      <Animated.View style={bodyStyle}>
        {/* Search bar */}
        <Animated.View style={[searchBarStyle, { paddingHorizontal: DS.spacing.lg, marginBottom: DS.spacing.xs }]}>
          <View style={{
            height: 44,
            backgroundColor: C.surface,
            borderRadius: 22,
            paddingHorizontal: DS.spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: C.border,
          }}>
            <Svg width={14} height={14} viewBox="0 0 24 24" style={{ marginRight: 8 }}>
              <Path
                d="M21 21L15 15M17 11C17 14.3137 14.3137 17 11 17C7.68629 17 5 14.3137 5 11C5 7.68629 7.68629 5 11 5C14.3137 5 17 7.68629 17 11Z"
                stroke={C.primaryGhost}
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </Svg>
            <TextInput
              value={searchText}
              onChangeText={handleSearch}
              placeholder="Search designs..."
              placeholderTextColor={C.primaryGhost}
              autoFocus={searchVisible}
              style={{
                flex: 1,
                fontFamily: DS.font.regular,
                fontSize: DS.fontSize.sm,
                color: C.primary,
              }}
            />
          </View>
        </Animated.View>

        {/* Trending carousel — only when no active search/filter */}
        {!searchText && activeChip === 'All' && templates.length > 0 && (
          <TrendingCarousel templates={templates} onPress={handleItemPress} C={C} />
        )}

        {/* Filter chips */}
        <FilterChipsRow activeChip={activeChip} onChipPress={handleChip} />
      </Animated.View>

      {/* Content */}
      {isLoading ? (
        <FeedSkeletonGrid />
      ) : loadError ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          {/* Network error illustration */}
          <Svg width={64} height={64} viewBox="0 0 64 64" style={{ marginBottom: DS.spacing.md }}>
            <Circle cx="32" cy="32" r="24" stroke={C.border} strokeWidth="1.5" fill="none" />
            <Path d="M20 20 L44 44 M44 20 L20 44" stroke={C.border} strokeWidth="1.8" strokeLinecap="round" />
            <Circle cx="32" cy="32" r="4" stroke={C.border} strokeWidth="1.2" fill="none" />
          </Svg>
          <ArchText variant="heading" style={{ fontSize: 20, color: C.primary, textAlign: 'center', marginBottom: DS.spacing.xs }}>
            Couldn&apos;t load designs
          </ArchText>
          <ArchText variant="body" style={{ fontSize: DS.fontSize.sm, color: C.primaryDim, textAlign: 'center', lineHeight: 18, marginBottom: DS.spacing.lg }}>
            Check your connection and try again.
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
              tintColor={C.primary}
            />
          }
          style={{ padding: 8 }}
          // Performance: limit render window
          windowSize={5}
          maxToRenderPerBatch={10}
          initialNumToRender={8}
          updateCellsBatchingPeriod={50}
          ListFooterComponent={
            isFetchingMore ? (
              <View style={{ padding: DS.spacing.md, alignItems: 'center' }}>
                <CompassRoseLoader size="small" />
              </View>
            ) : null
          }
        />
      )}

      <NotificationPanel
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </View>
  );
}
