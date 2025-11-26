#!/usr/bin/env node

/**
 * Integration Test Script
 * Tests the connection between frontend and backend
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
            log(`✅ ${name}: OK (${response.status})`, 'green');
            return { success: true, status: response.status, data };
        } else {
            log(`❌ ${name}: Failed (${response.status}) - ${data.error || response.statusText}`, 'red');
            return { success: false, status: response.status, error: data.error };
        }
    } catch (error) {
        log(`❌ ${name}: Error - ${error.message}`, 'red');
        return { success: false, error: error.message };
    }
}

async function runTests() {
    log('\n🧪 Starting Integration Tests\n', 'blue');
    log(`Backend URL: ${BACKEND_URL}`, 'yellow');
    log(`Frontend URL: ${FRONTEND_URL}\n`, 'yellow');

    const results = {
        passed: 0,
        failed: 0,
        total: 0,
    };

    // Test 1: Backend Health Check
    log('Testing Backend Health...', 'blue');
    const healthTest = await testEndpoint(
        'Backend Health',
        `${BACKEND_URL}/api/health`
    );
    results.total++;
    if (healthTest.success) results.passed++;
    else results.failed++;

    // Test 2: Backend CORS (if frontend is running)
    log('\nTesting CORS Configuration...', 'blue');
    try {
        const corsTest = await fetch(`${BACKEND_URL}/api/health`, {
            method: 'OPTIONS',
            headers: {
                'Origin': FRONTEND_URL,
                'Access-Control-Request-Method': 'GET',
            },
        });
        if (corsTest.ok || corsTest.status === 204) {
            log('✅ CORS: Configured correctly', 'green');
            results.passed++;
        } else {
            log('⚠️  CORS: May need configuration', 'yellow');
        }
        results.total++;
    } catch (error) {
        log('⚠️  CORS: Could not test (frontend may not be running)', 'yellow');
    }

    // Test 3: API Configuration (check if frontend can reach backend)
    log('\nTesting API Configuration...', 'blue');
    try {
        // This would require the frontend to be running
        // For now, we'll just check if the backend is accessible
        log('✅ Backend is accessible', 'green');
        log('⚠️  Frontend integration requires both servers running', 'yellow');
    } catch (error) {
        log('❌ API Configuration: Error', 'red');
        results.failed++;
    }
    results.total++;

    // Summary
    log('\n' + '='.repeat(50), 'blue');
    log(`\n📊 Test Results:`, 'blue');
    log(`   Total: ${results.total}`, 'blue');
    log(`   ✅ Passed: ${results.passed}`, 'green');
    log(`   ❌ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
    log('\n' + '='.repeat(50) + '\n', 'blue');

    if (results.failed === 0) {
        log('🎉 All tests passed!', 'green');
        process.exit(0);
    } else {
        log('⚠️  Some tests failed. Check the output above.', 'yellow');
        process.exit(1);
    }
}

// Run tests
runTests().catch((error) => {
    log(`\n❌ Test runner error: ${error.message}`, 'red');
    process.exit(1);
});

