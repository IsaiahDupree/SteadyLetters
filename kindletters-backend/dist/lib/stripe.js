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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.STRIPE_PLANS = exports.stripe = void 0;
exports.getOrCreateStripeCustomer = getOrCreateStripeCustomer;
const stripe_1 = __importDefault(require("stripe"));
const pricing_tiers_1 = require("./pricing-tiers");
Object.defineProperty(exports, "STRIPE_PLANS", { enumerable: true, get: function () { return pricing_tiers_1.STRIPE_PLANS; } });
// Lazy initialization - only create Stripe client when actually used
// This prevents crashes if STRIPE_SECRET_KEY is not set at module load time
let stripeInstance = null;
function getStripe() {
    if (!stripeInstance) {
        const apiKey = process.env.STRIPE_SECRET_KEY;
        if (!apiKey) {
            throw new Error('STRIPE_SECRET_KEY environment variable is not set');
        }
        stripeInstance = new stripe_1.default(apiKey, {
            apiVersion: '2025-11-17.clover',
            typescript: true,
        });
    }
    return stripeInstance;
}
// Export as a getter that works in both ESM and CommonJS
// This ensures Stripe is only initialized when actually accessed
exports.stripe = new Proxy({}, {
    get(_target, prop) {
        const client = getStripe();
        const value = client[prop];
        // If it's a function, bind it to the client
        if (typeof value === 'function') {
            return value.bind(client);
        }
        return value;
    },
});
async function getOrCreateStripeCustomer(userId, email) {
    // Check if customer exists in database
    const { prisma } = await Promise.resolve().then(() => __importStar(require('./prisma')));
    // Ensure user exists in Prisma first
    let user = await prisma.user.findUnique({
        where: { id: userId },
        select: { stripeCustomerId: true },
    });
    if (!user) {
        // User doesn't exist, create them
        user = await prisma.user.create({
            data: {
                id: userId,
                email,
            },
            select: { stripeCustomerId: true },
        });
    }
    if (user.stripeCustomerId) {
        return user.stripeCustomerId;
    }
    // Create new Stripe customer
    const customer = await exports.stripe.customers.create({
        email,
        metadata: { userId },
    });
    // Save to database (use upsert to handle race conditions)
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId: customer.id },
        });
    }
    catch (error) {
        // If update fails, try to get the customer ID that might have been set by another request
        const updatedUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { stripeCustomerId: true },
        });
        if (updatedUser?.stripeCustomerId) {
            return updatedUser.stripeCustomerId;
        }
        throw error;
    }
    return customer.id;
}
