#!/usr/bin/env node

/**
 * API Key Validation Script
 * 
 * Tests that API keys are valid by making actual API calls.
 * This catches expired or incorrect keys.
 */

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

// Load .env.local
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) {
    config({ path: envLocalPath });
}

console.log('═══════════════════════════════════════════════════════════');
console.log('🔑 API KEY VALIDATION');
console.log('═══════════════════════════════════════════════════════════\n');

let hasErrors = false;

// Test OpenAI API Key
async function testOpenAIKey() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
        console.log('❌ OPENAI_API_KEY not set\n');
        hasErrors = true;
        return;
    }

    console.log('Testing OpenAI API key...');
    
    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        if (response.ok) {
            console.log('✅ OpenAI API key is VALID\n');
        } else {
            const error = await response.json();
            console.error('❌ OpenAI API key is INVALID');
            console.error('Status:', response.status);
            console.error('Error:', error.error?.message || 'Unknown error');
            console.error('\nYour API key is either:');
            console.error('  - Expired');
            console.error('  - Revoked');
            console.error('  - Incorrect');
            console.error('\nGet a new key at: https://platform.openai.com/api-keys\n');
            hasErrors = true;
        }
    } catch (error) {
        console.error('❌ Failed to test OpenAI key:', error.message, '\n');
        hasErrors = true;
    }
}

// Test Stripe API Key
async function testStripeKey() {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    
    if (!apiKey) {
        console.log('❌ STRIPE_SECRET_KEY not set\n');
        hasErrors = true;
        return;
    }

    console.log('Testing Stripe API key...');
    
    try {
        const response = await fetch('https://api.stripe.com/v1/balance', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        if (response.ok) {
            const data = await response.json();
            const isLive = apiKey.startsWith('sk_live');
            console.log(`✅ Stripe API key is VALID (${isLive ? 'LIVE' : 'TEST'} mode)\n`);
        } else {
            const error = await response.json();
            console.error('❌ Stripe API key is INVALID');
            console.error('Status:', response.status);
            console.error('Error:', error.error?.message || 'Unknown error');
            console.error('\nGet your key at: https://dashboard.stripe.com/apikeys\n');
            hasErrors = true;
        }
    } catch (error) {
        console.error('❌ Failed to test Stripe key:', error.message, '\n');
        hasErrors = true;
    }
}

// Run all tests
async function main() {
    await testOpenAIKey();
    await testStripeKey();

    console.log('═══════════════════════════════════════════════════════════');
    
    if (hasErrors) {
        console.log('❌ API KEY VALIDATION FAILED');
        console.log('═══════════════════════════════════════════════════════════\n');
        console.log('Fix instructions:\n');
        console.log('1. Get new API keys:');
        console.log('   - OpenAI: https://platform.openai.com/api-keys');
        console.log('   - Stripe: https://dashboard.stripe.com/apikeys\n');
        console.log('2. Update .env.local with new keys');
        console.log('3. Restart dev server: npm run dev');
        console.log('4. Re-run validation: npm run validate:keys\n');
        process.exit(1);
    } else {
        console.log('✅ ALL API KEYS ARE VALID');
        console.log('═══════════════════════════════════════════════════════════\n');
        process.exit(0);
    }
}

main();
