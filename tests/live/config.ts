import type { Recipient } from '@/lib/thanks-io';

export const LIVE_TEST_CONFIG = {
  enabled: process.env.THANKS_IO_LIVE_TEST === 'true',
  apiKey: process.env.THANKS_IO_API_KEY || '',
  baseUrl: 'https://api.thanks.io/api/v2',
  maxSpend: parseFloat(process.env.THANKS_IO_LIVE_TEST_MAX_SPEND || '5.00'),
  profile: (process.env.LIVE_TEST_PROFILE || 'smoke') as 'smoke' | 'standard' | 'full',

  defaultRecipient: {
    name: process.env.LIVE_TEST_RECIPIENT_NAME || 'SteadyLetters QA',
    address: process.env.LIVE_TEST_RECIPIENT_ADDRESS || '3425 Delaney Drive Apt 214',
    city: process.env.LIVE_TEST_RECIPIENT_CITY || 'Melbourne',
    province: process.env.LIVE_TEST_RECIPIENT_STATE || 'FL',
    postal_code: process.env.LIVE_TEST_RECIPIENT_ZIP || '32934',
    country: process.env.LIVE_TEST_RECIPIENT_COUNTRY || 'US',
  } satisfies Recipient,

  defaultMessage: `SteadyLetters QA Test — ${new Date().toISOString()}`,
  defaultHandwritingStyle: '1',
  defaultHandwritingColor: 'blue' as const,
};

export function assertLiveTestEnabled(): void {
  if (!LIVE_TEST_CONFIG.enabled) {
    throw new Error(
      'Live tests are disabled. Set THANKS_IO_LIVE_TEST=true to enable.\n' +
      'WARNING: Live tests send real mail and spend real money.'
    );
  }
  if (!LIVE_TEST_CONFIG.apiKey) {
    throw new Error(
      'THANKS_IO_API_KEY is required for live tests.\n' +
      'Set it in .env.local or pass as environment variable.'
    );
  }
}
