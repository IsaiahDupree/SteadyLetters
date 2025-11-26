import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api-config';

/**
 * Proxy route: Forward requests to backend
 * This route has been migrated to the Express backend
 */
export async function POST(request: NextRequest) {
    try {
        const backendUrl = getApiUrl('stripe/checkout');
        
        // Forward the request to the backend
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': request.headers.get('cookie') || '',
                'Authorization': request.headers.get('authorization') || '',
            },
            body: await request.text(),
        });

        const data = await response.json().catch(() => ({ error: 'Failed to parse response' }));
        
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error('Proxy error:', error);
        return NextResponse.json(
            { error: 'Failed to forward request to backend' },
            { status: 500 }
        );
    }
}
