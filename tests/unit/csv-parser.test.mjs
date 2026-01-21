/**
 * @jest-environment node
 */

import { parseCSV, generateCSVTemplate } from '../../src/lib/csv-parser-impl.js';

describe('CSV Parser', () => {
    describe('parseCSV', () => {
        test('should parse valid CSV with standard column names', () => {
            const csv = `name,address1,address2,city,state,zip,country
John Doe,123 Main St,Apt 4B,New York,NY,10001,US
Jane Smith,456 Oak Ave,,Los Angeles,CA,90001,US`;

            const result = parseCSV(csv);

            expect(result.totalRows).toBe(2);
            expect(result.valid).toHaveLength(2);
            expect(result.invalid).toHaveLength(0);

            expect(result.valid[0].data).toEqual({
                name: 'John Doe',
                address1: '123 Main St',
                address2: 'Apt 4B',
                city: 'New York',
                state: 'NY',
                zip: '10001',
                country: 'US',
            });

            expect(result.valid[1].data.name).toBe('Jane Smith');
        });

        test('should handle alternative column names', () => {
            const csv = `full_name,street,addressline2,city,state,zipcode,country
John Doe,123 Main St,Apt 4B,New York,NY,10001,US`;

            const result = parseCSV(csv);

            expect(result.valid).toHaveLength(1);
            expect(result.valid[0].data.name).toBe('John Doe');
            expect(result.valid[0].data.address1).toBe('123 Main St');
            expect(result.valid[0].data.zip).toBe('10001');
        });

        test('should handle empty address2 field', () => {
            const csv = `name,address1,address2,city,state,zip,country
John Doe,123 Main St,,New York,NY,10001,US`;

            const result = parseCSV(csv);

            expect(result.valid).toHaveLength(1);
            expect(result.valid[0].data.address2).toBeUndefined();
        });

        test('should validate ZIP code format', () => {
            const csv = `name,address1,city,state,zip,country
Valid User,123 Main St,New York,NY,10001,US
Invalid ZIP,456 Oak Ave,Los Angeles,CA,invalid,US`;

            const result = parseCSV(csv);

            expect(result.valid).toHaveLength(1);
            expect(result.invalid).toHaveLength(1);
            expect(result.invalid[0].errors).toContain('zip: ZIP code must be in format 12345 or 12345-6789');
        });

        test('should require all mandatory fields', () => {
            const csv = `name,address1,city,state,zip,country
John Doe,123 Main St,New York,NY,10001,US
,456 Oak Ave,Los Angeles,CA,90001,US`;

            const result = parseCSV(csv);

            expect(result.valid).toHaveLength(1);
            expect(result.invalid).toHaveLength(1);
            expect(result.invalid[0].errors.some(e => e.includes('Name is required'))).toBe(true);
        });

        test('should handle quoted values with commas', () => {
            const csv = `name,address1,city,state,zip,country
"Doe, John",123 Main St,New York,NY,10001,US`;

            const result = parseCSV(csv);

            expect(result.valid).toHaveLength(1);
            expect(result.valid[0].data.name).toBe('Doe, John');
        });

        test('should handle escaped quotes', () => {
            const csv = `name,address1,city,state,zip,country
"John ""Jr."" Doe",123 Main St,New York,NY,10001,US`;

            const result = parseCSV(csv);

            expect(result.valid).toHaveLength(1);
            expect(result.valid[0].data.name).toBe('John "Jr." Doe');
        });

        test('should skip empty lines', () => {
            const csv = `name,address1,city,state,zip,country
John Doe,123 Main St,New York,NY,10001,US

Jane Smith,456 Oak Ave,Los Angeles,CA,90001,US`;

            const result = parseCSV(csv);

            expect(result.valid).toHaveLength(2);
            expect(result.totalRows).toBe(3); // Includes empty line
        });

        test('should throw error for missing required columns', () => {
            const csv = `name,city,state,zip
John Doe,New York,NY,10001`;

            expect(() => parseCSV(csv)).toThrow('Missing required columns: address1');
        });

        test('should throw error for empty CSV', () => {
            const csv = ``;

            expect(() => parseCSV(csv)).toThrow('CSV must contain at least a header row and one data row');
        });

        test('should throw error for header-only CSV', () => {
            const csv = `name,address1,city,state,zip,country`;

            expect(() => parseCSV(csv)).toThrow('CSV must contain at least a header row and one data row');
        });

        test('should handle extended ZIP codes', () => {
            const csv = `name,address1,city,state,zip,country
John Doe,123 Main St,New York,NY,10001-1234,US`;

            const result = parseCSV(csv);

            expect(result.valid).toHaveLength(1);
            expect(result.valid[0].data.zip).toBe('10001-1234');
        });

        test('should default country to US when not provided', () => {
            const csv = `name,address1,city,state,zip
John Doe,123 Main St,New York,NY,10001`;

            const result = parseCSV(csv);

            expect(result.valid).toHaveLength(1);
            expect(result.valid[0].data.country).toBe('US');
        });

        test('should track row numbers correctly', () => {
            const csv = `name,address1,city,state,zip,country
John Doe,123 Main St,New York,NY,10001,US
Invalid,456 Oak Ave,Los Angeles,CA,invalid,US
Jane Smith,789 Pine St,Chicago,IL,60601,US`;

            const result = parseCSV(csv);

            expect(result.valid[0].rowNumber).toBe(2);
            expect(result.invalid[0].rowNumber).toBe(3);
            expect(result.valid[1].rowNumber).toBe(4);
        });
    });

    describe('generateCSVTemplate', () => {
        test('should generate valid CSV template', () => {
            const template = generateCSVTemplate();

            expect(template).toContain('name,address1,address2,city,state,zip,country');
            expect(template).toContain('John Doe');
            expect(template).toContain('123 Main St');
            expect(template).toContain('10001');
        });

        test('should be parseable', () => {
            const template = generateCSVTemplate();
            const result = parseCSV(template);

            expect(result.valid).toHaveLength(1);
            expect(result.invalid).toHaveLength(0);
        });
    });
});
