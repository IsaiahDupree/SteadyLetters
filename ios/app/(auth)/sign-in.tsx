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
import { Mail, Lock, Send } from 'lucide-react-native';

export default function SignInScreen() {
  const { colors } = useTheme();
  const { signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter email and password.');
      return;
    }
    setIsLoading(true);
    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Sign In Failed', error instanceof Error ? error.message : 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1, justifyContent: 'center', padding: 24 },
    logo: { fontSize: 36, fontWeight: '700', color: colors.primary, textAlign: 'center', marginBottom: 8 },
    tagline: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginBottom: 40 },
    inputGroup: { marginBottom: 16 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, paddingVertical: 14, fontSize: 16, color: colors.text },
    button: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
    buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
    linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, gap: 4 },
    linkText: { fontSize: 15, color: colors.textSecondary },
    linkBold: { fontSize: 15, color: colors.primary, fontWeight: '600' },
    forgotLink: { alignSelf: 'flex-end', marginTop: 8, marginBottom: 16 },
    forgotText: { fontSize: 14, color: colors.accent },
  });

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.content}>
        <Send size={48} color={colors.primary} style={{ alignSelf: 'center', marginBottom: 16 }} />
        <Text style={s.logo}>SteadyLetters</Text>
        <Text style={s.tagline}>Send real handwritten letters from your phone</Text>

        <View style={s.inputGroup}>
          <View style={s.inputWrapper}>
            <Mail size={20} color={colors.textMuted} style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder="Email"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              accessibilityLabel="Email address"
            />
          </View>
        </View>

        <View style={s.inputGroup}>
          <View style={s.inputWrapper}>
            <Lock size={20} color={colors.textMuted} style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              accessibilityLabel="Password"
            />
          </View>
        </View>

        <TouchableOpacity style={s.forgotLink} onPress={() => router.push('/(auth)/forgot-password')}>
          <Text style={s.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.button} onPress={handleSignIn} disabled={isLoading} accessibilityLabel="Sign in" accessibilityRole="button">
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Sign In</Text>}
        </TouchableOpacity>

        <View style={s.linkRow}>
          <Text style={s.linkText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
            <Text style={s.linkBold}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
