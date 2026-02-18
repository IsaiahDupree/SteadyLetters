import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import { useTheme } from '@/providers/ThemeProvider';
import { useRouter } from 'expo-router';
import { transcribeAudio } from '@/services/openai';
import { Mic, Square, Play, RotateCcw, ArrowRight } from 'lucide-react-native';

type RecordingState = 'idle' | 'recording' | 'recorded' | 'transcribing';

export default function VoiceRecorderScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [transcription, setTranscription] = useState('');
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Microphone access is needed to record audio.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setState('recording');
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording.');
      console.error('Recording error:', error);
    }
  };

  const stopRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!recordingRef.current) return;

    try {
      await recordingRef.current.stopAndUnloadAsync();
      setState('recorded');
    } catch (error) {
      console.error('Stop recording error:', error);
    }
  };

  const handleTranscribe = async () => {
    if (!recordingRef.current) return;

    setState('transcribing');
    try {
      const uri = recordingRef.current.getURI();
      if (!uri) throw new Error('No recording URI');

      const text = await transcribeAudio(uri);
      setTranscription(text);

      router.push({
        pathname: '/(tabs)',
        params: { voiceTranscription: text },
      });
    } catch (error) {
      Alert.alert('Transcription Failed', error instanceof Error ? error.message : 'Could not transcribe audio');
      setState('recorded');
    }
  };

  const resetRecording = () => {
    recordingRef.current = null;
    setState('idle');
    setDuration(0);
    setTranscription('');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 },
    title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 8 },
    subtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: 40 },
    timer: { fontSize: 48, fontWeight: '300', color: colors.text, marginBottom: 32, fontVariant: ['tabular-nums'] },
    recordButton: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.error, justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
    recordButtonRecording: { backgroundColor: colors.error },
    stopButton: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.textMuted, justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
    actionRow: { flexDirection: 'row', gap: 16 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    actionBtnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
    actionText: { fontSize: 16, fontWeight: '600', color: colors.text },
    actionTextPrimary: { color: '#fff' },
    pulse: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.error, marginBottom: 12 },
    statusText: { fontSize: 14, color: colors.textMuted, marginBottom: 8 },
  });

  return (
    <View style={s.container}>
      <Text style={s.title}>Voice to Letter</Text>
      <Text style={s.subtitle}>
        {state === 'idle' && 'Tap the microphone to start dictating your letter.'}
        {state === 'recording' && 'Speaking... Tap stop when finished.'}
        {state === 'recorded' && 'Recording complete. Transcribe to use as letter content.'}
        {state === 'transcribing' && 'Transcribing your audio with AI...'}
      </Text>

      {state === 'recording' && <View style={s.pulse} />}
      <Text style={s.timer}>{formatTime(duration)}</Text>

      {state === 'idle' && (
        <TouchableOpacity style={s.recordButton} onPress={startRecording}>
          <Mic size={36} color="#fff" />
        </TouchableOpacity>
      )}

      {state === 'recording' && (
        <TouchableOpacity style={s.stopButton} onPress={stopRecording}>
          <Square size={32} color="#fff" />
        </TouchableOpacity>
      )}

      {state === 'recorded' && (
        <View style={s.actionRow}>
          <TouchableOpacity style={s.actionBtn} onPress={resetRecording}>
            <RotateCcw size={18} color={colors.text} />
            <Text style={s.actionText}>Redo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, s.actionBtnPrimary]} onPress={handleTranscribe}>
            <ArrowRight size={18} color="#fff" />
            <Text style={s.actionTextPrimary}>Transcribe</Text>
          </TouchableOpacity>
        </View>
      )}

      {state === 'transcribing' && <ActivityIndicator size="large" color={colors.primary} />}
    </View>
  );
}
