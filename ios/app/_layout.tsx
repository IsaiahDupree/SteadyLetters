import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/providers/AuthProvider';
import { ThemeProvider, useTheme } from '@/providers/ThemeProvider';
import { BillingProvider } from '@/providers/BillingProvider';
import { AnalyticsProvider } from '@/providers/AnalyticsProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
import { setupNotificationHandlers } from '@/services/notifications';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isDark } = useTheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    const cleanup = setupNotificationHandlers();
    return cleanup;
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="send" options={{ title: 'Send Letter', presentation: 'modal', headerShown: true }} />
        <Stack.Screen name="voice-recorder" options={{ title: 'Voice Recorder', presentation: 'modal', headerShown: true }} />
        <Stack.Screen name="add-recipient" options={{ title: 'Add Recipient', presentation: 'modal', headerShown: true }} />
        <Stack.Screen name="order-detail" options={{ title: 'Order Details', presentation: 'card', headerShown: true }} />
        <Stack.Screen name="paywall" options={{ title: 'Subscription', presentation: 'modal', headerShown: true }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BillingProvider>
            <AnalyticsProvider>
              <RootLayoutNav />
            </AnalyticsProvider>
          </BillingProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
