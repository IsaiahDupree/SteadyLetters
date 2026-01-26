/**
 * Unified Event Tracking SDK for SteadyLetters
 * Based on PRD_EVENT_TRACKING.md
 *
 * Tracks user events across the handwritten letter funnel:
 * signup → compose → render → send
 */

import { trackEvent as posthogTrack, identifyUser as posthogIdentify } from './posthog.ts';

// ============================
// Tracking SDK Class
// ============================

class TrackingSDK {
  constructor() {
    this.initialized = false;
    this.userId = undefined;
    this.userTraits = {};
  }

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
  track(event, properties) {
    this.init();

    const enrichedProperties = {
      ...properties,
      timestamp: new Date().toISOString(),
      page_url: typeof window !== 'undefined' ? window.location.href : undefined,
      page_title: typeof window !== 'undefined' ? document.title : undefined,
    };

    posthogTrack(event, enrichedProperties);

    if (process.env.NODE_ENV === 'development') {
      console.log('[Tracking]', event, enrichedProperties);
    }
  }

  /**
   * Identify a user with their ID and traits
   */
  identify(userId, traits) {
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

  trackLandingView(properties) {
    this.track('landing_view', properties);
  }

  trackCTAClick(properties) {
    this.track('cta_click', properties);
  }

  trackPricingView() {
    this.track('pricing_view');
  }

  trackSampleViewed(properties) {
    this.track('sample_viewed', properties);
  }

  // ============================
  // Activation Events
  // ============================

  trackSignupStart(properties) {
    this.track('signup_start', properties);
  }

  trackLoginSuccess(properties) {
    this.track('login_success', properties);
  }

  trackActivationComplete() {
    this.track('activation_complete');
  }

  trackFirstFontSelected(properties) {
    this.track('first_font_selected', properties);
  }

  // ============================
  // Core Value Events
  // ============================

  trackLetterCreated(properties) {
    this.track('letter_created', properties);
  }

  trackLetterRendered(properties) {
    this.track('letter_rendered', properties);
  }

  trackLetterSent(properties) {
    this.track('letter_sent', properties);
  }

  trackFontSelected(properties) {
    this.track('font_selected', properties);
  }

  trackRecipientAdded(properties) {
    this.track('recipient_added', properties);
  }

  trackCampaignCreated(properties) {
    this.track('campaign_created', properties);
  }

  // ============================
  // Monetization Events
  // ============================

  trackCheckoutStarted(properties) {
    this.track('checkout_started', properties);
  }

  trackPurchaseCompleted(properties) {
    this.track('purchase_completed', properties);
  }

  trackCreditsPurchased(properties) {
    this.track('credits_purchased', properties);
  }

  trackSubscriptionStarted(properties) {
    this.track('subscription_started', properties);
  }

  // ============================
  // Retention Events
  // ============================

  trackReturnSession(properties) {
    this.track('return_session', properties);
  }

  trackLetterReturningUser() {
    this.track('letter_returning_user');
  }

  trackCampaignRecurring(properties) {
    this.track('campaign_recurring', properties);
  }

  // ============================
  // Reliability Events
  // ============================

  trackErrorShown(properties) {
    this.track('error_shown', properties);
  }

  trackRenderFailed(properties) {
    this.track('render_failed', properties);
  }

  trackSendFailed(properties) {
    this.track('send_failed', properties);
  }

  // ============================
  // Utility Methods
  // ============================

  /**
   * Get the current user ID
   */
  getUserId() {
    return this.userId;
  }

  /**
   * Check if SDK is initialized
   */
  isInitialized() {
    return this.initialized;
  }
}

// Export singleton instance
export const tracking = new TrackingSDK();

// Export convenient aliases
export const trackEvent = (event, properties) => tracking.track(event, properties);

export const identifyUser = (userId, traits) => tracking.identify(userId, traits);

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
};
