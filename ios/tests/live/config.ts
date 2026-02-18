export interface LiveTestConfig {
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  profile: 'smoke' | 'standard' | 'full';
  maxSpend: number;
  defaultRecipient: {
    name: string;
    address: string;
    city: string;
    province: string;
    postal_code: string;
    country: string;
  };
  defaultMessage: string;
  defaultHandwritingStyle: string;
  defaultHandwritingColor: string;
}

export const LIVE_TEST_CONFIG: LiveTestConfig = {
  enabled: !!process.env.THANKS_IO_LIVE_TEST,
  apiKey: process.env.EXPO_PUBLIC_THANKS_IO_API_KEY || process.env.THANKS_IO_API_KEY || '',
  baseUrl: 'https://api.thanks.io/api/v2',
  profile: (process.env.LIVE_TEST_PROFILE as LiveTestConfig['profile']) || 'smoke',
  maxSpend: parseFloat(process.env.LIVE_TEST_MAX_SPEND || '15.00'),
  defaultRecipient: {
    name: process.env.LIVE_TEST_RECIPIENT_NAME || 'SteadyLetters QA',
    address: process.env.LIVE_TEST_RECIPIENT_ADDRESS || '123 Test Street',
    city: process.env.LIVE_TEST_RECIPIENT_CITY || 'Austin',
    province: process.env.LIVE_TEST_RECIPIENT_STATE || 'TX',
    postal_code: process.env.LIVE_TEST_RECIPIENT_ZIP || '78701',
    country: 'US',
  },
  defaultMessage: 'SteadyLetters iOS Live Test — This is a real letter sent from the iOS integration test suite. If you received this, the Thanks.io integration is working correctly!',
  defaultHandwritingStyle: '1',
  defaultHandwritingColor: 'blue',
};

export function assertLiveTestEnabled(): void {
  if (!LIVE_TEST_CONFIG.enabled) {
    throw new Error('Live tests are disabled. Set THANKS_IO_LIVE_TEST=true to enable.');
  }
  if (!LIVE_TEST_CONFIG.apiKey) {
    throw new Error('Thanks.io API key not set. Set THANKS_IO_API_KEY or EXPO_PUBLIC_THANKS_IO_API_KEY.');
  }
}
