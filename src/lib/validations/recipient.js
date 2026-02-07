import { z } from 'zod';

/**
 * Validation schema for recipient data
 * JavaScript version for use in non-TypeScript contexts
 *
 * Supports international addresses with flexible postal code validation
 */

// Common country codes supported
export const SUPPORTED_COUNTRIES = [
  { code: 'US', name: 'United States', postalLabel: 'ZIP Code' },
  { code: 'CA', name: 'Canada', postalLabel: 'Postal Code' },
  { code: 'GB', name: 'United Kingdom', postalLabel: 'Postcode' },
  { code: 'AU', name: 'Australia', postalLabel: 'Postcode' },
  { code: 'DE', name: 'Germany', postalLabel: 'Postcode' },
  { code: 'FR', name: 'France', postalLabel: 'Postal Code' },
  { code: 'JP', name: 'Japan', postalLabel: 'Postal Code' },
  { code: 'MX', name: 'Mexico', postalLabel: 'Postal Code' },
];

/**
 * Validates postal code based on country
 * Returns true if valid, false otherwise
 */
export function validatePostalCode(postalCode, countryCode) {
  if (!postalCode || !countryCode) return false;

  const patterns = {
    US: /^\d{5}(-\d{4})?$/,                           // 12345 or 12345-6789
    CA: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i,                // A1A 1A1 or A1A1A1
    GB: /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i,   // SW1A 1AA, W1A 1AA, SW1A1AA
    AU: /^\d{4}$/,                                     // 1234
    DE: /^\d{5}$/,                                     // 12345
    FR: /^\d{5}$/,                                     // 12345
    JP: /^\d{3}-\d{4}$/,                               // 123-4567
    MX: /^\d{5}$/,                                     // 12345
  };

  const pattern = patterns[countryCode];
  if (!pattern) {
    // For unsupported countries, accept any non-empty string up to 20 chars
    return postalCode.length > 0 && postalCode.length <= 20;
  }

  return pattern.test(postalCode);
}

/**
 * Validation schema for recipient data with international address support
 */
export const recipientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  address1: z.string().min(1, 'Address is required').max(200, 'Address must be at most 200 characters'),
  address2: z.string().max(200, 'Address line 2 must be at most 200 characters').optional().nullable(),
  city: z.string().min(1, 'City is required').max(100, 'City must be at most 100 characters'),
  state: z.string().min(1, 'State/Province is required').max(50, 'State/Province must be at most 50 characters'),
  zip: z.string().min(1, 'Postal code is required').max(20, 'Postal code must be at most 20 characters'),
  country: z.string().length(2, 'Country code must be 2 letters').default('US'),
  message: z.string().max(2000, 'Message must be at most 2000 characters').optional().nullable(),
}).refine((data) => validatePostalCode(data.zip, data.country), {
  message: 'Invalid postal code format for selected country',
  path: ['zip'],
});
