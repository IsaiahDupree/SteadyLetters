'use client';

import posthog from 'posthog-js';

// Initialize PostHog (client-side only)
export function initPostHog() {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      capture_pageview: false, // We'll manually capture page views
      capture_pageleave: true,
      person_profiles: 'identified_only', // Only create profiles for identified users
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[PostHog] Initialized');
        }
      },
    });
  }
}

// Track custom events
export function trackEvent(event: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined') {
    posthog.capture(event, properties);
  }
}

// Identify user
export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined') {
    posthog.identify(userId, properties);
  }
}

// Reset user (on logout)
export function resetUser() {
  if (typeof window !== 'undefined') {
    posthog.reset();
  }
}

// Track page view
export function trackPageView(url?: string) {
  if (typeof window !== 'undefined') {
    posthog.capture('$pageview', {
      $current_url: url || window.location.href,
    });
  }
}

// Key events for the conversion funnel
export const PostHogEvents = {
  // Authentication
  USER_SIGNED_UP: 'user_signed_up',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',

  // Letter Generation
  LETTER_GENERATED: 'letter_generated',
  LETTER_GENERATION_FAILED: 'letter_generation_failed',

  // Image Generation
  IMAGE_GENERATED: 'image_generated',
  IMAGE_GENERATION_FAILED: 'image_generation_failed',

  // Voice Transcription
  VOICE_TRANSCRIBED: 'voice_transcribed',
  VOICE_TRANSCRIPTION_FAILED: 'voice_transcription_failed',

  // Orders
  ORDER_CREATED: 'order_created',
  ORDER_CREATION_FAILED: 'order_creation_failed',
  ORDER_STATUS_UPDATED: 'order_status_updated',

  // Subscriptions
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  SUBSCRIPTION_UPDATED: 'subscription_updated',

  // Limits
  LIMIT_REACHED: 'limit_reached',
  LIMIT_WARNING: 'limit_warning',

  // Recipients
  RECIPIENT_CREATED: 'recipient_created',
  RECIPIENT_DELETED: 'recipient_deleted',

  // Templates
  TEMPLATE_CREATED: 'template_created',
  TEMPLATE_UPDATED: 'template_updated',
  TEMPLATE_DELETED: 'template_deleted',
} as const;

// Export PostHog instance for direct access if needed
export { posthog };
