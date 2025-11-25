#!/usr/bin/env node

/**
 * Gather All Test Information
 * Collects comprehensive test data from deployed site
 * Supports authentication for testing protected endpoints
 */

const BASE_URL = process.env.PRODUCTION_URL || 'https://www.steadyletters.com';
const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jibnaxhixzbuizscucbs.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

let authCookies = {};

async function authenticate() {
    if (!EMAIL || !PASSWORD || !SUPABASE_KEY) {
        log('⚠️  No credentials provided - will test unauthenticated endpoints only', 'yellow');
        return null;
    }

    log('\n🔐 Authenticating...', 'blue');
    
    try {
        // Use Supabase signInWithPassword endpoint
        const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
            },
            body: JSON.stringify({
                email: EMAIL,
                password: PASSWORD,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMsg = errorText;
            try {
                const errorJson = JSON.parse(errorText);
                errorMsg = errorJson.message || errorJson.error_description || errorText;
            } catch {}
            log(`❌ Authentication failed: ${response.status} - ${errorMsg}`, 'red');
            log('💡 Note: Testing will continue without authentication', 'yellow');
            return null;
        }

        const data = await response.json();
        log('✅ Authentication successful', 'green');
        
        // Extract all cookies from response headers
        const setCookieHeaders = response.headers.getSetCookie?.() || [];
        for (const cookie of setCookieHeaders) {
            const [nameValue] = cookie.split(';');
            const [name, value] = nameValue.split('=');
            if (name && value) {
                authCookies[name.trim()] = value.trim();
            }
        }
        
        // Build cookie string for requests
        const cookieString = Object.entries(authCookies)
            .map(([name, value]) => `${name}=${value}`)
            .join('; ');
        
        log(`📝 Got ${Object.keys(authCookies).length} auth cookies`, 'gray');
        
        return { accessToken: data.access_token, cookies: cookieString };
    } catch (error) {
        log(`❌ Authentication error: ${error.message}`, 'red');
        log('💡 Note: Testing will continue without authentication', 'yellow');
        return null;
    }
}

async function testEndpoint(name, url, options = {}) {
    const startTime = Date.now();
    try {
        // Add auth cookies if available
        const headers = { ...options.headers };
        if (authCookies && Object.keys(authCookies).length > 0) {
            const cookieString = Object.entries(authCookies)
                .map(([name, value]) => `${name}=${value}`)
                .join('; ');
            headers['Cookie'] = cookieString;
        }
        
        const response = await fetch(url, {
            ...options,
            headers,
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
    log(`📍 Target: ${BASE_URL}`, 'gray');
    if (EMAIL) {
        log(`👤 Authenticating as: ${EMAIL}`, 'gray');
    }
    log('', 'gray');

    const allResults = {
        timestamp: new Date().toISOString(),
        baseUrl: BASE_URL,
        authenticated: false,
        tests: {},
    };

    // Authenticate if credentials provided
    const authResult = await authenticate();
    allResults.authenticated = !!authResult;

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

    // API Endpoints
    log('\nTesting API Endpoints...', 'yellow');
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
        { path: '/api/settings/run-tests', name: 'Settings Run Tests', method: 'POST', body: {} },
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
            201: allTests.filter(t => t.status === 201),
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
    log(`🔐 Authenticated: ${allResults.authenticated ? 'Yes' : 'No'}`, allResults.authenticated ? 'green' : 'yellow');
    log('============================================================', 'gray');

    log('\n📊 By Status Code:', 'blue');
    Object.entries(allResults.grouped.byStatus).forEach(([status, tests]) => {
        if (tests.length > 0) {
            log(`  ${status}: ${tests.length}`, 'gray');
        }
    });

    log(`\n💾 Full results saved to ${resultsFile}`, 'blue');
    
    if (failed > 0) {
        log(`\n🔍 Failed Tests:`, 'red');
        allResults.grouped.failed.forEach(test => {
            const statusInfo = test.status ? ` (${test.status})` : '';
            log(`  ❌ ${test.name}${statusInfo}: ${test.error?.message || 'Unknown error'}`, 'red');
        });
    }

    return allResults;
}

gatherAllTests().catch(console.error);
