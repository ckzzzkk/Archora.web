import React, { useState } from 'react';
import { DS } from '../../../theme/designSystem';
import { ArchText } from '../../../components/common/ArchText';
import { View,  Pressable, Image, Alert } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';

import { aiService } from '../../../services/aiService';
import { useAuthStore } from '../../../stores/authStore';
import { useTierGate } from '../../../hooks/useTierGate';
import { CompassRoseLoader } from '../../../components/common/CompassRoseLoader';

interface Props {
  referenceImageUrl: string | undefined;
  onImageUploaded: (url: string) => void;
  onSkip: () => void;
  onNext: () => void;
}

export function Step5Reference({ referenceImageUrl, onImageUploaded, onSkip, onNext }: Props) {
  const userId = useAuthStore((s) => s.user?.id);
  const { allowed: canUploadReference } = useTierGate('blueprintUpload');
  const [uploading, setUploading] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);

  const pickImage = async () => {
    if (!canUploadReference) {
      Alert.alert(
        'Creator Feature',
        'Reference image upload is available on Creator plan and above. Upgrade to unlock this feature.',
        [{ text: 'OK' }],
      );
      return;
    }

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
      if (!userId) throw new Error('Not authenticated');
      const publicUrl = await aiService.uploadReferenceImage(userId, asset.uri);
      if (!publicUrl) throw new Error('Upload returned no URL');
      onImageUploaded(publicUrl);
    } catch {
      Alert.alert('Upload failed', 'Could not upload image. Please try again.');
      setLocalUri(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Animated.View entering={FadeIn.duration(150)} style={{ paddingHorizontal: DS.spacing.lg, flex: 1 }}>
      <ArchText variant="body"
        style={{
          fontFamily: 'ArchitectsDaughter_400Regular',
          fontSize: 24,
          color: DS.colors.primary,
          marginBottom: 24,
        }}
      >
        Any inspiration images?
      </ArchText>

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
            borderColor: DS.colors.border,
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
              <ArchText variant="body" style={{ fontSize: 32, marginBottom: 8 }}>{'\u{1F4F7}'}</ArchText>
              <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: DS.colors.primaryDim }}>
                Upload a photo
              </ArchText>
            </>
          )}
        </Pressable>
      )}

      <Pressable onPress={onSkip} style={{ alignSelf: 'center', marginBottom: 24 }}>
        <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: DS.colors.primaryDim, textDecorationLine: 'underline' }}>
          Skip this step
        </ArchText>
      </Pressable>

      {(referenceImageUrl || localUri) && !uploading && (
        <Pressable
          onPress={onNext}
          style={{
            backgroundColor: DS.colors.primary,
            borderRadius: 50,
            paddingVertical: 16,
            alignItems: 'center',
          }}
        >
          <ArchText variant="body" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: DS.colors.background }}>Next</ArchText>
        </Pressable>
      )}
    </Animated.View>
  );
}
