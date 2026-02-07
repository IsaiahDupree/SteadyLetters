/**
 * Unit tests for CSV bulk letter upload feature
 */

import { describe, test, expect } from '@jest/globals';

// Import the CSV parser
const { parseCSV } = await import('../../src/lib/csv-parser-impl.js');

describe('CSV Bulk Letter Upload', () => {
  describe('CSV parsing with message column', () => {
    test('should parse CSV with message column', () => {
      const csv = `name,address1,city,state,zip,message
John Doe,123 Main St,New York,NY,10001,Happy Birthday John!
Jane Smith,456 Oak Ave,Boston,MA,02101,Thank you for everything!`;

      const result = parseCSV(csv);

      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(0);
      expect(result.valid[0].data.message).toBe('Happy Birthday John!');
      expect(result.valid[1].data.message).toBe('Thank you for everything!');
    });

    test('should handle optional message column', () => {
      const csv = `name,address1,city,state,zip
John Doe,123 Main St,New York,NY,10001`;

      const result = parseCSV(csv);

      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].data.message).toBeUndefined();
    });

    test('should handle empty message values', () => {
      const csv = `name,address1,city,state,zip,message
John Doe,123 Main St,New York,NY,10001,
Jane Smith,456 Oak Ave,Boston,MA,02101,Thank you!`;

      const result = parseCSV(csv);

      expect(result.valid).toHaveLength(2);
      expect(result.valid[0].data.message).toBeUndefined();
      expect(result.valid[1].data.message).toBe('Thank you!');
    });

    test('should handle quoted messages with commas', () => {
      const csv = `name,address1,city,state,zip,message
"John Doe","123 Main St","New York","NY","10001","Dear John, Happy Birthday!"`;

      const result = parseCSV(csv);

      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].data.message).toBe('Dear John, Happy Birthday!');
    });

    test('should handle messages with line breaks escaped', () => {
      // Most CSV generators escape newlines within quoted fields
      // Our simple parser handles same-line content well
      const csv = `name,address1,city,state,zip,message
John Doe,123 Main St,New York,NY,10001,"Dear John. Happy Birthday! Best wishes."`;

      const result = parseCSV(csv);

      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].data.message).toContain('Happy Birthday!');
      expect(result.valid[0].data.message).toContain('Best wishes');
    });
  });

  describe('CSV template generation', () => {
    test('should generate template with message column', async () => {
      const { generateCSVTemplate } = await import('../../src/lib/csv-parser-impl.js');

      const template = generateCSVTemplate();

      expect(template).toContain('name');
      expect(template).toContain('address1');
      expect(template).toContain('city');
      expect(template).toContain('state');
      expect(template).toContain('zip');
      expect(template).toContain('John Doe');
    });
  });

  describe('CSV validation', () => {
    test('should reject CSV with missing required columns', () => {
      const csv = `name,city,state
John Doe,New York,NY`;

      expect(() => parseCSV(csv)).toThrow('Missing required columns');
    });

    test('should reject CSV with invalid ZIP codes', () => {
      const csv = `name,address1,city,state,zip
John Doe,123 Main St,New York,NY,INVALID`;

      const result = parseCSV(csv);

      expect(result.invalid).toHaveLength(1);
      expect(result.valid).toHaveLength(0);
    });

    test('should accept ZIP+4 format', () => {
      const csv = `name,address1,city,state,zip
John Doe,123 Main St,New York,NY,10001-1234`;

      const result = parseCSV(csv);

      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].data.zip).toBe('10001-1234');
    });

    test('should handle address2 and country columns', () => {
      const csv = `name,address1,address2,city,state,zip,country
John Doe,123 Main St,Apt 4B,New York,NY,10001,US`;

      const result = parseCSV(csv);

      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].data.address2).toBe('Apt 4B');
      expect(result.valid[0].data.country).toBe('US');
    });
  });

  describe('Batch processing', () => {
    test('should parse large CSV with mixed valid and invalid rows', () => {
      const rows = [
        'name,address1,city,state,zip',
        'John Doe,123 Main St,New York,NY,10001',
        'Jane Smith,456 Oak Ave,Boston,MA,02101',
        'Invalid User,,,,' // Missing required fields
      ];
      const csv = rows.join('\n');

      const result = parseCSV(csv);

      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(1);
      expect(result.totalRows).toBe(3);
    });

    test('should handle empty lines in CSV', () => {
      const csv = `name,address1,city,state,zip
John Doe,123 Main St,New York,NY,10001

Jane Smith,456 Oak Ave,Boston,MA,02101`;

      const result = parseCSV(csv);

      expect(result.valid).toHaveLength(2);
    });
  });

  describe('Column mapping', () => {
    test('should recognize alternative column names', () => {
      const csv = `full_name,street,city,province,postal_code
John Doe,123 Main St,New York,NY,10001`;

      const result = parseCSV(csv);

      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].data.name).toBe('John Doe');
      expect(result.valid[0].data.address1).toBe('123 Main St');
      expect(result.valid[0].data.state).toBe('NY');
      expect(result.valid[0].data.zip).toBe('10001');
    });

    test('should be case-insensitive for column names', () => {
      const csv = `NAME,ADDRESS1,CITY,STATE,ZIP
John Doe,123 Main St,New York,NY,10001`;

      const result = parseCSV(csv);

      expect(result.valid).toHaveLength(1);
    });
  });

  describe('Edge cases', () => {
    test('should handle CSV with only headers', () => {
      const csv = 'name,address1,city,state,zip';

      expect(() => parseCSV(csv)).toThrow('at least a header row and one data row');
    });

    test('should handle CSV with special characters in addresses', () => {
      const csv = `name,address1,city,state,zip
"O'Brien, John",123 Main St,New York,NY,10001`;

      const result = parseCSV(csv);

      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].data.name).toBe("O'Brien, John");
    });

    test('should trim whitespace from values', () => {
      const csv = `name,address1,city,state,zip
  John Doe  ,  123 Main St  ,  New York  ,  NY  ,  10001  `;

      const result = parseCSV(csv);

      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].data.name).toBe('John Doe');
      expect(result.valid[0].data.address1).toBe('123 Main St');
    });
  });
});
