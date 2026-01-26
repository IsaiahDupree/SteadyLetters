/**
 * Unified Event Tracking SDK for SteadyLetters
 * Based on PRD_EVENT_TRACKING.md
 *
 * Tracks user events across the handwritten letter funnel:
 * signup → compose → render → send
 */

import { trackEvent as posthogTrack, identifyUser as posthogIdentify } from './posthog';
import { autoTrackToMeta, generateEventId } from './meta-pixel';

// ============================
// Event Type Definitions
// ============================

// Acquisition Events
export type AcquisitionEvent =
  | 'landing_view'
  | 'cta_click'
  | 'pricing_view'
  | 'sample_viewed';

// Activation Events
export type ActivationEvent =
  | 'signup_start'
  | 'login_success'
  | 'activation_complete'
  | 'first_font_selected';

// Core Value Events
export type CoreValueEvent =
  | 'letter_created'
  | 'letter_rendered'
  | 'letter_sent'
  | 'font_selected'
  | 'recipient_added'
  | 'campaign_created';

// Monetization Events
export type MonetizationEvent =
  | 'checkout_started'
  | 'purchase_completed'
  | 'credits_purchased'
  | 'subscription_started';

// Retention Events
export type RetentionEvent =
  | 'return_session'
  | 'letter_returning_user'
  | 'campaign_recurring';

// Reliability Events
export type ReliabilityEvent =
  | 'error_shown'
  | 'render_failed'
  | 'send_failed';

// All Events Union Type
export type TrackingEvent =
  | AcquisitionEvent
  | ActivationEvent
  | CoreValueEvent
  | MonetizationEvent
  | RetentionEvent
  | ReliabilityEvent;

// ============================
// Event Property Interfaces
// ============================

// Generic properties for any event
export interface BaseEventProperties {
  [key: string]: string | number | boolean | undefined;
}

export interface LetterCreatedProperties extends BaseEventProperties {
  letter_id: string;
  font_id: string;
  word_count: number;
  template_used?: string;
}

export interface LetterSentProperties extends BaseEventProperties {
  letter_id: string;
  recipient_count: number;
  mail_class: 'first_class' | 'priority';
  cost: number;
}

export interface CheckoutStartedProperties extends BaseEventProperties {
  value: number;
  currency: string;
  plan?: string;
  credits?: number;
}

export interface PurchaseCompletedProperties extends BaseEventProperties {
  value: number;
  currency: string;
  transaction_id: string;
  plan?: string;
  credits?: number;
}

export interface CTAClickProperties extends BaseEventProperties {
  cta_text: string;
  cta_location: string;
  target_url?: string;
}

export interface ErrorShownProperties extends BaseEventProperties {
  error_type: string;
  error_message: string;
  component?: string;
  severity?: 'low' | 'medium' | 'high';
}

// ============================
// Tracking SDK Class
// ============================

class TrackingSDK {
  private initialized = false;
  private userId?: string;
  private userTraits: Record<string, any> = {};

  /**
   * Initialize the tracking SDK
   * Automatically called when used, but can be called explicitly
   */
  init() {
    if (this.initialized) return;

    if (typeof window !== 'undefined') {
      this.initialized = true;
      console.log('[Tracking] SDK initialized');
    }
  }

  /**
   * Track a generic event
   */
  track(event: TrackingEvent, properties?: BaseEventProperties) {
    this.init();

    const enrichedProperties = {
      ...properties,
      timestamp: new Date().toISOString(),
      page_url: typeof window !== 'undefined' ? window.location.href : undefined,
      page_title: typeof window !== 'undefined' ? document.title : undefined,
    };

    // Generate event ID for deduplication
    const eventId = generateEventId();

    // Track to PostHog
    posthogTrack(event, enrichedProperties);

    // Auto-track to Meta Pixel (client-side) with event ID
    autoTrackToMeta(event, { ...enrichedProperties, eventId });

    // Send to Meta CAPI (server-side) for deduplication
    this.sendToMetaCAPI(event, enrichedProperties, eventId);

    // Send to UnifiedEvent table for Growth Data Plane
    this.sendToUnifiedEvents(event, enrichedProperties);

    if (process.env.NODE_ENV === 'development') {
      console.log('[Tracking]', event, enrichedProperties);
    }
  }

  /**
   * Send event to Meta CAPI (server-side)
   * This runs asynchronously and doesn't block the main tracking
   */
  private async sendToMetaCAPI(event: TrackingEvent, properties: BaseEventProperties, eventId: string) {
    if (typeof window === 'undefined') return;

    try {
      await fetch('/api/tracking/meta-capi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          properties,
          eventId,
        }),
      });
    } catch (error) {
      // Silently fail - tracking errors shouldn't break the app
      if (process.env.NODE_ENV === 'development') {
        console.error('[Tracking] Failed to send to Meta CAPI:', error);
      }
    }
  }

  /**
   * Send event to UnifiedEvent table (server-side)
   * This stores events in the Growth Data Plane for unified analytics
   */
  private async sendToUnifiedEvents(event: TrackingEvent, properties: BaseEventProperties) {
    if (typeof window === 'undefined') return;

    try {
      // Extract UTM parameters from URL
      const urlParams = new URLSearchParams(window.location.search);
      const attribution = {
        sessionId: sessionStorage.getItem('sessionId') || undefined,
        referrer: document.referrer || undefined,
        utmSource: urlParams.get('utm_source') || undefined,
        utmMedium: urlParams.get('utm_medium') || undefined,
        utmCampaign: urlParams.get('utm_campaign') || undefined,
      };

      await fetch('/api/tracking/unified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventName: event,
          properties,
          source: 'web',
          attribution,
        }),
      });
    } catch (error) {
      // Silently fail - tracking errors shouldn't break the app
      if (process.env.NODE_ENV === 'development') {
        console.error('[Tracking] Failed to send to UnifiedEvent:', error);
      }
    }
  }

  /**
   * Identify a user with their ID and traits
   */
  identify(userId: string, traits?: Record<string, any>) {
    this.init();
    this.userId = userId;
    this.userTraits = traits || {};

    posthogIdentify(userId, traits);

    if (process.env.NODE_ENV === 'development') {
      console.log('[Tracking] User identified:', userId, traits);
    }
  }

  // ============================
  // Acquisition Events
  // ============================

  trackLandingView(properties?: { utm_source?: string; utm_medium?: string; utm_campaign?: string }) {
    this.track('landing_view', properties);
  }

  trackCTAClick(properties: CTAClickProperties) {
    this.track('cta_click', properties);
  }

  trackPricingView() {
    this.track('pricing_view');
  }

  trackSampleViewed(properties?: { sample_id?: string; sample_type?: string }) {
    this.track('sample_viewed', properties);
  }

  // ============================
  // Activation Events
  // ============================

  trackSignupStart(properties?: { method?: string }) {
    this.track('signup_start', properties);
  }

  trackLoginSuccess(properties?: { method?: string }) {
    this.track('login_success', properties);
  }

  trackActivationComplete() {
    this.track('activation_complete');
  }

  trackFirstFontSelected(properties: { font_id: string; font_name?: string }) {
    this.track('first_font_selected', properties);
  }

  // ============================
  // Core Value Events
  // ============================

  trackLetterCreated(properties: LetterCreatedProperties) {
    this.track('letter_created', properties);
  }

  trackLetterRendered(properties: { letter_id: string; render_time_ms?: number }) {
    this.track('letter_rendered', properties);
  }

  trackLetterSent(properties: LetterSentProperties) {
    this.track('letter_sent', properties);
  }

  trackFontSelected(properties: { font_id: string; font_name?: string }) {
    this.track('font_selected', properties);
  }

  trackRecipientAdded(properties: { recipient_id: string; source?: string }) {
    this.track('recipient_added', properties);
  }

  trackCampaignCreated(properties: { campaign_id: string; recipient_count: number }) {
    this.track('campaign_created', properties);
  }

  // ============================
  // Monetization Events
  // ============================

  trackCheckoutStarted(properties: CheckoutStartedProperties) {
    this.track('checkout_started', properties);
  }

  trackPurchaseCompleted(properties: PurchaseCompletedProperties) {
    this.track('purchase_completed', properties);
  }

  trackCreditsPurchased(properties: { credits: number; value: number; currency: string }) {
    this.track('credits_purchased', properties);
  }

  trackSubscriptionStarted(properties: { plan: string; value: number; currency: string }) {
    this.track('subscription_started', properties);
  }

  // ============================
  // Retention Events
  // ============================

  trackReturnSession(properties?: { days_since_last_session?: number }) {
    this.track('return_session', properties);
  }

  trackLetterReturningUser() {
    this.track('letter_returning_user');
  }

  trackCampaignRecurring(properties: { campaign_id: string; iteration: number }) {
    this.track('campaign_recurring', properties);
  }

  // ============================
  // Reliability Events
  // ============================

  trackErrorShown(properties: ErrorShownProperties) {
    this.track('error_shown', properties);
  }

  trackRenderFailed(properties: { letter_id: string; error_message: string }) {
    this.track('render_failed', properties);
  }

  trackSendFailed(properties: { letter_id: string; error_message: string; recipient_count: number }) {
    this.track('send_failed', properties);
  }

  // ============================
  // Utility Methods
  // ============================

  /**
   * Get the current user ID
   */
  getUserId(): string | undefined {
    return this.userId;
  }

  /**
   * Check if SDK is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const tracking = new TrackingSDK();

// Export convenient aliases
export const trackEvent = (event: TrackingEvent, properties?: BaseEventProperties) =>
  tracking.track(event, properties);

export const identifyUser = (userId: string, traits?: Record<string, any>) =>
  tracking.identify(userId, traits);

// ============================
// North Star Milestones
// ============================

/**
 * The 4 North Star Milestones for SteadyLetters:
 * 1. Activated = first_font_selected
 * 2. First Value = first letter_rendered
 * 3. Aha Moment = first letter_sent
 * 4. Monetized = purchase_completed
 */
export const NorthStarMilestones = {
  ACTIVATED: 'first_font_selected',
  FIRST_VALUE: 'letter_rendered',
  AHA_MOMENT: 'letter_sent',
  MONETIZED: 'purchase_completed',
} as const;
