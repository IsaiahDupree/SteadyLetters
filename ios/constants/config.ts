export const APP_NAME = 'SteadyLetters';
export const APP_SLUG = 'steadyletters';
export const APP_SCHEME = 'steadyletters';

export const DEV_MODE = __DEV__;

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
export const THANKS_IO_API_KEY = process.env.EXPO_PUBLIC_THANKS_IO_API_KEY || '';
export const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
export const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY || '';
export const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
export const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUCAT_API_KEY || '';
export const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://www.steadyletters.com';

export const TIERS = {
  free: {
    name: 'Free',
    price: 0,
    letterGenerations: 5,
    imageGenerations: 3,
    lettersSent: 2,
    products: ['postcard'],
  },
  pro: {
    name: 'Pro',
    price: 29,
    letterGenerations: 50,
    imageGenerations: 25,
    lettersSent: 20,
    products: ['postcard', 'letter', 'greeting'],
  },
  business: {
    name: 'Business',
    price: 99,
    letterGenerations: -1, // unlimited
    imageGenerations: 100,
    lettersSent: 100,
    products: ['postcard', 'letter', 'greeting', 'windowless_letter', 'giftcard'],
  },
} as const;

export type TierName = keyof typeof TIERS;
