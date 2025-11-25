#!/usr/bin/env node

/**
 * Test with Authentication
 * Tests all endpoints with authenticated user credentials
 */

const BASE_URL = process.env.PRODUCTION_URL || 'https://www.steadyletters.com';
const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

if (!EMAIL || !PASSWORD) {
    console.error('❌ Missing credentials. Set TEST_EMAIL and TEST_PASSWORD environment variables.');
    process.exit(1);
}

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

async function signIn() {
    log('\n🔐 Signing in...', 'blue');
    
    try {
        const response = await fetch(`${BASE_URL}/api/auth/sync-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: EMAIL,
                password: PASSWORD,
            }),
        });

        // Try Supabase auth endpoint
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jibnaxhixzbuizscucbs.supabase.co';
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
            },
            body: JSON.stringify({
                email: EMAIL,
                password: PASSWORD,
            }),
        });

        if (authResponse.ok) {
            const authData = await authResponse.json();
            return authData.access_token;
        }

        throw new Error('Failed to authenticate');
    } catch (error) {
        log(`❌ Authentication failed: ${error.message}`, 'red');
        log('Note: You may need to sign in manually and copy the session cookie', 'yellow');
        return null;
    }
}

async function testEndpoint(name, url, options = {}) {
    const startTime = Date.now();
    try {
        const response = await fetch(url, {
            ...options,
            signal: AbortSignal.timeout(10000),
        });
        const duration = Date.now() - startTime;
        const data = await response.json().catch(() => ({ error: 'No JSON response' }));
        
        return {
            name,
            success: response.ok,
            status: response.status,
            duration,
            data: response.ok ? data : null,
            error: response.ok ? null : `Status ${response.status}: ${data.error || 'Unknown error'}`,
        };
    } catch (error) {
        const duration = Date.now() - startTime;
        return {
            name,
            success: false,
            duration,
            error: error.message || 'Request failed',
        };
    }
}

async function runTestsWithAuth(token) {
    log('\n🧪 Running Authenticated Tests', 'blue');
    
    const headers = token ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    } : {};

    const results = [];

    // Test authenticated endpoints
    const endpoints = [
        { name: 'Billing Usage', method: 'GET', path: '/api/billing/usage' },
        { name: 'Orders GET', method: 'GET', path: '/api/orders' },
        { name: 'Thanks.io Products', method: 'GET', path: '/api/thanks-io/products' },
        { name: 'Thanks.io Styles', method: 'GET', path: '/api/thanks-io/styles' },
        { name: 'Generate Letter', method: 'POST', path: '/api/generate/letter', body: { context: 'test', tone: 'warm', occasion: 'general' } },
        { name: 'Transcribe', method: 'POST', path: '/api/transcribe' },
        { name: 'Analyze Image', method: 'POST', path: '/api/analyze-image' },
    ];

    for (const endpoint of endpoints) {
        const options = {
            method: endpoint.method,
            headers,
        };
        
        if (endpoint.body) {
            options.body = JSON.stringify(endpoint.body);
        }

        results.push(await testEndpoint(endpoint.name, `${BASE_URL}${endpoint.path}`, options));
    }

    return results;
}

async function main() {
    log('🚀 Authenticated Test Runner', 'blue');
    log(`📍 Target: ${BASE_URL}\n`, 'gray');

    const token = await signIn();
    
    if (!token) {
        log('\n⚠️  Continuing without authentication token...', 'yellow');
        log('Some tests may fail with 401 errors.\n', 'yellow');
    }

    const results = await runTestsWithAuth(token);

    // Summary
    log('\n============================================================', 'gray');
    log('📊 Test Results Summary', 'blue');
    log('============================================================', 'gray');
    
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const total = results.length;

    log(`Total: ${total}`, 'gray');
    log(`✅ Passed: ${passed}`, 'green');
    log(`❌ Failed: ${failed}`, 'red');
    log('============================================================\n', 'gray');

    // Detailed results
    results.forEach(result => {
        if (result.success) {
            log(`✅ ${result.name}`, 'green');
            log(`   Duration: ${result.duration}ms`, 'gray');
            if (result.data) {
                log(`   Response: ${JSON.stringify(result.data).substring(0, 100)}...`, 'gray');
            }
        } else {
            log(`❌ ${result.name}`, 'red');
            log(`   Error: ${result.error}`, 'red');
            log(`   Duration: ${result.duration}ms`, 'gray');
        }
    });

    // Save results to file
    const fs = await import('fs');
    const resultsFile = 'test-results-auth.json';
    fs.writeFileSync(resultsFile, JSON.stringify({
        timestamp: new Date().toISOString(),
        baseUrl: BASE_URL,
        authenticated: !!token,
        summary: { total, passed, failed },
        results,
    }, null, 2));
    
    log(`\n💾 Results saved to ${resultsFile}`, 'blue');
}

main().catch(console.error);

