import React, { useState } from 'react';
import { View, Text, Pressable, Image, Alert } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { BASE_COLORS } from '../../../theme/colors';
import { supabase } from '../../../utils/supabaseClient';
import { useAuthStore } from '../../../stores/authStore';
import { CompassRoseLoader } from '../../../components/common/CompassRoseLoader';

interface Props {
  referenceImageUrl: string | undefined;
  onImageUploaded: (url: string) => void;
  onSkip: () => void;
  onNext: () => void;
}

export function Step5Reference({ referenceImageUrl, onImageUploaded, onSkip, onNext }: Props) {
  const userId = useAuthStore((s) => s.user?.id);
  const [uploading, setUploading] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }

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
      const filename = `${userId}/${Date.now()}.jpg`;
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const { error } = await supabase.storage
        .from('reference-images')
        .upload(filename, blob, { contentType: 'image/jpeg', upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('reference-images')
        .getPublicUrl(filename);

      onImageUploaded(urlData.publicUrl);
    } catch {
      Alert.alert('Upload failed', 'Could not upload image. Please try again.');
      setLocalUri(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Animated.View entering={FadeIn.duration(150)} style={{ paddingHorizontal: 20, flex: 1 }}>
      <Text
        style={{
          fontFamily: 'ArchitectsDaughter_400Regular',
          fontSize: 24,
          color: BASE_COLORS.textPrimary,
          marginBottom: 24,
        }}
      >
        Any inspiration images?
      </Text>

      {localUri || referenceImageUrl ? (
        <Pressable onPress={pickImage} style={{ marginBottom: 20 }}>
          <Image
            source={{ uri: localUri ?? referenceImageUrl }}
            style={{ width: '100%', height: 200, borderRadius: 16 }}
            resizeMode="cover"
          />
          {uploading && (
            <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 16 }}>
              <CompassRoseLoader size="medium" />
            </View>
          )}
        </Pressable>
      ) : (
        <Pressable
          onPress={pickImage}
          style={{
            borderRadius: 24,
            borderWidth: 2,
            borderColor: BASE_COLORS.border,
            borderStyle: 'dashed',
            height: 180,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          {uploading ? (
            <CompassRoseLoader size="medium" />
          ) : (
            <>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>{'\u{1F4F7}'}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: BASE_COLORS.textSecondary }}>
                Upload a photo
              </Text>
            </>
          )}
        </Pressable>
      )}

      <Pressable onPress={onSkip} style={{ alignSelf: 'center', marginBottom: 24 }}>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: BASE_COLORS.textSecondary, textDecorationLine: 'underline' }}>
          Skip this step
        </Text>
      </Pressable>

      {(referenceImageUrl || localUri) && !uploading && (
        <Pressable
          onPress={onNext}
          style={{
            backgroundColor: BASE_COLORS.textPrimary,
            borderRadius: 50,
            paddingVertical: 16,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: BASE_COLORS.background }}>Next</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}
