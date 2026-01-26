/**
 * Unit tests for Meta Custom Audiences configuration
 *
 * Tests the audience segment definitions and utility functions
 */

import { describe, it, expect } from '@jest/globals';

// Mock the audience configuration
const CUSTOM_AUDIENCES = [
  {
    id: 'warm-leads',
    name: 'Warm Leads',
    description: "Users who viewed pricing but haven't signed up",
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
    description: "Visited website but didn't view pricing",
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
  {
    id: 'signed-up-not-activated',
    name: 'Signed Up, Not Activated',
    description: "Completed registration but haven't created a letter",
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
];

function getAudienceById(id) {
  return CUSTOM_AUDIENCES.find((audience) => audience.id === id);
}

function getAudiencesByCategory(category) {
  const categoryKeywords = {
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

function exportAudienceDefinition(audienceId) {
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

describe('Meta Custom Audiences Configuration', () => {
  describe('Audience Definitions', () => {
    it('should have all required fields for each audience', () => {
      CUSTOM_AUDIENCES.forEach((audience) => {
        expect(audience).toHaveProperty('id');
        expect(audience).toHaveProperty('name');
        expect(audience).toHaveProperty('description');
        expect(audience).toHaveProperty('rules');
        expect(audience).toHaveProperty('lookbackDays');
        expect(audience).toHaveProperty('useCase');
        expect(audience.rules).toBeInstanceOf(Array);
        expect(audience.rules.length).toBeGreaterThan(0);
      });
    });

    it('should have unique audience IDs', () => {
      const ids = CUSTOM_AUDIENCES.map((a) => a.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should have valid lookback days', () => {
      CUSTOM_AUDIENCES.forEach((audience) => {
        expect(audience.lookbackDays).toBeGreaterThan(0);
        expect(audience.lookbackDays).toBeLessThanOrEqual(180);
      });
    });

    it('should have valid event operators', () => {
      const validOperators = [
        'occurred',
        'not_occurred',
        'occurred_after',
        'occurred_before',
      ];

      CUSTOM_AUDIENCES.forEach((audience) => {
        audience.rules.forEach((rule) => {
          expect(validOperators).toContain(rule.operator);
        });
      });
    });
  });

  describe('getAudienceById', () => {
    it('should return audience by ID', () => {
      const audience = getAudienceById('warm-leads');
      expect(audience).toBeDefined();
      expect(audience.id).toBe('warm-leads');
      expect(audience.name).toBe('Warm Leads');
    });

    it('should return undefined for non-existent ID', () => {
      const audience = getAudienceById('non-existent');
      expect(audience).toBeUndefined();
    });
  });

  describe('getAudiencesByCategory', () => {
    it('should return acquisition audiences', () => {
      const audiences = getAudiencesByCategory('acquisition');
      expect(audiences.length).toBeGreaterThan(0);
      expect(audiences.some((a) => a.id === 'warm-leads')).toBe(true);
    });

    it('should return activation audiences', () => {
      const audiences = getAudiencesByCategory('activation');
      expect(audiences.length).toBeGreaterThan(0);
      expect(audiences.some((a) => a.id === 'signed-up-not-activated')).toBe(true);
    });

    it('should return lookalike audiences', () => {
      const audiences = getAudiencesByCategory('lookalike');
      expect(audiences.length).toBeGreaterThan(0);
      expect(audiences.some((a) => a.id === 'converters')).toBe(true);
    });

    it('should return retention audiences', () => {
      const audiences = getAudiencesByCategory('retention');
      expect(audiences.length).toBeGreaterThan(0);
      expect(audiences.some((a) => a.id === 'active-senders')).toBe(true);
    });

    it('should return empty array for unknown category', () => {
      const audiences = getAudiencesByCategory('unknown');
      expect(audiences).toEqual([]);
    });
  });

  describe('exportAudienceDefinition', () => {
    it('should export audience as JSON', () => {
      const json = exportAudienceDefinition('warm-leads');
      const parsed = JSON.parse(json);

      expect(parsed).toHaveProperty('name');
      expect(parsed).toHaveProperty('description');
      expect(parsed).toHaveProperty('rules');
      expect(parsed).toHaveProperty('retention_days');
      expect(parsed).toHaveProperty('use_case');
    });

    it('should include all rules in export', () => {
      const json = exportAudienceDefinition('warm-leads');
      const parsed = JSON.parse(json);

      expect(parsed.rules).toHaveLength(2);
      expect(parsed.rules[0].event).toBe('ViewContent');
      expect(parsed.rules[1].event).toBe('CompleteRegistration');
    });

    it('should throw error for non-existent audience', () => {
      expect(() => {
        exportAudienceDefinition('non-existent');
      }).toThrow('Audience not found');
    });
  });

  describe('Audience Rules Validation', () => {
    it('warm-leads should have correct rules', () => {
      const audience = getAudienceById('warm-leads');
      expect(audience.rules).toHaveLength(2);
      expect(audience.rules[0].event).toBe('ViewContent');
      expect(audience.rules[0].operator).toBe('occurred');
      expect(audience.rules[0].parameters.content_type).toBe('pricing');
      expect(audience.rules[1].event).toBe('CompleteRegistration');
      expect(audience.rules[1].operator).toBe('not_occurred');
    });

    it('landing-visitors should exclude pricing viewers', () => {
      const audience = getAudienceById('landing-visitors');
      expect(audience.rules).toHaveLength(2);
      expect(audience.rules[0].event).toBe('PageView');
      expect(audience.rules[0].operator).toBe('occurred');
      expect(audience.rules[1].event).toBe('ViewContent');
      expect(audience.rules[1].operator).toBe('not_occurred');
    });

    it('signed-up-not-activated should have onboarding focus', () => {
      const audience = getAudienceById('signed-up-not-activated');
      expect(audience.rules).toHaveLength(2);
      expect(audience.rules[0].event).toBe('CompleteRegistration');
      expect(audience.rules[0].operator).toBe('occurred');
      expect(audience.rules[1].event).toBe('ViewContent');
      expect(audience.rules[1].operator).toBe('not_occurred');
      expect(audience.lookbackDays).toBe(7); // Short window for activation
    });
  });

  describe('Use Case Mapping', () => {
    it('should have clear use cases for all audiences', () => {
      CUSTOM_AUDIENCES.forEach((audience) => {
        expect(audience.useCase).toBeTruthy();
        expect(audience.useCase.length).toBeGreaterThan(10);
      });
    });

    it('lookalike sources should have long lookback windows', () => {
      const lookalikes = getAudiencesByCategory('lookalike');
      lookalikes.forEach((audience) => {
        expect(audience.lookbackDays).toBeGreaterThanOrEqual(180);
      });
    });

    it('activation audiences should have short lookback windows', () => {
      const activation = getAudiencesByCategory('activation');
      activation.forEach((audience) => {
        expect(audience.lookbackDays).toBeLessThanOrEqual(14);
      });
    });
  });

  describe('Event Coverage', () => {
    it('should use Meta standard events', () => {
      const metaEvents = [
        'PageView',
        'ViewContent',
        'CompleteRegistration',
        'Purchase',
        'Subscribe',
        'InitiateCheckout',
        'AddToCart',
        'Lead',
        'Contact',
      ];

      const usedEvents = new Set();
      CUSTOM_AUDIENCES.forEach((audience) => {
        audience.rules.forEach((rule) => {
          usedEvents.add(rule.event);
        });
      });

      // All used events should be from Meta's standard events
      usedEvents.forEach((event) => {
        expect(metaEvents).toContain(event);
      });
    });

    it('should cover all key funnel stages', () => {
      const acquisition = getAudiencesByCategory('acquisition');
      const activation = getAudiencesByCategory('activation');
      const retention = getAudiencesByCategory('retention');
      const lookalike = getAudiencesByCategory('lookalike');

      // Should have audiences for each stage
      expect(acquisition.length).toBeGreaterThan(0);
      expect(activation.length).toBeGreaterThan(0);
      expect(retention.length).toBeGreaterThan(0);
      expect(lookalike.length).toBeGreaterThan(0);
    });
  });
});
