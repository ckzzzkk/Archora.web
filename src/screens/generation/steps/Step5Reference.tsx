import React, { useState, useCallback } from 'react';
import { View, Pressable, Image, ScrollView, useWindowDimensions, TextInput, FlatList } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Circle } from 'react-native-svg';

import { DS } from '../../../theme/designSystem';
import { BASE_COLORS } from '../../../theme/colors';
import { ArchText } from '../../../components/common/ArchText';
import { GridBackground } from '../../../components/common/GridBackground';
import { CompassRoseLoader } from '../../../components/common/CompassRoseLoader';
import { aiService } from '../../../services/aiService';
import { useSession } from '../../../auth/useSession';
import { useUIStore } from '../../../stores/uiStore';
import { useTierGate } from '../../../hooks/useTierGate';
import { useUnsplashSearch } from '../../../hooks/useUnsplashSearch';

const SEARCH_CATEGORIES = [
  'modern house floor plan',
  'two story house plans',
  'luxury home floor plan',
  'apartment floor plan',
  'minimalist house plan',
  'contemporary home design',
  'victorian house floor plan',
  'tudor home design',
];

interface Props {
  referenceImageUrl: string | undefined;
  onImageUploaded: (url: string) => void;
  onSkip: () => void;
  onNext: () => void;
}

export function Step5Reference({ referenceImageUrl, onImageUploaded, onSkip, onNext }: Props) {
  const { width: SCREEN_W } = useWindowDimensions();
  const userId = useSession().user?.id;
  const s = useUIStore();
  const { allowed: canUploadReference } = useTierGate('blueprintUpload');
  const [uploading, setUploading] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'upload' | 'browse'>('browse');
  const [searchQuery, setSearchQuery] = useState('');

  const { images, loading, error, search, nextPage, totalPages, currentPage, clearSearch } = useUnsplashSearch();

  const pickImage = async () => {
    if (!canUploadReference) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setLocalUri(asset.uri);
    setUploading(true);

    try {
      if (!userId) throw new Error('Not authenticated');
      const publicUrl = await aiService.uploadReferenceImage(userId, asset.uri);
      if (!publicUrl) {
        s.actions.showToast('Failed to upload reference image', 'warning');
      } else {
        onImageUploaded(publicUrl);
      }
    } catch {
      s.actions.showToast('Failed to upload reference image', 'warning');
      setLocalUri(null);
    } finally {
      setUploading(false);
    }
  };

  const handleCategorySearch = useCallback((category: string) => {
    clearSearch();
    search(category);
  }, [search, clearSearch]);

  const handleTextSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    search(searchQuery.trim());
  }, [searchQuery, search]);

  const handleSelectImage = useCallback((img: { small: string }) => {
    onImageUploaded(img.small);
  }, [onImageUploaded]);

  const IMAGE_COLUMNS = 3;
  const IMAGE_GAP = 6;
  const IMAGE_W = (SCREEN_W - 32 - (IMAGE_COLUMNS - 1) * IMAGE_GAP) / IMAGE_COLUMNS;

  return (
    <Animated.View entering={FadeIn.duration(150)} style={{ flex: 1 }}>
      <GridBackground />

      <View style={{ paddingHorizontal: DS.spacing.lg, flex: 1 }}>
        <ArchText variant="heading" style={{ marginBottom: DS.spacing.xs }}>
          reference images
        </ArchText>
        <ArchText variant="body" style={{ color: DS.colors.primaryDim, fontSize: 13, marginBottom: DS.spacing.md }}>
          Browse floor plan inspiration or upload your own sketch
        </ArchText>

        {/* Tab toggle */}
        <View style={{ flexDirection: 'row', backgroundColor: DS.colors.surfaceHigh, borderRadius: 999, padding: 3, marginBottom: DS.spacing.md, alignSelf: 'flex-start', borderWidth: 1, borderColor: DS.colors.border }}>
          {(['browse', 'upload'] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setSelectedTab(tab)}
              style={{
                paddingHorizontal: 16, paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: selectedTab === tab ? DS.colors.primary : 'transparent',
              }}
            >
              <ArchText variant="body" style={{ fontSize: 12, color: selectedTab === tab ? DS.colors.background : DS.colors.primaryDim }}>
                {tab === 'browse' ? 'Browse' : 'Upload'}
              </ArchText>
            </Pressable>
          ))}
        </View>

        {selectedTab === 'browse' ? (
          <>
            {/* Search bar */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: DS.spacing.sm }}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: DS.colors.surfaceHigh, borderRadius: 50, paddingHorizontal: 14, borderWidth: 1, borderColor: DS.colors.border }}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={DS.colors.primaryGhost} strokeWidth={2} strokeLinecap="round">
                  <Circle cx={11} cy={11} r={8} /><Path d="M21 21l-4.35-4.35" />
                </Svg>
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleTextSearch}
                  placeholder="Search floor plans..."
                  placeholderTextColor={DS.colors.primaryGhost}
                  style={{ flex: 1, fontSize: 14, color: DS.colors.primary, paddingVertical: 10, paddingHorizontal: 8 }}
                  returnKeyType="search"
                />
              </View>
              <Pressable
                onPress={handleTextSearch}
                style={{ backgroundColor: DS.colors.primary, borderRadius: 50, paddingHorizontal: 16, justifyContent: 'center' }}
              >
                <ArchText variant="body" style={{ fontSize: 13, color: DS.colors.background }}>Search</ArchText>
              </Pressable>
            </View>

            {/* Category chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: DS.spacing.sm }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {SEARCH_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => handleCategorySearch(cat)}
                    style={{
                      paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999,
                      borderWidth: 1, borderColor: DS.colors.border,
                      backgroundColor: DS.colors.surfaceHigh,
                    }}
                  >
                    <ArchText variant="body" style={{ fontSize: 11, color: DS.colors.primaryDim }}>
                      {cat.split(' ').slice(0, 2).join(' ')}
                    </ArchText>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Image grid */}
            {loading ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <CompassRoseLoader size="large" />
              </View>
            ) : error ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ArchText variant="body" style={{ color: DS.colors.error, textAlign: 'center', marginBottom: 8 }}>
                  {error}
                </ArchText>
                <Pressable onPress={() => search(SEARCH_CATEGORIES[0])}>
                  <ArchText variant="body" style={{ color: DS.colors.primary, textDecorationLine: 'underline' }}>Try again</ArchText>
                </Pressable>
              </View>
            ) : images.length > 0 ? (
              <FlatList
                data={images}
                numColumns={IMAGE_COLUMNS}
                keyExtractor={(item) => item.id}
                columnWrapperStyle={{ gap: IMAGE_GAP }}
                contentContainerStyle={{ gap: IMAGE_GAP }}
                renderItem={({ item }) => (
                  <Pressable onPress={() => handleSelectImage(item)} style={{ width: IMAGE_W, aspectRatio: 1.5, borderRadius: 8, overflow: 'hidden', borderWidth: referenceImageUrl === item.small ? 2 : 0, borderColor: DS.colors.warning }}>
                    <Image source={{ uri: item.small }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    {referenceImageUrl === item.small && (
                      <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: DS.colors.warning, borderRadius: 999, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={DS.colors.background} strokeWidth={3} strokeLinecap="round">
                          <Path d="M20 6L9 17l-5-5" />
                        </Svg>
                      </View>
                    )}
                  </Pressable>
                )}
                onEndReached={() => currentPage < totalPages && nextPage('')}
                ListFooterComponent={currentPage < totalPages ? <CompassRoseLoader size="small" /> : null}
              />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ArchText variant="body" style={{ color: DS.colors.primaryGhost, textAlign: 'center' }}>
                  Search for floor plan inspiration{'\n'}or pick a category above
                </ArchText>
              </View>
            )}
          </>
        ) : (
          /* Upload tab */
          <>
            {localUri || referenceImageUrl ? (
              <Pressable onPress={pickImage}>
                <Image
                  source={{ uri: localUri ?? referenceImageUrl }}
                  style={{
                    width: '100%',
                    height: 220,
                    borderRadius: DS.radius.large,
                    borderWidth: 2,
                    borderColor: DS.colors.primary,
                  }}
                  resizeMode="cover"
                />
                {uploading && (
                  <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(11,30,61,0.7)', borderRadius: DS.radius.large }}>
                    <CompassRoseLoader size="medium" />
                  </View>
                )}
              </Pressable>
            ) : (
              <Pressable
                onPress={pickImage}
                style={{
                  borderRadius: DS.radius.card,
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: DS.colors.primaryGhost,
                  padding: DS.spacing.xl,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: DS.spacing.xl,
                }}
              >
                {uploading ? (
                  <CompassRoseLoader size="medium" />
                ) : (
                  <>
                    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={DS.colors.primaryGhost} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: DS.spacing.sm }}>
                      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <Circle cx={12} cy={13} r={4} />
                    </Svg>
                    <ArchText variant="body" style={{ fontFamily: DS.font.regular, color: DS.colors.primaryGhost }}>
                      Upload a photo
                    </ArchText>
                  </>
                )}
              </Pressable>
            )}
            <View style={{ flex: 1 }} />
          </>
        )}

        <View style={{ flexDirection: 'row', gap: 12, marginTop: DS.spacing.md }}>
          <Pressable onPress={onSkip} style={{ flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 50, borderWidth: 1, borderColor: DS.colors.border }}>
            <ArchText variant="body" style={{ color: DS.colors.primaryDim }}>Skip</ArchText>
          </Pressable>
          <Pressable
            onPress={onNext}
            disabled={!referenceImageUrl && !localUri}
            style={{
              flex: 2, alignItems: 'center', paddingVertical: 14, borderRadius: 50,
              backgroundColor: referenceImageUrl || localUri ? DS.colors.primary : DS.colors.surfaceHigh,
            }}
          >
            <ArchText variant="body" style={{ color: referenceImageUrl || localUri ? DS.colors.background : DS.colors.primaryGhost, fontFamily: DS.font.medium }}>
              Continue
            </ArchText>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}