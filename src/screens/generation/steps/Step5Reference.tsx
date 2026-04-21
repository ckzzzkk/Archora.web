import React, { useState } from 'react';
import { View, Pressable, Image } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

import { DS } from '../../../theme/designSystem';
import { BASE_COLORS } from '../../../theme/colors';
import { ArchText } from '../../../components/common/ArchText';
import { GridBackground } from '../../../components/common/GridBackground';
import { CompassRoseLoader } from '../../../components/common/CompassRoseLoader';
import { aiService } from '../../../services/aiService';
import { useSession } from '../../../auth/useSession';
import { useUIStore } from '../../../stores/uiStore';
import { useTierGate } from '../../../hooks/useTierGate';

interface Props {
  referenceImageUrl: string | undefined;
  onImageUploaded: (url: string) => void;
  onSkip: () => void;
  onNext: () => void;
}

export function Step5Reference({ referenceImageUrl, onImageUploaded, onSkip, onNext }: Props) {
  const userId = useSession().user?.id;
  const s = useUIStore();
  const { allowed: canUploadReference } = useTierGate('blueprintUpload');
  const [uploading, setUploading] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);

  const pickImage = async () => {
    if (!canUploadReference) {
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
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

  return (
    <Animated.View entering={FadeIn.duration(150)} style={{ flex: 1 }}>
      <GridBackground />

      <View style={{ paddingHorizontal: DS.spacing.lg, flex: 1 }}>
        <ArchText variant="heading" style={{ marginBottom: DS.spacing.xl }}>
          add a reference image
        </ArchText>

        {localUri || referenceImageUrl ? (
          <Pressable onPress={pickImage}>
            <Image
              source={{ uri: localUri ?? referenceImageUrl }}
              style={{
                width: '100%',
                height: 200,
                borderRadius: DS.radius.large,
                borderWidth: 2,
                borderColor: BASE_COLORS.textPrimary,
              }}
              resizeMode="cover"
            />
            {uploading && (
              <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(26,26,26,0.6)', borderRadius: DS.radius.large }}>
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
              borderColor: BASE_COLORS.textPrimary,
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
                <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={BASE_COLORS.textPrimary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: DS.spacing.sm }}>
                  <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <Circle cx={12} cy={13} r={4} />
                </Svg>
                <ArchText variant="body" style={{ fontFamily: DS.font.regular }}>
                  Upload a photo
                </ArchText>
              </>
            )}
          </Pressable>
        )}

        <View style={{ flex: 1 }} />

        <Pressable onPress={onSkip} style={{ alignSelf: 'center', marginBottom: DS.spacing.lg }}>
          <ArchText variant="caption" style={{ textDecorationLine: 'underline' }}>
            Skip this step
          </ArchText>
        </Pressable>
      </View>
    </Animated.View>
  );
}
