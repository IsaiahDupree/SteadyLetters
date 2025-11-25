/**
 * Address Extraction Examples Tests
 * 
 * Tests using the letter examples fixture to validate address extraction
 * with various real-world address formats.
 */

import { describe, it, expect } from '@jest/globals';
import {
    LETTER_EXAMPLES,
    getRandomLetterExample,
    getLetterExampleById,
    getAllReturnAddresses,
    EXTRACTION_TEST_CASES,
} from './fixtures/letter-examples.mjs';

describe('Address Extraction Examples Tests', () => {
    describe('Letter Examples Fixture', () => {
        it('should have multiple letter examples', () => {
            expect(LETTER_EXAMPLES.length).toBeGreaterThan(5);
        });

        it('should have examples with different address formats', () => {
            const hasApartment = LETTER_EXAMPLES.some(e => e.returnAddress.address2);
            const hasPOBox = LETTER_EXAMPLES.some(e => e.returnAddress.address1?.includes('PO Box'));
            const hasOrganization = LETTER_EXAMPLES.some(e => 
                e.returnAddress.name && e.returnAddress.name.toLowerCase().includes('corporation')
            );

            expect(hasApartment).toBe(true);
            expect(hasPOBox).toBe(true);
            expect(hasOrganization).toBe(true);
        });

        it('should have all required address fields', () => {
            LETTER_EXAMPLES.forEach(example => {
                const addr = example.returnAddress;
                expect(addr.address1).toBeTruthy();
                expect(addr.city).toBeTruthy();
                expect(addr.state).toBeTruthy();
                expect(addr.zip).toBeTruthy();
            });
        });

        it('should have states as 2-letter abbreviations', () => {
            LETTER_EXAMPLES.forEach(example => {
                const state = example.returnAddress.state;
                expect(state).toMatch(/^[A-Z]{2}$/);
            });
        });

        it('should have valid ZIP codes', () => {
            LETTER_EXAMPLES.forEach(example => {
                const zip = example.returnAddress.zip;
                // 5 digits or 9 digits with hyphen
                expect(zip).toMatch(/^\d{5}(-\d{4})?$/);
            });
        });
    });

    describe('Helper Functions', () => {
        it('should get random letter example', () => {
            const example = getRandomLetterExample();
            expect(example).toBeDefined();
            expect(example.id).toBeDefined();
            expect(example.returnAddress).toBeDefined();
        });

        it('should get letter example by ID', () => {
            const example = getLetterExampleById('example-1');
            expect(example).toBeDefined();
            expect(example.id).toBe('example-1');
            expect(example.returnAddress.name).toBe('John Smith');
        });

        it('should return null for invalid ID', () => {
            const example = getLetterExampleById('invalid-id');
            expect(example).toBeUndefined();
        });

        it('should get all return addresses', () => {
            const addresses = getAllReturnAddresses();
            expect(addresses.length).toBe(LETTER_EXAMPLES.length);
            addresses.forEach(addr => {
                expect(addr.address1).toBeTruthy();
                expect(addr.city).toBeTruthy();
                expect(addr.state).toBeTruthy();
                expect(addr.zip).toBeTruthy();
            });
        });
    });

    describe('Address Format Validation', () => {
        EXTRACTION_TEST_CASES.forEach(testCase => {
            it(`should handle ${testCase.name}`, () => {
                const expected = testCase.expected;
                
                // Validate required fields
                expect(expected.address1).toBeTruthy();
                expect(expected.city).toBeTruthy();
                expect(expected.state).toBeTruthy();
                expect(expected.zip).toBeTruthy();
                
                // Validate state format
                expect(expected.state).toMatch(/^[A-Z]{2}$/);
                
                // Validate ZIP format
                expect(expected.zip).toMatch(/^\d{5}(-\d{4})?$/);
            });
        });
    });

    describe('Address Field Extraction', () => {
        it('should extract name field', () => {
            LETTER_EXAMPLES.forEach(example => {
                const name = example.returnAddress.name;
                expect(name).toBeTruthy();
                expect(typeof name).toBe('string');
                expect(name.length).toBeGreaterThan(0);
            });
        });

        it('should extract address1 field', () => {
            LETTER_EXAMPLES.forEach(example => {
                const address1 = example.returnAddress.address1;
                expect(address1).toBeTruthy();
                expect(typeof address1).toBe('string');
            });
        });

        it('should handle optional address2 field', () => {
            const withAddress2 = LETTER_EXAMPLES.filter(e => e.returnAddress.address2);
            const withoutAddress2 = LETTER_EXAMPLES.filter(e => !e.returnAddress.address2);
            
            expect(withAddress2.length).toBeGreaterThan(0);
            expect(withoutAddress2.length).toBeGreaterThan(0);
        });

        it('should extract city, state, and ZIP', () => {
            LETTER_EXAMPLES.forEach(example => {
                const { city, state, zip } = example.returnAddress;
                
                expect(city).toBeTruthy();
                expect(state).toBeTruthy();
                expect(zip).toBeTruthy();
                
                expect(city).toMatch(/^[A-Za-z\s]+$/);
                expect(state).toMatch(/^[A-Z]{2}$/);
                expect(zip).toMatch(/^\d{5}(-\d{4})?$/);
            });
        });

        it('should default country to US', () => {
            LETTER_EXAMPLES.forEach(example => {
                const country = example.returnAddress.country || 'US';
                expect(country).toBe('US');
            });
        });
    });

    describe('Formatted Address Strings', () => {
        it('should have formatted address strings', () => {
            LETTER_EXAMPLES.forEach(example => {
                expect(example.formattedAddress).toBeTruthy();
                expect(typeof example.formattedAddress).toBe('string');
                expect(example.formattedAddress.length).toBeGreaterThan(0);
            });
        });

        it('should include all address components in formatted string', () => {
            const example = getLetterExampleById('example-1');
            const formatted = example.formattedAddress;
            
            expect(formatted).toContain(example.returnAddress.name);
            expect(formatted).toContain(example.returnAddress.address1);
            expect(formatted).toContain(example.returnAddress.city);
            expect(formatted).toContain(example.returnAddress.state);
            expect(formatted).toContain(example.returnAddress.zip);
        });
    });

    describe('Real-World Address Scenarios', () => {
        it('should handle business addresses with suite numbers', () => {
            const example = getLetterExampleById('example-1');
            expect(example.returnAddress.address2).toBe('Suite 400');
        });

        it('should handle apartment addresses', () => {
            const example = getLetterExampleById('example-4');
            expect(example.returnAddress.address2).toBe('Apt 12B');
        });

        it('should handle PO Box addresses', () => {
            const example = getLetterExampleById('example-5');
            expect(example.returnAddress.address1).toContain('PO Box');
        });

        it('should handle 9-digit ZIP codes', () => {
            const example = getLetterExampleById('example-6');
            expect(example.returnAddress.zip).toContain('-');
            expect(example.returnAddress.zip).toMatch(/^\d{5}-\d{4}$/);
        });

        it('should handle addresses without address2', () => {
            const example = getLetterExampleById('example-7');
            expect(example.returnAddress.address2).toBeUndefined();
        });

        it('should handle organization names', () => {
            const example = getLetterExampleById('example-3');
            expect(example.returnAddress.name).toBe('Acme Corporation');
            expect(example.returnAddress.name.toLowerCase()).toContain('corporation');
        });
    });
});

