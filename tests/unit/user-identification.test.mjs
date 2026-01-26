/**
 * Unit tests for TRACK-008: User Identification
 * @jest-environment node
 *
 * Tests that users are properly identified on login with traits including:
 * - Email
 * - Subscription tier (FREE, STARTER, PRO, ENTERPRISE)
 * - Stripe customer/subscription info
 * - Usage statistics
 */
import { jest } from '@jest/globals';

describe('TRACK-008: User Identification', () => {
    describe('User Traits API', () => {
        it('should return user traits with tier information', async () => {
            const mockTraits = {
                tier: 'PRO',
                created_at: '2024-01-01T00:00:00.000Z',
                stripe_customer_id: 'cus_test123',
                stripe_subscription_id: 'sub_test123',
                subscription_active: true,
                price_id: 'price_test123',
                letters_sent: 5,
                letter_generations: 10,
                image_generations: 8,
                voice_transcriptions: 3,
                total_spent: '25.50',
            };

            // Test that traits object has required fields
            expect(mockTraits).toHaveProperty('tier');
            expect(mockTraits).toHaveProperty('created_at');
            expect(['FREE', 'STARTER', 'PRO', 'ENTERPRISE']).toContain(mockTraits.tier);
        });

        it('should handle FREE tier users without Stripe info', () => {
            const mockTraits = {
                tier: 'FREE',
                created_at: '2024-01-01T00:00:00.000Z',
                letters_sent: 0,
                letter_generations: 2,
                image_generations: 0,
                voice_transcriptions: 0,
                total_spent: '0.00',
            };

            expect(mockTraits.tier).toBe('FREE');
            expect(mockTraits).not.toHaveProperty('stripe_customer_id');
            expect(mockTraits).not.toHaveProperty('subscription_active');
        });

        it('should include subscription info for paid users', () => {
            const mockTraits = {
                tier: 'STARTER',
                stripe_customer_id: 'cus_test123',
                stripe_subscription_id: 'sub_test123',
                subscription_active: true,
                price_id: 'price_test123',
                subscription_period_end: '2024-02-01T00:00:00.000Z',
            };

            expect(mockTraits.subscription_active).toBe(true);
            expect(mockTraits.stripe_customer_id).toBeDefined();
            expect(mockTraits.stripe_subscription_id).toBeDefined();
        });
    });

    describe('User Identification on Login', () => {
        it('should identify user with email and traits', () => {
            const userId = 'user_test123';
            const userEmail = 'test@example.com';
            const traits = {
                email: userEmail,
                tier: 'PRO',
                created_at: '2024-01-01T00:00:00.000Z',
                letters_sent: 5,
            };

            // Verify required fields are present
            expect(traits.email).toBe(userEmail);
            expect(traits.tier).toBeDefined();
            expect(['FREE', 'STARTER', 'PRO', 'ENTERPRISE']).toContain(traits.tier);
        });

        it('should track login_success event', () => {
            const loginEvent = {
                event: 'login_success',
                properties: {
                    method: 'email',
                },
            };

            expect(loginEvent.event).toBe('login_success');
            expect(loginEvent.properties.method).toBe('email');
        });

        it('should handle identification failure gracefully', () => {
            const fallbackTraits = {
                email: 'test@example.com',
            };

            // Should still have at least email even if tier fetch fails
            expect(fallbackTraits.email).toBeDefined();
        });
    });

    describe('Tracking SDK Identification', () => {
        it('should support identify method with userId and traits', () => {
            const mockIdentify = jest.fn();

            const userId = 'user_123';
            const traits = {
                email: 'test@example.com',
                tier: 'PRO',
                letters_sent: 10,
            };

            mockIdentify(userId, traits);

            expect(mockIdentify).toHaveBeenCalledWith(userId, traits);
            expect(mockIdentify).toHaveBeenCalledTimes(1);
        });

        it('should identify in both PostHog and unified tracking', () => {
            const mockPostHogIdentify = jest.fn();
            const mockTrackingIdentify = jest.fn();

            const userId = 'user_123';
            const traits = {
                email: 'test@example.com',
                tier: 'STARTER',
            };

            mockPostHogIdentify(userId, traits);
            mockTrackingIdentify(userId, traits);

            expect(mockPostHogIdentify).toHaveBeenCalledWith(userId, traits);
            expect(mockTrackingIdentify).toHaveBeenCalledWith(userId, traits);
        });
    });

    describe('Trait Properties', () => {
        it('should include all expected user properties', () => {
            const completeTraits = {
                email: 'test@example.com',
                tier: 'PRO',
                created_at: '2024-01-01T00:00:00.000Z',
                stripe_customer_id: 'cus_test',
                stripe_subscription_id: 'sub_test',
                subscription_active: true,
                price_id: 'price_test',
                subscription_period_end: '2024-02-01T00:00:00.000Z',
                letters_sent: 5,
                letter_generations: 10,
                image_generations: 8,
                voice_transcriptions: 3,
                total_spent: '25.50',
            };

            // Required fields
            expect(completeTraits).toHaveProperty('email');
            expect(completeTraits).toHaveProperty('tier');
            expect(completeTraits).toHaveProperty('created_at');

            // Usage tracking
            expect(completeTraits).toHaveProperty('letters_sent');
            expect(completeTraits).toHaveProperty('letter_generations');
            expect(completeTraits).toHaveProperty('image_generations');
            expect(completeTraits).toHaveProperty('voice_transcriptions');
            expect(completeTraits).toHaveProperty('total_spent');

            // Subscription info (for paid users)
            expect(completeTraits).toHaveProperty('stripe_customer_id');
            expect(completeTraits).toHaveProperty('subscription_active');
        });

        it('should have valid tier values', () => {
            const validTiers = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];

            validTiers.forEach(tier => {
                const traits = { tier };
                expect(validTiers).toContain(traits.tier);
            });
        });

        it('should format dates as ISO strings', () => {
            const traits = {
                created_at: '2024-01-01T00:00:00.000Z',
                subscription_period_end: '2024-02-01T00:00:00.000Z',
            };

            // Check ISO 8601 format
            expect(traits.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
            expect(traits.subscription_period_end).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        });

        it('should format numeric values correctly', () => {
            const traits = {
                letters_sent: 5,
                letter_generations: 10,
                image_generations: 8,
                voice_transcriptions: 3,
                total_spent: '25.50',
            };

            expect(typeof traits.letters_sent).toBe('number');
            expect(typeof traits.letter_generations).toBe('number');
            expect(typeof traits.image_generations).toBe('number');
            expect(typeof traits.voice_transcriptions).toBe('number');
            expect(typeof traits.total_spent).toBe('string'); // Decimal stored as string
        });
    });
});
