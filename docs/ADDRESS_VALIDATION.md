# Address Validation System

## Overview

The SteadyLetters address validation system ensures that all recipient addresses are valid and deliverable before creating recipients or sending mail orders. This reduces failed deliveries, saves costs, and improves user experience.

## Architecture

### Provider-Based Design

The system uses a provider-based architecture that supports multiple validation services:

- **USPS Provider** - Production address validation using USPS Web Tools API
- **Mock Provider** - Development and testing with simulated validation
- **Extensible** - Easy to add new providers (Smarty Streets, Lob, Google, etc.)

### Core Components

```
src/lib/address-validation.js       # Main validation library
src/app/actions/recipients.ts       # Recipient creation with validation
src/app/actions/orders.ts           # Order creation with validation
tests/unit/address-validation.test.mjs  # Comprehensive unit tests
```

## Usage

### Basic Validation

```javascript
import { validateAddress } from '@/lib/address-validation.js';

const address = {
  address1: '123 Main St',
  city: 'San Francisco',
  state: 'CA',
  zip: '94102',
};

const result = await validateAddress(address);

if (result.isValid) {
  console.log('Address is valid');
  if (result.corrected) {
    // USPS standardized the address
    console.log('Standardized:', result.corrected);
  }
} else {
  console.error('Invalid address:', result.messages);
}
```

### Batch Validation

```javascript
import { validateAddresses } from '@/lib/address-validation.js';

const addresses = [
  { address1: '123 Main St', city: 'SF', state: 'CA', zip: '94102' },
  { address1: '456 Market St', city: 'SF', state: 'CA', zip: '94105' },
];

const results = await validateAddresses(addresses);

results.forEach((result, index) => {
  console.log(`Address ${index + 1}:`, result.isValid ? 'Valid' : 'Invalid');
});
```

## Configuration

### USPS API Setup

1. Register for USPS Web Tools at https://www.usps.com/business/web-tools-apis/
2. Obtain your USPS User ID
3. Add to environment variables:

```env
USPS_USER_ID=your-usps-user-id
```

### Fallback Mode

When `USPS_USER_ID` is not configured, the system automatically falls back to format validation:
- Validates required fields (address1, city, state, zip)
- Checks ZIP code format (12345 or 12345-6789)
- Does not verify deliverability

## Integration Points

### 1. Recipient Creation

When creating a recipient, addresses are validated:

```typescript
// src/app/actions/recipients.ts
const validationResult = await validateAddress(data);

if (!validationResult.isValid) {
  return {
    success: false,
    error: `Address validation failed: ${validationResult.messages[0]}`
  };
}

// Use corrected address if available
const addressToSave = validationResult.corrected || data;
```

### 2. Order Creation

Before sending an order, the recipient's address is validated:

```typescript
// src/app/actions/orders.ts
const validationResult = await validateAddress(recipientAddress);

if (!validationResult.isValid || validationResult.deliverable === false) {
  return {
    success: false,
    error: 'Cannot send to invalid address'
  };
}
```

### 3. Bulk Import

CSV imports validate all addresses before creating recipients:

```typescript
// Invalid addresses are reported with row numbers
// Valid addresses are standardized and imported
// Returns summary: { imported: 5, failed: 2, errors: [...] }
```

## API Response Structure

### ValidatedAddress

```typescript
{
  address1: string;         // Street address
  address2?: string;        // Apartment, suite, etc.
  city: string;             // City name
  state: string;            // State code (e.g., "CA")
  zip: string;              // ZIP code (5 or 9 digit)
  country?: string;         // Country code (default: "US")
  isValid: boolean;         // Whether the address is valid
  deliverable?: boolean;    // USPS delivery confirmation (if available)
  corrected?: Address;      // USPS standardized address (if different)
  messages?: string[];      // Validation messages or errors
}
```

## USPS API Details

### How It Works

1. Sends address to USPS Web Tools API
2. USPS validates against their database
3. Returns standardized address or error
4. Supports ZIP+4 enhancement

### Example Request

```xml
<AddressValidateRequest USERID="your-user-id">
  <Address>
    <Address1></Address1>
    <Address2>123 MAIN ST</Address2>
    <City>SAN FRANCISCO</City>
    <State>CA</State>
    <Zip5>94102</Zip5>
    <Zip4></Zip4>
  </Address>
</AddressValidateRequest>
```

### Example Response

```xml
<AddressValidateResponse>
  <Address>
    <Address2>123 MAIN ST</Address2>
    <City>SAN FRANCISCO</City>
    <State>CA</State>
    <Zip5>94102</Zip5>
    <Zip4>1234</Zip4>
  </Address>
</AddressValidateResponse>
```

## Testing

### Run Unit Tests

```bash
npm test -- tests/unit/address-validation.test.mjs
```

### Test Coverage

- ✅ Mock provider validation
- ✅ Invalid ZIP code handling
- ✅ Missing required fields
- ✅ ZIP+4 format support
- ✅ Optional address2 field
- ✅ Country defaulting
- ✅ USPS fallback mode
- ✅ Batch validation
- ✅ Edge cases

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Address Not Found" | USPS can't locate address | Verify address with user |
| "Invalid ZIP code" | Wrong format | Use 5 or 9 digit ZIP |
| "Invalid address format" | Missing required fields | Complete all fields |
| "API validation unavailable" | No USPS credentials | Add USPS_USER_ID or use fallback |

### Graceful Degradation

The system handles errors gracefully:
- Network errors → fallback to format validation
- API errors → fallback to format validation
- Non-US addresses → fallback to format validation
- Missing credentials → fallback to format validation

## Future Enhancements

### Commercial Providers

Consider upgrading to commercial services for production:

**Smarty Streets (Recommended)**
- More reliable than USPS
- Better error messages
- International support
- Higher rate limits

**Lob Address Verification**
- Specialized for mail services
- Good integration with Thanks.io
- Competitive pricing

**Google Address Validation API**
- Global coverage
- Auto-complete support
- Part of Google Maps Platform

### Adding a New Provider

1. Create a new provider class:

```javascript
class SmartyValidationProvider {
  async validateAddress(address) {
    // Implement validation logic
    return validatedAddress;
  }
}
```

2. Add to the provider factory:

```javascript
export async function validateAddress(address, provider = 'usps') {
  switch (provider) {
    case 'smarty':
      validationProvider = new SmartyValidationProvider();
      break;
    // ...
  }
}
```

## Performance Considerations

### Rate Limiting

- USPS API has rate limits
- Batch validation includes delays between requests
- Consider caching validation results

### Optimization Tips

1. **Cache Results** - Store validated addresses
2. **Batch Processing** - Validate multiple addresses in one session
3. **Async Validation** - Don't block UI during validation
4. **Skip Re-validation** - Don't validate unchanged addresses

## Security

### Best Practices

- ✅ USPS_USER_ID stored in environment variables
- ✅ No sensitive data logged
- ✅ Input sanitization (XML escaping)
- ✅ Error messages don't leak system details

## Monitoring

### Metrics to Track

- Validation success rate
- USPS API response time
- Fallback usage frequency
- Failed delivery correlation

### Logging

The system logs:
- USPS API errors
- Validation failures
- Fallback mode usage

## Support

### Troubleshooting

**Problem**: All validations failing
- **Solution**: Check USPS_USER_ID configuration

**Problem**: Slow validation
- **Solution**: USPS API may be slow; consider caching

**Problem**: Address corrected unexpectedly
- **Solution**: USPS standardizes addresses; review corrected format

### Resources

- [USPS Web Tools Documentation](https://www.usps.com/business/web-tools-apis/)
- [USPS Address Standards](https://pe.usps.com/text/pub28/welcome.htm)
- [Smarty Streets](https://www.smarty.com/)
- [Lob Address Verification](https://www.lob.com/address-verification)

---

**Last Updated**: January 2026
**Feature ID**: FUTURE-004
**Status**: ✅ Complete
