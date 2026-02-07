import { z } from 'zod';

/**
 * Supported countries for international addresses
 */
export const SUPPORTED_COUNTRIES = [
  { code: 'US', name: 'United States', postalLabel: 'ZIP Code' },
  { code: 'CA', name: 'Canada', postalLabel: 'Postal Code' },
  { code: 'GB', name: 'United Kingdom', postalLabel: 'Postcode' },
  { code: 'AU', name: 'Australia', postalLabel: 'Postcode' },
  { code: 'DE', name: 'Germany', postalLabel: 'Postcode' },
  { code: 'FR', name: 'France', postalLabel: 'Postal Code' },
  { code: 'JP', name: 'Japan', postalLabel: 'Postal Code' },
  { code: 'MX', name: 'Mexico', postalLabel: 'Postal Code' },
] as const;

/**
 * Validation schema for recipient data
 */
export const recipientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  address1: z.string().min(1, 'Address is required').max(200, 'Address must be at most 200 characters'),
  address2: z.string().max(200, 'Address line 2 must be at most 200 characters').optional().nullable(),
  city: z.string().min(1, 'City is required').max(100, 'City must be at most 100 characters'),
  state: z.string().min(2, 'State is required').max(50, 'State must be at most 50 characters'),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'ZIP code must be in format 12345 or 12345-6789'),
  country: z.string().default('US'),
});

export type RecipientInput = z.infer<typeof recipientSchema>;
