import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TestResult {
    name: string;
    status: 'pass' | 'fail' | 'running' | 'pending';
    duration?: number;
    error?: string;
    details?: any;
    logs?: string[];
}

interface TestSuite {
    name: string;
    tests: TestResult[];
    status: 'pass' | 'fail' | 'running' | 'pending';
}

// Use backend URL for API tests, fallback to frontend URL for page tests
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://steadylettersbackend.vercel.app';
const FRONTEND_URL = process.env.NEXT_PUBLIC_URL || 'https://www.steadyletters.com';

async function runTest(
    name: string,
    testFn: () => Promise<{ success: boolean; error?: string; details?: any; logs?: string[] }>
): Promise<TestResult> {
    const startTime = Date.now();
    try {
        const result = await testFn();
        const duration = Date.now() - startTime;
        return {
            name,
            status: result.success ? 'pass' : 'fail',
            duration,
            error: result.error,
            details: result.details,
            logs: result.logs,
        };
    } catch (error: any) {
        const duration = Date.now() - startTime;
        return {
            name,
            status: 'fail',
            duration,
            error: error.message || 'Test failed',
            details: { stack: error.stack },
        };
    }
}

export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const user = await getAuthenticatedUser(request);
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const suites: TestSuite[] = [];

        // ============================================
        // API Endpoints Tests
        // ============================================
        const apiTests: TestResult[] = [];

        // Test: Health Check
        apiTests.push(await runTest('Health Check Endpoint', async () => {
            const response = await fetch(`${BACKEND_URL}/api/health`);
            const data = await response.json();
            return {
                success: response.ok,
                details: { status: response.status, data },
                logs: [`Status: ${response.status}`, `Response: ${JSON.stringify(data)}`],
            };
        }));

        // Test: Auth Sync User
        apiTests.push(await runTest('Auth Sync User', async () => {
            const response = await fetch(`${BACKEND_URL}/api/auth/sync-user`, {
                method: 'POST',
                headers: {
                    'Cookie': request.headers.get('cookie') || '',
                },
            });
            const data = await response.json();
            return {
                success: response.ok || response.status === 401, // 401 is expected if not authenticated
                error: response.ok ? undefined : `Status ${response.status}: ${data.error || 'Unknown error'}`,
                details: { status: response.status, data },
                logs: [`Status: ${response.status}`, `Response: ${JSON.stringify(data)}`],
            };
        }));

        // Test: Billing Usage
        apiTests.push(await runTest('Billing Usage Endpoint', async () => {
            const response = await fetch(`${BACKEND_URL}/api/billing/usage`, {
                headers: {
                    'Cookie': request.headers.get('cookie') || '',
                },
            });
            const data = await response.json();
            return {
                success: response.ok || response.status === 401,
                error: response.ok ? undefined : `Status ${response.status}: ${data.error || 'Unknown error'}`,
                details: { status: response.status },
                logs: [`Status: ${response.status}`],
            };
        }));

        // Test: Transcribe (with auth)
        apiTests.push(await runTest('Transcribe Endpoint (Auth Required)', async () => {
            const response = await fetch(`${BACKEND_URL}/api/transcribe`, {
                method: 'POST',
                headers: {
                    'Cookie': request.headers.get('cookie') || '',
                },
            });
            const data = await response.json();
            // 401 is expected if not authenticated, 400 is expected if no file
            const isExpected = response.status === 401 || response.status === 400;
            return {
                success: isExpected || response.ok,
                error: isExpected ? undefined : `Status ${response.status}: ${data.error || 'Unexpected error'}`,
                details: { status: response.status, expected: isExpected },
                logs: [`Status: ${response.status}`, `Expected: ${isExpected ? 'Yes (401/400)' : 'No'}`],
            };
        }));

        // Test: Analyze Image (with auth)
        apiTests.push(await runTest('Analyze Image Endpoint (Auth Required)', async () => {
            const response = await fetch(`${BACKEND_URL}/api/analyze-image`, {
                method: 'POST',
                headers: {
                    'Cookie': request.headers.get('cookie') || '',
                },
            });
            const data = await response.json();
            const isExpected = response.status === 401 || response.status === 400;
            return {
                success: isExpected || response.ok,
                error: isExpected ? undefined : `Status ${response.status}: ${data.error || 'Unexpected error'}`,
                details: { status: response.status, expected: isExpected },
                logs: [`Status: ${response.status}`, `Expected: ${isExpected ? 'Yes (401/400)' : 'No'}`],
            };
        }));

        // Test: Generate Letter (with auth)
        apiTests.push(await runTest('Generate Letter Endpoint (Auth Required)', async () => {
            const response = await fetch(`${BACKEND_URL}/api/generate/letter`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': request.headers.get('cookie') || '',
                },
                body: JSON.stringify({
                    context: 'Test context',
                    tone: 'warm',
                    occasion: 'general',
                }),
            });
            const data = await response.json();
            const isExpected = response.status === 401 || response.status === 400;
            return {
                success: isExpected || response.ok,
                error: isExpected ? undefined : `Status ${response.status}: ${data.error || 'Unexpected error'}`,
                details: { status: response.status, expected: isExpected },
                logs: [`Status: ${response.status}`, `Expected: ${isExpected ? 'Yes (401/400)' : 'No'}`],
            };
        }));

        // Test: Generate Card Image (with auth)
        apiTests.push(await runTest('Generate Card Image Endpoint (Auth Required)', async () => {
            const response = await fetch(`${BACKEND_URL}/api/generate/card-image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': request.headers.get('cookie') || '',
                },
                body: JSON.stringify({
                    tone: 'warm',
                    occasion: 'general',
                }),
            });
            const data = await response.json();
            const isExpected = response.status === 401 || response.status === 400;
            return {
                success: isExpected || response.ok,
                error: isExpected ? undefined : `Status ${response.status}: ${data.error || 'Unexpected error'}`,
                details: { status: response.status, expected: isExpected },
                logs: [`Status: ${response.status}`, `Expected: ${isExpected ? 'Yes (401/400)' : 'No'}`],
            };
        }));

        // Test: Generate Images (with auth)
        apiTests.push(await runTest('Generate Images Endpoint (Auth Required)', async () => {
            const response = await fetch(`${BACKEND_URL}/api/generate/images`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': request.headers.get('cookie') || '',
                },
                body: JSON.stringify({
                    occasion: 'general',
                    tone: 'warm',
                }),
            });
            const data = await response.json();
            const isExpected = response.status === 401 || response.status === 400;
            return {
                success: isExpected || response.ok,
                error: isExpected ? undefined : `Status ${response.status}: ${data.error || 'Unexpected error'}`,
                details: { status: response.status, expected: isExpected },
                logs: [`Status: ${response.status}`, `Expected: ${isExpected ? 'Yes (401/400)' : 'No'}`],
            };
        }));

        // Test: Extract Address (with auth)
        apiTests.push(await runTest('Extract Address Endpoint (Auth Required)', async () => {
            const response = await fetch(`${BACKEND_URL}/api/extract-address`, {
                method: 'POST',
                headers: {
                    'Cookie': request.headers.get('cookie') || '',
                },
            });
            const data = await response.json();
            const isExpected = response.status === 401 || response.status === 400;
            return {
                success: isExpected || response.ok,
                error: isExpected ? undefined : `Status ${response.status}: ${data.error || 'Unexpected error'}`,
                details: { status: response.status, expected: isExpected },
                logs: [`Status: ${response.status}`, `Expected: ${isExpected ? 'Yes (401/400)' : 'No'}`],
            };
        }));

        // Test: Orders GET (with auth)
        apiTests.push(await runTest('Orders GET Endpoint (Auth Required)', async () => {
            const response = await fetch(`${BACKEND_URL}/api/orders`, {
                headers: {
                    'Cookie': request.headers.get('cookie') || '',
                },
            });
            const data = await response.json();
            const isExpected = response.status === 401 || response.ok;
            return {
                success: isExpected,
                error: isExpected ? undefined : `Status ${response.status}: ${data.error || 'Unexpected error'}`,
                details: { status: response.status, expected: isExpected },
                logs: [`Status: ${response.status}`, `Expected: ${isExpected ? 'Yes (200/401)' : 'No'}`],
            };
        }));

        // Test: Orders POST (with auth)
        apiTests.push(await runTest('Orders POST Endpoint (Auth Required)', async () => {
            const response = await fetch(`${BACKEND_URL}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': request.headers.get('cookie') || '',
                },
                body: JSON.stringify({}),
            });
            const data = await response.json();
            const isExpected = response.status === 401 || response.status === 400;
            return {
                success: isExpected || response.ok,
                error: isExpected ? undefined : `Status ${response.status}: ${data.error || 'Unexpected error'}`,
                details: { status: response.status, expected: isExpected },
                logs: [`Status: ${response.status}`, `Expected: ${isExpected ? 'Yes (401/400)' : 'No'}`],
            };
        }));

        // Test: Thanks.io Products (with auth)
        apiTests.push(await runTest('Thanks.io Products Endpoint (Auth Required)', async () => {
            const response = await fetch(`${BACKEND_URL}/api/thanks-io/products`, {
                headers: {
                    'Cookie': request.headers.get('cookie') || '',
                },
            });
            const data = await response.json();
            const isExpected = response.status === 401 || response.ok;
            return {
                success: isExpected,
                error: isExpected ? undefined : `Status ${response.status}: ${data.error || 'Unexpected error'}`,
                details: { status: response.status, expected: isExpected },
                logs: [`Status: ${response.status}`, `Expected: ${isExpected ? 'Yes (200/401)' : 'No'}`],
            };
        }));

        // Test: Thanks.io Styles (with auth)
        apiTests.push(await runTest('Thanks.io Styles Endpoint (Auth Required)', async () => {
            const response = await fetch(`${BACKEND_URL}/api/thanks-io/styles`, {
                headers: {
                    'Cookie': request.headers.get('cookie') || '',
                },
            });
            const data = await response.json();
            const isExpected = response.status === 401 || response.ok;
            return {
                success: isExpected,
                error: isExpected ? undefined : `Status ${response.status}: ${data.error || 'Unexpected error'}`,
                details: { status: response.status, expected: isExpected },
                logs: [`Status: ${response.status}`, `Expected: ${isExpected ? 'Yes (200/401)' : 'No'}`],
            };
        }));

        // Test: Thanks.io Send (with auth)
        apiTests.push(await runTest('Thanks.io Send Endpoint (Auth Required)', async () => {
            const response = await fetch(`${BACKEND_URL}/api/thanks-io/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': request.headers.get('cookie') || '',
                },
                body: JSON.stringify({
                    productType: 'postcard',
                    recipients: [],
                    message: 'test',
                }),
            });
            const data = await response.json();
            const isExpected = response.status === 401 || response.status === 400;
            return {
                success: isExpected || response.ok,
                error: isExpected ? undefined : `Status ${response.status}: ${data.error || 'Unexpected error'}`,
                details: { status: response.status, expected: isExpected },
                logs: [`Status: ${response.status}`, `Expected: ${isExpected ? 'Yes (401/400)' : 'No'}`],
            };
        }));

        // Test: Stripe Checkout (with auth)
        apiTests.push(await runTest('Stripe Checkout Endpoint (Auth Required)', async () => {
            const response = await fetch(`${BACKEND_URL}/api/stripe/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': request.headers.get('cookie') || '',
                },
                body: JSON.stringify({
                    priceId: 'test',
                }),
            });
            const data = await response.json();
            const isExpected = response.status === 401 || response.status === 400;
            return {
                success: isExpected || response.ok,
                error: isExpected ? undefined : `Status ${response.status}: ${data.error || 'Unexpected error'}`,
                details: { status: response.status, expected: isExpected },
                logs: [`Status: ${response.status}`, `Expected: ${isExpected ? 'Yes (401/400)' : 'No'}`],
            };
        }));

        // Test: Stripe Portal (with auth)
        apiTests.push(await runTest('Stripe Portal Endpoint (Auth Required)', async () => {
            const response = await fetch(`${BACKEND_URL}/api/stripe/portal`, {
                headers: {
                    'Cookie': request.headers.get('cookie') || '',
                },
            });
            const data = await response.json();
            const isExpected = response.status === 401 || response.status === 400;
            return {
                success: isExpected || response.ok,
                error: isExpected ? undefined : `Status ${response.status}: ${data.error || 'Unexpected error'}`,
                details: { status: response.status, expected: isExpected },
                logs: [`Status: ${response.status}`, `Expected: ${isExpected ? 'Yes (401/400)' : 'No'}`],
            };
        }));

        // Test: Handwriting Styles (public)
        apiTests.push(await runTest('Handwriting Styles Endpoint (Public)', async () => {
            const response = await fetch(`${BACKEND_URL}/api/handwriting-styles`);
            const data = await response.json();
            return {
                success: response.ok,
                error: response.ok ? undefined : `Status ${response.status}: ${data.error || 'Unknown error'}`,
                details: { status: response.status },
                logs: [`Status: ${response.status}`],
            };
        }));

        suites.push({
            name: 'API Endpoints',
            tests: apiTests,
            status: apiTests.every(t => t.status === 'pass') ? 'pass' : 'fail',
        });

        // ============================================
        // Public Pages Tests
        // ============================================
        const pageTests: TestResult[] = [];

        const publicPages = [
            { path: '/', name: 'Homepage' },
            { path: '/pricing', name: 'Pricing Page' },
            { path: '/login', name: 'Login Page' },
            { path: '/signup', name: 'Signup Page' },
        ];

        for (const page of publicPages) {
            pageTests.push(await runTest(page.name, async () => {
                const response = await fetch(`${FRONTEND_URL}${page.path}`);
                return {
                    success: response.ok,
                    error: response.ok ? undefined : `Status ${response.status}`,
                    details: { status: response.status, url: `${FRONTEND_URL}${page.path}` },
                    logs: [`Status: ${response.status}`],
                };
            }));
        }

        suites.push({
            name: 'Public Pages',
            tests: pageTests,
            status: pageTests.every(t => t.status === 'pass') ? 'pass' : 'fail',
        });

        // ============================================
        // Environment Tests
        // ============================================
        const envTests: TestResult[] = [];

        envTests.push(await runTest('Supabase URL Configured', async () => {
            const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
            return {
                success: hasUrl,
                error: hasUrl ? undefined : 'NEXT_PUBLIC_SUPABASE_URL not set',
                details: { configured: hasUrl },
            };
        }));

        envTests.push(await runTest('Supabase Anon Key Configured', async () => {
            const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
            return {
                success: hasKey,
                error: hasKey ? undefined : 'NEXT_PUBLIC_SUPABASE_ANON_KEY not set',
                details: { configured: hasKey },
            };
        }));

        envTests.push(await runTest('Database URL Configured', async () => {
            const hasDb = !!process.env.DATABASE_URL;
            return {
                success: hasDb,
                error: hasDb ? undefined : 'DATABASE_URL not set',
                details: { configured: hasDb },
            };
        }));

        envTests.push(await runTest('OpenAI API Key Configured', async () => {
            const hasKey = !!process.env.OPENAI_API_KEY;
            return {
                success: hasKey,
                error: hasKey ? undefined : 'OPENAI_API_KEY not set',
                details: { configured: hasKey },
            };
        }));

        suites.push({
            name: 'Environment Variables',
            tests: envTests,
            status: envTests.every(t => t.status === 'pass') ? 'pass' : 'fail',
        });

        // ============================================
        // Database Connection Test
        // ============================================
        const dbTests: TestResult[] = [];

        dbTests.push(await runTest('Database Connection', async () => {
            try {
                const { prisma } = await import('@/lib/prisma');
                await prisma.$queryRaw`SELECT 1`;
                return {
                    success: true,
                    details: { connected: true },
                    logs: ['Database connection successful'],
                };
            } catch (error: any) {
                return {
                    success: false,
                    error: error.message,
                    details: { error: error.message },
                };
            }
        }));

        suites.push({
            name: 'Database',
            tests: dbTests,
            status: dbTests.every(t => t.status === 'pass') ? 'pass' : 'fail',
        });

        // Calculate overall status
        const allTests = suites.flatMap(s => s.tests);
        const overallStatus = allTests.every(t => t.status === 'pass')
            ? 'pass'
            : allTests.some(t => t.status === 'fail')
            ? 'fail'
            : 'running';

        return NextResponse.json({
            suites,
            overallStatus,
            summary: {
                total: allTests.length,
                passed: allTests.filter(t => t.status === 'pass').length,
                failed: allTests.filter(t => t.status === 'fail').length,
            },
        });
    } catch (error: any) {
        console.error('Test runner error:', error);
        return NextResponse.json(
            {
                error: error.message || 'Failed to run tests',
                suites: [],
                overallStatus: 'fail',
            },
            { status: 500 }
        );
    }
}

