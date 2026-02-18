import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { generateLetter, type LetterTone, type LetterOccasion } from '@/services/openai';
import { saveTemplate } from '@/services/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Mic } from 'lucide-react-native';

const OCCASIONS: { value: LetterOccasion; label: string }[] = [
  { value: 'thank_you', label: 'Thank You' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'congratulations', label: 'Congratulations' },
  { value: 'thinking_of_you', label: 'Thinking of You' },
  { value: 'sympathy', label: 'Sympathy' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'business', label: 'Business' },
  { value: 'custom', label: 'Custom' },
];

const TONES: { value: LetterTone; label: string }[] = [
  { value: 'warm', label: 'Warm' },
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'formal', label: 'Formal' },
  { value: 'heartfelt', label: 'Heartfelt' },
];

export default function CreateLetterScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    voiceTranscription?: string;
    templateContent?: string;
    templateOccasion?: string;
    templateTone?: string;
  }>();

  const [occasion, setOccasion] = useState<LetterOccasion>(
    (params.templateOccasion as LetterOccasion) || 'thank_you',
  );
  const [tone, setTone] = useState<LetterTone>(
    (params.templateTone as LetterTone) || 'warm',
  );
  const [keyPoints, setKeyPoints] = useState(
    params.voiceTranscription || params.templateContent || '',
  );
  const [recipientContext, setRecipientContext] = useState('');
  const [senderName, setSenderName] = useState('');
  const [generatedLetters, setGeneratedLetters] = useState<string[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<number>(-1);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsGenerating(true);
    try {
      const letters = await generateLetter({
        occasion,
        tone,
        keyPoints: keyPoints || undefined,
        recipientContext: recipientContext || undefined,
        senderName: senderName || undefined,
      });
      setGeneratedLetters(letters);
      setSelectedLetter(0);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to generate letter');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = () => {
    if (selectedLetter < 0 || !generatedLetters[selectedLetter]) {
      Alert.alert('Select a Letter', 'Please generate and select a letter first.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/send',
      params: { message: generatedLetters[selectedLetter] },
    });
  };

  const handleSaveTemplate = async () => {
    if (selectedLetter < 0 || !generatedLetters[selectedLetter]) return;
    try {
      await saveTemplate({
        name: `${occasion} - ${tone}`,
        occasion,
        tone,
        content: generatedLetters[selectedLetter],
      });
      Alert.alert('Saved', 'Letter saved as template.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save template.');
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16 },
    sectionTitle: { fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 8, marginTop: 16 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { fontSize: 14, color: colors.textSecondary },
    chipTextActive: { color: '#fff' },
    input: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border, marginTop: 8, minHeight: 80, textAlignVertical: 'top' },
    inputSmall: { minHeight: 44 },
    button: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
    buttonDisabled: { opacity: 0.5 },
    buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
    letterCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginTop: 12, borderWidth: 2, borderColor: colors.border },
    letterCardSelected: { borderColor: colors.primary },
    letterLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 4 },
    letterText: { fontSize: 15, color: colors.text, lineHeight: 22 },
    sendButton: { backgroundColor: colors.success, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
    saveButton: { backgroundColor: colors.info, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 10, marginBottom: 40 },
    saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    voiceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    voiceBtn: { backgroundColor: colors.error, borderRadius: 10, padding: 10 },
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={s.sectionTitle}>Occasion</Text>
        <View style={s.chipRow}>
          {OCCASIONS.map((o) => (
            <TouchableOpacity
              key={o.value}
              style={[s.chip, occasion === o.value && s.chipActive]}
              onPress={() => setOccasion(o.value)}
              accessibilityLabel={`Occasion: ${o.label}`}
              accessibilityRole="button"
            >
              <Text style={[s.chipText, occasion === o.value && s.chipTextActive]}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionTitle}>Tone</Text>
        <View style={s.chipRow}>
          {TONES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[s.chip, tone === t.value && s.chipActive]}
              onPress={() => setTone(t.value)}
              accessibilityLabel={`Tone: ${t.label}`}
              accessibilityRole="button"
            >
              <Text style={[s.chipText, tone === t.value && s.chipTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.sectionTitle}>Key Points (optional)</Text>
        <TextInput
          style={s.input}
          placeholder="What should the letter include?"
          placeholderTextColor={colors.textMuted}
          value={keyPoints}
          onChangeText={setKeyPoints}
          multiline
          accessibilityLabel="Key points for the letter"
        />
        <View style={s.voiceRow}>
          <TouchableOpacity
            style={s.voiceBtn}
            onPress={() => router.push('/voice-recorder')}
            accessibilityLabel="Record voice message"
            accessibilityRole="button"
          >
            <Mic size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>Or dictate with your voice</Text>
        </View>

        <Text style={s.sectionTitle}>Recipient Context (optional)</Text>
        <TextInput
          style={[s.input, s.inputSmall]}
          placeholder="e.g. Client who just signed a deal"
          placeholderTextColor={colors.textMuted}
          value={recipientContext}
          onChangeText={setRecipientContext}
          accessibilityLabel="Recipient context"
        />

        <Text style={s.sectionTitle}>Your Name</Text>
        <TextInput
          style={[s.input, s.inputSmall]}
          placeholder="How to sign the letter"
          placeholderTextColor={colors.textMuted}
          value={senderName}
          onChangeText={setSenderName}
          accessibilityLabel="Your name to sign the letter"
        />

        <TouchableOpacity
          style={[s.button, isGenerating && s.buttonDisabled]}
          onPress={handleGenerate}
          disabled={isGenerating}
          accessibilityLabel="Generate letter variations"
          accessibilityRole="button"
        >
          {isGenerating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.buttonText}>Generate 3 Letter Variations</Text>
          )}
        </TouchableOpacity>

        {generatedLetters.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Choose a Letter</Text>
            {generatedLetters.map((letter, i) => (
              <TouchableOpacity
                key={i}
                style={[s.letterCard, selectedLetter === i && s.letterCardSelected]}
                onPress={() => setSelectedLetter(i)}
                accessibilityLabel={`Letter variation ${i + 1}`}
                accessibilityRole="button"
              >
                <Text style={s.letterLabel}>Variation {i + 1}</Text>
                <Text style={s.letterText}>{letter}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={s.sendButton} onPress={handleSend} accessibilityLabel="Send this letter" accessibilityRole="button">
              <Text style={s.buttonText}>Send This Letter</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.saveButton} onPress={handleSaveTemplate} accessibilityLabel="Save as template" accessibilityRole="button">
              <Text style={s.saveButtonText}>Save as Template</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}
