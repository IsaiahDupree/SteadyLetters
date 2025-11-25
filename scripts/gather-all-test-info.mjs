#!/usr/bin/env node

/**
 * Gather All Test Information
 * Collects comprehensive test data from deployed site
 */

const BASE_URL = process.env.PRODUCTION_URL || 'https://www.steadyletters.com';

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
        const response = await fetch(url, {
            ...options,
            signal: AbortSignal.timeout(10000),
        });
        const duration = Date.now() - startTime;
        
        let data;
        try {
            data = await response.json();
        } catch {
            data = { error: 'No JSON response', statusText: response.statusText };
        }
        
        return {
            name,
            url,
            method: options.method || 'GET',
            success: response.ok,
            status: response.status,
            statusText: response.statusText,
            duration,
            headers: Object.fromEntries(response.headers.entries()),
            data: response.ok ? data : null,
            error: response.ok ? null : {
                message: data.error || 'Unknown error',
                status: response.status,
                statusText: response.statusText,
            },
        };
    } catch (error) {
        const duration = Date.now() - startTime;
        return {
            name,
            url,
            method: options.method || 'GET',
            success: false,
            duration,
            error: {
                message: error.message || 'Request failed',
                type: error.name,
            },
        };
    }
}

async function gatherAllTests() {
    log('📊 Gathering All Test Information', 'blue');
    log(`📍 Target: ${BASE_URL}\n`, 'gray');

    const allResults = {
        timestamp: new Date().toISOString(),
        baseUrl: BASE_URL,
        tests: {},
    };

    // Public Pages
    log('Testing Public Pages...', 'yellow');
    const publicPages = [
        { path: '/', name: 'Homepage' },
        { path: '/pricing', name: 'Pricing' },
        { path: '/login', name: 'Login' },
        { path: '/signup', name: 'Signup' },
    ];

    allResults.tests.publicPages = [];
    for (const page of publicPages) {
        allResults.tests.publicPages.push(await testEndpoint(page.name, `${BASE_URL}${page.path}`));
    }

    // API Endpoints (Unauthenticated)
    log('\nTesting API Endpoints (Unauthenticated)...', 'yellow');
    const apiEndpoints = [
        { path: '/api/health', name: 'Health Check', method: 'GET' },
        { path: '/api/handwriting-styles', name: 'Handwriting Styles', method: 'GET' },
        { path: '/api/auth/sync-user', name: 'Auth Sync User', method: 'POST' },
        { path: '/api/billing/usage', name: 'Billing Usage', method: 'GET' },
        { path: '/api/orders', name: 'Orders GET', method: 'GET' },
        { path: '/api/orders', name: 'Orders POST', method: 'POST', body: {} },
        { path: '/api/thanks-io/products', name: 'Thanks.io Products', method: 'GET' },
        { path: '/api/thanks-io/styles', name: 'Thanks.io Styles', method: 'GET' },
        { path: '/api/thanks-io/send', name: 'Thanks.io Send', method: 'POST', body: { productType: 'postcard', recipients: [], message: 'test' } },
        { path: '/api/transcribe', name: 'Transcribe', method: 'POST' },
        { path: '/api/analyze-image', name: 'Analyze Image', method: 'POST' },
        { path: '/api/generate/letter', name: 'Generate Letter', method: 'POST', body: { context: 'test', tone: 'warm', occasion: 'general' } },
        { path: '/api/generate/card-image', name: 'Generate Card Image', method: 'POST', body: { tone: 'warm', occasion: 'general' } },
        { path: '/api/generate/images', name: 'Generate Images', method: 'POST', body: { occasion: 'general', tone: 'warm' } },
        { path: '/api/extract-address', name: 'Extract Address', method: 'POST' },
        { path: '/api/stripe/checkout', name: 'Stripe Checkout', method: 'POST', body: { priceId: 'test' } },
        { path: '/api/stripe/portal', name: 'Stripe Portal', method: 'GET' },
        { path: '/api/post-deploy', name: 'Post-Deploy', method: 'POST', body: {} },
    ];

    allResults.tests.apiEndpoints = [];
    for (const endpoint of apiEndpoints) {
        const options = {
            method: endpoint.method,
            headers: { 'Content-Type': 'application/json' },
        };
        
        if (endpoint.body) {
            options.body = JSON.stringify(endpoint.body);
        }

        allResults.tests.apiEndpoints.push(await testEndpoint(endpoint.name, `${BASE_URL}${endpoint.path}`, options));
    }

    // Summary
    const allTests = [
        ...allResults.tests.publicPages,
        ...allResults.tests.apiEndpoints,
    ];

    const passed = allTests.filter(t => t.success).length;
    const failed = allTests.filter(t => !t.success).length;
    const total = allTests.length;

    allResults.summary = { total, passed, failed };

    // Group by status
    allResults.grouped = {
        passed: allTests.filter(t => t.success),
        failed: allTests.filter(t => !t.success),
        byStatus: {
            200: allTests.filter(t => t.status === 200),
            400: allTests.filter(t => t.status === 400),
            401: allTests.filter(t => t.status === 401),
            404: allTests.filter(t => t.status === 404),
            405: allTests.filter(t => t.status === 405),
            500: allTests.filter(t => t.status === 500),
        },
    };

    // Save results
    const fs = await import('fs');
    const resultsFile = 'all-test-results.json';
    fs.writeFileSync(resultsFile, JSON.stringify(allResults, null, 2));

    // Print summary
    log('\n============================================================', 'gray');
    log('📊 Test Results Summary', 'blue');
    log('============================================================', 'gray');
    log(`Total: ${total}`, 'gray');
    log(`✅ Passed: ${passed}`, 'green');
    log(`❌ Failed: ${failed}`, 'red');
    log('============================================================', 'gray');

    log('\n📊 By Status Code:', 'blue');
    Object.entries(allResults.grouped.byStatus).forEach(([status, tests]) => {
        if (tests.length > 0) {
            log(`  ${status}: ${tests.length}`, 'gray');
        }
    });

    log(`\n💾 Full results saved to ${resultsFile}`, 'blue');
    log(`\n🔍 Failed Tests:`, 'red');
    allResults.grouped.failed.forEach(test => {
        log(`  ❌ ${test.name} (${test.status || 'ERROR'}): ${test.error?.message || 'Unknown error'}`, 'red');
    });

    return allResults;
}

gatherAllTests().catch(console.error);

