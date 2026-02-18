import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import { useRouter } from 'expo-router';
import { MapPin, Save } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface ReturnAddress {
  returnName: string;
  returnAddress1: string;
  returnAddress2: string;
  returnCity: string;
  returnState: string;
  returnZip: string;
  returnCountry: string;
}

const EMPTY: ReturnAddress = {
  returnName: '',
  returnAddress1: '',
  returnAddress2: '',
  returnCity: '',
  returnState: '',
  returnZip: '',
  returnCountry: 'US',
};

export default function ReturnAddressScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [address, setAddress] = useState<ReturnAddress>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) { setIsLoading(false); return; }
    (async () => {
      try {
        const { data } = await supabase
          .from('User')
          .select('returnName,returnAddress1,returnAddress2,returnCity,returnState,returnZip,returnCountry')
          .eq('id', user.id)
          .single();
        if (data) {
          setAddress({
            returnName: data.returnName || '',
            returnAddress1: data.returnAddress1 || '',
            returnAddress2: data.returnAddress2 || '',
            returnCity: data.returnCity || '',
            returnState: data.returnState || '',
            returnZip: data.returnZip || '',
            returnCountry: data.returnCountry || 'US',
          });
        }
      } catch {}
      setIsLoading(false);
    })();
  }, [user?.id]);

  const handleSave = async () => {
    if (!address.returnName.trim() || !address.returnAddress1.trim() || !address.returnCity.trim() || !address.returnState.trim() || !address.returnZip.trim()) {
      Alert.alert('Missing Fields', 'Please fill in name, street address, city, state, and ZIP.');
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('User')
        .update({
          returnName: address.returnName.trim(),
          returnAddress1: address.returnAddress1.trim(),
          returnAddress2: address.returnAddress2.trim(),
          returnCity: address.returnCity.trim(),
          returnState: address.returnState.trim().toUpperCase(),
          returnZip: address.returnZip.trim(),
          returnCountry: address.returnCountry.trim() || 'US',
        })
        .eq('id', user!.id);

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Your return address has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Save Failed', err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  const update = (field: keyof ReturnAddress, value: string) =>
    setAddress((prev) => ({ ...prev, [field]: value }));

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    headerText: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
    label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginTop: 16, marginBottom: 6 },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
    },
    row: { flexDirection: 'row', gap: 12 },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      marginTop: 28,
    },
    saveText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  });

  if (isLoading) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <MapPin size={20} color={colors.textSecondary} />
          <Text style={s.headerText}>
            This address appears as the sender on your letters and postcards.
          </Text>
        </View>

        <Text style={s.label}>Full Name</Text>
        <TextInput
          style={s.input}
          value={address.returnName}
          onChangeText={(v) => update('returnName', v)}
          placeholder="John Doe"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="words"
          returnKeyType="next"
          accessibilityLabel="Sender full name"
        />

        <Text style={s.label}>Street Address</Text>
        <TextInput
          style={s.input}
          value={address.returnAddress1}
          onChangeText={(v) => update('returnAddress1', v)}
          placeholder="123 Main St"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="words"
          returnKeyType="next"
          accessibilityLabel="Street address"
        />

        <Text style={s.label}>Apt / Suite (optional)</Text>
        <TextInput
          style={s.input}
          value={address.returnAddress2}
          onChangeText={(v) => update('returnAddress2', v)}
          placeholder="Apt 4B"
          placeholderTextColor={colors.textMuted}
          returnKeyType="next"
          accessibilityLabel="Apartment or suite number"
        />

        <Text style={s.label}>City</Text>
        <TextInput
          style={s.input}
          value={address.returnCity}
          onChangeText={(v) => update('returnCity', v)}
          placeholder="San Francisco"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="words"
          returnKeyType="next"
          accessibilityLabel="City"
        />

        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>State</Text>
            <TextInput
              style={s.input}
              value={address.returnState}
              onChangeText={(v) => update('returnState', v)}
              placeholder="CA"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              maxLength={2}
              returnKeyType="next"
              accessibilityLabel="State"
            />
          </View>
          <View style={{ flex: 1.5 }}>
            <Text style={s.label}>ZIP Code</Text>
            <TextInput
              style={s.input}
              value={address.returnZip}
              onChangeText={(v) => update('returnZip', v)}
              placeholder="94102"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={10}
              returnKeyType="done"
              accessibilityLabel="ZIP code"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[s.saveButton, isSaving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={isSaving}
          accessibilityLabel="Save return address"
          accessibilityRole="button"
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Save size={20} color="#fff" />
              <Text style={s.saveText}>Save Address</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
