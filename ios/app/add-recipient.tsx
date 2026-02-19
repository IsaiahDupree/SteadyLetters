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
import * as Haptics from 'expo-haptics';
import { UserPlus } from 'lucide-react-native';
import { trackEvent, Events } from '@/services/events';

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
    const trimmed = { name: name.trim(), address: address.trim(), address2: address2.trim(), city: city.trim(), province: province.trim(), postalCode: postalCode.trim(), country: country.trim() || 'US' };
    const missing: string[] = [];
    if (!trimmed.name) missing.push('Full Name');
    if (!trimmed.address) missing.push('Street Address');
    if (!trimmed.city) missing.push('City');
    if (!trimmed.province) missing.push('State');
    if (!trimmed.postalCode) missing.push('ZIP Code');
    if (missing.length > 0) {
      Alert.alert('Missing Fields', `Please fill in: ${missing.join(', ')}`);
      return;
    }
    setIsSaving(true);
    try {
      await createRecipient({
        name: trimmed.name,
        address: trimmed.address,
        address2: trimmed.address2 || undefined,
        city: trimmed.city,
        province: trimmed.province,
        postal_code: trimmed.postalCode,
        country: trimmed.country,
      });
      trackEvent(Events.RECIPIENT_ADDED, { name: trimmed.name, city: trimmed.city, state: trimmed.province });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Recipient Saved', `${trimmed.name} has been added to your address book.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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

  const Field = ({ label, value, onChangeText, placeholder, required, autoCapitalize, keyboardType }: { label: string; value: string; onChangeText: (t: string) => void; placeholder: string; required?: boolean; autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'; keyboardType?: 'default' | 'number-pad' }) => (
    <>
      <Text style={s.label}>{label} {required && <Text style={s.required}>*</Text>}</Text>
      <TextInput style={s.input} placeholder={placeholder} placeholderTextColor={colors.textMuted} value={value} onChangeText={onChangeText} accessibilityLabel={label} autoCapitalize={autoCapitalize} keyboardType={keyboardType} />
    </>
  );

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 8 }}>Add a mailing address for someone you'd like to send letters to. This address will be used by Thanks.io to deliver physical mail.</Text>
        <Field label="Full Name" value={name} onChangeText={setName} placeholder="John Doe" required autoCapitalize="words" />
        <Field label="Street Address" value={address} onChangeText={setAddress} placeholder="123 Main St" required autoCapitalize="words" />
        <Field label="Apt / Suite" value={address2} onChangeText={setAddress2} placeholder="Apt 4B" />
        <View style={s.row}>
          <View style={s.flex1}>
            <Field label="City" value={city} onChangeText={setCity} placeholder="Austin" required autoCapitalize="words" />
          </View>
          <View style={s.flex1}>
            <Field label="State" value={province} onChangeText={(t) => setProvince(t.toUpperCase())} placeholder="TX" required autoCapitalize="characters" />
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

        <TouchableOpacity style={[s.button, isSaving && { opacity: 0.6 }]} onPress={handleSave} disabled={isSaving} accessibilityLabel="Save recipient" accessibilityRole="button">
          {isSaving ? <ActivityIndicator color="#fff" /> : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <UserPlus size={20} color="#fff" />
              <Text style={s.buttonText}>Save Recipient</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
