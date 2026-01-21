"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importStar(require("express"));
const stripe_1 = require("../../lib/stripe");
const prisma_1 = require("../../lib/prisma");
const router = (0, express_1.Router)();
/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 * Note: This route must receive raw body (not parsed JSON) for signature verification
 */
router.post('/webhook', express_1.default.raw({ type: 'application/json' }), async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
        return res.status(400).json({
            error: 'No signature'
        });
    }
    const rawBody = req.body;
    if (!rawBody) {
        return res.status(400).json({
            error: 'No body'
        });
    }
    let event;
    try {
        event = stripe_1.stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (error) {
        console.error('Webhook signature verification failed:', error);
        return res.status(400).json({
            error: 'Invalid signature'
        });
    }
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = session.metadata?.userId;
                if (!userId)
                    break;
                const subscription = await stripe_1.stripe.subscriptions.retrieve(session.subscription, { expand: ['items.data.price'] });
                await prisma_1.prisma.user.update({
                    where: { id: userId },
                    data: {
                        stripeSubscriptionId: subscription.id,
                        stripePriceId: subscription.items.data[0].price.id,
                        stripeCurrentPeriodEnd: subscription.current_period_end
                            ? new Date(subscription.current_period_end * 1000)
                            : null,
                    },
                });
                // Update user tier in UserUsage
                const priceId = subscription.items.data[0].price.id;
                let tier = 'FREE';
                if (priceId === process.env.STRIPE_PRO_PRICE_ID || priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
                    tier = 'PRO';
                }
                else if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID || priceId === process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID) {
                    tier = 'BUSINESS';
                }
                await prisma_1.prisma.userUsage.update({
                    where: { userId },
                    data: { tier },
                });
                break;
            }
            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                const customerId = subscription.customer;
                const user = await prisma_1.prisma.user.findUnique({
                    where: { stripeCustomerId: customerId },
                });
                if (!user)
                    break;
                await prisma_1.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        stripePriceId: subscription.items.data[0].price.id,
                        stripeCurrentPeriodEnd: subscription.current_period_end
                            ? new Date(subscription.current_period_end * 1000)
                            : null,
                    },
                });
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                const customerId = subscription.customer;
                const user = await prisma_1.prisma.user.findUnique({
                    where: { stripeCustomerId: customerId },
                });
                if (!user)
                    break;
                // Downgrade to FREE tier
                await prisma_1.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        stripeSubscriptionId: null,
                        stripePriceId: null,
                        stripeCurrentPeriodEnd: null,
                    },
                });
                await prisma_1.prisma.userUsage.update({
                    where: { userId: user.id },
                    data: { tier: 'FREE' },
                });
                break;
            }
        }
        return res.json({ received: true });
    }
    catch (error) {
        console.error('Webhook handler error:', error);
        return res.status(500).json({
            error: 'Webhook handler failed'
        });
    }
});
exports.default = router;
