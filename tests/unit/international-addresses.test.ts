import { describe, it, expect } from 'vitest';
import { validatePostalCode, SUPPORTED_COUNTRIES, recipientSchema } from '@/lib/validations/recipient';

describe('International Address Validation', () => {
  describe('validatePostalCode', () => {
    it('should validate US ZIP codes', () => {
      expect(validatePostalCode('12345', 'US')).toBe(true);
      expect(validatePostalCode('12345-6789', 'US')).toBe(true);
      expect(validatePostalCode('1234', 'US')).toBe(false);
      expect(validatePostalCode('ABCDE', 'US')).toBe(false);
    });

    it('should validate Canadian postal codes', () => {
      expect(validatePostalCode('A1A 1A1', 'CA')).toBe(true);
      expect(validatePostalCode('A1A1A1', 'CA')).toBe(true);
      expect(validatePostalCode('K1A 0B1', 'CA')).toBe(true);
      expect(validatePostalCode('12345', 'CA')).toBe(false);
      expect(validatePostalCode('AAA AAA', 'CA')).toBe(false);
    });

    it('should validate UK postcodes', () => {
      expect(validatePostalCode('SW1A 1AA', 'GB')).toBe(true);
      expect(validatePostalCode('W1A 1AA', 'GB')).toBe(true);
      expect(validatePostalCode('SW1A1AA', 'GB')).toBe(true);
      expect(validatePostalCode('12345', 'GB')).toBe(false);
    });

    it('should validate Australian postcodes', () => {
      expect(validatePostalCode('2000', 'AU')).toBe(true);
      expect(validatePostalCode('3000', 'AU')).toBe(true);
      expect(validatePostalCode('123', 'AU')).toBe(false);
      expect(validatePostalCode('12345', 'AU')).toBe(false);
    });

    it('should validate German postcodes', () => {
      expect(validatePostalCode('12345', 'DE')).toBe(true);
      expect(validatePostalCode('80331', 'DE')).toBe(true);
      expect(validatePostalCode('1234', 'DE')).toBe(false);
      expect(validatePostalCode('123456', 'DE')).toBe(false);
    });

    it('should validate French postcodes', () => {
      expect(validatePostalCode('75001', 'FR')).toBe(true);
      expect(validatePostalCode('13008', 'FR')).toBe(true);
      expect(validatePostalCode('1234', 'FR')).toBe(false);
      expect(validatePostalCode('123456', 'FR')).toBe(false);
    });

    it('should validate Japanese postcodes', () => {
      expect(validatePostalCode('123-4567', 'JP')).toBe(true);
      expect(validatePostalCode('100-0001', 'JP')).toBe(true);
      expect(validatePostalCode('1234567', 'JP')).toBe(false);
      expect(validatePostalCode('123-456', 'JP')).toBe(false);
    });

    it('should validate Mexican postcodes', () => {
      expect(validatePostalCode('12345', 'MX')).toBe(true);
      expect(validatePostalCode('01000', 'MX')).toBe(true);
      expect(validatePostalCode('1234', 'MX')).toBe(false);
      expect(validatePostalCode('123456', 'MX')).toBe(false);
    });

    it('should accept any non-empty postal code for unsupported countries', () => {
      expect(validatePostalCode('ABC123', 'XX')).toBe(true);
      expect(validatePostalCode('12345', 'ZZ')).toBe(true);
      expect(validatePostalCode('A', 'YY')).toBe(true);
      expect(validatePostalCode('', 'XX')).toBe(false);
      expect(validatePostalCode('A'.repeat(21), 'XX')).toBe(false); // Over 20 chars
    });

    it('should return false for empty postal code or country', () => {
      expect(validatePostalCode('', 'US')).toBe(false);
      expect(validatePostalCode('12345', '')).toBe(false);
      expect(validatePostalCode(null, 'US')).toBe(false);
      expect(validatePostalCode('12345', null)).toBe(false);
    });
  });

  describe('SUPPORTED_COUNTRIES', () => {
    it('should contain common countries', () => {
      expect(SUPPORTED_COUNTRIES).toBeDefined();
      expect(SUPPORTED_COUNTRIES.length).toBeGreaterThan(0);

      const countryCodes = SUPPORTED_COUNTRIES.map(c => c.code);
      expect(countryCodes).toContain('US');
      expect(countryCodes).toContain('CA');
      expect(countryCodes).toContain('GB');
    });

    it('should have correct structure for each country', () => {
      SUPPORTED_COUNTRIES.forEach(country => {
        expect(country).toHaveProperty('code');
        expect(country).toHaveProperty('name');
        expect(country).toHaveProperty('postalLabel');
        expect(country.code).toHaveLength(2);
        expect(typeof country.name).toBe('string');
        expect(typeof country.postalLabel).toBe('string');
      });
    });
  });

  describe('recipientSchema', () => {
    it('should validate a US recipient', () => {
      const result = recipientSchema.safeParse({
        name: 'John Doe',
        address1: '123 Main St',
        address2: '',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
      });

      expect(result.success).toBe(true);
    });

    it('should validate a Canadian recipient', () => {
      const result = recipientSchema.safeParse({
        name: 'Jane Smith',
        address1: '456 Maple Ave',
        city: 'Toronto',
        state: 'ON',
        zip: 'M5H 2N2',
        country: 'CA',
      });

      expect(result.success).toBe(true);
    });

    it('should validate a UK recipient', () => {
      const result = recipientSchema.safeParse({
        name: 'James Brown',
        address1: '10 Downing Street',
        city: 'London',
        state: 'Greater London',
        zip: 'SW1A 2AA',
        country: 'GB',
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid postal code for country', () => {
      const result = recipientSchema.safeParse({
        name: 'John Doe',
        address1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: 'INVALID',
        country: 'US',
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Invalid postal code');
    });

    it('should use US as default country', () => {
      const result = recipientSchema.safeParse({
        name: 'John Doe',
        address1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
      });

      expect(result.success).toBe(true);
      expect(result.data?.country).toBe('US');
    });

    it('should validate country code length', () => {
      const result = recipientSchema.safeParse({
        name: 'John Doe',
        address1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'USA', // Invalid: should be 2 letters
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('2 letters');
    });

    it('should require all mandatory fields', () => {
      const result = recipientSchema.safeParse({
        name: 'John Doe',
        // missing address1
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
      });

      expect(result.success).toBe(false);
    });

    it('should allow optional address2 and message fields', () => {
      const result = recipientSchema.safeParse({
        name: 'John Doe',
        address1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
        // address2 and message omitted
      });

      expect(result.success).toBe(true);
    });
  });

  describe('International Address Examples', () => {
    const testCases = [
      {
        country: 'US',
        name: 'Alice Johnson',
        address1: '123 Elm Street',
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
      },
      {
        country: 'CA',
        name: 'Bob Martin',
        address1: '789 Pine Road',
        city: 'Vancouver',
        state: 'BC',
        zip: 'V6B 4Y8',
      },
      {
        country: 'GB',
        name: 'Charlie Wilson',
        address1: '221B Baker Street',
        city: 'London',
        state: 'England',
        zip: 'NW1 6XE',
      },
      {
        country: 'AU',
        name: 'Diana Cooper',
        address1: '45 Collins Street',
        city: 'Melbourne',
        state: 'VIC',
        zip: '3000',
      },
      {
        country: 'DE',
        name: 'Erik Schmidt',
        address1: 'Hauptstraße 42',
        city: 'Berlin',
        state: 'Berlin',
        zip: '10115',
      },
      {
        country: 'FR',
        name: 'Françoise Dupont',
        address1: '15 Rue de la Paix',
        city: 'Paris',
        state: 'Île-de-France',
        zip: '75002',
      },
      {
        country: 'JP',
        name: 'Haruto Tanaka',
        address1: '1-2-3 Shibuya',
        city: 'Tokyo',
        state: 'Tokyo',
        zip: '150-0002',
      },
      {
        country: 'MX',
        name: 'Isabel García',
        address1: 'Calle Principal 123',
        city: 'Mexico City',
        state: 'CDMX',
        zip: '06000',
      },
    ];

    testCases.forEach(testCase => {
      it(`should validate ${testCase.country} address for ${testCase.name}`, () => {
        const result = recipientSchema.safeParse(testCase);
        expect(result.success).toBe(true);
      });
    });
  });
});
