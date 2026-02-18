/**
 * Unified event tracking service.
 * Bridges app events to: PostHog (analytics), RevenueCat (subscription),
 * and Meta Ads (attribution/conversion).
 *
 * Usage:
 *   import { trackEvent, Events } from '@/services/events';
 *   trackEvent(Events.LETTER_SENT, { product_type: 'postcard' });
 */

import { DEV_MODE, META_APP_ID } from '@/constants/config';
import { AppEventsLogger } from 'react-native-fbsdk-next';
import Purchases from 'react-native-purchases';

// ---------------------------------------------------------------------------
// Event names (consistent across all providers)
// ---------------------------------------------------------------------------

export const Events = {
  // Auth
  SIGN_UP: 'sign_up',
  SIGN_IN: 'sign_in',
  SIGN_OUT: 'sign_out',

  // Core actions
  LETTER_GENERATED: 'letter_generated',
  IMAGE_GENERATED: 'image_generated',
  LETTER_SENT: 'letter_sent',
  VOICE_TRANSCRIBED: 'voice_transcribed',
  TEMPLATE_USED: 'template_used',
  RECIPIENT_ADDED: 'recipient_added',

  // Billing
  PAYWALL_VIEWED: 'paywall_viewed',
  PURCHASE_STARTED: 'purchase_started',
  PURCHASE_COMPLETED: 'purchase_completed',
  PURCHASE_FAILED: 'purchase_failed',
  SUBSCRIPTION_RESTORED: 'subscription_restored',

  // Navigation
  SCREEN_VIEWED: 'screen_viewed',
} as const;

export type EventName = (typeof Events)[keyof typeof Events];

// ---------------------------------------------------------------------------
// Meta Ads (Facebook SDK)
// ---------------------------------------------------------------------------

let metaInitialized = false;

function initMeta(): void {
  if (metaInitialized || !META_APP_ID) return;
  try {
    // Facebook SDK auto-initializes if the app ID is in Info.plist,
    // but we can also trigger manual init:
    AppEventsLogger.setFlushBehavior('auto');
    metaInitialized = true;
    if (DEV_MODE) console.log('[Events] Meta Ads SDK initialized');
  } catch (e) {
    console.warn('[Events] Meta Ads init failed:', e);
  }
}

function trackMetaEvent(name: string, params?: Record<string, any>): void {
  if (!META_APP_ID) return;
  initMeta();
  try {
    if (params?.value && params?.currency) {
      AppEventsLogger.logPurchase(params.value, params.currency, params);
    } else {
      AppEventsLogger.logEvent(name, params ?? {});
    }
  } catch (e) {
    if (DEV_MODE) console.warn('[Events] Meta track error:', e);
  }
}

// Map our events to standard Meta Ads events for better attribution
const META_EVENT_MAP: Partial<Record<EventName, string>> = {
  [Events.SIGN_UP]: 'fb_mobile_complete_registration',
  [Events.LETTER_SENT]: 'fb_mobile_purchase',
  [Events.PURCHASE_COMPLETED]: 'fb_mobile_purchase',
  [Events.PAYWALL_VIEWED]: 'fb_mobile_content_view',
  [Events.PURCHASE_STARTED]: 'fb_mobile_initiated_checkout',
};

// ---------------------------------------------------------------------------
// RevenueCat attributes
// ---------------------------------------------------------------------------

function setRevenueCatAttributes(attrs: Record<string, string>): void {
  try {
    Purchases.setAttributes(attrs);
  } catch (e) {
    if (DEV_MODE) console.warn('[Events] RC attribute error:', e);
  }
}

// ---------------------------------------------------------------------------
// PostHog (via AnalyticsProvider — import lazily to avoid circular deps)
// ---------------------------------------------------------------------------

let posthogCapture: ((event: string, props?: Record<string, any>) => void) | null = null;

export function setPostHogCapture(fn: (event: string, props?: Record<string, any>) => void): void {
  posthogCapture = fn;
}

// ---------------------------------------------------------------------------
// Unified track function
// ---------------------------------------------------------------------------

export function trackEvent(name: EventName, params?: Record<string, any>): void {
  if (DEV_MODE) {
    console.log(`[Events] ${name}`, params ?? '');
  }

  // 1. PostHog
  try {
    posthogCapture?.(name, params);
  } catch {}

  // 2. Meta Ads
  const metaName = META_EVENT_MAP[name] || name;
  trackMetaEvent(metaName, params);

  // 3. RevenueCat — set user attributes for segmentation
  if (name === Events.SIGN_UP) {
    setRevenueCatAttributes({
      $email: params?.email || '',
      $displayName: params?.name || '',
    });
  }
  if (name === Events.LETTER_SENT) {
    setRevenueCatAttributes({
      letters_sent: String((params?.total ?? 0) + 1),
      last_send_product: params?.product_type || '',
    });
  }
}

// ---------------------------------------------------------------------------
// Revenue-specific tracking (for Meta Ads purchase events)
// ---------------------------------------------------------------------------

export function trackRevenue(
  amount: number,
  currency: string = 'USD',
  productId?: string,
): void {
  trackMetaEvent('fb_mobile_purchase', {
    value: amount,
    currency,
    fb_content_id: productId,
    fb_content_type: 'subscription',
  });

  posthogCapture?.('revenue', { amount, currency, product_id: productId });
}
