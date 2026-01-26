/**
 * Meta Pixel Integration for SteadyLetters
 *
 * Provides client-side tracking with Facebook Pixel
 * Works alongside CAPI (Conversions API) for server-side tracking
 */

'use client';

// Extend window type to include fbq
declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: (...args: any[]) => void;
  }
}

/**
 * Initialize Meta Pixel
 * Should be called once in the app lifecycle
 */
export function initMetaPixel(pixelId: string) {
  if (typeof window === 'undefined' || !pixelId) return;

  // Check if already initialized
  if (window.fbq) return;

  // Meta Pixel base code
  const fbq = function(...args: any[]) {
    if (fbq.callMethod) {
      fbq.callMethod.apply(fbq, args);
    } else {
      fbq.queue.push(args);
    }
  } as any;

  if (!window._fbq) window._fbq = fbq;
  window.fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];

  // Load pixel script
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  // Initialize pixel
  fbq('init', pixelId);

  if (process.env.NODE_ENV === 'development') {
    console.log('[Meta Pixel] Initialized with ID:', pixelId);
  }
}

/**
 * Track PageView event
 */
export function trackPageView() {
  if (typeof window === 'undefined' || !window.fbq) return;

  window.fbq('track', 'PageView');

  if (process.env.NODE_ENV === 'development') {
    console.log('[Meta Pixel] PageView tracked');
  }
}

/**
 * Meta Standard Events
 */
export enum MetaStandardEvent {
  ViewContent = 'ViewContent',
  Search = 'Search',
  AddToCart = 'AddToCart',
  AddToWishlist = 'AddToWishlist',
  InitiateCheckout = 'InitiateCheckout',
  AddPaymentInfo = 'AddPaymentInfo',
  Purchase = 'Purchase',
  Lead = 'Lead',
  CompleteRegistration = 'CompleteRegistration',
  Contact = 'Contact',
  CustomizeProduct = 'CustomizeProduct',
  Donate = 'Donate',
  FindLocation = 'FindLocation',
  Schedule = 'Schedule',
  StartTrial = 'StartTrial',
  SubmitApplication = 'SubmitApplication',
  Subscribe = 'Subscribe',
}

/**
 * Track a standard Meta event
 */
export function trackMetaEvent(
  eventName: MetaStandardEvent | string,
  parameters?: Record<string, any>,
  eventId?: string
) {
  if (typeof window === 'undefined' || !window.fbq) return;

  const eventData = {
    ...parameters,
    ...(eventId && { eventID: eventId }),
  };

  window.fbq('track', eventName, eventData);

  if (process.env.NODE_ENV === 'development') {
    console.log('[Meta Pixel] Event tracked:', eventName, eventData);
  }
}

/**
 * Track a custom Meta event
 */
export function trackCustomEvent(
  eventName: string,
  parameters?: Record<string, any>,
  eventId?: string
) {
  if (typeof window === 'undefined' || !window.fbq) return;

  const eventData = {
    ...parameters,
    ...(eventId && { eventID: eventId }),
  };

  window.fbq('trackCustom', eventName, eventData);

  if (process.env.NODE_ENV === 'development') {
    console.log('[Meta Pixel] Custom event tracked:', eventName, eventData);
  }
}

/**
 * Generate a unique event ID for deduplication
 * Used to match browser-side and server-side events
 */
export function generateEventId(): string {
  // Format: timestamp_random
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}_${random}`;
}

/**
 * Map SteadyLetters tracking events to Meta standard events
 */
export function mapToMetaEvent(
  trackingEvent: string,
  properties?: Record<string, any>
): { event: MetaStandardEvent | string; params: Record<string, any> } | null {
  // Generate event ID for deduplication with CAPI
  const eventId = generateEventId();

  switch (trackingEvent) {
    // Activation
    case 'signup_start':
      return {
        event: MetaStandardEvent.CompleteRegistration,
        params: {
          eventID: eventId,
          status: 'started',
          ...properties,
        },
      };

    case 'login_success':
      return {
        event: MetaStandardEvent.CompleteRegistration,
        params: {
          eventID: eventId,
          status: 'completed',
          ...properties,
        },
      };

    case 'activation_complete':
      return {
        event: MetaStandardEvent.Lead,
        params: {
          eventID: eventId,
          ...properties,
        },
      };

    // Core Value
    case 'letter_created':
      return {
        event: MetaStandardEvent.ViewContent,
        params: {
          eventID: eventId,
          content_type: 'letter',
          content_name: 'Letter Created',
          ...properties,
        },
      };

    case 'letter_sent':
      return {
        event: MetaStandardEvent.Purchase,
        params: {
          eventID: eventId,
          content_type: 'letter',
          value: properties?.cost || 0,
          currency: 'USD',
          ...properties,
        },
      };

    // Monetization
    case 'checkout_started':
      return {
        event: MetaStandardEvent.InitiateCheckout,
        params: {
          eventID: eventId,
          value: properties?.value || 0,
          currency: properties?.currency || 'USD',
          ...properties,
        },
      };

    case 'purchase_completed':
      return {
        event: MetaStandardEvent.Purchase,
        params: {
          eventID: eventId,
          value: properties?.value || 0,
          currency: properties?.currency || 'USD',
          transaction_id: properties?.transaction_id,
          ...properties,
        },
      };

    case 'subscription_started':
      return {
        event: MetaStandardEvent.Subscribe,
        params: {
          eventID: eventId,
          value: properties?.value || 0,
          currency: properties?.currency || 'USD',
          predicted_ltv: (properties?.value || 0) * 12, // Annual value
          ...properties,
        },
      };

    // Acquisition
    case 'pricing_view':
      return {
        event: MetaStandardEvent.ViewContent,
        params: {
          eventID: eventId,
          content_type: 'pricing',
          content_name: 'Pricing Page',
          ...properties,
        },
      };

    case 'cta_click':
      return {
        event: MetaStandardEvent.Contact,
        params: {
          eventID: eventId,
          ...properties,
        },
      };

    // Recipient management
    case 'recipient_added':
      return {
        event: MetaStandardEvent.AddToCart,
        params: {
          eventID: eventId,
          content_type: 'recipient',
          ...properties,
        },
      };

    default:
      // Don't track unmapped events to Meta
      return null;
  }
}

/**
 * Auto-track a SteadyLetters event to Meta Pixel
 * This is called automatically when tracking events through our tracking SDK
 */
export function autoTrackToMeta(
  trackingEvent: string,
  properties?: Record<string, any>
) {
  const mapped = mapToMetaEvent(trackingEvent, properties);

  if (mapped) {
    trackMetaEvent(mapped.event, mapped.params, mapped.params.eventID);
  }
}
