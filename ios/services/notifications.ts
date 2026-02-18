import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from './supabase';

// -------------------------------------------------------------------
// Configuration
// -------------------------------------------------------------------

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// -------------------------------------------------------------------
// Push token registration
// -------------------------------------------------------------------

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission not granted');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B35',
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: undefined, // Uses Constants.expoConfig.extra.eas.projectId automatically
    });
    const token = tokenData.data;

    await savePushToken(token).catch((err) =>
      console.warn('Could not save push token:', err.message),
    );

    return token;
  } catch (err: any) {
    console.warn('Could not get push token:', err.message);
    return null;
  }
}

async function savePushToken(token: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return; // Not authenticated — silently skip

  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      {
        user_id: user.id,
        token,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,token' },
    );

  if (error) {
    // Don't crash if table doesn't exist yet
    console.warn('savePushToken error:', error.message);
  }
}

// -------------------------------------------------------------------
// Notification handlers
// -------------------------------------------------------------------

export function setupNotificationHandlers(): () => void {
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Notification received:', notification.request.identifier);
    },
  );

  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data as
        | { screen?: string; orderId?: string }
        | undefined;

      if (data?.screen === 'orders' || data?.orderId) {
        router.push('/(tabs)/orders');
      }
    },
  );

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

// -------------------------------------------------------------------
// Local notifications
// -------------------------------------------------------------------

export async function sendOrderDeliveredNotification(
  orderId: string,
  recipientName: string,
): Promise<string> {
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Letter Delivered!',
      body: `Your letter to ${recipientName} has been delivered.`,
      sound: 'default',
      data: { screen: 'orders', orderId },
    },
    trigger: null,
  });

  return identifier;
}
