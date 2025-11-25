#!/usr/bin/env node

/**
 * Production Environment Diagnostic Tool
 * 
 * Checks for missing or misconfigured environment variables that could
 * cause 500 errors in production but not in local development.
 * 
 * Usage: node scripts/check-production-env.mjs
 */

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

// Load .env.local if it exists
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) {
    config({ path: envLocalPath });
    console.log('✅ Loaded .env.local\n');
} else {
    console.warn('⚠️  No .env.local found\n');
}

// Critical environment variables required for production
const REQUIRED_ENV_VARS = {
    // Supabase
    'NEXT_PUBLIC_SUPABASE_URL': 'Supabase project URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'Supabase anonymous key',
    'SUPABASE_SERVICE_ROLE_KEY': 'Supabase service role key (server-side)',
    
    // Database
    'DATABASE_URL': 'PostgreSQL database connection string',
    
    // OpenAI
    'OPENAI_API_KEY': 'OpenAI API key for GPT-4, DALL-E, Whisper',
    
    // Stripe
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': 'Stripe publishable key',
    'STRIPE_SECRET_KEY': 'Stripe secret key',
    'NEXT_PUBLIC_STRIPE_PRO_PRICE_ID': 'Stripe Pro plan price ID',
    'NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID': 'Stripe Business plan price ID',
    'STRIPE_WEBHOOK_SECRET': 'Stripe webhook signing secret',
    
    // App
    'NEXT_PUBLIC_URL': 'Application URL (for redirects, callbacks)',
};

console.log('═══════════════════════════════════════════════════════════');
console.log('🔍 PRODUCTION ENVIRONMENT DIAGNOSTIC');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('Checking critical environment variables...\n');

let missingVars = [];
let presentVars = [];
let warnings = [];

for (const [varName, description] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[varName];
    const isPresent = value && value.length > 0;
    
    if (isPresent) {
        presentVars.push(varName);
        // Show partial value for security
        const displayValue = value.substring(0, 10) + '...' + (value.length > 10 ? `(${value.length} chars)` : '');
        console.log(`✅ ${varName}`);
        console.log(`   ${description}`);
        console.log(`   Value: ${displayValue}\n`);
    } else {
        missingVars.push({ name: varName, description });
        console.log(`❌ ${varName}`);
        console.log(`   ${description}`);
        console.log(`   ⚠️  NOT SET\n`);
    }
}

// Additional checks
console.log('═══════════════════════════════════════════════════════════');
console.log('📋 ADDITIONAL CHECKS');
console.log('═══════════════════════════════════════════════════════════\n');

// Check DATABASE_URL format
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
    if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
        warnings.push('DATABASE_URL points to localhost - this will not work in production!');
        console.log('⚠️  DATABASE_URL appears to be localhost');
        console.log('   Production needs a remote database (e.g., Supabase connection string)\n');
    } else {
        console.log('✅ DATABASE_URL appears to be a remote connection\n');
    }
} else {
    console.log('❌ DATABASE_URL not set\n');
}

// Check NEXT_PUBLIC_URL
const appUrl = process.env.NEXT_PUBLIC_URL;
if (appUrl) {
    if (appUrl.includes('localhost')) {
        warnings.push('NEXT_PUBLIC_URL is set to localhost - update this for production!');
        console.log('⚠️  NEXT_PUBLIC_URL is set to localhost');
        console.log('   Should be: https://www.steadyletters.com (or your production URL)\n');
    } else if (appUrl.includes('vercel.app')) {
        console.log('✅ NEXT_PUBLIC_URL is set to Vercel URL\n');
    } else if (appUrl.includes('steadyletters.com')) {
        console.log('✅ NEXT_PUBLIC_URL is set to production domain\n');
    }
} else {
    console.log('❌ NEXT_PUBLIC_URL not set\n');
}

// Check Stripe keys match environment
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (stripeKey) {
    if (stripeKey.startsWith('sk_test_')) {
        console.log('⚠️  STRIPE_SECRET_KEY is a TEST key');
        console.log('   For production, use sk_live_ keys\n');
    } else if (stripeKey.startsWith('sk_live_')) {
        console.log('✅ STRIPE_SECRET_KEY is a LIVE key (production)\n');
    }
}

// Summary
console.log('═══════════════════════════════════════════════════════════');
console.log('📊 SUMMARY');
console.log('═══════════════════════════════════════════════════════════\n');

console.log(`✅ Present: ${presentVars.length}/${Object.keys(REQUIRED_ENV_VARS).length} variables`);
console.log(`❌ Missing: ${missingVars.length}/${Object.keys(REQUIRED_ENV_VARS).length} variables`);
console.log(`⚠️  Warnings: ${warnings.length}\n`);

if (missingVars.length > 0) {
    console.log('❌ MISSING ENVIRONMENT VARIABLES:\n');
    missingVars.forEach(({ name, description }) => {
        console.log(`   • ${name}`);
        console.log(`     ${description}\n`);
    });
}

if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    warnings.forEach(warning => {
        console.log(`   • ${warning}\n`);
    });
}

console.log('═══════════════════════════════════════════════════════════');
console.log('🔧 HOW TO FIX');
console.log('═══════════════════════════════════════════════════════════\n');

if (missingVars.length > 0) {
    console.log('To fix missing variables in Vercel:\n');
    console.log('1. Go to: https://vercel.com/isaiahduprees-projects/steadyletters/settings/environment-variables');
    console.log('2. Add each missing variable');
    console.log('3. Redeploy the application\n');
    console.log('OR use Vercel CLI:');
    console.log('   vercel env add <VARIABLE_NAME>\n');
}

if (warnings.length > 0) {
    console.log('To fix warnings:\n');
    console.log('1. Update environment variables in Vercel settings');
    console.log('2. Make sure production values are different from local');
    console.log('3. Redeploy after making changes\n');
}

console.log('═══════════════════════════════════════════════════════════');
console.log('🚨 COMMON CAUSES OF 500 ERRORS IN PRODUCTION');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('1. Missing OPENAI_API_KEY');
console.log('   → All OpenAI features will fail (letter gen, transcribe, image analysis)\n');

console.log('2. Missing STRIPE_SECRET_KEY');
console.log('   → Checkout will fail\n');

console.log('3. Wrong DATABASE_URL');
console.log('   → All database operations will fail\n');

console.log('4. Missing SUPABASE_SERVICE_ROLE_KEY');
console.log('   → Server-side Supabase operations will fail\n');

console.log('5. Wrong NEXT_PUBLIC_URL');
console.log('   → Stripe callbacks and redirects will fail\n');

// Exit with error if critical vars are missing
if (missingVars.length > 0) {
    console.log('❌ Exiting with error due to missing variables\n');
    process.exit(1);
} else {
    console.log('✅ All critical environment variables are set!\n');
    console.log('If you still see 500 errors in production:');
    console.log('  1. Check Vercel deployment logs');
    console.log('  2. Verify environment variables in Vercel dashboard');
    console.log('  3. Run production tests:');
    console.log('     npm run test:e2e:production\n');
    process.exit(0);
}
