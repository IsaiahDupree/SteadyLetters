/**
 * Tests for Tracking SDK
 * @jest-environment node
 */
import { jest } from '@jest/globals';

// Mock PostHog before importing tracking
const mockTrackEvent = jest.fn();
const mockIdentifyUser = jest.fn();

jest.unstable_mockModule('../../src/lib/posthog.ts', () => ({
  trackEvent: mockTrackEvent,
  identifyUser: mockIdentifyUser,
}));

// Now import the tracking module
const { tracking, trackEvent, identifyUser } = await import('../../src/lib/tracking.js');

describe('Tracking SDK', () => {
  beforeEach(() => {
    mockTrackEvent.mockClear();
    mockIdentifyUser.mockClear();
  });

  describe('User Identification', () => {
    test('should identify a user', () => {
      const userId = 'user-123';
      const traits = { email: 'test@example.com', plan: 'pro' };

      tracking.identify(userId, traits);

      expect(mockIdentifyUser).toHaveBeenCalledWith(userId, traits);
      expect(tracking.getUserId()).toBe(userId);
    });
  });

  describe('Acquisition Events', () => {
    test('should track landing view', () => {
      tracking.trackLandingView({ utm_source: 'facebook', utm_campaign: 'spring' });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'landing_view',
        expect.objectContaining({
          utm_source: 'facebook',
          utm_campaign: 'spring',
        })
      );
    });

    test('should track CTA clicks', () => {
      tracking.trackCTAClick({
        cta_text: 'Get Started',
        cta_location: 'hero',
        target_url: '/signup',
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'cta_click',
        expect.objectContaining({
          cta_text: 'Get Started',
          cta_location: 'hero',
        })
      );
    });

    test('should track pricing view', () => {
      tracking.trackPricingView();

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'pricing_view',
        expect.any(Object)
      );
    });

    test('should track sample viewed', () => {
      tracking.trackSampleViewed({ sample_id: 'sample-1', sample_type: 'letter' });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'sample_viewed',
        expect.objectContaining({
          sample_id: 'sample-1',
          sample_type: 'letter',
        })
      );
    });
  });

  describe('Activation Events', () => {
    test('should track signup start', () => {
      tracking.trackSignupStart({ method: 'email' });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'signup_start',
        expect.objectContaining({
          method: 'email',
        })
      );
    });

    test('should track login success', () => {
      tracking.trackLoginSuccess({ method: 'google' });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'login_success',
        expect.objectContaining({
          method: 'google',
        })
      );
    });

    test('should track activation complete', () => {
      tracking.trackActivationComplete();

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'activation_complete',
        expect.any(Object)
      );
    });

    test('should track first font selected', () => {
      tracking.trackFirstFontSelected({ font_id: 'font-1', font_name: 'Casual' });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'first_font_selected',
        expect.objectContaining({
          font_id: 'font-1',
          font_name: 'Casual',
        })
      );
    });
  });

  describe('Core Value Events', () => {
    test('should track letter created', () => {
      tracking.trackLetterCreated({
        letter_id: 'letter-1',
        font_id: 'font-2',
        word_count: 150,
        template_used: 'birthday',
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'letter_created',
        expect.objectContaining({
          letter_id: 'letter-1',
          font_id: 'font-2',
          word_count: 150,
        })
      );
    });

    test('should track letter rendered', () => {
      tracking.trackLetterRendered({
        letter_id: 'letter-1',
        render_time_ms: 500,
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'letter_rendered',
        expect.objectContaining({
          letter_id: 'letter-1',
          render_time_ms: 500,
        })
      );
    });

    test('should track letter sent', () => {
      tracking.trackLetterSent({
        letter_id: 'letter-1',
        recipient_count: 3,
        mail_class: 'first_class',
        cost: 5.99,
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'letter_sent',
        expect.objectContaining({
          letter_id: 'letter-1',
          recipient_count: 3,
          mail_class: 'first_class',
          cost: 5.99,
        })
      );
    });

    test('should track font selected', () => {
      tracking.trackFontSelected({ font_id: 'font-3', font_name: 'Professional' });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'font_selected',
        expect.objectContaining({
          font_id: 'font-3',
          font_name: 'Professional',
        })
      );
    });

    test('should track recipient added', () => {
      tracking.trackRecipientAdded({ recipient_id: 'rec-1', source: 'manual' });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'recipient_added',
        expect.objectContaining({
          recipient_id: 'rec-1',
          source: 'manual',
        })
      );
    });

    test('should track campaign created', () => {
      tracking.trackCampaignCreated({ campaign_id: 'camp-1', recipient_count: 10 });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'campaign_created',
        expect.objectContaining({
          campaign_id: 'camp-1',
          recipient_count: 10,
        })
      );
    });
  });

  describe('Monetization Events', () => {
    test('should track checkout started', () => {
      tracking.trackCheckoutStarted({
        value: 29.99,
        currency: 'USD',
        plan: 'pro',
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'checkout_started',
        expect.objectContaining({
          value: 29.99,
          currency: 'USD',
          plan: 'pro',
        })
      );
    });

    test('should track purchase completed', () => {
      tracking.trackPurchaseCompleted({
        value: 29.99,
        currency: 'USD',
        transaction_id: 'txn-123',
        plan: 'pro',
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'purchase_completed',
        expect.objectContaining({
          value: 29.99,
          currency: 'USD',
          transaction_id: 'txn-123',
        })
      );
    });

    test('should track credits purchased', () => {
      tracking.trackCreditsPurchased({
        credits: 100,
        value: 49.99,
        currency: 'USD',
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'credits_purchased',
        expect.objectContaining({
          credits: 100,
          value: 49.99,
          currency: 'USD',
        })
      );
    });

    test('should track subscription started', () => {
      tracking.trackSubscriptionStarted({
        plan: 'business',
        value: 99.99,
        currency: 'USD',
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'subscription_started',
        expect.objectContaining({
          plan: 'business',
          value: 99.99,
          currency: 'USD',
        })
      );
    });
  });

  describe('Retention Events', () => {
    test('should track return session', () => {
      tracking.trackReturnSession({ days_since_last_session: 3 });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'return_session',
        expect.objectContaining({
          days_since_last_session: 3,
        })
      );
    });

    test('should track letter returning user', () => {
      tracking.trackLetterReturningUser();

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'letter_returning_user',
        expect.any(Object)
      );
    });

    test('should track campaign recurring', () => {
      tracking.trackCampaignRecurring({ campaign_id: 'camp-1', iteration: 5 });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'campaign_recurring',
        expect.objectContaining({
          campaign_id: 'camp-1',
          iteration: 5,
        })
      );
    });
  });

  describe('Reliability Events', () => {
    test('should track error shown', () => {
      tracking.trackErrorShown({
        error_type: 'validation',
        error_message: 'Invalid email',
        component: 'signup-form',
        severity: 'medium',
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'error_shown',
        expect.objectContaining({
          error_type: 'validation',
          error_message: 'Invalid email',
          component: 'signup-form',
          severity: 'medium',
        })
      );
    });

    test('should track render failed', () => {
      tracking.trackRenderFailed({
        letter_id: 'letter-1',
        error_message: 'Font loading failed',
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'render_failed',
        expect.objectContaining({
          letter_id: 'letter-1',
          error_message: 'Font loading failed',
        })
      );
    });

    test('should track send failed', () => {
      tracking.trackSendFailed({
        letter_id: 'letter-1',
        error_message: 'API error',
        recipient_count: 2,
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'send_failed',
        expect.objectContaining({
          letter_id: 'letter-1',
          error_message: 'API error',
          recipient_count: 2,
        })
      );
    });
  });
});
