import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'error';

  if (type === 'error') {
    // This will be caught by Sentry
    throw new Error('Test error from Sentry integration');
  }

  if (type === 'message') {
    // Manually capture a message
    Sentry.captureMessage('Test message from Sentry', 'info');
    return NextResponse.json({ message: 'Message sent to Sentry' });
  }

  if (type === 'exception') {
    // Manually capture an exception
    try {
      throw new Error('Manually captured exception');
    } catch (error) {
      Sentry.captureException(error);
      return NextResponse.json({ message: 'Exception captured by Sentry' });
    }
  }

  return NextResponse.json({
    message: 'Sentry test endpoint',
    usage: 'Add ?type=error, ?type=message, or ?type=exception'
  });
}
