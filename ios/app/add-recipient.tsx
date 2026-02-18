import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useRouter } from 'expo-router';
import { createRecipient } from '@/services/api';

export default function AddRecipientScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('US');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name || !address || !city || !province || !postalCode) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    setIsSaving(true);
    try {
      await createRecipient({
        name,
        address,
        address2: address2 || undefined,
        city,
        province,
        postal_code: postalCode,
        country,
      });
      router.back();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save recipient');
    } finally {
      setIsSaving(false);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 40 },
    label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginTop: 16, marginBottom: 6 },
    input: { backgroundColor: colors.surface, borderRadius: 10, padding: 14, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.border },
    row: { flexDirection: 'row', gap: 12 },
    flex1: { flex: 1 },
    button: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
    buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
    required: { color: colors.error, fontSize: 12 },
  });

  const Field = ({ label, value, onChangeText, placeholder, required }: { label: string; value: string; onChangeText: (t: string) => void; placeholder: string; required?: boolean }) => (
    <>
      <Text style={s.label}>{label} {required && <Text style={s.required}>*</Text>}</Text>
      <TextInput style={s.input} placeholder={placeholder} placeholderTextColor={colors.textMuted} value={value} onChangeText={onChangeText} />
    </>
  );

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.content}>
        <Field label="Full Name" value={name} onChangeText={setName} placeholder="John Doe" required />
        <Field label="Street Address" value={address} onChangeText={setAddress} placeholder="123 Main St" required />
        <Field label="Apt / Suite" value={address2} onChangeText={setAddress2} placeholder="Apt 4B" />
        <View style={s.row}>
          <View style={s.flex1}>
            <Field label="City" value={city} onChangeText={setCity} placeholder="Austin" required />
          </View>
          <View style={s.flex1}>
            <Field label="State" value={province} onChangeText={setProvince} placeholder="TX" required />
          </View>
        </View>
        <View style={s.row}>
          <View style={s.flex1}>
            <Field label="ZIP Code" value={postalCode} onChangeText={setPostalCode} placeholder="78701" required />
          </View>
          <View style={s.flex1}>
            <Field label="Country" value={country} onChangeText={setCountry} placeholder="US" />
          </View>
        </View>

        <TouchableOpacity style={s.button} onPress={handleSave} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Save Recipient</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
