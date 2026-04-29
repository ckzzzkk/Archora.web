import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Image, Alert, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DS } from '../../theme/designSystem';
import { TierGate } from '../../components/common/TierGate';
import { CompassRoseLoader } from '../../components/common/CompassRoseLoader';
import { ArchText } from '../../components/common/ArchText';
import { OvalButton } from '../../components/common/OvalButton';
import { supabase } from '../../lib/supabase';
import {
  submitVigaReconstruction,
  subscribeToVigaTask,
  unsubscribeFromVigaTask,
  fetchCustomFurniture,
  type VigaMesh,
  type VigaTaskStatus,
} from '../../services/vigaService';
import type { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const CATEGORIES = [
  'Living Room',
  'Bedroom',
  'Kitchen',
  'Dining',
  'Office',
  'Bathroom',
  'Outdoor',
  'Storage',
  'Other',
];

const STATUS_LABELS: Record<VigaTaskStatus['status'], string> = {
  pending: 'Queued',
  processing: 'Reconstructing...',
  done: 'Complete',
  failed: 'Failed',
};

export function VIGAScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [meshName, setMeshName] = useState('');
  const [category, setCategory] = useState('');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<VigaTaskStatus['status']>('pending');
  const [meshes, setMeshes] = useState<VigaMesh[]>([]);
  const [loadingMeshes, setLoadingMeshes] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch custom meshes on mount
  useEffect(() => {
    let channel: ReturnType<typeof subscribeToVigaTask> | null = null;

    const loadMeshes = async () => {
      setLoadingMeshes(true);
      try {
        const data = await fetchCustomFurniture();
        setMeshes(data);
      } catch {
        // silently fail — user can still upload
      } finally {
        setLoadingMeshes(false);
      }
    };

    loadMeshes();

    return () => {
      if (channel) unsubscribeFromVigaTask(channel);
    };
  }, []);

  // Subscribe to realtime updates when activeTaskId changes
  useEffect(() => {
    if (!activeTaskId) return;

    const channel = subscribeToVigaTask(activeTaskId, (status) => {
      setActiveStatus(status.status);
      if (status.status === 'done' || status.status === 'failed') {
        // Reload mesh list when done
        fetchCustomFurniture()
          .then(setMeshes)
          .catch(() => null);
      }
    });

    return () => unsubscribeFromVigaTask(channel);
  }, [activeTaskId]);

  const pickFromGallery = useCallback(async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission needed', 'Please allow gallery access to select photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  }, []);

  const takePhoto = useCallback(async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission needed', 'Please allow camera access to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedImage) {
      Alert.alert('No image selected', 'Please select or take a photo first.');
      return;
    }
    if (!meshName.trim()) {
      Alert.alert('Name required', 'Please give your mesh a name.');
      return;
    }

    setUploading(true);
    try {
      // 1. Upload image to Supabase Storage
      const uri = selectedImage;
      const path = `${Date.now()}-viga-input.jpg`;

      const response = await fetch(uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('viga-inputs')
        .upload(path, blob, {
          upsert: false,
          contentType: 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('viga-inputs')
        .getPublicUrl(path);

      const imageUrl = urlData.publicUrl;

      // 2. Submit for reconstruction
      const { taskId } = await submitVigaReconstruction(imageUrl, {
        name: meshName.trim(),
        category: category || undefined,
      });

      setActiveTaskId(taskId);
      setActiveStatus('pending');

      // Clear form
      setSelectedImage(null);
      setMeshName('');
      setCategory('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      Alert.alert('Error', message);
    } finally {
      setUploading(false);
    }
  }, [selectedImage, meshName, category]);

  const navigateToWorkspace = useCallback((meshId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigation.navigate('Workspace', { placeFurniture: meshId } as any);
  }, [navigation]);

  return (
    <TierGate feature="arScansPerMonth" featureLabel="VIGA 3D Reconstruction">
      <View
        className="flex-1"
        style={{ backgroundColor: DS.colors.background, paddingTop: insets.top }}
      >
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="mt-6 mb-8 flex-row items-center justify-between">
            <View>
              <ArchText variant="title" style={{ color: DS.colors.primary }}>
                VIGA 3D
              </ArchText>
              <Text
                style={{
                  color: DS.colors.primaryDim,
                  fontSize: DS.fontSize.sm,
                  marginTop: 2,
                }}
              >
                Upload a photo — get a 3D mesh
              </Text>
            </View>
            <Svg width={36} height={36} viewBox="0 0 40 40">
              <Circle cx="20" cy="20" r="18" stroke={DS.colors.border} strokeWidth="1" fill="none" opacity="0.5" />
              <Path d="M12,15 L20,8 L28,15 M20,8 L20,32" stroke={DS.colors.accent} strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <Circle cx="20" cy="20" r="4" stroke={DS.colors.accent} strokeWidth="1" fill="none" />
            </Svg>
          </View>

          {/* Image selection buttons */}
          <View className="flex-row gap-3 mb-6">
            <Pressable
              onPress={pickFromGallery}
              className="flex-1 rounded-full py-4 px-6 items-center"
              style={{
                backgroundColor: DS.colors.surface,
                borderWidth: 1,
                borderColor: DS.colors.border,
              }}
            >
              <Text style={{ color: DS.colors.primary, fontSize: DS.fontSize.md }}>Gallery</Text>
            </Pressable>
            <Pressable
              onPress={takePhoto}
              className="flex-1 rounded-full py-4 px-6 items-center"
              style={{
                backgroundColor: DS.colors.surface,
                borderWidth: 1,
                borderColor: DS.colors.border,
              }}
            >
              <Text style={{ color: DS.colors.primary, fontSize: DS.fontSize.md }}>Camera</Text>
            </Pressable>
          </View>

          {/* Preview */}
          {selectedImage && (
            <View
              className="mb-6 rounded-2xl overflow-hidden"
              style={{
                backgroundColor: DS.colors.surface,
                borderWidth: 1,
                borderColor: DS.colors.border,
              }}
            >
              <Image
                source={{ uri: selectedImage }}
                className="w-full"
                style={{ height: 220, resizeMode: 'cover' }}
              />
            </View>
          )}

          {/* Name input */}
          <View className="mb-4">
            <Text style={{ color: DS.colors.primaryDim, fontSize: DS.fontSize.sm, marginBottom: 6, marginLeft: 4 }}>
              Mesh Name
            </Text>
            <View
              className="rounded-full px-5 py-3"
              style={{
                backgroundColor: DS.colors.surface,
                borderWidth: 1,
                borderColor: DS.colors.border,
              }}
            >
              <TextInput
                value={meshName}
                onChangeText={setMeshName}
                placeholder="e.g. Lounge Chair V1"
                placeholderTextColor={DS.colors.primaryGhost}
                style={{ color: DS.colors.primary, fontSize: DS.fontSize.md }}
              />
            </View>
          </View>

          {/* Category selector */}
          <View className="mb-6">
            <Text style={{ color: DS.colors.primaryDim, fontSize: DS.fontSize.sm, marginBottom: 6, marginLeft: 4 }}>
              Category
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row gap-2"
            >
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setCategory(cat === category ? '' : cat)}
                  className="rounded-full px-4 py-2"
                  style={{
                    backgroundColor: category === cat ? DS.colors.accent : DS.colors.surface,
                    borderWidth: 1,
                    borderColor: category === cat ? DS.colors.accent : DS.colors.border,
                  }}
                >
                  <Text
                    style={{
                      color: category === cat ? DS.colors.paper : DS.colors.primary,
                      fontSize: DS.fontSize.sm,
                    }}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Submit button */}
          <OvalButton
            label={uploading ? 'Uploading...' : 'Reconstruct 3D Mesh'}
            onPress={handleSubmit}
            disabled={!selectedImage || !meshName.trim() || uploading}
            variant="filled"
            fullWidth
          />

          {/* Active task status */}
          {activeTaskId && (
            <View
              className="mb-8 rounded-2xl p-4 flex-row items-center gap-4"
              style={{
                backgroundColor: DS.colors.surface,
                borderWidth: 1,
                borderColor: DS.colors.border,
              }}
            >
              <CompassRoseLoader size="small" />
              <View className="flex-1">
                <Text style={{ color: DS.colors.primary, fontSize: DS.fontSize.sm }}>
                  {STATUS_LABELS[activeStatus]}
                </Text>
                <Text style={{ color: DS.colors.primaryDim, fontSize: DS.fontSize.xs }}>
                  {activeStatus === 'processing'
                    ? 'VIGA is reconstructing your mesh...'
                    : activeStatus === 'done'
                    ? 'Mesh ready — check your library below'
                    : activeStatus === 'failed'
                    ? 'Something went wrong. Please try again.'
                    : 'Waiting in queue...'}
                </Text>
              </View>
            </View>
          )}

          {/* Divider */}
          <View
            className="h-px mb-6"
            style={{ backgroundColor: DS.colors.border, opacity: 0.3 }}
          />

          {/* My Meshes section */}
          <View className="mb-4 flex-row items-center justify-between">
            <ArchText variant="heading" style={{ color: DS.colors.primary }}>
              My 3D Meshes
            </ArchText>
            <Text style={{ color: DS.colors.primaryDim, fontSize: DS.fontSize.xs }}>
              {meshes.length} mesh{meshes.length !== 1 ? 'es' : ''}
            </Text>
          </View>

          {loadingMeshes ? (
            <View className="items-center py-12">
              <CompassRoseLoader size="medium" />
            </View>
          ) : meshes.length === 0 ? (
            <View
              className="rounded-2xl p-6 items-center"
              style={{ backgroundColor: DS.colors.surface, borderWidth: 1, borderColor: DS.colors.border }}
            >
              <Text style={{ color: DS.colors.primaryDim, fontSize: DS.fontSize.sm, textAlign: 'center' }}>
                No meshes yet. Upload a photo above to get started.
              </Text>
            </View>
          ) : (
            <View className="gap-4">
              {meshes.map((mesh) => (
                <Pressable
                  key={mesh.id}
                  onPress={() => navigateToWorkspace(mesh.id)}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    backgroundColor: DS.colors.surface,
                    borderWidth: 1,
                    borderColor: DS.colors.border,
                  }}
                >
                  <View className="flex-row items-center p-4 gap-4">
                    {mesh.thumbnailUrl ? (
                      <Image
                        source={{ uri: mesh.thumbnailUrl }}
                        className="rounded-xl"
                        style={{ width: 56, height: 56, resizeMode: 'cover' }}
                      />
                    ) : (
                      <View
                        className="rounded-xl items-center justify-center"
                        style={{
                          width: 56,
                          height: 56,
                          backgroundColor: DS.colors.surfaceHigh,
                        }}
                      >
                        <Svg width={24} height={24} viewBox="0 0 24 24">
                          <Path d="M12,4 L20,20 L4,20 Z" stroke={DS.colors.primaryDim} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
                        </Svg>
                      </View>
                    )}
                    <View className="flex-1">
                      <Text style={{ color: DS.colors.primary, fontSize: DS.fontSize.md, fontWeight: '600' }}>
                        {mesh.name}
                      </Text>
                      <Text style={{ color: DS.colors.primaryDim, fontSize: DS.fontSize.xs, marginTop: 2 }}>
                        {mesh.category || 'Uncategorized'} · {mesh.dimensions.x.toFixed(1)}×{mesh.dimensions.y.toFixed(1)}×{mesh.dimensions.z.toFixed(1)}m
                      </Text>
                    </View>
                    <Svg width={20} height={20} viewBox="0 0 24 24">
                      <Path d="M9,6 L15,12 L9,18" stroke={DS.colors.primaryDim} strokeWidth="1.5" strokeLinecap="round" fill="none" />
                    </Svg>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </TierGate>
  );
}