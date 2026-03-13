import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, ScrollView, TextInput, Pressable,
  RefreshControl, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FeedCard } from '../../components/social/FeedCard';
import { LogoLoader } from '../../components/common/LogoLoader';
import { HeaderLogoMark } from '../../components/common/HeaderLogoMark';
import { useTheme } from '../../hooks/useTheme';
import { useHaptics } from '../../hooks/useHaptics';
import { useFeed } from '../../hooks/useFeed';
import { BASE_COLORS } from '../../theme/colors';
import { useScreenSlideIn } from '../../hooks/useScreenSlideIn';
import type { RootStackParamList } from '../../navigation/types';
import type { Template } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SCREEN_W = Dimensions.get('window').width;

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
  { label: 'Open Plan', buildingType: 'apartment' },
  { label: 'Trending', trendingOrNew: 'trending' },
  { label: 'New', trendingOrNew: 'new' },
];

function EmptyState({ colors }: { colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 22, color: BASE_COLORS.textPrimary, textAlign: 'center', marginBottom: 8 }}>
        No designs yet.
      </Text>
      <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 15, color: BASE_COLORS.textSecondary, textAlign: 'center' }}>
        Be the first to share.
      </Text>
    </View>
  );
}

export function FeedScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { light } = useHaptics();
  const slideStyle = useScreenSlideIn();

  const { templates, isLoading, isRefreshing, isFetchingMore, hasMore, filter, setFilter, refresh, fetchMore } = useFeed();

  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeChip, setActiveChip] = useState('All');

  const searchBarHeight = useSharedValue(0);
  const headerY = useSharedValue(-30);
  const headerOp = useSharedValue(0);

  useEffect(() => {
    headerY.value = withSpring(0, { damping: 18, stiffness: 200 });
    headerOp.value = withTiming(1, { duration: 250 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerY.value }],
    opacity: headerOp.value,
  }));

  const searchBarStyle = useAnimatedStyle(() => ({
    height: searchBarHeight.value,
    overflow: 'hidden',
  }));

  const toggleSearch = () => {
    light();
    const next = !searchVisible;
    setSearchVisible(next);
    searchBarHeight.value = withSpring(next ? 44 : 0, { damping: 16, stiffness: 200 });
    if (!next) {
      setSearchText('');
      setFilter({ ...filter, search: undefined });
    }
  };

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

  const renderCard = ({ item, index }: { item: Template; index: number }) => {
    const cardHeight = index % 4 === 0 || index % 4 === 3 ? 280 : 200;
    return (
      <FeedCard
        template={item}
        index={index}
        height={cardHeight}
        onPress={() => navigation.navigate('TemplateDetail', { templateId: item.id })}
      />
    );
  };

  const renderFooter = () => {
    if (!isFetchingMore) return null;
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <LogoLoader size="small" />
      </View>
    );
  };

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: BASE_COLORS.background }, slideStyle]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <Animated.View
          style={[
            headerStyle,
            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <HeaderLogoMark size={32} />
            <Text style={{ fontFamily: 'ArchitectsDaughter_400Regular', fontSize: 28, color: BASE_COLORS.textPrimary, marginLeft: 10 }}>
              Inspo
            </Text>
          </View>
        </Animated.View>

        {/* Search bar */}
        <Animated.View style={[searchBarStyle, { paddingHorizontal: 20, marginBottom: 4 }]}>
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

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}
        >
          {CHIPS.map((chip) => (
            <Pressable
              key={chip.label}
              onPress={() => handleChip(chip)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: activeChip === chip.label ? colors.primary : BASE_COLORS.border,
                backgroundColor: activeChip === chip.label ? `${colors.primary}20` : 'transparent',
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 12,
                  color: activeChip === chip.label ? colors.primary : BASE_COLORS.textSecondary,
                }}
              >
                {chip.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Content */}
        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <LogoLoader size="medium" />
          </View>
        ) : templates.length === 0 ? (
          <EmptyState colors={colors} />
        ) : (
          <FlatList
            data={templates}
            numColumns={2}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 8, paddingBottom: 120 }}
            renderItem={renderCard}
            ListFooterComponent={renderFooter}
            onEndReached={hasMore ? fetchMore : undefined}
            onEndReachedThreshold={0.3}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => { void refresh(); }}
                tintColor={colors.primary}
              />
            }
          />
        )}
      </SafeAreaView>
    </Animated.View>
  );
}
