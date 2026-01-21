/**
 * Address Validation Library
 *
 * Provides address validation using multiple providers:
 * - USPS Address Validation API (free, requires registration)
 * - Mock validation (for testing)
 * - Extensible for future providers (Smarty, Google, Lob)
 */

/**
 * @typedef {Object} Address
 * @property {string} address1
 * @property {string} [address2]
 * @property {string} city
 * @property {string} state
 * @property {string} zip
 * @property {string} [country]
 */

/**
 * @typedef {Object} ValidatedAddress
 * @property {string} address1
 * @property {string} [address2]
 * @property {string} city
 * @property {string} state
 * @property {string} zip
 * @property {string} [country]
 * @property {boolean} isValid - Whether the address is valid
 * @property {Address} [corrected] - Standardized/corrected address (if available)
 * @property {string[]} [messages] - Validation messages or errors
 * @property {boolean} [deliverable] - DPV (Delivery Point Validation) confirmation
 */

/**
 * Mock provider for testing and development
 */
class MockValidationProvider {
  /**
   * @param {Address} address
   * @returns {Promise<ValidatedAddress>}
   */
  async validateAddress(address) {
    // Simple validation rules for testing
    const isValid = !!(
      address.address1 &&
      address.city &&
      address.state &&
      address.zip.match(/^\d{5}(-\d{4})?$/)
    );

    // Mock: uppercase city/state for standardization
    const corrected = {
      ...address,
      city: address.city.toUpperCase(),
      state: address.state.toUpperCase(),
      zip: address.zip,
      country: address.country || 'US',
    };

    return {
      ...corrected,
      isValid,
      deliverable: isValid,
      messages: isValid ? ['Address format is valid'] : ['Invalid address format'],
    };
  }
}

/**
 * USPS Address Validation Provider
 * Uses the USPS Web Tools API
 *
 * Requirements:
 * - Register at https://www.usps.com/business/web-tools-apis/
 * - Set USPS_USER_ID environment variable
 *
 * Note: The USPS API uses XML and has rate limits.
 * For production, consider upgrading to Smarty or Lob.
 */
class USPSValidationProvider {
  /**
   * @param {string} [userId]
   */
  constructor(userId) {
    this.userId = userId || process.env.USPS_USER_ID || '';
    this.apiUrl = 'https://secure.shippingapis.com/ShippingAPI.dll';

    if (!this.userId) {
      console.warn('USPS_USER_ID not configured. Address validation will use fallback.');
    }
  }

  /**
   * @param {Address} address
   * @returns {Promise<ValidatedAddress>}
   */
  async validateAddress(address) {
    // If no USPS credentials, fall back to basic validation
    if (!this.userId) {
      return this.fallbackValidation(address);
    }

    try {
      // Only validate US addresses
      if (address.country && address.country !== 'US') {
        return this.fallbackValidation(address);
      }

      // Build USPS XML request
      const xmlRequest = this.buildUSPSXML(address);
      const url = `${this.apiUrl}?API=Verify&XML=${encodeURIComponent(xmlRequest)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/xml',
        },
      });

      if (!response.ok) {
        console.error('USPS API error:', response.status);
        return this.fallbackValidation(address);
      }

      const xmlText = await response.text();
      return this.parseUSPSResponse(xmlText, address);
    } catch (error) {
      console.error('USPS validation error:', error);
      return this.fallbackValidation(address);
    }
  }

  /**
   * @param {Address} address
   * @returns {string}
   */
  buildUSPSXML(address) {
    const address2 = address.address2 || '';
    return `
      <AddressValidateRequest USERID="${this.userId}">
        <Address>
          <Address1>${this.escapeXML(address2)}</Address1>
          <Address2>${this.escapeXML(address.address1)}</Address2>
          <City>${this.escapeXML(address.city)}</City>
          <State>${this.escapeXML(address.state)}</State>
          <Zip5>${address.zip.substring(0, 5)}</Zip5>
          <Zip4>${address.zip.length > 5 ? address.zip.substring(6) : ''}</Zip4>
        </Address>
      </AddressValidateRequest>
    `.trim();
  }

  /**
   * @param {string} str
   * @returns {string}
   */
  escapeXML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * @param {string} xmlText
   * @param {Address} originalAddress
   * @returns {ValidatedAddress}
   */
  parseUSPSResponse(xmlText, originalAddress) {
    // Simple XML parsing (in production, use a proper XML parser)
    const hasError = xmlText.includes('<Error>');

    if (hasError) {
      const errorMatch = xmlText.match(/<Description>([^<]+)<\/Description>/);
      const errorMessage = errorMatch ? errorMatch[1] : 'Address validation failed';

      return {
        ...originalAddress,
        isValid: false,
        deliverable: false,
        messages: [errorMessage],
        country: originalAddress.country || 'US',
      };
    }

    // Extract validated address fields
    const address2Match = xmlText.match(/<Address2>([^<]+)<\/Address2>/);
    const address1Match = xmlText.match(/<Address1>([^<]*)<\/Address1>/);
    const cityMatch = xmlText.match(/<City>([^<]+)<\/City>/);
    const stateMatch = xmlText.match(/<State>([^<]+)<\/State>/);
    const zip5Match = xmlText.match(/<Zip5>([^<]+)<\/Zip5>/);
    const zip4Match = xmlText.match(/<Zip4>([^<]*)<\/Zip4>/);

    if (!address2Match || !cityMatch || !stateMatch || !zip5Match) {
      return this.fallbackValidation(originalAddress);
    }

    const corrected = {
      address1: address2Match[1],
      address2: address1Match ? address1Match[1] : undefined,
      city: cityMatch[1],
      state: stateMatch[1],
      zip: zip4Match && zip4Match[1]
        ? `${zip5Match[1]}-${zip4Match[1]}`
        : zip5Match[1],
      country: 'US',
    };

    return {
      ...corrected,
      isValid: true,
      deliverable: true,
      corrected,
      messages: ['Address validated and standardized by USPS'],
    };
  }

  /**
   * @param {Address} address
   * @returns {ValidatedAddress}
   */
  fallbackValidation(address) {
    // Basic format validation as fallback
    const hasRequiredFields = !!(
      address.address1 &&
      address.city &&
      address.state &&
      address.zip
    );

    const zipValid = /^\d{5}(-\d{4})?$/.test(address.zip);
    const isValid = hasRequiredFields && zipValid;

    return {
      ...address,
      isValid,
      deliverable: undefined, // Cannot confirm deliverability without API
      messages: isValid
        ? ['Address format is valid (API validation unavailable)']
        : ['Invalid address format'],
      country: address.country || 'US',
    };
  }
}

/**
 * Main address validation function
 *
 * @param {Address} address - Address to validate
 * @param {'usps' | 'mock'} [provider='usps'] - Validation provider to use
 * @returns {Promise<ValidatedAddress>} Validated address with standardization and deliverability info
 */
export async function validateAddress(address, provider = 'usps') {
  let validationProvider;

  switch (provider) {
    case 'mock':
      validationProvider = new MockValidationProvider();
      break;
    case 'usps':
    default:
      validationProvider = new USPSValidationProvider();
      break;
  }

  return validationProvider.validateAddress(address);
}

/**
 * Batch validate multiple addresses
 *
 * @param {Address[]} addresses - Array of addresses to validate
 * @param {'usps' | 'mock'} [provider='usps'] - Validation provider to use
 * @returns {Promise<ValidatedAddress[]>} Array of validated addresses
 */
export async function validateAddresses(addresses, provider = 'usps') {
  // Validate sequentially to respect API rate limits
  // In production, implement proper rate limiting and batching
  const results = [];

  for (const address of addresses) {
    const result = await validateAddress(address, provider);
    results.push(result);

    // Small delay to avoid rate limiting (for USPS)
    if (provider === 'usps' && addresses.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}
