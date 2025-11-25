import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
        });
    } catch (error: any) {
        console.error('Health check error:', error);
        return NextResponse.json(
            {
                status: 'error',
                error: error.message || 'Health check failed',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}
