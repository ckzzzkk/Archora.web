import React, { useState, useRef } from 'react';
import { DS } from '../../../theme/designSystem';
import { ArchText } from '../../../components/common/ArchText';
import { View,  TextInput, Pressable, Alert } from 'react-native';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { Audio } from 'expo-av';

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
      <ArchText variant="body"
        style={{
          fontFamily: 'ArchitectsDaughter_400Regular',
          fontSize: 24,
          color: DS.colors.primary,
          marginBottom: 24,
        }}
      >
        Anything else to tell me?
      </ArchText>

      <TextInput
        value={notes}
        onChangeText={(t) => onNotesChange(t.slice(0, MAX_CHARS))}
        placeholder="North facing windows, open plan kitchen flowing to garden..."
        placeholderTextColor={DS.colors.primaryGhost}
        multiline
        style={{
          backgroundColor: DS.colors.surface,
          borderRadius: 24,
          paddingHorizontal: 20,
          paddingVertical: 16,
          fontFamily: 'Inter_400Regular',
          fontSize: 15,
          color: DS.colors.primary,
          borderWidth: 1,
          borderColor: DS.colors.border,
          minHeight: 120,
          textAlignVertical: 'top',
          marginBottom: 8,
        }}
      />

      <ArchText variant="body"
        style={{
          fontFamily: 'JetBrainsMono_400Regular',
          fontSize: 11,
          color: DS.colors.primaryGhost,
          textAlign: 'right',
          marginBottom: 20,
        }}
      >
        {notes.length}/{MAX_CHARS}
      </ArchText>

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
                backgroundColor: isRecording ? DS.colors.error : DS.colors.surface,
                borderWidth: 2,
                borderColor: isRecording ? DS.colors.error : DS.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArchText variant="body" style={{ fontSize: 24 }}>{'\u{1F3A4}'}</ArchText>
            </Pressable>
          </Animated.View>
        )}
        {isRecording && (
          <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: DS.colors.error, marginTop: 8 }}>
            Recording... tap to stop
          </ArchText>
        )}
      </View>

      {transcript ? (
        <View style={{ backgroundColor: DS.colors.surface, borderRadius: 12, padding: 12, marginBottom: 16 }}>
          <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: DS.colors.primaryGhost, marginBottom: 4 }}>
            Transcript:
          </ArchText>
          <ArchText variant="body" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: DS.colors.primaryDim }}>
            {transcript}
          </ArchText>
        </View>
      ) : null}

      <Pressable
        onPress={onNext}
        style={{
          backgroundColor: DS.colors.primary,
          borderRadius: 50,
          paddingVertical: 16,
          alignItems: 'center',
          marginTop: 'auto',
        }}
      >
        <ArchText variant="body" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: DS.colors.background }}>Next</ArchText>
      </Pressable>
    </Animated.View>
  );
}
