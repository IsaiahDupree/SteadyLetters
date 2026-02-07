import { describe, it, expect } from 'vitest';
import {
  checkDuplicate,
  findDuplicates,
  groupDuplicates,
  type RecipientForDuplicateCheck,
} from '@/lib/duplicate-detection';

describe('Duplicate Detection', () => {
  const testRecipient1: RecipientForDuplicateCheck = {
    id: '1',
    name: 'John Smith',
    address1: '123 Main Street',
    city: 'Springfield',
    state: 'IL',
    zip: '62701',
    country: 'US',
  };

  const testRecipient2: RecipientForDuplicateCheck = {
    id: '2',
    name: 'John Smith',
    address1: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    zip: '62701',
    country: 'US',
  };

  const testRecipient3: RecipientForDuplicateCheck = {
    id: '3',
    name: 'Jane Doe',
    address1: '456 Oak Avenue',
    city: 'Chicago',
    state: 'IL',
    zip: '60601',
    country: 'US',
  };

  const testRecipient4: RecipientForDuplicateCheck = {
    id: '4',
    name: 'Jon Smith',
    address1: '123 Main Street Apt 2',
    city: 'Springfield',
    state: 'IL',
    zip: '62701',
    country: 'US',
  };

  describe('checkDuplicate', () => {
    it('should detect exact duplicates with normalized addresses', () => {
      const result = checkDuplicate(testRecipient1, testRecipient2);

      expect(result).not.toBeNull();
      expect(result?.matchType).toBe('exact');
      expect(result?.confidence).toBeGreaterThan(80);
      expect(result?.matchReasons).toContain('Identical names');
    });

    it('should not flag completely different recipients as duplicates', () => {
      const result = checkDuplicate(testRecipient1, testRecipient3);

      expect(result).toBeNull();
    });

    it('should detect likely duplicates with similar names and addresses', () => {
      const result = checkDuplicate(testRecipient1, testRecipient4);

      expect(result).not.toBeNull();
      expect(result?.matchType).toMatch(/likely|possible/);
      expect(result?.matchReasons.length).toBeGreaterThan(0);
    });

    it('should not compare a recipient with itself', () => {
      const result = checkDuplicate(testRecipient1, testRecipient1);

      expect(result).toBeNull();
    });

    it('should handle case-insensitive name matching', () => {
      const upper: RecipientForDuplicateCheck = {
        ...testRecipient1,
        id: '5',
        name: 'JOHN SMITH',
      };

      const result = checkDuplicate(testRecipient1, upper);

      expect(result).not.toBeNull();
      expect(result?.matchReasons).toContain('Identical names');
    });

    it('should normalize street abbreviations', () => {
      const abbreviated: RecipientForDuplicateCheck = {
        ...testRecipient1,
        id: '6',
        address1: '123 Main St',
      };

      const result = checkDuplicate(testRecipient1, abbreviated);

      expect(result).not.toBeNull();
      expect(result?.matchType).toBe('exact');
    });

    it('should handle apartment/suite variations', () => {
      const withApt: RecipientForDuplicateCheck = {
        ...testRecipient1,
        id: '7',
        address1: '123 Main Street Apartment 5',
      };

      const withAptAbbrev: RecipientForDuplicateCheck = {
        ...testRecipient1,
        id: '8',
        address1: '123 Main Street Apt 5',
      };

      const result = checkDuplicate(withApt, withAptAbbrev);

      expect(result).not.toBeNull();
      expect(result?.confidence).toBeGreaterThan(50);
    });

    it('should match recipients with same ZIP code', () => {
      const sameZip: RecipientForDuplicateCheck = {
        id: '9',
        name: 'John Smith',
        address1: '789 Oak Street',
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
        country: 'US',
      };

      const result = checkDuplicate(testRecipient1, sameZip);

      expect(result).not.toBeNull();
      expect(result?.matchReasons).toContain('Same ZIP code');
    });

    it('should handle ZIP+4 codes correctly', () => {
      const zip5: RecipientForDuplicateCheck = {
        ...testRecipient1,
        id: '10',
        zip: '62701',
      };

      const zip9: RecipientForDuplicateCheck = {
        ...testRecipient1,
        id: '11',
        zip: '62701-1234',
      };

      const result = checkDuplicate(zip5, zip9);

      expect(result).not.toBeNull();
      expect(result?.matchReasons).toContain('Same ZIP code');
    });

    it('should detect typos in names', () => {
      const typo: RecipientForDuplicateCheck = {
        ...testRecipient1,
        id: '12',
        name: 'John Smtih', // typo
      };

      const result = checkDuplicate(testRecipient1, typo);

      expect(result).not.toBeNull();
      expect(result?.matchReasons.some(r => r.includes('similar'))).toBe(true);
    });
  });

  describe('findDuplicates', () => {
    it('should find all duplicate pairs in a list', () => {
      const recipients = [
        testRecipient1,
        testRecipient2,
        testRecipient3,
      ];

      const duplicates = findDuplicates(recipients);

      expect(duplicates.length).toBeGreaterThan(0);
      expect(duplicates[0].recipient1.id).toBe(testRecipient1.id);
      expect(duplicates[0].recipient2.id).toBe(testRecipient2.id);
    });

    it('should return empty array when no duplicates exist', () => {
      const recipients = [testRecipient1, testRecipient3];

      const duplicates = findDuplicates(recipients);

      expect(duplicates).toEqual([]);
    });

    it('should handle empty input', () => {
      const duplicates = findDuplicates([]);

      expect(duplicates).toEqual([]);
    });

    it('should handle single recipient', () => {
      const duplicates = findDuplicates([testRecipient1]);

      expect(duplicates).toEqual([]);
    });

    it('should sort duplicates by confidence (highest first)', () => {
      const exactDupe: RecipientForDuplicateCheck = {
        ...testRecipient1,
        id: '13',
      };

      const possibleDupe: RecipientForDuplicateCheck = {
        ...testRecipient1,
        id: '14',
        name: 'Jon Smith',
      };

      const recipients = [
        testRecipient1,
        possibleDupe,
        exactDupe,
      ];

      const duplicates = findDuplicates(recipients);

      expect(duplicates.length).toBeGreaterThan(0);
      // First result should be the exact duplicate
      expect(duplicates[0].matchType).toBe('exact');
    });

    it('should not create duplicate pairs', () => {
      const recipients = [
        testRecipient1,
        testRecipient2,
        testRecipient2, // Duplicate entry
      ];

      const duplicates = findDuplicates(recipients);

      // Should have matches, but not duplicate the same pair
      const pairKeys = new Set();
      for (const match of duplicates) {
        const key = [match.recipient1.id, match.recipient2.id].sort().join('-');
        expect(pairKeys.has(key)).toBe(false);
        pairKeys.add(key);
      }
    });
  });

  describe('groupDuplicates', () => {
    it('should group transitive duplicates together', () => {
      // If A = B and B = C, then A, B, C should be in same group
      const recA: RecipientForDuplicateCheck = {
        id: 'A',
        name: 'John Smith',
        address1: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
        country: 'US',
      };

      const recB: RecipientForDuplicateCheck = {
        id: 'B',
        name: 'John Smith',
        address1: '123 Main Street',
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
        country: 'US',
      };

      const recC: RecipientForDuplicateCheck = {
        id: 'C',
        name: 'J. Smith',
        address1: '123 Main Street',
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
        country: 'US',
      };

      const duplicates = findDuplicates([recA, recB, recC]);
      const groups = groupDuplicates(duplicates);

      // Should have at least one group
      expect(groups.length).toBeGreaterThan(0);

      // The largest group should contain all related recipients
      const largestGroup = groups.reduce((max, group) =>
        group.length > max.length ? group : max
      , groups[0]);

      expect(largestGroup.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle empty input', () => {
      const groups = groupDuplicates([]);

      expect(groups).toEqual([]);
    });

    it('should create separate groups for unrelated duplicates', () => {
      const groupA1: RecipientForDuplicateCheck = {
        id: 'A1',
        name: 'Alice Johnson',
        address1: '100 First St',
        city: 'Boston',
        state: 'MA',
        zip: '02101',
        country: 'US',
      };

      const groupA2: RecipientForDuplicateCheck = {
        ...groupA1,
        id: 'A2',
      };

      const groupB1: RecipientForDuplicateCheck = {
        id: 'B1',
        name: 'Bob Williams',
        address1: '200 Second Ave',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
      };

      const groupB2: RecipientForDuplicateCheck = {
        ...groupB1,
        id: 'B2',
      };

      const duplicates = findDuplicates([groupA1, groupA2, groupB1, groupB2]);
      const groups = groupDuplicates(duplicates);

      // Should have 2 separate groups
      expect(groups.length).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in names', () => {
      const special1: RecipientForDuplicateCheck = {
        id: '20',
        name: "O'Brien, Mary-Jane",
        address1: '123 Main St',
        city: 'Boston',
        state: 'MA',
        zip: '02101',
        country: 'US',
      };

      const special2: RecipientForDuplicateCheck = {
        id: '21',
        name: 'OBrien Mary Jane',
        address1: '123 Main Street',
        city: 'Boston',
        state: 'MA',
        zip: '02101',
        country: 'US',
      };

      const result = checkDuplicate(special1, special2);

      expect(result).not.toBeNull();
    });

    it('should handle very long addresses', () => {
      const long1: RecipientForDuplicateCheck = {
        id: '22',
        name: 'Test User',
        address1: '123456789 Very Long Street Name With Many Words',
        city: 'Longest City Name Ever',
        state: 'MA',
        zip: '02101',
        country: 'US',
      };

      const long2: RecipientForDuplicateCheck = {
        ...long1,
        id: '23',
      };

      const result = checkDuplicate(long1, long2);

      expect(result).not.toBeNull();
      expect(result?.matchType).toBe('exact');
    });

    it('should handle empty address2 fields', () => {
      const withAddress2: RecipientForDuplicateCheck = {
        ...testRecipient1,
        id: '24',
        address2: 'Apt 5',
      };

      const withoutAddress2: RecipientForDuplicateCheck = {
        ...testRecipient1,
        id: '25',
        address2: undefined,
      };

      const result = checkDuplicate(withAddress2, withoutAddress2);

      // Should still detect as duplicate based on other fields
      expect(result).not.toBeNull();
    });

    it('should handle international addresses', () => {
      const canada1: RecipientForDuplicateCheck = {
        id: '26',
        name: 'John Doe',
        address1: '123 Maple Street',
        city: 'Toronto',
        state: 'ON',
        zip: 'M5H 2N2',
        country: 'CA',
      };

      const canada2: RecipientForDuplicateCheck = {
        ...canada1,
        id: '27',
        zip: 'M5H2N2', // No space
      };

      const result = checkDuplicate(canada1, canada2);

      expect(result).not.toBeNull();
      // Canadian postal codes have letters, so ZIP matching logic may differ
      // The key is that it's still detected as a duplicate based on other factors
      expect(result?.confidence).toBeGreaterThan(50);
      expect(result?.matchReasons.length).toBeGreaterThan(0);
    });
  });
});
