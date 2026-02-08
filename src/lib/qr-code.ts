import QRCode from 'qrcode';

/**
 * QR Code generation utilities for SteadyLetters
 */

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

const DEFAULT_OPTIONS: QRCodeOptions = {
  width: 200,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#FFFFFF',
  },
  errorCorrectionLevel: 'M',
};

/**
 * Generate a QR code as a data URL (suitable for embedding in emails/documents)
 */
export async function generateQRCodeDataUrl(
  text: string,
  options?: QRCodeOptions
): Promise<string> {
  try {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    const dataUrl = await QRCode.toDataURL(text, {
      width: mergedOptions.width,
      margin: mergedOptions.margin,
      color: mergedOptions.color,
      errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
    });
    return dataUrl;
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    throw error;
  }
}

/**
 * Generate a QR code as a PNG buffer (suitable for storing as file)
 */
export async function generateQRCodeBuffer(
  text: string,
  options?: QRCodeOptions
): Promise<Buffer> {
  try {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    const buffer = await QRCode.toBuffer(text, {
      width: mergedOptions.width,
      margin: mergedOptions.margin,
      color: mergedOptions.color,
      errorCorrectionLevel: mergedOptions.errorCorrectionLevel,
    });
    return buffer;
  } catch (error) {
    console.error('Failed to generate QR code buffer:', error);
    throw error;
  }
}

/**
 * Validate a URL for QR code
 */
export function isValidQRCodeUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a short tracking URL from a pattern
 * Example: https://steadyletters.com/qr/abc123
 */
export function createTrackingUrl(baseUrl: string, trackingId: string): string {
  try {
    const url = new URL(`/qr/${trackingId}`, baseUrl);
    return url.toString();
  } catch (error) {
    console.error('Failed to create tracking URL:', error);
    throw error;
  }
}

/**
 * Generate a unique tracking ID for QR codes
 */
export function generateTrackingId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Common QR code use cases
 */
export const QR_CODE_TEMPLATES = {
  website: (url: string) => ({ data: url, label: 'Website' }),
  vcard: (vcard: string) => ({ data: vcard, label: 'Contact Card' }),
  wifi: (wifi: string) => ({ data: wifi, label: 'WiFi Connection' }),
  email: (email: string) => ({ data: `mailto:${email}`, label: 'Email' }),
  phone: (phone: string) => ({ data: `tel:${phone}`, label: 'Phone' }),
  sms: (phone: string, message?: string) => ({
    data: `smsto:${phone}${message ? ':' + encodeURIComponent(message) : ''}`,
    label: 'SMS',
  }),
  text: (text: string) => ({ data: text, label: 'Text' }),
};
