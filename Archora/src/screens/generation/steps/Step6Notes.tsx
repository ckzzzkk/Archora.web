import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { Audio } from 'expo-av';
import { BASE_COLORS } from '../../../theme/colors';
import { aiService } from '../../../services/aiService';
import { CompassRoseLoader } from '../../../components/common/CompassRoseLoader';

const MAX_CHARS = 500;

interface Props {
  notes: string;
  transcript: string | undefined;
  onNotesChange: (v: string) => void;
  onTranscriptAppend: (t: string) => void;
  onNext: () => void;
}

export function Step6Notes({ notes, transcript, onNotesChange, onTranscriptAppend, onNext }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const pulseScale = useSharedValue(1);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow microphone access.');
        return;
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);

      pulseScale.value = withRepeat(
        withTiming(1.15, { duration: 600 }),
        -1,
        true,
      );
    } catch {
      Alert.alert('Error', 'Could not start recording.');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    pulseScale.value = withTiming(1, { duration: 150 });
    setIsRecording(false);
    setIsTranscribing(true);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) return;

      const text = await aiService.transcribeAudio(uri);
      if (text) {
        onTranscriptAppend(text);
        // Also append to notes
        const combined = notes ? `${notes}\n${text}` : text;
        onNotesChange(combined.slice(0, MAX_CHARS));
      }
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err.code !== 'DEVICE_SPEECH_FALLBACK') {
        Alert.alert('Transcription failed', 'Could not transcribe audio. Type your notes instead.');
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      void stopRecording();
    } else {
      void startRecording();
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
        Anything else to tell me?
      </Text>

      <TextInput
        value={notes}
        onChangeText={(t) => onNotesChange(t.slice(0, MAX_CHARS))}
        placeholder="North facing windows, open plan kitchen flowing to garden..."
        placeholderTextColor={BASE_COLORS.textDim}
        multiline
        style={{
          backgroundColor: BASE_COLORS.surface,
          borderRadius: 24,
          paddingHorizontal: 20,
          paddingVertical: 16,
          fontFamily: 'Inter_400Regular',
          fontSize: 15,
          color: BASE_COLORS.textPrimary,
          borderWidth: 1,
          borderColor: BASE_COLORS.border,
          minHeight: 120,
          textAlignVertical: 'top',
          marginBottom: 8,
        }}
      />

      <Text
        style={{
          fontFamily: 'JetBrainsMono_400Regular',
          fontSize: 11,
          color: BASE_COLORS.textDim,
          textAlign: 'right',
          marginBottom: 20,
        }}
      >
        {notes.length}/{MAX_CHARS}
      </Text>

      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        {isTranscribing ? (
          <CompassRoseLoader size="medium" />
        ) : (
          <Animated.View style={pulseStyle}>
            <Pressable
              onPress={toggleRecording}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: isRecording ? BASE_COLORS.error : BASE_COLORS.surface,
                borderWidth: 2,
                borderColor: isRecording ? BASE_COLORS.error : BASE_COLORS.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 24 }}>{'\u{1F3A4}'}</Text>
            </Pressable>
          </Animated.View>
        )}
        {isRecording && (
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: BASE_COLORS.error, marginTop: 8 }}>
            Recording... tap to stop
          </Text>
        )}
      </View>

      {transcript ? (
        <View style={{ backgroundColor: BASE_COLORS.surface, borderRadius: 12, padding: 12, marginBottom: 16 }}>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: BASE_COLORS.textDim, marginBottom: 4 }}>
            Transcript:
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: BASE_COLORS.textSecondary }}>
            {transcript}
          </Text>
        </View>
      ) : null}

      <Pressable
        onPress={onNext}
        style={{
          backgroundColor: BASE_COLORS.textPrimary,
          borderRadius: 50,
          paddingVertical: 16,
          alignItems: 'center',
          marginTop: 'auto',
        }}
      >
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: BASE_COLORS.background }}>Next</Text>
      </Pressable>
    </Animated.View>
  );
}
