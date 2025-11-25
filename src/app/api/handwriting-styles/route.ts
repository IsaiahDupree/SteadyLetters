import { NextRequest, NextResponse } from 'next/server';

// Thanks.io API endpoint for handwriting styles
const THANKS_IO_API = 'https://api.thanks.io/api/v2';

export async function GET() {
    try {
        const response = await fetch(`${THANKS_IO_API}/handwriting-styles`, {
            headers: {
                'Authorization': `Bearer ${process.env.THANKS_IO_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch handwriting styles');
        }

        const styles = await response.json();

        return NextResponse.json({ styles });
    } catch (error) {
        console.error('Handwriting styles error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch handwriting styles' },
            { status: 500 }
        );
    }
}
