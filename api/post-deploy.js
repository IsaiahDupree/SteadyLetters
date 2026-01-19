/**
 * Vercel Serverless Function for Post-Deploy Hook
 * This runs automatically after each deployment
 * 
 * To set up:
 * 1. Go to Vercel Dashboard → Your Project → Settings → Git
 * 2. Add a webhook URL pointing to this function
 * OR
 * 3. Use Vercel CLI: vercel env add POST_DEPLOY_WEBHOOK_URL
 */

const https = require('https');
const http = require('http');

const PRODUCTION_URL = process.env.NEXT_PUBLIC_URL || 'https://www.steadyletters.com';

async function runTest(name, url, options = {}) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;
        
        const req = client.request(url, {
            method: options.method || 'GET',
            headers: options.headers || {},
            timeout: 10000,
        }, (res) => {
            const duration = Date.now() - startTime;
            const isSuccess = res.statusCode === 200 || 
                             (options.expectStatus && res.statusCode === options.expectStatus);
            
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    name,
                    success: isSuccess,
                    status: res.statusCode,
                    duration,
                    error: isSuccess ? null : `Status ${res.statusCode}`,
                });
            });
        });
        
        req.on('error', (error) => {
            const duration = Date.now() - startTime;
            resolve({
                name,
                success: false,
                duration,
                error: error.message,
            });
        });
        
        req.on('timeout', () => {
            req.destroy();
            resolve({
                name,
                success: false,
                duration: Date.now() - startTime,
                error: 'Request timeout',
            });
        });
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

module.exports = async (req, res) => {
    // Only allow POST requests (from Vercel webhook)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const results = [];
    const startTime = Date.now();

    try {
        // Test critical endpoints
        results.push(await runTest('Health Check', `${PRODUCTION_URL}/api/health`));
        results.push(await runTest('Homepage', `${PRODUCTION_URL}/`));
        results.push(await runTest('Pricing Page', `${PRODUCTION_URL}/pricing`));
        
        // Test authenticated endpoints (should return 401)
        results.push(await runTest('Billing Usage (Auth Required)', `${PRODUCTION_URL}/api/billing/usage`, {
            expectStatus: 401,
        }));
        results.push(await runTest('Generate Letter (Auth Required)', `${PRODUCTION_URL}/api/generate/letter`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ context: 'test', tone: 'warm', occasion: 'general' }),
            expectStatus: 401,
        }));

        const duration = Date.now() - startTime;
        const passed = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        const total = results.length;

        const summary = {
            timestamp: new Date().toISOString(),
            deployment: req.body?.deployment?.url || PRODUCTION_URL,
            environment: process.env.VERCEL_ENV || 'production',
            duration: `${duration}ms`,
            total,
            passed,
            failed,
            results,
        };

        // Log results
        console.log('Post-Deploy Test Results:', JSON.stringify(summary, null, 2));

        // Return results
        res.status(failed === 0 ? 200 : 207).json(summary); // 207 = Multi-Status (some failed)

    } catch (error) {
        console.error('Post-deploy test error:', error);
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
};


