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
import { Mail, Lock, User } from 'lucide-react-native';

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
      Alert.alert('Weak Password', 'Password must be at least 8 characters.');
      return;
    }
    setIsLoading(true);
    try {
      await signUp(email, password, fullName);
      Alert.alert('Check Your Email', 'We sent a verification link to your email.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Sign Up Failed', error instanceof Error ? error.message : 'Something went wrong');
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
            <TextInput style={s.input} placeholder="Full Name" placeholderTextColor={colors.textMuted} value={fullName} onChangeText={setFullName} autoComplete="name" accessibilityLabel="Full name" />
          </View>
        </View>

        <View style={s.inputGroup}>
          <View style={s.inputWrapper}>
            <Mail size={20} color={colors.textMuted} />
            <TextInput style={s.input} placeholder="Email" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" accessibilityLabel="Email address" />
          </View>
        </View>

        <View style={s.inputGroup}>
          <View style={s.inputWrapper}>
            <Lock size={20} color={colors.textMuted} />
            <TextInput style={s.input} placeholder="Password" placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" accessibilityLabel="Password" />
          </View>
        </View>

        <View style={s.inputGroup}>
          <View style={s.inputWrapper}>
            <Lock size={20} color={colors.textMuted} />
            <TextInput style={s.input} placeholder="Confirm Password" placeholderTextColor={colors.textMuted} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry accessibilityLabel="Confirm password" />
          </View>
        </View>

        <TouchableOpacity style={s.button} onPress={handleSignUp} disabled={isLoading} accessibilityLabel="Create account" accessibilityRole="button">
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Create Account</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
