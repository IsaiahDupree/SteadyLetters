/**
 * Unit tests for address validation library
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

// Import the module
const { validateAddress, validateAddresses } = await import('../../src/lib/address-validation.js');

describe('Address Validation Library', () => {
  beforeEach(() => {
    // Clear environment variables
    delete process.env.USPS_USER_ID;
    // Clear fetch mock
    if (global.fetch && global.fetch.mockClear) {
      global.fetch.mockClear();
    }
  });

  describe('validateAddress with mock provider', () => {
    test('should validate a correct address', async () => {
      const address = {
        address1: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zip: '94102',
      };

      const result = await validateAddress(address, 'mock');

      expect(result.isValid).toBe(true);
      expect(result.deliverable).toBe(true);
      expect(result.city).toBe('SAN FRANCISCO'); // Mock uppercases
      expect(result.state).toBe('CA');
      expect(result.messages).toContain('Address format is valid');
    });

    test('should reject address with invalid ZIP code', async () => {
      const address = {
        address1: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zip: 'INVALID',
      };

      const result = await validateAddress(address, 'mock');

      expect(result.isValid).toBe(false);
      expect(result.deliverable).toBe(false);
      expect(result.messages).toContain('Invalid address format');
    });

    test('should reject address with missing required fields', async () => {
      const address = {
        address1: '',
        city: 'San Francisco',
        state: 'CA',
        zip: '94102',
      };

      const result = await validateAddress(address, 'mock');

      expect(result.isValid).toBe(false);
      expect(result.deliverable).toBe(false);
    });

    test('should validate ZIP+4 format', async () => {
      const address = {
        address1: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zip: '94102-1234',
      };

      const result = await validateAddress(address, 'mock');

      expect(result.isValid).toBe(true);
      expect(result.zip).toBe('94102-1234');
    });

    test('should handle optional address2 field', async () => {
      const address = {
        address1: '123 Main St',
        address2: 'Apt 4B',
        city: 'San Francisco',
        state: 'CA',
        zip: '94102',
      };

      const result = await validateAddress(address, 'mock');

      expect(result.isValid).toBe(true);
      expect(result.address2).toBe('Apt 4B');
    });

    test('should default country to US', async () => {
      const address = {
        address1: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zip: '94102',
      };

      const result = await validateAddress(address, 'mock');

      expect(result.country).toBe('US');
    });
  });

  describe('validateAddress with USPS provider (fallback mode)', () => {
    test('should use fallback validation when USPS_USER_ID is not set', async () => {
      const address = {
        address1: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zip: '94102',
      };

      const result = await validateAddress(address, 'usps');

      expect(result.isValid).toBe(true);
      expect(result.deliverable).toBeUndefined(); // Cannot confirm without API
      expect(result.messages?.[0]).toContain('API validation unavailable');
    });

    test('should validate format in fallback mode', async () => {
      const address = {
        address1: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zip: 'BADZIP',
      };

      const result = await validateAddress(address, 'usps');

      expect(result.isValid).toBe(false);
      expect(result.messages).toContain('Invalid address format');
    });
  });

  describe('validateAddresses (batch validation)', () => {
    test('should validate multiple addresses', async () => {
      const addresses = [
        {
          address1: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zip: '94102',
        },
        {
          address1: '456 Market St',
          city: 'San Francisco',
          state: 'CA',
          zip: '94105',
        },
      ];

      const results = await validateAddresses(addresses, 'mock');

      expect(results).toHaveLength(2);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(true);
    });

    test('should handle mixed valid and invalid addresses', async () => {
      const addresses = [
        {
          address1: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zip: '94102',
        },
        {
          address1: '',
          city: 'Invalid',
          state: 'CA',
          zip: 'BADZIP',
        },
      ];

      const results = await validateAddresses(addresses, 'mock');

      expect(results).toHaveLength(2);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(false);
    });

    test('should process addresses sequentially', async () => {
      const addresses = [
        {
          address1: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zip: '94102',
        },
        {
          address1: '456 Market St',
          city: 'San Francisco',
          state: 'CA',
          zip: '94105',
        },
      ];

      const results = await validateAddresses(addresses, 'mock');

      expect(results).toHaveLength(2);
    });
  });

  describe('Edge cases', () => {
    test('should handle empty string in optional fields', async () => {
      const address = {
        address1: '123 Main St',
        address2: '',
        city: 'San Francisco',
        state: 'CA',
        zip: '94102',
      };

      const result = await validateAddress(address, 'mock');

      expect(result.isValid).toBe(true);
    });

    test('should handle undefined country field', async () => {
      const address = {
        address1: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zip: '94102',
        country: undefined,
      };

      const result = await validateAddress(address, 'mock');

      expect(result.country).toBe('US');
    });

    test('should preserve original data on validation failure', async () => {
      const address = {
        address1: 'Invalid',
        city: '',
        state: '',
        zip: '',
      };

      const result = await validateAddress(address, 'mock');

      expect(result.isValid).toBe(false);
      expect(result.address1).toBe('Invalid');
    });
  });
});
