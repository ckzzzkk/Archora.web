import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { aiService } from '../services/aiService';
import { useAuthStore } from '../stores/authStore';
import { isFeatureAllowed } from '../utils/tierLimits';

export interface VoiceInputState {
  isRecording: boolean;
  transcript: string;
  isAvailable: boolean;
  error: string | null;
  isFallback: boolean;
}

export function useVoiceInput() {
  const tier = useAuthStore((s) => s.user?.subscriptionTier ?? 'starter');
  const audioAllowed = isFeatureAllowed(tier, 'audioInput');

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = useCallback(async () => {
    if (!audioAllowed) {
      setError('Voice input requires Creator tier or above');
      return;
    }
    try {
      setError(null);
      setTranscript('');

      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setError('Microphone permission denied');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err) {
      setError('Failed to start recording');
      console.error('[useVoiceInput] startRecording error:', err);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recordingRef.current) return;

    try {
      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();

      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        setError('No recording found');
        return;
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      try {
        const text = await aiService.transcribeAudio(uri);
        setTranscript(text);
        setIsFallback(false);
      } catch (transcribeErr) {
        const code = (transcribeErr as { code?: string }).code;
        if (code === 'DEVICE_SPEECH_FALLBACK') {
          setIsFallback(true);
        } else {
          setError('Transcription failed');
          setIsFallback(true);
        }
      }
    } catch (err) {
      setError('Failed to transcribe recording');
      setIsFallback(true);
      console.error('[useVoiceInput] stopRecording error:', err);
    }
  }, []);

  const setManualTranscript = useCallback((text: string) => {
    setTranscript(text);
    setIsFallback(false);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setIsFallback(false);
    setError(null);
  }, []);

  return {
    isRecording,
    transcript,
    isAvailable: audioAllowed,
    error,
    isFallback,
    startRecording,
    stopRecording,
    setManualTranscript,
    clearTranscript,
  };
}
