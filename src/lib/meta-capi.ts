/**
 * Meta Conversions API (CAPI) for Server-Side Event Tracking
 *
 * Sends events to Meta from the server for better tracking accuracy
 * and deduplication with client-side Pixel events
 */

import crypto from 'crypto';

/**
 * Hash user data (PII) with SHA256 for privacy
 */
export function hashUserData(data: string): string {
  if (!data) return '';
  // Normalize: lowercase and trim
  const normalized = data.toLowerCase().trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * User data for CAPI events
 */
export interface MetaCAPIUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  externalId?: string; // User ID from our system
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string; // Facebook click ID from cookie
  fbp?: string; // Facebook browser ID from cookie
}

/**
 * Custom data parameters
 */
export interface MetaCAPICustomData {
  value?: number;
  currency?: string;
  contentName?: string;
  contentCategory?: string;
  contentIds?: string[];
  contents?: Array<{ id: string; quantity: number }>;
  contentType?: string;
  orderId?: string;
  predictedLtv?: number;
  numItems?: number;
  status?: string;
  [key: string]: any;
}

/**
 * CAPI Event parameters
 */
export interface MetaCAPIEvent {
  eventName: string;
  eventTime: number; // Unix timestamp in seconds
  eventId: string; // For deduplication with Pixel
  eventSourceUrl?: string;
  actionSource: 'website' | 'email' | 'app' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
  userData?: MetaCAPIUserData;
  customData?: MetaCAPICustomData;
}

/**
 * Send event to Meta Conversions API
 */
export async function sendMetaCAPIEvent(event: MetaCAPIEvent): Promise<boolean> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Meta CAPI] Missing Pixel ID or Access Token');
    }
    return false;
  }

  try {
    // Hash PII data
    const hashedUserData: any = {};
    if (event.userData) {
      if (event.userData.email) {
        hashedUserData.em = hashUserData(event.userData.email);
      }
      if (event.userData.phone) {
        hashedUserData.ph = hashUserData(event.userData.phone);
      }
      if (event.userData.firstName) {
        hashedUserData.fn = hashUserData(event.userData.firstName);
      }
      if (event.userData.lastName) {
        hashedUserData.ln = hashUserData(event.userData.lastName);
      }
      if (event.userData.city) {
        hashedUserData.ct = hashUserData(event.userData.city);
      }
      if (event.userData.state) {
        hashedUserData.st = hashUserData(event.userData.state);
      }
      if (event.userData.zip) {
        hashedUserData.zp = hashUserData(event.userData.zip);
      }
      if (event.userData.country) {
        hashedUserData.country = hashUserData(event.userData.country);
      }
      if (event.userData.externalId) {
        hashedUserData.external_id = hashUserData(event.userData.externalId);
      }
      // Don't hash these
      if (event.userData.clientIpAddress) {
        hashedUserData.client_ip_address = event.userData.clientIpAddress;
      }
      if (event.userData.clientUserAgent) {
        hashedUserData.client_user_agent = event.userData.clientUserAgent;
      }
      if (event.userData.fbc) {
        hashedUserData.fbc = event.userData.fbc;
      }
      if (event.userData.fbp) {
        hashedUserData.fbp = event.userData.fbp;
      }
    }

    // Format custom data
    const customData: any = {};
    if (event.customData) {
      if (event.customData.value !== undefined) {
        customData.value = event.customData.value;
      }
      if (event.customData.currency) {
        customData.currency = event.customData.currency;
      }
      if (event.customData.contentName) {
        customData.content_name = event.customData.contentName;
      }
      if (event.customData.contentCategory) {
        customData.content_category = event.customData.contentCategory;
      }
      if (event.customData.contentIds) {
        customData.content_ids = event.customData.contentIds;
      }
      if (event.customData.contents) {
        customData.contents = event.customData.contents;
      }
      if (event.customData.contentType) {
        customData.content_type = event.customData.contentType;
      }
      if (event.customData.orderId) {
        customData.order_id = event.customData.orderId;
      }
      if (event.customData.predictedLtv !== undefined) {
        customData.predicted_ltv = event.customData.predictedLtv;
      }
      if (event.customData.numItems !== undefined) {
        customData.num_items = event.customData.numItems;
      }
      if (event.customData.status) {
        customData.status = event.customData.status;
      }
    }

    // Build event payload
    const payload = {
      data: [
        {
          event_name: event.eventName,
          event_time: event.eventTime,
          event_id: event.eventId,
          event_source_url: event.eventSourceUrl,
          action_source: event.actionSource,
          user_data: hashedUserData,
          custom_data: Object.keys(customData).length > 0 ? customData : undefined,
        },
      ],
    };

    // Send to Meta CAPI
    const url = `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[Meta CAPI] Error sending event:', result);
      return false;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[Meta CAPI] Event sent successfully:', event.eventName, result);
    }

    return true;
  } catch (error) {
    console.error('[Meta CAPI] Failed to send event:', error);
    return false;
  }
}

/**
 * Map SteadyLetters tracking events to Meta CAPI events
 */
export function createMetaCAPIEvent(
  trackingEvent: string,
  properties: Record<string, any>,
  eventId: string,
  userData?: MetaCAPIUserData
): MetaCAPIEvent | null {
  const eventTime = Math.floor(Date.now() / 1000); // Unix timestamp in seconds

  // Base event structure
  const baseEvent: Partial<MetaCAPIEvent> = {
    eventTime,
    eventId,
    actionSource: 'website',
    eventSourceUrl: properties.page_url,
    userData,
  };

  switch (trackingEvent) {
    case 'signup_start':
      return {
        ...baseEvent,
        eventName: 'CompleteRegistration',
        customData: {
          status: 'started',
        },
      } as MetaCAPIEvent;

    case 'login_success':
      return {
        ...baseEvent,
        eventName: 'CompleteRegistration',
        customData: {
          status: 'completed',
        },
      } as MetaCAPIEvent;

    case 'activation_complete':
      return {
        ...baseEvent,
        eventName: 'Lead',
      } as MetaCAPIEvent;

    case 'letter_created':
      return {
        ...baseEvent,
        eventName: 'ViewContent',
        customData: {
          contentType: 'letter',
          contentName: 'Letter Created',
          contentIds: properties.letter_id ? [properties.letter_id] : undefined,
        },
      } as MetaCAPIEvent;

    case 'letter_sent':
      return {
        ...baseEvent,
        eventName: 'Purchase',
        customData: {
          value: properties.cost || 0,
          currency: 'USD',
          contentType: 'letter',
          contentIds: properties.letter_id ? [properties.letter_id] : undefined,
          numItems: properties.recipient_count || 1,
        },
      } as MetaCAPIEvent;

    case 'checkout_started':
      return {
        ...baseEvent,
        eventName: 'InitiateCheckout',
        customData: {
          value: properties.value || 0,
          currency: properties.currency || 'USD',
        },
      } as MetaCAPIEvent;

    case 'purchase_completed':
      return {
        ...baseEvent,
        eventName: 'Purchase',
        customData: {
          value: properties.value || 0,
          currency: properties.currency || 'USD',
          orderId: properties.transaction_id,
        },
      } as MetaCAPIEvent;

    case 'subscription_started':
      return {
        ...baseEvent,
        eventName: 'Subscribe',
        customData: {
          value: properties.value || 0,
          currency: properties.currency || 'USD',
          predictedLtv: (properties.value || 0) * 12, // Annual value
        },
      } as MetaCAPIEvent;

    case 'pricing_view':
      return {
        ...baseEvent,
        eventName: 'ViewContent',
        customData: {
          contentType: 'pricing',
          contentName: 'Pricing Page',
        },
      } as MetaCAPIEvent;

    case 'cta_click':
      return {
        ...baseEvent,
        eventName: 'Contact',
      } as MetaCAPIEvent;

    case 'recipient_added':
      return {
        ...baseEvent,
        eventName: 'AddToCart',
        customData: {
          contentType: 'recipient',
          contentIds: properties.recipient_id ? [properties.recipient_id] : undefined,
        },
      } as MetaCAPIEvent;

    default:
      // Don't track unmapped events to CAPI
      return null;
  }
}
