# Letter Examples Guide

This guide explains how to use the letter examples for testing the address extraction feature.

## Overview

The letter examples provide realistic test data for validating address extraction from various letter formats. These examples cover:

- Different address formats (business, personal, organization)
- Various address components (apartments, PO Boxes, suites)
- Different ZIP code formats (5-digit and 9-digit)
- Edge cases and variations

## Location

- **Data**: `tests/fixtures/letter-examples.mjs`
- **Images**: `tests/fixtures/letter-images/` (generated)
- **Tests**: `tests/address-extraction-examples.test.mjs`

## Available Examples

### Example 1: Standard Business Letter
- **Name**: John Smith
- **Address**: 123 Main Street, Suite 400
- **Location**: Los Angeles, CA 90210
- **Use Case**: Testing standard business address format

### Example 2: Personal Letter
- **Name**: Sarah Johnson
- **Address**: 456 Oak Avenue
- **Location**: San Francisco, CA 94102
- **Use Case**: Testing simple personal address

### Example 3: Organization Letter
- **Name**: Acme Corporation
- **Address**: 789 Business Park Drive, Building 5
- **Location**: Seattle, WA 98101
- **Use Case**: Testing organization/company names

### Example 4: Apartment Address
- **Name**: Michael Chen
- **Address**: 321 Elm Street, Apt 12B
- **Location**: New York, NY 10001
- **Use Case**: Testing apartment/unit numbers

### Example 5: PO Box Address
- **Name**: Emily Davis
- **Address**: PO Box 1234
- **Location**: Austin, TX 78701
- **Use Case**: Testing PO Box format

### Example 6: Extended ZIP Code
- **Name**: Robert Wilson
- **Address**: 555 Pine Road
- **Location**: Chicago, IL 60601-1234
- **Use Case**: Testing 9-digit ZIP codes

### Example 7: Simple Address
- **Name**: Lisa Anderson
- **Address**: 888 Maple Lane
- **Location**: Boston, MA 02101
- **Use Case**: Testing addresses without address2

## Using in Tests

### Import Examples

```javascript
import {
    LETTER_EXAMPLES,
    getRandomLetterExample,
    getLetterExampleById,
    getAllReturnAddresses,
} from './fixtures/letter-examples.mjs';
```

### Get Specific Example

```javascript
const example = getLetterExampleById('example-1');
console.log(example.returnAddress);
// {
//   name: 'John Smith',
//   address1: '123 Main Street',
//   address2: 'Suite 400',
//   city: 'Los Angeles',
//   state: 'CA',
//   zip: '90210',
//   country: 'US'
// }
```

### Get Random Example

```javascript
const random = getRandomLetterExample();
// Use for randomized testing
```

### Get All Addresses

```javascript
const addresses = getAllReturnAddresses();
// Array of all return addresses
```

## Creating Letter Images

To generate visual letter images for testing:

```bash
node tests/fixtures/create-letter-images.mjs
```

This creates PNG images in `tests/fixtures/letter-images/` with:
- Return address in top-left corner
- Letter content below
- Various formats and styles

## Testing Address Extraction

### Manual Testing

1. Use a letter image from `tests/fixtures/letter-images/`
2. Upload to the address extraction feature
3. Verify extracted address matches expected format
4. Check all fields are populated correctly

### Automated Testing

```javascript
import { EXTRACTION_TEST_CASES } from './fixtures/letter-examples.mjs';

EXTRACTION_TEST_CASES.forEach(testCase => {
    it(`should extract ${testCase.name}`, async () => {
        // Test extraction logic
        const extracted = await extractAddress(testCase.input);
        expect(extracted).toMatchObject(testCase.expected);
    });
});
```

## Address Format Validation

All examples follow these rules:

- **State**: 2-letter abbreviation (CA, NY, TX, etc.)
- **ZIP**: 5 digits or 9 digits with hyphen (90210 or 90210-1234)
- **Country**: Defaults to "US"
- **Address2**: Optional (apartments, suites, PO Boxes)

## Expected Extraction Results

When extracting addresses, expect:

```javascript
{
    name: string,        // Required if visible
    address1: string,   // Required
    address2?: string,  // Optional
    city: string,       // Required
    state: string,      // Required (2 letters)
    zip: string,        // Required (5 or 9 digits)
    country?: string    // Optional (defaults to "US")
}
```

## Adding New Examples

To add a new letter example:

1. Edit `tests/fixtures/letter-examples.mjs`
2. Add new entry to `LETTER_EXAMPLES` array
3. Include all required fields
4. Add to `EXTRACTION_TEST_CASES` if needed
5. Regenerate images: `node tests/fixtures/create-letter-images.mjs`

## Notes

- All addresses use US format
- States are normalized to abbreviations
- ZIP codes support both formats
- Examples cover common real-world scenarios
- Use for both unit and integration tests

