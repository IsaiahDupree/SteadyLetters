import { NextRequest, NextResponse } from 'next/server';

const PRODUCTION_URL = process.env.NEXT_PUBLIC_URL || 'https://www.steadyletters.com';

async function testEndpoint(name: string, url: string, options: RequestInit = {}) {
    const startTime = Date.now();
    try {
        const response = await fetch(url, {
            ...options,
            signal: AbortSignal.timeout(10000),
        });
        const duration = Date.now() - startTime;
        const isSuccess = response.ok || 
                         (options.headers && (response.status === 401 || response.status === 400));
        
        return {
            name,
            success: isSuccess,
            status: response.status,
            duration,
            error: isSuccess ? null : `Status ${response.status}`,
        };
    } catch (error: any) {
        const duration = Date.now() - startTime;
        return {
            name,
            success: false,
            duration,
            error: error.message || 'Request failed',
        };
    }
}

export async function POST(request: NextRequest) {
    const results = [];
    const startTime = Date.now();

    try {
        // Test critical endpoints
        results.push(await testEndpoint('Health Check', `${PRODUCTION_URL}/api/health`));
        results.push(await testEndpoint('Homepage', `${PRODUCTION_URL}/`));
        results.push(await testEndpoint('Pricing Page', `${PRODUCTION_URL}/pricing`));
        
        // Test authenticated endpoints (should return 401)
        results.push(await testEndpoint('Billing Usage (Auth Required)', `${PRODUCTION_URL}/api/billing/usage`, {
            headers: {},
        }));
        results.push(await testEndpoint('Generate Letter (Auth Required)', `${PRODUCTION_URL}/api/generate/letter`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ context: 'test', tone: 'warm', occasion: 'general' }),
        }));

        const duration = Date.now() - startTime;
        const passed = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        const total = results.length;

        const summary = {
            timestamp: new Date().toISOString(),
            deployment: PRODUCTION_URL,
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
        return NextResponse.json(summary, { 
            status: failed === 0 ? 200 : 207 // 207 = Multi-Status (some failed)
        });

    } catch (error: any) {
        console.error('Post-deploy test error:', error);
        return NextResponse.json({
            error: error.message,
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}


