import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { supabase } from '../utils/supabaseClient';

export interface VoiceInputState {
  isRecording: boolean;
  transcript: string;
  isAvailable: boolean;
  error: string | null;
  isFallback: boolean;
}

export function useVoiceInput() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = useCallback(async () => {
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

      // Read file and convert to base64
      const response = await fetch(uri);
      const blob = await response.blob();
      const base64 = await blobToBase64(blob);

      // Call transcribe edge function
      const { data, error: fnError } = await supabase.functions.invoke('transcribe', {
        body: { audio: base64, mimeType: 'audio/m4a' },
      });

      if (fnError) {
        setError('Transcription failed');
        return;
      }

      if (data?.fallback === 'device_speech') {
        // Edge function signalled to use manual text input
        setIsFallback(true);
      } else if (data?.text) {
        setTranscript(data.text);
        setIsFallback(false);
      } else {
        setIsFallback(true);
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
    isAvailable: true,
    error,
    isFallback,
    startRecording,
    stopRecording,
    setManualTranscript,
    clearTranscript,
  };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip data URL prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
