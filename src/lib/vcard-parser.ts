/**
 * vCard Parser for importing contacts
 * Supports vCard 3.0 and 4.0 formats
 * Parses contacts from Google Contacts, Outlook, Apple Contacts, etc.
 */

export interface VCardContact {
  name: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  email?: string;
  phone?: string;
}

interface VCardParseResult {
  valid: VCardContact[];
  invalid: Array<{ line: number; error: string; raw: string }>;
  totalContacts: number;
}

/**
 * Parse vCard field value, handling quoted-printable and other encodings
 */
function parseVCardValue(value: string, encoding?: string): string {
  let decoded = value;

  // Handle quoted-printable encoding
  if (encoding === 'QUOTED-PRINTABLE') {
    decoded = value
      .replace(/=\r?\n/g, '') // Remove soft line breaks
      .replace(/=([0-9A-F]{2})/g, (_, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
      });

    // Decode UTF-8 byte sequences
    try {
      const bytes = new Uint8Array(decoded.split('').map(c => c.charCodeAt(0)));
      decoded = new TextDecoder('utf-8').decode(bytes);
    } catch {
      // Fallback if decoding fails
    }
  }

  // Handle escaped characters in vCard
  decoded = decoded
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');

  return decoded.trim();
}

/**
 * Parse a single vCard entry
 */
function parseSingleVCard(vcard: string): VCardContact | null {
  const lines = vcard.split(/\r?\n/);
  const contact: Partial<VCardContact> = {};

  let currentProperty = '';
  let currentValue = '';

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Skip empty lines
    if (!line) continue;

    // Handle line continuation (starts with space or tab) - check raw line, not trimmed
    if (rawLine.length > 0 && (rawLine[0] === ' ' || rawLine[0] === '\t')) {
      // Remove the continuation character and append (without space)
      currentValue += line;
      continue;
    }

    // Process the previous property if it exists
    if (currentProperty) {
      processVCardProperty(contact, currentProperty, currentValue);
    }

    // Parse new property
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    currentProperty = line.substring(0, colonIndex);
    currentValue = line.substring(colonIndex + 1);
  }

  // Process the last property
  if (currentProperty) {
    processVCardProperty(contact, currentProperty, currentValue);
  }

  // Validate that we have at least a name
  if (!contact.name && !contact.firstName && !contact.lastName) {
    return null;
  }

  // Build full name if not provided
  if (!contact.name && (contact.firstName || contact.lastName)) {
    contact.name = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
  }

  return contact as VCardContact;
}

/**
 * Process a single vCard property
 */
function processVCardProperty(
  contact: Partial<VCardContact>,
  property: string,
  value: string
): void {
  // Parse property parameters (e.g., "ADR;TYPE=HOME" or "item1.ADR;TYPE=HOME")
  let [propWithItem, ...params] = property.split(';');

  // Handle item prefix (Apple format: "item1.ADR", "item2.EMAIL")
  const itemMatch = propWithItem.match(/^item\d+\.(.+)$/i);
  const propertyName = itemMatch ? itemMatch[1] : propWithItem;

  const encoding = params.find(p => p.startsWith('ENCODING='))?.split('=')[1];

  const decodedValue = parseVCardValue(value, encoding);

  switch (propertyName.toUpperCase()) {
    case 'FN': // Full Name
      contact.name = decodedValue;
      break;

    case 'N': // Structured Name (Last;First;Middle;Prefix;Suffix)
      {
        const parts = decodedValue.split(';');
        contact.lastName = parts[0] || undefined;
        contact.firstName = parts[1] || undefined;

        // If no FN was provided, build name from N
        if (!contact.name) {
          contact.name = [parts[1], parts[0]].filter(Boolean).join(' ');
        }
      }
      break;

    case 'ADR': // Address (PO Box;Extended;Street;City;State;ZIP;Country)
      {
        const parts = decodedValue.split(';');

        // Standard vCard format: PO Box(0);Extended(1);Street(2);City(3);State(4);ZIP(5);Country(6)
        // Some variants have more parts or different ordering
        // We'll use heuristics to identify apartment vs street

        // Initialize with standard positions
        let street = parts[2]?.trim();
        let extended = parts[1]?.trim();
        let city = parts[3]?.trim();
        let state = parts[4]?.trim();
        let zip = parts[5]?.trim();
        let country = parts[6]?.trim();

        // Handle case where there are 8 parts: pobox;empty;street;apartment;city;state;zip;country
        if (parts.length === 8) {
          const maybe_apartment = parts[3]?.trim();
          if (maybe_apartment && /^(apt|suite|#|ste|unit|apartment)/i.test(maybe_apartment)) {
            extended = maybe_apartment;
            city = parts[4]?.trim();
            state = parts[5]?.trim();
            zip = parts[6]?.trim();
            country = parts[7]?.trim();
          }
        }

        // Heuristic: if extended looks like apartment and street looks like apartment,
        // they might be swapped. Check the pattern.
        const isApartment = (str?: string) => str && /^(apt|suite|#|ste|unit|apartment)/i.test(str);
        const isStreet = (str?: string) => str && /\d/.test(str);

        if (isApartment(street) && isStreet(extended)) {
          // Swap them
          [extended, street] = [street, extended];
        }

        // Combine extended address (apt/suite) and street
        const addressParts = [];
        if (extended) addressParts.push(extended);
        if (street) addressParts.push(street);

        contact.address = addressParts.length > 0 ? addressParts.join(' ') : undefined;
        contact.address2 = undefined;
        contact.city = city || undefined;
        contact.state = state || undefined;
        contact.zip = zip || undefined;
        contact.country = country || undefined;
      }
      break;

    case 'EMAIL':
      if (!contact.email) {
        contact.email = decodedValue;
      }
      break;

    case 'TEL':
      if (!contact.phone) {
        contact.phone = decodedValue.replace(/[^\d+]/g, ''); // Clean phone number
      }
      break;
  }
}

/**
 * Split vCard file content into individual vCard entries
 */
function splitVCards(content: string): string[] {
  const vcards: string[] = [];
  const lines = content.split(/\r?\n/);
  let currentVCard: string[] = [];
  let inVCard = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === 'BEGIN:VCARD') {
      inVCard = true;
      currentVCard = [line];
    } else if (trimmed === 'END:VCARD') {
      currentVCard.push(line);
      vcards.push(currentVCard.join('\n'));
      currentVCard = [];
      inVCard = false;
    } else if (inVCard) {
      currentVCard.push(line);
    }
  }

  return vcards;
}

/**
 * Parse vCard file content into contacts
 * @param vcardContent - Raw vCard file content
 * @returns Parsing result with valid and invalid contacts
 */
export function parseVCard(vcardContent: string): VCardParseResult {
  const result: VCardParseResult = {
    valid: [],
    invalid: [],
    totalContacts: 0,
  };

  if (!vcardContent.trim()) {
    throw new Error('vCard content is empty');
  }

  // Check if it's a valid vCard file
  if (!vcardContent.includes('BEGIN:VCARD')) {
    throw new Error('Invalid vCard format: missing BEGIN:VCARD');
  }

  const vcards = splitVCards(vcardContent);
  result.totalContacts = vcards.length;

  vcards.forEach((vcard, index) => {
    try {
      const contact = parseSingleVCard(vcard);

      if (contact && contact.name) {
        result.valid.push(contact);
      } else {
        result.invalid.push({
          line: index + 1,
          error: 'Missing required field: name',
          raw: vcard.substring(0, 100) + '...',
        });
      }
    } catch (error) {
      result.invalid.push({
        line: index + 1,
        error: error instanceof Error ? error.message : 'Unknown parsing error',
        raw: vcard.substring(0, 100) + '...',
      });
    }
  });

  return result;
}

/**
 * Validate a parsed vCard contact for recipient import
 * @param contact - Parsed vCard contact
 * @returns Validation error message or null if valid
 */
export function validateVCardContact(contact: VCardContact): string | null {
  if (!contact.name || contact.name.trim().length === 0) {
    return 'Name is required';
  }

  // For recipient import, we need at least an address
  // (city, state, zip are optional as they might be added later)
  if (!contact.address && !contact.city) {
    return 'Address or city is required for mail recipients';
  }

  return null;
}

/**
 * Convert vCard contact to recipient format
 */
export function vCardToRecipient(contact: VCardContact): {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
} {
  return {
    name: contact.name,
    address1: contact.address || '',
    address2: contact.address2,
    city: contact.city || '',
    state: contact.state || '',
    zip: contact.zip || '',
    country: contact.country || 'US',
  };
}
