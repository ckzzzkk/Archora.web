import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
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
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { BASE_COLORS } from '../../theme/colors';
import { FeedCard } from '../../components/social/FeedCard';
import { CompassRoseLoader } from '../../components/common/CompassRoseLoader';
import { useFeed } from '../../hooks/useFeed';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { useScreenSlideIn } from '../../hooks/useScreenSlideIn';
import { HeaderLogoMark } from '../../components/common/HeaderLogoMark';
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

// ─────────────────────────────────────────────────────────────────────────────
// FeedHeader
// ─────────────────────────────────────────────────────────────────────────────
function FeedHeader({
  onToggleSearch,
  colors,
}: {
  onToggleSearch: () => void;
  colors: { primary: string };
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <HeaderLogoMark size={32} />
        <Text
          style={{
            fontFamily: 'ArchitectsDaughter_400Regular',
            fontSize: 28,
            color: BASE_COLORS.textPrimary,
            marginLeft: 10,
          }}
        >
          Inspo
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable
          onPress={onToggleSearch}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: BASE_COLORS.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24">
            <Path
              d="M21 21L15 15M17 11C17 14.3137 14.3137 17 11 17C7.68629 17 5 14.3137 5 11C5 7.68629 7.68629 5 11 5C14.3137 5 17 7.68629 17 11Z"
              stroke={BASE_COLORS.textSecondary}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </Svg>
        </Pressable>
        <Pressable
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: BASE_COLORS.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: BASE_COLORS.textPrimary, fontSize: 18 }}>🔔</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StoriesRow
// ─────────────────────────────────────────────────────────────────────────────
const PLACEHOLDER_STORIES = [
  { id: 'your_story', name: 'Your Story', isOwn: true },
] as const;

function StoriesRow() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 12,
      }}
    >
      {PLACEHOLDER_STORIES.map((story) => (
        <Pressable key={story.id} style={{ alignItems: 'center', gap: 4 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: BASE_COLORS.surface,
              borderWidth: story.isOwn ? 0 : 2,
              borderColor: BASE_COLORS.textPrimary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: BASE_COLORS.textPrimary, fontSize: 24 }}>+</Text>
          </View>
          <Text style={{ color: BASE_COLORS.textSecondary, fontSize: 10 }}>
            Your Story
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FilterChipsRow
// ─────────────────────────────────────────────────────────────────────────────
function FilterChipsRow({
  activeChip,
  onChipPress,
  colors,
}: {
  activeChip: string;
  onChipPress: (chip: ChipConfig) => void;
  colors: { primary: string };
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 8,
      }}
    >
      {CHIPS.map((chip) => (
        <Pressable
          key={chip.label}
          onPress={() => onChipPress(chip)}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 999,
            borderWidth: 1.5,
            borderColor:
              activeChip === chip.label ? colors.primary : BASE_COLORS.border,
            backgroundColor:
              activeChip === chip.label ? `${colors.primary}20` : 'transparent',
          }}
        >
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 12,
              color:
                activeChip === chip.label
                  ? colors.primary
                  : BASE_COLORS.textSecondary,
            }}
          >
            {chip.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FeedEmptyState
// ─────────────────────────────────────────────────────────────────────────────
function FeedEmptyState() {
  const navigation = useNavigation<Nav>();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
      }}
    >
      <Text
        style={{
          fontFamily: 'ArchitectsDaughter_400Regular',
          fontSize: 22,
          color: BASE_COLORS.textPrimary,
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        No designs yet.
      </Text>
      <Text
        style={{
          fontFamily: 'ArchitectsDaughter_400Regular',
          fontSize: 15,
          color: BASE_COLORS.textSecondary,
          textAlign: 'center',
          marginBottom: 32,
        }}
      >
        Be the first to share your blueprint.
      </Text>
      <Pressable
        onPress={() => navigation.navigate('Generation')}
        style={{
          backgroundColor: BASE_COLORS.textPrimary,
          paddingHorizontal: 32,
          paddingVertical: 14,
          borderRadius: 50,
        }}
      >
        <Text
          style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 16,
            color: BASE_COLORS.background,
          }}
        >
          Create a Design
        </Text>
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MasonryItem wrapper — FlashList numColumns gives each item flex:1 in a row,
// we alternate height via index to get the masonry feel.
// ─────────────────────────────────────────────────────────────────────────────
interface MasonryItemProps {
  item: import('../../types').Template;
  index: number;
  onPress: (id: string) => void;
}

function MasonryItem({ item, index, onPress }: MasonryItemProps) {
  // Alternate: even items 200px, odd items 260px
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

// ─────────────────────────────────────────────────────────────────────────────
// FeedScreen
// ─────────────────────────────────────────────────────────────────────────────
export function FeedScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { light } = useHaptics();
  const slideStyle = useScreenSlideIn();

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

  const searchBarHeight = useSharedValue(0);

  const searchBarStyle = useAnimatedStyle(() => ({
    height: searchBarHeight.value,
    overflow: 'hidden',
  }));

  const toggleSearch = useCallback(() => {
    light();
    const next = !searchVisible;
    setSearchVisible(next);
    searchBarHeight.value = withSpring(next ? 44 : 0, {
      damping: 16,
      stiffness: 200,
    });
    if (!next) {
      setSearchText('');
      setFilter({ ...filter, search: undefined });
    }
  }, [searchVisible, searchBarHeight, light, filter, setFilter]);

  const handleChip = useCallback(
    (chip: ChipConfig) => {
      light();
      setActiveChip(chip.label);
      setFilter({
        buildingType: chip.buildingType,
        trendingOrNew: chip.trendingOrNew,
        search: searchText || undefined,
      });
    },
    [light, setFilter, searchText],
  );

  const handleSearch = useCallback(
    (text: string) => {
      setSearchText(text);
      setFilter({ ...filter, search: text || undefined });
    },
    [filter, setFilter],
  );

  const handleItemPress = useCallback(
    (templateId: string) => {
      navigation.navigate('TemplateDetail', { templateId });
    },
    [navigation],
  );

  const handleEndReached = useCallback(() => {
    if (hasMore && !isFetchingMore) void fetchMore();
  }, [hasMore, isFetchingMore, fetchMore]);

  const renderItem = useCallback(
    ({
      item,
      index,
    }: {
      item: import('../../types').Template;
      index: number;
    }) => <MasonryItem item={item} index={index} onPress={handleItemPress} />,
    [handleItemPress],
  );

  const keyExtractor = useCallback(
    (item: import('../../types').Template) => item.id,
    [],
  );

  return (
    <Animated.View
      style={[
        { flex: 1, backgroundColor: BASE_COLORS.background },
        slideStyle,
      ]}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <FeedHeader onToggleSearch={toggleSearch} colors={colors} />

        {/* Search bar */}
        <Animated.View
          style={[searchBarStyle, { paddingHorizontal: 20, marginBottom: 4 }]}
        >
          <TextInput
            value={searchText}
            onChangeText={handleSearch}
            placeholder="Search designs..."
            placeholderTextColor={BASE_COLORS.textDim}
            autoFocus={searchVisible}
            style={{
              fontFamily: 'JetBrainsMono_400Regular',
              fontSize: 14,
              color: BASE_COLORS.textPrimary,
              borderBottomWidth: 1.5,
              borderBottomColor: colors.primary,
              paddingVertical: 8,
              height: 44,
            }}
          />
        </Animated.View>

        {/* Stories row */}
        <StoriesRow />

        {/* Filter chips */}
        <FilterChipsRow
          activeChip={activeChip}
          onChipPress={handleChip}
          colors={colors}
        />

        {/* Content */}
        {isLoading ? (
          <View
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <CompassRoseLoader size="medium" />
          </View>
        ) : loadError ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
            }}
          >
            <Text
              style={{
                fontFamily: 'ArchitectsDaughter_400Regular',
                fontSize: 20,
                color: BASE_COLORS.textPrimary,
                textAlign: 'center',
                marginBottom: 16,
              }}
            >
              Couldn&apos;t load designs
            </Text>
            <Pressable
              onPress={() => {
                void refresh();
              }}
              style={{
                backgroundColor: BASE_COLORS.textPrimary,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 50,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 14,
                  color: BASE_COLORS.background,
                }}
              >
                Retry
              </Text>
            </Pressable>
          </View>
        ) : templates.length === 0 ? (
          <FeedEmptyState />
        ) : (
          <FlashList
            data={templates}
            numColumns={2}
            {...({ estimatedItemSize: 230 } as object)}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => {
                  void refresh();
                }}
                tintColor={colors.primary}
              />
            }
            style={{ padding: 8 }}
            ListFooterComponent={
              isFetchingMore ? (
                <View style={{ padding: 16, alignItems: 'center' }}>
                  <CompassRoseLoader size="small" />
                </View>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </Animated.View>
  );
}
