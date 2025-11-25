#!/usr/bin/env node

/**
 * Post-Deploy Test Runner
 * 
 * This script runs comprehensive tests against the production deployment
 * after it's been deployed. It can be called from Vercel's post-deploy hook
 * or run manually.
 * 
 * Usage:
 *   node scripts/post-deploy-tests.mjs
 *   PRODUCTION_URL=https://www.steadyletters.com node scripts/post-deploy-tests.mjs
 */

const PRODUCTION_URL = process.env.PRODUCTION_URL || process.env.NEXT_PUBLIC_URL || 'https://www.steadyletters.com';

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    gray: '\x1b[90m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, url, options = {}) {
    const startTime = Date.now();
    try {
        const response = await fetch(url, options);
        const duration = Date.now() - startTime;
        const isSuccess = response.ok || (options.expectStatus && response.status === options.expectStatus);
        
        return {
            name,
            success: isSuccess,
            status: response.status,
            duration,
            error: isSuccess ? null : `Status ${response.status}`,
        };
    } catch (error) {
        const duration = Date.now() - startTime;
        return {
            name,
            success: false,
            duration,
            error: error.message,
        };
    }
}

async function runTests() {
    log('\n🧪 Running Post-Deploy Tests', 'blue');
    log(`📍 Target: ${PRODUCTION_URL}\n`, 'gray');

    const results = [];

    // Public Pages
    log('Testing Public Pages...', 'yellow');
    results.push(await testEndpoint('Homepage', `${PRODUCTION_URL}/`));
    results.push(await testEndpoint('Pricing Page', `${PRODUCTION_URL}/pricing`));
    results.push(await testEndpoint('Login Page', `${PRODUCTION_URL}/login`));
    results.push(await testEndpoint('Signup Page', `${PRODUCTION_URL}/signup`));

    // API Endpoints
    log('\nTesting API Endpoints...', 'yellow');
    results.push(await testEndpoint('Health Check', `${PRODUCTION_URL}/api/health`));
    results.push(await testEndpoint('Handwriting Styles (Public)', `${PRODUCTION_URL}/api/handwriting-styles`));
    
    // Authenticated endpoints (should return 401)
    const authEndpoints = [
        { name: 'Auth Sync', path: '/api/auth/sync-user', method: 'POST' },
        { name: 'Billing Usage', path: '/api/billing/usage', method: 'GET' },
        { name: 'Transcribe', path: '/api/transcribe', method: 'POST' },
        { name: 'Analyze Image', path: '/api/analyze-image', method: 'POST' },
        { name: 'Generate Letter', path: '/api/generate/letter', method: 'POST', body: { context: 'test', tone: 'warm', occasion: 'general' } },
        { name: 'Generate Card Image', path: '/api/generate/card-image', method: 'POST', body: { tone: 'warm', occasion: 'general' } },
        { name: 'Generate Images', path: '/api/generate/images', method: 'POST', body: { occasion: 'general', tone: 'warm' } },
        { name: 'Extract Address', path: '/api/extract-address', method: 'POST' },
        { name: 'Orders GET', path: '/api/orders', method: 'GET' },
        { name: 'Orders POST', path: '/api/orders', method: 'POST', body: {} },
        { name: 'Thanks.io Products', path: '/api/thanks-io/products', method: 'GET' },
        { name: 'Thanks.io Styles', path: '/api/thanks-io/styles', method: 'GET' },
        { name: 'Thanks.io Send', path: '/api/thanks-io/send', method: 'POST', body: { productType: 'postcard', recipients: [], message: 'test' } },
        { name: 'Stripe Checkout', path: '/api/stripe/checkout', method: 'POST', body: { priceId: 'test' } },
        { name: 'Stripe Portal', path: '/api/stripe/portal', method: 'GET' },
    ];

    for (const endpoint of authEndpoints) {
        const options = {
            method: endpoint.method,
            expectStatus: 401,
        };
        
        if (endpoint.body) {
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify(endpoint.body);
        }
        
        results.push(await testEndpoint(`${endpoint.name} (Unauthenticated)`, `${PRODUCTION_URL}${endpoint.path}`, options));
    }

    // Summary
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const total = results.length;

    log('\n' + '='.repeat(60), 'gray');
    log('📊 Test Results Summary', 'blue');
    log('='.repeat(60), 'gray');
    log(`Total: ${total}`, 'gray');
    log(`✅ Passed: ${passed}`, 'green');
    log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'gray');
    log('='.repeat(60) + '\n', 'gray');

    // Detailed Results
    results.forEach(result => {
        const icon = result.success ? '✅' : '❌';
        const color = result.success ? 'green' : 'red';
        log(`${icon} ${result.name}`, color);
        if (result.error) {
            log(`   Error: ${result.error}`, 'red');
        }
        log(`   Duration: ${result.duration}ms`, 'gray');
    });

    log('\n' + '='.repeat(60), 'gray');
    
    if (failed === 0) {
        log('🎉 All tests passed!', 'green');
        process.exit(0);
    } else {
        log(`⚠️  ${failed} test(s) failed. Check the details above.`, 'red');
        process.exit(1);
    }
}

// Run tests
runTests().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
});

