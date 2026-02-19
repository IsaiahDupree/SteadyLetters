import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
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

  // Request ATT permission for Meta Ads (iOS 14.5+)
  useEffect(() => {
    if (Platform.OS === 'ios') {
      requestTrackingPermissionsAsync().catch(() => {});
    }
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
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="return-address" options={{ title: 'Return Address', presentation: 'modal', headerShown: true }} />
        <Stack.Screen name="letter-preview" options={{ title: 'Preview', presentation: 'card', headerShown: true }} />
        <Stack.Screen name="import-contacts" options={{ title: 'Import Contacts', presentation: 'modal', headerShown: true }} />
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
