#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * Runs all authenticated tests in sequence and reports results
 */

import { spawn } from 'child_process';
import { performance } from 'perf_hooks';

const tests = [
    { name: 'Unit Tests', command: 'node', args: ['--test', 'tests/unit.test.mjs'] },
    { name: 'Backend E2E Tests (Auth)', command: 'node', args: ['--test', 'tests/backend-e2e-auth.test.mjs'] },
    { name: 'Performance Tests (Auth)', command: 'node', args: ['--test', 'tests/performance-auth.test.mjs'] },
    { name: 'Security Tests (Auth)', command: 'node', args: ['--test', 'tests/security-auth.test.mjs'] },
    { name: 'Playwright E2E Tests (Authenticated)', command: 'npx', args: ['playwright', 'test', 'tests/e2e/authenticated.spec.ts'] },
    { name: 'Playwright E2E Tests (Complete Features)', command: 'npx', args: ['playwright', 'test', 'tests/e2e/complete-features.spec.ts'] },
];

console.log('🧪 Running Comprehensive Authenticated Test Suite\n');
console.log('='.repeat(60));

const results = [];
const startTime = performance.now();

for (const test of tests) {
    console.log(`\n📋 Running: ${test.name}...`);
    console.log('-'.repeat(60));

    const testStartTime = performance.now();

    try {
        await new Promise((resolve, reject) => {
            const proc = spawn(test.command, test.args, {
                stdio: 'inherit',
                shell: true,
            });

            proc.on('close', (code) => {
                const duration = performance.now() - testStartTime;

                if (code === 0) {
                    console.log(`✅ ${test.name} passed (${(duration / 1000).toFixed(2)}s)`);
                    results.push({ name: test.name, passed: true, duration });
                    resolve();
                } else {
                    console.log(`❌ ${test.name} failed (${(duration / 1000).toFixed(2)}s)`);
                    results.push({ name: test.name, passed: false, duration });
                    resolve(); // Continue with other tests
                }
            });

            proc.on('error', (error) => {
                console.error(`❌ Error running ${test.name}:`, error);
                results.push({ name: test.name, passed: false, error: error.message });
                resolve();
            });
        });
    } catch (error) {
        console.error(`❌ ${test.name} failed:`, error);
        results.push({ name: test.name, passed: false, error: error.message });
    }
}

const endTime = performance.now();
const totalDuration = (endTime - startTime) / 1000;

console.log('\n' + '='.repeat(60));
console.log('📊 Test Results Summary');
console.log('='.repeat(60));

const passedTests = results.filter(r => r.passed).length;
const failedTests = results.filter(r => !r.passed).length;

for (const result of results) {
    const status = result.passed ? '✅' : '❌';
    const duration = result.duration ? `(${(result.duration / 1000).toFixed(2)}s)` : '';
    console.log(`${status} ${result.name} ${duration}`);
}

console.log('\n' + '='.repeat(60));
console.log(`Total: ${passedTests} passed, ${failedTests} failed`);
console.log(`Total Duration: ${totalDuration.toFixed(2)}s`);
console.log('='.repeat(60));

if (failedTests > 0) {
    process.exit(1);
}
