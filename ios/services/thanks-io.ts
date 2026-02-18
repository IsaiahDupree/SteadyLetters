import { THANKS_IO_API_KEY } from '@/constants/config';

const BASE_URL = 'https://api.thanks.io/api/v2';

export type ProductType = 'postcard' | 'letter' | 'greeting' | 'windowless_letter' | 'giftcard';
export type PostcardSize = '4x6' | '6x9' | '6x11';
export type HandwritingColor = 'blue' | 'black' | 'green' | 'purple' | 'red' | string;

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
  province: string;
  postal_code: string;
  country?: string;
  email?: string;
  phone?: string;
}

export interface ThanksIoResponse {
  id: string;
  status: 'queued' | 'processing' | 'sent' | 'failed';
  created_at?: string;
  error?: string;
}

export interface ThanksIoOrderStatus {
  id: string;
  status: 'queued' | 'processing' | 'sent' | 'delivered' | 'failed';
  created_at?: string;
  updated_at?: string;
  delivered_at?: string;
  estimated_delivery?: string;
  tracking_number?: string;
  error?: string;
}

export interface ProductInfo {
  id: ProductType;
  name: string;
  description: string;
  basePrice: number;
  features: string[];
  allowedTiers: ('free' | 'pro' | 'business')[];
}

// -------------------------------------------------------------------
// API helpers
// -------------------------------------------------------------------

async function apiRequest<T>(
  method: 'GET' | 'POST',
  endpoint: string,
  body?: Record<string, unknown>,
): Promise<T> {
  if (!THANKS_IO_API_KEY) {
    throw new Error('Thanks.io API key not configured');
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${THANKS_IO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Thanks.io API error: ${response.status}`);
  }

  return response.json();
}

// -------------------------------------------------------------------
// Handwriting styles
// -------------------------------------------------------------------

export async function getHandwritingStyles(): Promise<HandwritingStyle[]> {
  const data = await apiRequest<{ data: Array<{ id?: number; handwriting_id?: number; name?: string; description?: string; style?: string }> }>('GET', '/handwriting');
  return (
    data.data?.map((s) => ({
      id: String(s.id ?? s.handwriting_id ?? ''),
      name: s.name || `Style ${s.id ?? s.handwriting_id ?? 'unknown'}`,
      style: s.description || s.style || 'Handwritten',
    })) ?? []
  );
}

// -------------------------------------------------------------------
// Order status
// -------------------------------------------------------------------

export async function getOrderStatus(orderId: string): Promise<ThanksIoOrderStatus> {
  return apiRequest<ThanksIoOrderStatus>('GET', `/order/${orderId}`);
}

// -------------------------------------------------------------------
// Send functions
// -------------------------------------------------------------------

export async function sendPostcard(params: {
  recipients: Recipient[];
  message: string;
  handwriting_style?: string;
  handwriting_color?: HandwritingColor;
  front_image_url?: string;
  size?: PostcardSize;
}): Promise<ThanksIoResponse> {
  return apiRequest<ThanksIoResponse>('POST', '/postcard/send', {
    recipients: params.recipients,
    message: params.message,
    front_image_url: params.front_image_url,
    handwriting_style: params.handwriting_style || '1',
    handwriting_color: params.handwriting_color || 'blue',
    size: params.size || '4x6',
  });
}

export async function sendLetter(params: {
  recipients: Recipient[];
  message: string;
  handwriting_style?: string;
  handwriting_color?: HandwritingColor;
  front_image_url?: string;
  pages?: number;
}): Promise<ThanksIoResponse> {
  return apiRequest<ThanksIoResponse>('POST', '/letter/send', {
    recipients: params.recipients,
    message: params.message,
    front_image_url: params.front_image_url,
    handwriting_style: params.handwriting_style || '1',
    handwriting_color: params.handwriting_color || 'blue',
    pages: params.pages || 1,
  });
}

export async function sendGreetingCard(params: {
  recipients: Recipient[];
  message: string;
  handwriting_style?: string;
  handwriting_color?: HandwritingColor;
  front_image_url?: string;
  envelope_style?: string;
}): Promise<ThanksIoResponse> {
  return apiRequest<ThanksIoResponse>('POST', '/greeting/send', {
    recipients: params.recipients,
    message: params.message,
    front_image_url: params.front_image_url,
    handwriting_style: params.handwriting_style || '1',
    handwriting_color: params.handwriting_color || 'blue',
    envelope_style: params.envelope_style,
  });
}

export async function sendWindowlessLetter(params: {
  recipients: Recipient[];
  pdf_url: string;
  front_image_url?: string;
  handwriting_style?: string;
}): Promise<ThanksIoResponse> {
  return apiRequest<ThanksIoResponse>('POST', '/send/windowlessletter', {
    recipients: params.recipients,
    pdf_url: params.pdf_url,
    front_image_url: params.front_image_url,
    handwriting_style: params.handwriting_style || '1',
  });
}

// -------------------------------------------------------------------
// Product catalog (mirrors web version)
// -------------------------------------------------------------------

export const PRODUCT_CATALOG: Record<ProductType, ProductInfo> = {
  postcard: {
    id: 'postcard',
    name: 'Postcard',
    description: 'Quick, cost-effective promotional mailer',
    basePrice: 1.14,
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
    basePrice: 3.00,
    features: ['Physical gift card', 'Multiple brands', 'US only'],
    allowedTiers: ['business'],
  },
};

export function getPostcardPrice(size: PostcardSize): number {
  const prices: Record<PostcardSize, number> = { '4x6': 1.14, '6x9': 1.61, '6x11': 1.83 };
  return prices[size];
}

export function getProductsForTier(tier: 'free' | 'pro' | 'business'): ProductInfo[] {
  return Object.values(PRODUCT_CATALOG).filter((p) => p.allowedTiers.includes(tier));
}
