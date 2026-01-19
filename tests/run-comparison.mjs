#!/usr/bin/env node

/**
 * Environment Comparison Test Runner
 * 
 * Runs tests against both local and production environments
 * and generates a comparison report
 */

import { spawn } from 'child_process';
import { performance } from 'perf_hooks';

const LOCAL_URL = process.env.LOCAL_URL || 'http://localhost:3000';
const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.steadyletters.com';

console.log('🔍 Environment Comparison Test Runner\n');
console.log('='.repeat(60));
console.log(`Local:      ${LOCAL_URL}`);
console.log(`Production: ${PRODUCTION_URL}`);
console.log('='.repeat(60));
console.log('');

// Check if local server is running
async function checkLocalServer() {
    try {
        const response = await fetch(LOCAL_URL);
        return response.ok || response.status === 404;
    } catch (error) {
        return false;
    }
}

// Check if production is accessible
async function checkProduction() {
    try {
        const response = await fetch(PRODUCTION_URL);
        return response.ok;
    } catch (error) {
        return false;
    }
}

async function runComparison() {
    const startTime = performance.now();

    // Check environments
    console.log('📡 Checking environments...');
    const localRunning = await checkLocalServer();
    const productionRunning = await checkProduction();

    if (!localRunning) {
        console.log('⚠️  Local server not running. Start with: npm run dev');
        console.log('   Continuing with production-only tests...\n');
    }

    if (!productionRunning) {
        console.log('❌ Production not accessible. Check your internet connection.\n');
        process.exit(1);
    }

    console.log('✅ Environments ready\n');

    // Run comparison tests
    console.log('🧪 Running comparison tests...\n');

    return new Promise((resolve, reject) => {
        const testProcess = spawn('npm', ['test', '--', 'tests/environment-comparison.test.mjs'], {
            stdio: 'inherit',
            shell: true,
            env: {
                ...process.env,
                LOCAL_URL,
                PRODUCTION_URL,
            },
        });

        testProcess.on('close', (code) => {
            const duration = ((performance.now() - startTime) / 1000).toFixed(2);
            console.log(`\n⏱️  Total time: ${duration}s`);
            
            if (code === 0) {
                console.log('\n✅ Comparison tests completed successfully!');
                resolve();
            } else {
                console.log('\n⚠️  Some tests failed. Review output above.');
                reject(new Error(`Tests exited with code ${code}`));
            }
        });

        testProcess.on('error', (error) => {
            console.error('❌ Error running tests:', error);
            reject(error);
        });
    });
}

runComparison().catch((error) => {
    console.error('❌ Comparison failed:', error);
    process.exit(1);
});


