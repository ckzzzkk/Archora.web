import React, { useState } from 'react';
import {
  View, Text, Pressable, Image, Alert,
} from 'react-native';
import { DS } from '../../theme/designSystem';
import { SUNRISE } from '../../theme/sunrise';
import { ArchText } from '../common/ArchText';
import { OvalButton } from '../common/OvalButton';
import { AIProcessingIndicator } from '../common/AIProcessingIndicator';
import { supabase } from '../../utils/supabaseClient';
import { useBlueprintStore } from '../../stores/blueprintStore';
import type { CustomAsset } from '../../types/blueprint';
import * as ImagePicker from 'expo-image-picker';

type Phase = 'select' | 'preview' | 'generating' | 'result' | 'error';

interface Identification {
  furnitureType: string;
  name: string;
  width: number;
  height: number;
  depth: number;
  category: string;
  styleTags: string[];
  confidence: number;
}

interface GenerationResult {
  customAsset: CustomAsset;
  identification: Identification;
  meshGenerated: boolean;
}

const FURNITURE_GENERATION_WORDS = [
  { text: 'Identifying furniture from photo...', icon: 'compass' as const },
  { text: 'Analyzing proportions and style...', icon: 'wave' as const },
  { text: 'Generating 3D geometry...', icon: 'sparkle' as const },
  { text: 'Finalizing your custom model...', icon: 'compass' as const },
];

export function ImageToFurnitureSheet({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('Something went wrong. Please try again.');
  const { addCustomAsset } = useBlueprintStore.getState().actions;

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library access to select furniture images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setLocalImageUri(result.assets[0].uri);
      setSelectedImage(result.assets[0].uri);
      setPhase('preview');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera access to photograph furniture.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setLocalImageUri(result.assets[0].uri);
      setSelectedImage(result.assets[0].uri);
      setPhase('preview');
    }
  };

  const uploadAndGenerate = async () => {
    if (!localImageUri) return;

    setPhase('generating');

    try {
      // Upload image to furniture-images bucket
      const fileExt = localImageUri.split('.').pop() ?? 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
      const fileUri = localImageUri;

      const fileData = await fetch(fileUri);
      const blob = await fileData.blob();

      const { error: uploadError } = await supabase.storage
        .from('furniture-images')
        .upload(fileName, blob, { contentType: `image/${fileExt}` });

      if (uploadError) throw new Error('Failed to upload image');

      const { data: urlData } = supabase.storage
        .from('furniture-images')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Call edge function
      const { data, error } = await supabase.functions.invoke('generate-furniture-from-image', {
        body: { imageUrl: publicUrl },
      });

      if (error || !data) {
        throw new Error((error as { message?: string })?.message ?? 'Generation failed');
      }

      const resultData = data as GenerationResult;
      setResult(resultData);
      setPhase('result');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setPhase('error');
    }
  };

  const handleAddToLibrary = () => {
    if (result) {
      addCustomAsset(result.customAsset);
    }
    onClose();
  };

  const handleTryAnother = () => {
    setSelectedImage(null);
    setLocalImageUri(null);
    setResult(null);
    setPhase('select');
  };

  return (
    <View style={{
      backgroundColor: DS.colors.surfaceHigh,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 20,
      paddingBottom: 40,
      paddingHorizontal: 24,
      maxHeight: '85%',
    }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <ArchText variant="heading" style={{ fontSize: 18, color: DS.colors.primary }}>
          Photo → 3D Model
        </ArchText>
        <Pressable onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={{ color: DS.colors.primaryGhost, fontSize: 20 }}>✕</Text>
        </Pressable>
      </View>

      {/* ── SELECT phase ───────────────────────────────────────────── */}
      {phase === 'select' && (
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📷</Text>
          <ArchText variant="body" style={{ color: DS.colors.primaryGhost, textAlign: 'center', marginBottom: 24 }}>
            Photograph any piece of furniture and we'll create a 3D model you can place in your designs.
          </ArchText>
          <View style={{ width: '100%', gap: 12 }}>
            <OvalButton variant="filled" onPress={takePhoto} label="Take a Photo" />
            <OvalButton variant="outline" onPress={pickFromLibrary} label="Choose from Gallery" />
          </View>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: DS.colors.primaryDim, marginTop: 16, textAlign: 'center' }}>
            Works best with well-lit, clear photos from above
          </Text>
        </View>
      )}

      {/* ── PREVIEW phase ──────────────────────────────────────────── */}
      {phase === 'preview' && localImageUri && (
        <View style={{ alignItems: 'center', paddingVertical: 12 }}>
          <View style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 16, overflow: 'hidden', marginBottom: 20, backgroundColor: DS.colors.surface }}>
            <Image source={{ uri: localImageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </View>
          <View style={{ width: '100%', gap: 10 }}>
            <OvalButton variant="filled" onPress={uploadAndGenerate} label="Generate 3D Model" />
            <OvalButton variant="ghost" onPress={handleTryAnother} label="Choose Different Image" />
          </View>
        </View>
      )}

      {/* ── GENERATING phase ───────────────────────────────────────── */}
      {phase === 'generating' && (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <AIProcessingIndicator
            size="large"
            words={FURNITURE_GENERATION_WORDS}
            interval={4000}
          />
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: DS.colors.primaryDim, marginTop: 24 }}>
            This usually takes 30–60 seconds
          </Text>
        </View>
      )}

      {/* ── RESULT phase ───────────────────────────────────────────── */}
      {phase === 'result' && result && (
        <View style={{ paddingVertical: 8 }}>
          {/* Identification card */}
          <View style={{
            backgroundColor: DS.colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: DS.colors.border,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <View>
                <ArchText variant="heading" style={{ fontSize: 16, color: DS.colors.primary }}>
                  {result.identification.name}
                </ArchText>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: DS.colors.primaryDim, marginTop: 2 }}>
                  {result.identification.furnitureType} · {result.identification.category}
                </Text>
              </View>
              {result.meshGenerated ? (
                <View style={{ backgroundColor: '#7AB87A20', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 12 }}>✨</Text>
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: '#7AB87A' }}>Mesh Ready</Text>
                </View>
              ) : (
                <View style={{ backgroundColor: `${SUNRISE.amber}20`, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 12 }}>⚙</Text>
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: SUNRISE.amber }}>
                    Procedural
                  </Text>
                </View>
              )}
            </View>

            {/* Dimensions */}
            <View style={{ flexDirection: 'row', gap: 16 }}>
              {[
                { label: 'W', value: result.identification.width.toFixed(2) },
                { label: 'H', value: result.identification.height.toFixed(2) },
                { label: 'D', value: result.identification.depth.toFixed(2) },
              ].map(({ label, value }) => (
                <View key={label} style={{ flex: 1, backgroundColor: DS.colors.surfaceHigh, borderRadius: 8, padding: 10, alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: DS.colors.primaryDim }}>{label} (m)</Text>
                  <Text style={{ fontFamily: 'JetBrainsMono_400Regular', fontSize: 15, color: DS.colors.primary, marginTop: 2 }}>{value}</Text>
                </View>
              ))}
            </View>

            {/* Style tags */}
            {result.identification.styleTags.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {result.identification.styleTags.map((tag) => (
                  <View key={tag} style={{ backgroundColor: DS.colors.surfaceHigh, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}>
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: DS.colors.primaryGhost }}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={{ gap: 10 }}>
            <OvalButton variant="filled" onPress={handleAddToLibrary} label="Add to Studio Library" />
            <OvalButton variant="ghost" onPress={handleTryAnother} label="Try Another Photo" />
          </View>
        </View>
      )}

      {/* ── ERROR phase ────────────────────────────────────────────── */}
      {phase === 'error' && (
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <Text style={{ fontSize: 40, marginBottom: 16 }}>⚠</Text>
          <ArchText variant="body" style={{ color: DS.colors.primaryGhost, textAlign: 'center', marginBottom: 8 }}>
            {errorMessage}
          </ArchText>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: DS.colors.primaryDim, marginBottom: 24, textAlign: 'center' }}>
            Make sure the photo is clear and the furniture is visible.
          </Text>
          <View style={{ width: '100%', gap: 10 }}>
            <OvalButton variant="filled" onPress={() => setPhase('preview')} label="Try Again" />
            <OvalButton variant="ghost" onPress={handleTryAnother} label="Choose Different Image" />
          </View>
        </View>
      )}
    </View>
  );
}