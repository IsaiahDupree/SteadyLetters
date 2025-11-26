import { trackEvent } from './events';

const THANKS_IO_API_KEY = process.env.THANKS_IO_API_KEY;
const BASE_URL = 'https://api.thanks.io/api/v2';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ProductType = 'postcard' | 'letter' | 'greeting' | 'windowless_letter' | 'giftcard';
export type PostcardSize = '4x6' | '6x9' | '6x11';
export type HandwritingColor = 'blue' | 'black' | 'green' | 'purple' | 'red' | string; // hex also supported

export interface HandwritingStyle {
  id: string;
  name: string;
  style: string;
}

export interface Recipient {
  name: string;
  address: string;
  address2?: string;
  city: string;
  province: string; // State
  postal_code: string; // Zip
  country?: string;
  email?: string; // For address lookup
  phone?: string;
  custom1?: string;
  custom2?: string;
  custom3?: string;
  custom4?: string;
}

export interface BaseOrderParams {
  recipients: Recipient[];
  message: string;
  handwriting_style?: string;
  handwriting_color?: HandwritingColor;
  front_image_url?: string;
}

export interface PostcardOrderParams extends BaseOrderParams {
  size?: PostcardSize;
}

export interface LetterOrderParams extends BaseOrderParams {
  pages?: number;
}

export interface GreetingOrderParams extends BaseOrderParams {
  envelope_style?: string;
}

export interface WindowlessLetterOrderParams {
  recipients: Recipient[];
  pdf_url: string;
  front_image_url?: string;
  handwriting_style?: string;
  custom1?: string;
  custom2?: string;
  custom3?: string;
  custom4?: string;
}

export interface GiftCardOrderParams extends BaseOrderParams {
  giftcard_brand: string;
  giftcard_amount_in_cents: number;
}

export interface ThanksIoResponse {
  id: string;
  status: 'queued' | 'processing' | 'sent' | 'failed';
  created_at?: string;
  error?: string;
}

// ============================================================================
// HANDWRITING STYLES API
// ============================================================================

export async function getHandwritingStyles(): Promise<HandwritingStyle[]> {
  if (!THANKS_IO_API_KEY) {
    console.warn('Thanks.io API key not found, returning mock styles');
    return MOCK_STYLES;
  }

  try {
    const response = await fetch(`${BASE_URL}/handwriting`, {
      headers: {
        'Authorization': `Bearer ${THANKS_IO_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch styles: ${response.statusText}`);
    }

    const data = await response.json() as any;
    // Map API response to our interface
    return data.data?.map((style: any) => ({
      id: style.id?.toString() || style.handwriting_id?.toString(),
      name: style.name || `Style ${style.id}`,
      style: style.description || style.style || 'Handwritten',
    })) || MOCK_STYLES;
  } catch (error) {
    console.error('Error fetching handwriting styles:', error);
    return MOCK_STYLES;
  }
}

// ============================================================================
// POSTCARD API
// ============================================================================

export async function sendPostcard(params: PostcardOrderParams): Promise<ThanksIoResponse> {
  if (!THANKS_IO_API_KEY) {
    console.warn('Thanks.io API key not found, returning mock response');
    return { id: 'mock-postcard-' + Date.now(), status: 'queued' };
  }

  try {
    const response = await fetch(`${BASE_URL}/postcard/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${THANKS_IO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients: params.recipients,
        message: params.message,
        front_image_url: params.front_image_url,
        handwriting_style: params.handwriting_style || '1',
        handwriting_color: params.handwriting_color || 'blue',
        size: params.size || '4x6',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json() as any;
      throw new Error(errorData.error || 'Failed to send postcard');
    }

    return await response.json() as ThanksIoResponse;
  } catch (error) {
    console.error('Error sending postcard:', error);
    throw error;
  }
}

// ============================================================================
// LETTER API (Windowed)
// ============================================================================

export async function sendLetter(params: LetterOrderParams): Promise<ThanksIoResponse> {
  if (!THANKS_IO_API_KEY) {
    console.warn('Thanks.io API key not found, returning mock response');
    return { id: 'mock-letter-' + Date.now(), status: 'queued' };
  }

  try {
    const response = await fetch(`${BASE_URL}/letter/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${THANKS_IO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients: params.recipients,
        message: params.message,
        front_image_url: params.front_image_url,
        handwriting_style: params.handwriting_style || '1',
        handwriting_color: params.handwriting_color || 'blue',
        pages: params.pages || 1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json() as any;
      throw new Error(errorData.error || 'Failed to send letter');
    }

    return await response.json() as ThanksIoResponse;
  } catch (error) {
    console.error('Error sending letter:', error);
    throw error;
  }
}

// ============================================================================
// GREETING CARD API
// ============================================================================

export async function sendGreetingCard(params: GreetingOrderParams): Promise<ThanksIoResponse> {
  if (!THANKS_IO_API_KEY) {
    console.warn('Thanks.io API key not found, returning mock response');
    return { id: 'mock-greeting-' + Date.now(), status: 'queued' };
  }

  try {
    const response = await fetch(`${BASE_URL}/greeting/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${THANKS_IO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients: params.recipients,
        message: params.message,
        front_image_url: params.front_image_url,
        handwriting_style: params.handwriting_style || '1',
        handwriting_color: params.handwriting_color || 'blue',
        envelope_style: params.envelope_style,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json() as any;
      throw new Error(errorData.error || 'Failed to send greeting card');
    }

    return await response.json() as ThanksIoResponse;
  } catch (error) {
    console.error('Error sending greeting card:', error);
    throw error;
  }
}

// ============================================================================
// WINDOWLESS LETTER API (PDF-based, premium)
// ============================================================================

export async function sendWindowlessLetter(params: WindowlessLetterOrderParams): Promise<ThanksIoResponse> {
  if (!THANKS_IO_API_KEY) {
    console.warn('Thanks.io API key not found, returning mock response');
    return { id: 'mock-windowless-' + Date.now(), status: 'queued' };
  }

  try {
    const response = await fetch(`${BASE_URL}/send/windowlessletter`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${THANKS_IO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients: params.recipients,
        pdf_url: params.pdf_url,
        front_image_url: params.front_image_url,
        handwriting_style: params.handwriting_style || '1',
        custom1: params.custom1,
        custom2: params.custom2,
        custom3: params.custom3,
        custom4: params.custom4,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json() as any;
      throw new Error(errorData.error || 'Failed to send windowless letter');
    }

    return await response.json() as ThanksIoResponse;
  } catch (error) {
    console.error('Error sending windowless letter:', error);
    throw error;
  }
}

// ============================================================================
// PRODUCT INFO & PRICING
// ============================================================================

export interface ProductInfo {
  id: ProductType;
  name: string;
  description: string;
  basePrice: number; // in dollars
  features: string[];
  allowedTiers: ('free' | 'pro' | 'business')[];
}

export const PRODUCT_CATALOG: Record<ProductType, ProductInfo> = {
  postcard: {
    id: 'postcard',
    name: 'Postcard',
    description: 'Quick, cost-effective promotional mailer',
    basePrice: 1.14, // 4x6 size
    features: ['3 sizes available', 'Front image customization', 'Handwritten message'],
    allowedTiers: ['free', 'pro', 'business'],
  },
  letter: {
    id: 'letter',
    name: 'Letter (Windowed)',
    description: 'Standard business letter with window envelope',
    basePrice: 1.20,
    features: ['Additional pages $0.20 each', 'Optional letterhead', 'Professional presentation'],
    allowedTiers: ['pro', 'business'],
  },
  greeting: {
    id: 'greeting',
    name: 'Greeting Card',
    description: 'Premium card with real stamp and handwritten address',
    basePrice: 3.00,
    features: ['Real stamp', 'Handwritten address', 'Premium envelope'],
    allowedTiers: ['pro', 'business'],
  },
  windowless_letter: {
    id: 'windowless_letter',
    name: 'Windowless Letter',
    description: 'Premium letter with PDF support and real stamp',
    basePrice: 2.52,
    features: ['PDF content support', 'Handwritten address', 'Real stamp'],
    allowedTiers: ['business'],
  },
  giftcard: {
    id: 'giftcard',
    name: 'Gift Card',
    description: 'Letter with physical gift card inclusion',
    basePrice: 3.00, // + gift card value
    features: ['Physical gift card', 'Multiple brands', 'US only'],
    allowedTiers: ['business'],
  },
};

export function getProductsForTier(tier: 'free' | 'pro' | 'business'): ProductInfo[] {
  return Object.values(PRODUCT_CATALOG).filter(product =>
    product.allowedTiers.includes(tier)
  );
}

export function getPostcardPrice(size: PostcardSize): number {
  const prices: Record<PostcardSize, number> = {
    '4x6': 1.14,
    '6x9': 1.61,
    '6x11': 1.83,
  };
  return prices[size];
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_STYLES: HandwritingStyle[] = [
  { id: '1', name: 'Jeremy', style: 'Casual & Friendly' },
  { id: '2', name: 'Tribeca', style: 'Professional & Clean' },
  { id: '3', name: 'Terry', style: 'Elegant & Formal' },
  { id: '4', name: 'Madeline', style: 'Warm & Personal' },
  { id: '5', name: 'Brooklyn', style: 'Modern & Bold' },
  { id: '6', name: 'Signature', style: 'Sophisticated' },
];
