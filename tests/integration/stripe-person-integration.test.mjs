/**
 * Integration tests for Stripe webhook + Growth Data Plane (GDP-007, GDP-008)
 * Tests the mapping of stripe_customer_id to person_id and PersonSubscription upserts
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { prisma } from '../../src/lib/prisma.js';
import { getOrCreatePersonFromStripe } from '../../src/lib/identity.js';

describe('Stripe + Person Integration (GDP-007, GDP-008)', () => {
    let testUser;
    let testStripeCustomerId;

    beforeEach(async () => {
        // Create a test user
        testUser = await prisma.user.create({
            data: {
                email: `stripe-test-${Date.now()}@example.com`,
            },
        });

        testStripeCustomerId = `cus_test_${Date.now()}`;

        // Clean up any existing test persons
        await prisma.person.deleteMany({
            where: { email: testUser.email },
        });
    });

    describe('getOrCreatePersonFromStripe', () => {
        it('should create a new Person from Stripe customer', async () => {
            const person = await getOrCreatePersonFromStripe(
                testStripeCustomerId,
                testUser.email,
                'John',
                'Doe'
            );

            expect(person).toBeTruthy();
            expect(person.email).toBe(testUser.email);
            expect(person.firstName).toBe('John');
            expect(person.lastName).toBe('Doe');

            // Verify identity link was created
            const identityLink = await prisma.identityLink.findUnique({
                where: {
                    source_externalId: {
                        source: 'stripe',
                        externalId: testStripeCustomerId,
                    },
                },
            });

            expect(identityLink).toBeTruthy();
            expect(identityLink.personId).toBe(person.id);
        });

        it('should return existing Person if already linked', async () => {
            // First call creates the person
            const person1 = await getOrCreatePersonFromStripe(
                testStripeCustomerId,
                testUser.email,
                'John',
                'Doe'
            );

            // Second call should return the same person
            const person2 = await getOrCreatePersonFromStripe(
                testStripeCustomerId,
                testUser.email,
                'John',
                'Doe'
            );

            expect(person1.id).toBe(person2.id);

            // Verify only one identity link exists
            const identityLinks = await prisma.identityLink.findMany({
                where: {
                    source: 'stripe',
                    externalId: testStripeCustomerId,
                },
            });

            expect(identityLinks).toHaveLength(1);
        });

        it('should link existing Person to new Stripe customer', async () => {
            // Create person first
            const person = await prisma.person.create({
                data: {
                    email: testUser.email,
                    firstName: 'Jane',
                    lastName: 'Smith',
                },
            });

            // Link to Stripe customer
            const linkedPerson = await getOrCreatePersonFromStripe(
                testStripeCustomerId,
                testUser.email,
                'Jane',
                'Smith'
            );

            expect(linkedPerson.id).toBe(person.id);

            // Verify identity link was created
            const identityLink = await prisma.identityLink.findUnique({
                where: {
                    source_externalId: {
                        source: 'stripe',
                        externalId: testStripeCustomerId,
                    },
                },
            });

            expect(identityLink).toBeTruthy();
            expect(identityLink.personId).toBe(person.id);
        });
    });

    describe('PersonSubscription Upsert', () => {
        let testPerson;
        let testSubscriptionId;

        beforeEach(async () => {
            testPerson = await getOrCreatePersonFromStripe(
                testStripeCustomerId,
                testUser.email,
                'Test',
                'User'
            );

            testSubscriptionId = `sub_test_${Date.now()}`;
        });

        it('should create PersonSubscription on checkout.session.completed', async () => {
            const subscriptionData = {
                id: testSubscriptionId,
                customer: testStripeCustomerId,
                status: 'active',
                current_period_start: Math.floor(Date.now() / 1000),
                current_period_end: Math.floor(Date.now() / 1000) + 2592000, // +30 days
                items: {
                    data: [
                        {
                            price: {
                                id: 'price_pro_test',
                                unit_amount: 999, // $9.99
                            },
                        },
                    ],
                },
            };

            await prisma.personSubscription.create({
                data: {
                    personId: testPerson.id,
                    stripeCustomerId: testStripeCustomerId,
                    stripeSubscriptionId: subscriptionData.id,
                    stripePriceId: subscriptionData.items.data[0].price.id,
                    status: subscriptionData.status,
                    plan: 'PRO',
                    mrr: 9.99,
                    currentPeriodStart: new Date(subscriptionData.current_period_start * 1000),
                    currentPeriodEnd: new Date(subscriptionData.current_period_end * 1000),
                },
            });

            const subscription = await prisma.personSubscription.findUnique({
                where: { stripeSubscriptionId: testSubscriptionId },
            });

            expect(subscription).toBeTruthy();
            expect(subscription.personId).toBe(testPerson.id);
            expect(subscription.status).toBe('active');
            expect(subscription.plan).toBe('PRO');
            expect(Number(subscription.mrr)).toBe(9.99);
        });

        it('should update PersonSubscription on customer.subscription.updated', async () => {
            // Create initial subscription
            await prisma.personSubscription.create({
                data: {
                    personId: testPerson.id,
                    stripeCustomerId: testStripeCustomerId,
                    stripeSubscriptionId: testSubscriptionId,
                    stripePriceId: 'price_pro_test',
                    status: 'active',
                    plan: 'PRO',
                    mrr: 9.99,
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 2592000000),
                },
            });

            // Update to BUSINESS tier
            await prisma.personSubscription.update({
                where: { stripeSubscriptionId: testSubscriptionId },
                data: {
                    stripePriceId: 'price_business_test',
                    plan: 'BUSINESS',
                    mrr: 29.99,
                },
            });

            const subscription = await prisma.personSubscription.findUnique({
                where: { stripeSubscriptionId: testSubscriptionId },
            });

            expect(subscription.plan).toBe('BUSINESS');
            expect(Number(subscription.mrr)).toBe(29.99);
            expect(subscription.stripePriceId).toBe('price_business_test');
        });

        it('should mark subscription as canceled on customer.subscription.deleted', async () => {
            // Create active subscription
            await prisma.personSubscription.create({
                data: {
                    personId: testPerson.id,
                    stripeCustomerId: testStripeCustomerId,
                    stripeSubscriptionId: testSubscriptionId,
                    stripePriceId: 'price_pro_test',
                    status: 'active',
                    plan: 'PRO',
                    mrr: 9.99,
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 2592000000),
                },
            });

            // Cancel subscription
            await prisma.personSubscription.updateMany({
                where: { stripeSubscriptionId: testSubscriptionId },
                data: {
                    status: 'canceled',
                    plan: 'FREE',
                    mrr: 0,
                },
            });

            const subscription = await prisma.personSubscription.findUnique({
                where: { stripeSubscriptionId: testSubscriptionId },
            });

            expect(subscription.status).toBe('canceled');
            expect(subscription.plan).toBe('FREE');
            expect(Number(subscription.mrr)).toBe(0);
        });

        it('should handle trial subscriptions', async () => {
            await prisma.personSubscription.create({
                data: {
                    personId: testPerson.id,
                    stripeCustomerId: testStripeCustomerId,
                    stripeSubscriptionId: testSubscriptionId,
                    stripePriceId: 'price_pro_test',
                    status: 'trialing',
                    plan: 'PRO',
                    mrr: 0,
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 2592000000),
                },
            });

            const subscription = await prisma.personSubscription.findUnique({
                where: { stripeSubscriptionId: testSubscriptionId },
            });

            expect(subscription.status).toBe('trialing');
            expect(Number(subscription.mrr)).toBe(0);
        });

        it('should handle past_due subscriptions', async () => {
            await prisma.personSubscription.create({
                data: {
                    personId: testPerson.id,
                    stripeCustomerId: testStripeCustomerId,
                    stripeSubscriptionId: testSubscriptionId,
                    stripePriceId: 'price_pro_test',
                    status: 'past_due',
                    plan: 'PRO',
                    mrr: 9.99,
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 2592000000),
                },
            });

            const subscription = await prisma.personSubscription.findUnique({
                where: { stripeSubscriptionId: testSubscriptionId },
            });

            expect(subscription.status).toBe('past_due');
        });
    });

    describe('Multi-System Identity Linking', () => {
        it('should link User, Stripe, and PostHog to same Person', async () => {
            // Create person from Stripe
            const person = await getOrCreatePersonFromStripe(
                testStripeCustomerId,
                testUser.email,
                'Multi',
                'System'
            );

            // Link user identity
            await prisma.identityLink.upsert({
                where: {
                    source_externalId: {
                        source: 'user',
                        externalId: testUser.id,
                    },
                },
                update: { personId: person.id },
                create: {
                    personId: person.id,
                    source: 'user',
                    externalId: testUser.id,
                },
            });

            // Link PostHog identity
            const posthogId = `ph_${Date.now()}`;
            await prisma.identityLink.create({
                data: {
                    personId: person.id,
                    source: 'posthog',
                    externalId: posthogId,
                },
            });

            // Verify all identities are linked
            const identityLinks = await prisma.identityLink.findMany({
                where: { personId: person.id },
                orderBy: { source: 'asc' },
            });

            expect(identityLinks).toHaveLength(3);
            expect(identityLinks.find(l => l.source === 'stripe')).toBeTruthy();
            expect(identityLinks.find(l => l.source === 'user')).toBeTruthy();
            expect(identityLinks.find(l => l.source === 'posthog')).toBeTruthy();
        });
    });
});
