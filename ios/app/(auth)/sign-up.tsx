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
  ScrollView,
} from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';
import { Mail, Lock, User, Send } from 'lucide-react-native';
import { trackEvent, Events } from '@/services/events';

export default function SignUpScreen() {
  const { colors } = useTheme();
  const { signUp } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (!fullName || !email || !password) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters long.');
      return;
    }
    setIsLoading(true);
    try {
      await signUp(email.trim(), password, fullName.trim());
      trackEvent(Events.SIGN_UP, { email: email.trim(), name: fullName.trim() });
      Alert.alert(
        'Check Your Email',
        `We sent a verification link to ${email.trim()}. Please verify your email before signing in.`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Something went wrong';
      if (msg.includes('already registered')) {
        Alert.alert('Account Exists', 'An account with this email already exists. Try signing in instead.');
      } else {
        Alert.alert('Sign Up Failed', msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 24, paddingTop: 40 },
    title: { fontSize: 28, fontWeight: '700', color: colors.text, marginBottom: 8 },
    subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 32 },
    inputGroup: { marginBottom: 16 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14 },
    input: { flex: 1, paddingVertical: 14, fontSize: 16, color: colors.text, marginLeft: 10 },
    button: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  });

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Create Account</Text>
        <Text style={s.subtitle}>Start sending handwritten letters today</Text>

        <View style={s.inputGroup}>
          <View style={s.inputWrapper}>
            <User size={20} color={colors.textMuted} />
            <TextInput style={s.input} placeholder="Full Name" placeholderTextColor={colors.textMuted} value={fullName} onChangeText={setFullName} autoComplete="name" autoCapitalize="words" returnKeyType="next" accessibilityLabel="Full name" />
          </View>
        </View>

        <View style={s.inputGroup}>
          <View style={s.inputWrapper}>
            <Mail size={20} color={colors.textMuted} />
            <TextInput style={s.input} placeholder="Email" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" returnKeyType="next" accessibilityLabel="Email address" />
          </View>
        </View>

        <View style={s.inputGroup}>
          <View style={s.inputWrapper}>
            <Lock size={20} color={colors.textMuted} />
            <TextInput style={s.input} placeholder="Password (min 8 chars)" placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" returnKeyType="next" accessibilityLabel="Password" />
          </View>
        </View>

        <View style={s.inputGroup}>
          <View style={s.inputWrapper}>
            <Lock size={20} color={colors.textMuted} />
            <TextInput style={s.input} placeholder="Confirm Password" placeholderTextColor={colors.textMuted} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry returnKeyType="done" onSubmitEditing={handleSignUp} accessibilityLabel="Confirm password" />
          </View>
        </View>

        <TouchableOpacity style={[s.button, isLoading && s.buttonDisabled]} onPress={handleSignUp} disabled={isLoading} accessibilityLabel="Create account" accessibilityRole="button">
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Create Account</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
