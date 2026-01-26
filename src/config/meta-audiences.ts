/**
 * Meta Custom Audiences Configuration
 *
 * Defines audience segments based on user behavior for Meta Ads targeting
 *
 * These audiences are created in Meta Ads Manager using the Pixel events
 * we're already tracking. This file documents the recommended audience
 * segments for SteadyLetters marketing campaigns.
 */

export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  rules: AudienceRule[];
  lookbackDays: number; // How far back to look for events
  useCase: string;
  estimatedSize?: 'small' | 'medium' | 'large';
}

export interface AudienceRule {
  event: string;
  operator: 'occurred' | 'not_occurred' | 'occurred_after' | 'occurred_before';
  timeframe?: number; // Days
  parameters?: Record<string, any>;
}

/**
 * Pre-configured audience segments for SteadyLetters
 */
export const CUSTOM_AUDIENCES: AudienceSegment[] = [
  // === Acquisition Audiences ===
  {
    id: 'warm-leads',
    name: 'Warm Leads',
    description: 'Users who viewed pricing but haven\'t signed up',
    rules: [
      {
        event: 'ViewContent',
        operator: 'occurred',
        parameters: { content_type: 'pricing' },
      },
      {
        event: 'CompleteRegistration',
        operator: 'not_occurred',
      },
    ],
    lookbackDays: 30,
    useCase: 'Retarget with signup incentive ads',
    estimatedSize: 'medium',
  },
  {
    id: 'landing-visitors',
    name: 'Landing Page Visitors',
    description: 'Visited website but didn\'t view pricing',
    rules: [
      {
        event: 'PageView',
        operator: 'occurred',
      },
      {
        event: 'ViewContent',
        operator: 'not_occurred',
        parameters: { content_type: 'pricing' },
      },
    ],
    lookbackDays: 14,
    useCase: 'Top-of-funnel awareness and education',
    estimatedSize: 'large',
  },

  // === Activation Audiences ===
  {
    id: 'signed-up-not-activated',
    name: 'Signed Up, Not Activated',
    description: 'Completed registration but haven\'t created a letter',
    rules: [
      {
        event: 'CompleteRegistration',
        operator: 'occurred',
      },
      {
        event: 'ViewContent',
        operator: 'not_occurred',
        parameters: { content_type: 'letter' },
      },
    ],
    lookbackDays: 7,
    useCase: 'Onboarding emails and activation campaigns',
    estimatedSize: 'small',
  },
  {
    id: 'created-not-sent',
    name: 'Created Letter, Didn\'t Send',
    description: 'Created a letter but haven\'t sent it yet',
    rules: [
      {
        event: 'ViewContent',
        operator: 'occurred',
        parameters: { content_type: 'letter' },
      },
      {
        event: 'Purchase',
        operator: 'not_occurred',
        parameters: { content_type: 'letter' },
      },
    ],
    lookbackDays: 14,
    useCase: 'Nudge to complete their first send',
    estimatedSize: 'small',
  },

  // === Monetization Audiences ===
  {
    id: 'free-tier-active',
    name: 'Free Tier Active Users',
    description: 'Active on free tier, potential upgrade candidates',
    rules: [
      {
        event: 'Purchase',
        operator: 'occurred',
        parameters: { content_type: 'letter' },
      },
      {
        event: 'Subscribe',
        operator: 'not_occurred',
      },
    ],
    lookbackDays: 30,
    useCase: 'Promote paid subscription benefits',
    estimatedSize: 'medium',
  },
  {
    id: 'checkout-abandoners',
    name: 'Checkout Abandoners',
    description: 'Started checkout but didn\'t complete purchase',
    rules: [
      {
        event: 'InitiateCheckout',
        operator: 'occurred',
      },
      {
        event: 'Purchase',
        operator: 'not_occurred',
        timeframe: 1, // Within 1 day
      },
    ],
    lookbackDays: 7,
    useCase: 'Retarget with discount or urgency messaging',
    estimatedSize: 'small',
  },

  // === Retention Audiences ===
  {
    id: 'active-senders',
    name: 'Active Letter Senders',
    description: 'Users who sent a letter in the last 30 days',
    rules: [
      {
        event: 'Purchase',
        operator: 'occurred',
        parameters: { content_type: 'letter' },
        timeframe: 30,
      },
    ],
    lookbackDays: 30,
    useCase: 'Upsell campaigns and feature announcements',
    estimatedSize: 'medium',
  },
  {
    id: 'at-risk-churners',
    name: 'At-Risk Churners',
    description: 'Haven\'t sent a letter in 60+ days (previously active)',
    rules: [
      {
        event: 'Purchase',
        operator: 'occurred',
        parameters: { content_type: 'letter' },
        timeframe: 90, // Sent in last 90 days
      },
      {
        event: 'Purchase',
        operator: 'not_occurred',
        timeframe: 60, // But not in last 60 days
      },
    ],
    lookbackDays: 90,
    useCase: 'Re-engagement and win-back campaigns',
    estimatedSize: 'small',
  },

  // === Value-Based Audiences ===
  {
    id: 'high-value-customers',
    name: 'High-Value Customers',
    description: 'Sent 5+ letters in the last 90 days',
    rules: [
      {
        event: 'Purchase',
        operator: 'occurred',
        parameters: {
          content_type: 'letter',
          // Note: Meta lets you set event count in the UI
        },
      },
    ],
    lookbackDays: 90,
    useCase: 'VIP treatment, referral programs, case studies',
    estimatedSize: 'small',
  },
  {
    id: 'subscribers',
    name: 'Active Subscribers',
    description: 'Users with active paid subscriptions',
    rules: [
      {
        event: 'Subscribe',
        operator: 'occurred',
      },
    ],
    lookbackDays: 30,
    useCase: 'Premium feature announcements, upsells',
    estimatedSize: 'small',
  },

  // === Lookalike Source Audiences ===
  {
    id: 'converters',
    name: 'Letter Converters (Lookalike Source)',
    description: 'Users who sent their first letter (best converters)',
    rules: [
      {
        event: 'Purchase',
        operator: 'occurred',
        parameters: { content_type: 'letter' },
      },
    ],
    lookbackDays: 180,
    useCase: 'Source for lookalike audiences for acquisition',
    estimatedSize: 'medium',
  },
  {
    id: 'paying-customers',
    name: 'Paying Customers (Lookalike Source)',
    description: 'Users who completed a purchase or subscription',
    rules: [
      {
        event: 'Subscribe',
        operator: 'occurred',
      },
    ],
    lookbackDays: 180,
    useCase: 'Source for high-intent lookalike audiences',
    estimatedSize: 'small',
  },
];

/**
 * Get audience by ID
 */
export function getAudienceById(id: string): AudienceSegment | undefined {
  return CUSTOM_AUDIENCES.find((audience) => audience.id === id);
}

/**
 * Get audiences by use case category
 */
export function getAudiencesByCategory(
  category: 'acquisition' | 'activation' | 'monetization' | 'retention' | 'lookalike'
): AudienceSegment[] {
  const categoryKeywords: Record<string, string[]> = {
    acquisition: ['retarget', 'signup', 'landing', 'awareness'],
    activation: ['onboarding', 'activation', 'first send', 'created'],
    monetization: ['upgrade', 'checkout', 'subscription', 'paid'],
    retention: ['active', 'churn', 're-engagement', 'upsell'],
    lookalike: ['lookalike', 'source'],
  };

  const keywords = categoryKeywords[category] || [];

  return CUSTOM_AUDIENCES.filter((audience) => {
    const text = `${audience.name} ${audience.description} ${audience.useCase}`.toLowerCase();
    return keywords.some((keyword) => text.includes(keyword));
  });
}

/**
 * Export audience definition for Meta Ads Manager
 * (For manual setup in UI or API integration)
 */
export function exportAudienceDefinition(audienceId: string): string {
  const audience = getAudienceById(audienceId);
  if (!audience) {
    throw new Error(`Audience not found: ${audienceId}`);
  }

  return JSON.stringify(
    {
      name: audience.name,
      description: audience.description,
      rules: audience.rules,
      retention_days: audience.lookbackDays,
      use_case: audience.useCase,
    },
    null,
    2
  );
}
