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
    results.push(await testEndpoint('Auth Sync (Unauthenticated)', `${PRODUCTION_URL}/api/auth/sync-user`, {
        method: 'POST',
        expectStatus: 401,
    }));
    results.push(await testEndpoint('Billing Usage (Unauthenticated)', `${PRODUCTION_URL}/api/billing/usage`, {
        expectStatus: 401,
    }));
    results.push(await testEndpoint('Transcribe (Unauthenticated)', `${PRODUCTION_URL}/api/transcribe`, {
        method: 'POST',
        expectStatus: 401,
    }));
    results.push(await testEndpoint('Analyze Image (Unauthenticated)', `${PRODUCTION_URL}/api/analyze-image`, {
        method: 'POST',
        expectStatus: 401,
    }));
    results.push(await testEndpoint('Generate Letter (Unauthenticated)', `${PRODUCTION_URL}/api/generate/letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: 'test', tone: 'warm', occasion: 'general' }),
        expectStatus: 401,
    }));

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

