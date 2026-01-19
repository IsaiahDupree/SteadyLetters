# Test Fixtures

This directory contains test fixtures and example data for testing the address extraction feature.

## Letter Examples

### `letter-examples.mjs`

Contains sample letter data with return addresses in various formats:

- **Standard business letters** - With suite numbers
- **Personal letters** - Simple addresses
- **Organization letters** - Company names
- **Apartment addresses** - With unit numbers
- **PO Box addresses** - Postal box format
- **9-digit ZIP codes** - Extended ZIP format
- **Various state formats** - Different address styles

### Usage

```javascript
import { LETTER_EXAMPLES, getRandomLetterExample, getLetterExampleById } from './letter-examples.mjs';

// Get all examples
const allExamples = LETTER_EXAMPLES;

// Get random example
const random = getRandomLetterExample();

// Get specific example
const example = getLetterExampleById('example-1');

// Get all return addresses
const addresses = getAllReturnAddresses();
```

## Letter Images

### Creating Letter Images

To generate sample letter images for visual testing:

```bash
node tests/fixtures/create-letter-images.mjs
```

This will create PNG images in `tests/fixtures/letter-images/` with:
- Return addresses in the top-left corner
- Letter content below
- Various address formats

### Using Letter Images in Tests

```javascript
import fs from 'fs';
import path from 'path';

const imagePath = path.join(__dirname, 'fixtures/letter-images/example-1.png');
const imageBuffer = fs.readFileSync(imagePath);
const imageFile = new File([imageBuffer], 'example-1.png', { type: 'image/png' });
```

## Example Letter Formats

### Format 1: Standard Business
```
John Smith
123 Main Street
Suite 400
Los Angeles, CA 90210
```

### Format 2: Personal
```
Sarah Johnson
456 Oak Avenue
San Francisco, CA 94102
```

### Format 3: Organization
```
Acme Corporation
789 Business Park Drive
Building 5
Seattle, WA 98101
```

### Format 4: Apartment
```
Michael Chen
321 Elm Street
Apt 12B
New York, NY 10001
```

### Format 5: PO Box
```
Emily Davis
PO Box 1234
Austin, TX 78701
```

## Testing Address Extraction

Use these examples to test:

1. **Address Parsing** - Verify all fields are extracted correctly
2. **Format Variations** - Test different address styles
3. **Edge Cases** - PO Boxes, apartments, organizations
4. **State Normalization** - Ensure 2-letter abbreviations
5. **ZIP Code Formats** - 5-digit and 9-digit formats

## Notes

- All addresses use US format
- States are normalized to 2-letter abbreviations
- ZIP codes support both 5 and 9-digit formats
- Country defaults to "US" if not specified
- Address2 is optional


