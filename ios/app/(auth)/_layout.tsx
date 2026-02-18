import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@/providers/ThemeProvider';
import { hasCompletedOnboarding } from '@/app/onboarding';

export default function AuthLayout() {
  const { colors } = useTheme();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    hasCompletedOnboarding().then((done) => {
      if (!done) {
        router.replace('/onboarding');
      } else {
        setChecked(true);
      }
    });
  }, []);

  if (!checked) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="sign-in" options={{ title: 'Sign In', headerShown: false }} />
      <Stack.Screen name="sign-up" options={{ title: 'Create Account' }} />
      <Stack.Screen name="forgot-password" options={{ title: 'Reset Password' }} />
    </Stack>
  );
}
