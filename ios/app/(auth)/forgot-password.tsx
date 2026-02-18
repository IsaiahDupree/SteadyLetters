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
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';
import { Mail } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const { resetPassword } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!email) { Alert.alert('Missing Email', 'Please enter your email.'); return; }
    setIsLoading(true);
    try {
      await resetPassword(email);
      Alert.alert('Check Your Email', 'Password reset link sent.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 24, paddingTop: 40 },
    title: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 8 },
    subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 32 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14 },
    input: { flex: 1, paddingVertical: 14, fontSize: 16, color: colors.text, marginLeft: 10 },
    button: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
    buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  });

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.content}>
        <Text style={s.title}>Reset Password</Text>
        <Text style={s.subtitle}>Enter your email and we'll send a reset link.</Text>
        <View style={s.inputWrapper}>
          <Mail size={20} color={colors.textMuted} />
          <TextInput style={s.input} placeholder="Email" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        </View>
        <TouchableOpacity style={s.button} onPress={handleReset} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Send Reset Link</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
