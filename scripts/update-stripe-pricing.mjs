import Stripe from 'stripe';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-11-17.clover',
});

async function updateStripePricing() {
    console.log('🔄 Updating Stripe pricing based on tierresearch.txt...\n');

    try {
        // Get existing products
        const products = await stripe.products.list({ limit: 100 });
        
        let proProduct = products.data.find(p => p.name === 'Pro' || p.name === 'SteadyLetters Pro');
        let businessProduct = products.data.find(p => p.name === 'Business' || p.name === 'SteadyLetters Business');

        // Create products if they don't exist
        if (!proProduct) {
            console.log('📦 Creating Pro product...');
            proProduct = await stripe.products.create({
                name: 'SteadyLetters Pro',
                description: 'Pro plan for individual power users - 50 AI letters, 100 images, 10 mailed letters/month',
            });
        }

        if (!businessProduct) {
            console.log('📦 Creating Business product...');
            businessProduct = await stripe.products.create({
                name: 'SteadyLetters Business',
                description: 'Business plan for teams and high-volume users - 200 AI letters, 400 images, 50 mailed letters/month',
            });
        }

        // Get existing prices for these products
        const proPrices = await stripe.prices.list({ product: proProduct.id, active: true });
        const businessPrices = await stripe.prices.list({ product: businessProduct.id, active: true });

        // Deactivate old prices
        for (const price of [...proPrices.data, ...businessPrices.data]) {
            if (price.active) {
                console.log(`⏸️  Deactivating old price: ${price.id}`);
                await stripe.prices.update(price.id, { active: false });
            }
        }

        // Create new prices based on research recommendations
        console.log('\n💰 Creating new prices...\n');

        // Pro Plan: $29.99/month (monthly)
        const proMonthlyPrice = await stripe.prices.create({
            product: proProduct.id,
            unit_amount: 2999, // $29.99 in cents
            currency: 'usd',
            recurring: {
                interval: 'month',
            },
            nickname: 'Pro Monthly',
        });
        console.log(`✅ Created Pro Monthly: ${proMonthlyPrice.id} - $29.99/month`);

        // Pro Plan: $299/year (annual - effectively $24.99/month)
        const proAnnualPrice = await stripe.prices.create({
            product: proProduct.id,
            unit_amount: 29900, // $299.00 in cents
            currency: 'usd',
            recurring: {
                interval: 'year',
            },
            nickname: 'Pro Annual',
        });
        console.log(`✅ Created Pro Annual: ${proAnnualPrice.id} - $299/year ($24.99/month)`);

        // Business Plan: $59.99/month (monthly)
        const businessMonthlyPrice = await stripe.prices.create({
            product: businessProduct.id,
            unit_amount: 5999, // $59.99 in cents
            currency: 'usd',
            recurring: {
                interval: 'month',
            },
            nickname: 'Business Monthly',
        });
        console.log(`✅ Created Business Monthly: ${businessMonthlyPrice.id} - $59.99/month`);

        // Business Plan: $599/year (annual - effectively $49.99/month)
        const businessAnnualPrice = await stripe.prices.create({
            product: businessProduct.id,
            unit_amount: 59900, // $599.00 in cents
            currency: 'usd',
            recurring: {
                interval: 'year',
            },
            nickname: 'Business Annual',
        });
        console.log(`✅ Created Business Annual: ${businessAnnualPrice.id} - $599/year ($49.99/month)`);

        console.log('\n📋 Summary:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Pro Plan:');
        console.log(`  Monthly: ${proMonthlyPrice.id} - $29.99/month`);
        console.log(`  Annual:  ${proAnnualPrice.id} - $299/year ($24.99/month)`);
        console.log('\nBusiness Plan:');
        console.log(`  Monthly: ${businessMonthlyPrice.id} - $59.99/month`);
        console.log(`  Annual:  ${businessAnnualPrice.id} - $599/year ($49.99/month)`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('⚠️  IMPORTANT: Update your environment variables:');
        console.log(`   STRIPE_PRO_PRICE_ID=${proMonthlyPrice.id}`);
        console.log(`   STRIPE_BUSINESS_PRICE_ID=${businessMonthlyPrice.id}`);
        console.log('\n💡 You can also use annual prices by setting:');
        console.log(`   STRIPE_PRO_ANNUAL_PRICE_ID=${proAnnualPrice.id}`);
        console.log(`   STRIPE_BUSINESS_ANNUAL_PRICE_ID=${businessAnnualPrice.id}`);

    } catch (error) {
        console.error('❌ Error updating Stripe pricing:', error.message);
        if (error.type === 'StripeAuthenticationError') {
            console.error('   Make sure STRIPE_SECRET_KEY is set in your .env file');
        }
        process.exit(1);
    }
}

updateStripePricing();

