import { describe, it, expect } from 'vitest';
import {
  parseVCard,
  validateVCardContact,
  vCardToRecipient,
  type VCardContact,
} from '@/lib/vcard-parser';

describe('vCard Parser', () => {
  describe('parseVCard', () => {
    it('should parse a simple vCard 3.0', () => {
      const vcard = `BEGIN:VCARD
VERSION:3.0
FN:John Doe
N:Doe;John;;;
ADR;TYPE=HOME:;;123 Main Street;Springfield;IL;62701;US
EMAIL:john.doe@example.com
TEL:+1-555-123-4567
END:VCARD`;

      const result = parseVCard(vcard);

      expect(result.totalContacts).toBe(1);
      expect(result.valid).toHaveLength(1);
      expect(result.invalid).toHaveLength(0);

      const contact = result.valid[0];
      expect(contact.name).toBe('John Doe');
      expect(contact.firstName).toBe('John');
      expect(contact.lastName).toBe('Doe');
      expect(contact.address).toBe('123 Main Street');
      expect(contact.city).toBe('Springfield');
      expect(contact.state).toBe('IL');
      expect(contact.zip).toBe('62701');
      expect(contact.country).toBe('US');
      expect(contact.email).toBe('john.doe@example.com');
      expect(contact.phone).toBe('+15551234567');
    });

    it('should parse vCard 4.0', () => {
      const vcard = `BEGIN:VCARD
VERSION:4.0
FN:Jane Smith
N:Smith;Jane;Marie;;
ADR;TYPE=home:;;456 Oak Avenue;Portland;OR;97201;USA
EMAIL;TYPE=work:jane.smith@company.com
TEL;TYPE=cell:555-987-6543
END:VCARD`;

      const result = parseVCard(vcard);

      expect(result.valid).toHaveLength(1);
      const contact = result.valid[0];
      expect(contact.name).toBe('Jane Smith');
      expect(contact.firstName).toBe('Jane');
      expect(contact.lastName).toBe('Smith');
      expect(contact.address).toBe('456 Oak Avenue');
      expect(contact.city).toBe('Portland');
      expect(contact.state).toBe('OR');
      expect(contact.zip).toBe('97201');
      expect(contact.country).toBe('USA');
    });

    it('should parse multiple vCards', () => {
      const vcards = `BEGIN:VCARD
VERSION:3.0
FN:John Doe
N:Doe;John;;;
ADR:;;123 Main St;Springfield;IL;62701;US
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:Jane Smith
N:Smith;Jane;;;
ADR:;;456 Oak Ave;Portland;OR;97201;US
END:VCARD`;

      const result = parseVCard(vcards);

      expect(result.totalContacts).toBe(2);
      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(0);

      expect(result.valid[0].name).toBe('John Doe');
      expect(result.valid[1].name).toBe('Jane Smith');
    });

    it('should handle vCard with only FN (no N field)', () => {
      const vcard = `BEGIN:VCARD
VERSION:3.0
FN:Bob Johnson
ADR:;;789 Elm St;Boston;MA;02101;US
END:VCARD`;

      const result = parseVCard(vcard);

      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].name).toBe('Bob Johnson');
    });

    it('should handle vCard with only N field (no FN)', () => {
      const vcard = `BEGIN:VCARD
VERSION:3.0
N:Anderson;Alice;;;
ADR:;;321 Pine St;Seattle;WA;98101;US
END:VCARD`;

      const result = parseVCard(vcard);

      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].name).toBe('Alice Anderson');
      expect(result.valid[0].firstName).toBe('Alice');
      expect(result.valid[0].lastName).toBe('Anderson');
    });

    it('should handle escaped characters', () => {
      const vcard = `BEGIN:VCARD
VERSION:3.0
FN:O'Brien\\, Patrick
N:O'Brien;Patrick;;;
ADR:;;123\\, Main Street\\nApt 4B;New York;NY;10001;US
END:VCARD`;

      const result = parseVCard(vcard);

      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].name).toBe("O'Brien, Patrick");
      expect(result.valid[0].address).toContain('123, Main Street');
    });

    it('should handle line continuations', () => {
      const vcard = `BEGIN:VCARD
VERSION:3.0
FN:John
  Doe
ADR:;;123 Main
  Street;Springfield;IL;62701;US
END:VCARD`;

      const result = parseVCard(vcard);

      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].name).toBe('JohnDoe');
      expect(result.valid[0].address).toContain('123 MainStreet');
    });

    it('should handle quoted-printable encoding', () => {
      const vcard = `BEGIN:VCARD
VERSION:3.0
FN;ENCODING=QUOTED-PRINTABLE:M=C3=BCller
N;ENCODING=QUOTED-PRINTABLE:M=C3=BCller;Hans;;;
ADR:;;Hauptstra=C3=9Fe 1;Berlin;;10115;DE
END:VCARD`;

      const result = parseVCard(vcard);

      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].name).toBe('Müller');
      expect(result.valid[0].lastName).toBe('Müller');
    });

    it('should handle address with extended field (apartment)', () => {
      const vcard = `BEGIN:VCARD
VERSION:3.0
FN:Alice Cooper
ADR:;;100 Broadway;Apt 5B;New York;NY;10005;US
END:VCARD`;

      const result = parseVCard(vcard);

      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].address).toBe('Apt 5B 100 Broadway');
    });

    it('should mark vCard without name as invalid', () => {
      const vcard = `BEGIN:VCARD
VERSION:3.0
ADR:;;123 Main St;Springfield;IL;62701;US
EMAIL:noemail@example.com
END:VCARD`;

      const result = parseVCard(vcard);

      expect(result.totalContacts).toBe(1);
      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].error).toContain('name');
    });

    it('should handle empty vCard content', () => {
      expect(() => parseVCard('')).toThrow('vCard content is empty');
    });

    it('should handle invalid vCard format', () => {
      expect(() => parseVCard('This is not a vCard')).toThrow('Invalid vCard format');
    });

    it('should handle Google Contacts export format', () => {
      const vcard = `BEGIN:VCARD
VERSION:3.0
N:Doe;John;;;
FN:John Doe
EMAIL;TYPE=INTERNET;TYPE=HOME:john@gmail.com
TEL;TYPE=CELL:+1-555-1234567
ADR;TYPE=HOME:;;123 Main Street;Springfield;Illinois;62701;United States
END:VCARD`;

      const result = parseVCard(vcard);

      expect(result.valid).toHaveLength(1);
      const contact = result.valid[0];
      expect(contact.name).toBe('John Doe');
      expect(contact.address).toBe('123 Main Street');
      expect(contact.city).toBe('Springfield');
      expect(contact.state).toBe('Illinois');
      expect(contact.zip).toBe('62701');
      expect(contact.country).toBe('United States');
    });

    it('should handle Apple Contacts export format', () => {
      const vcard = `BEGIN:VCARD
VERSION:3.0
PRODID:-//Apple Inc.//Mac OS X 10.15.7//EN
N:Smith;Jane;;;
FN:Jane Smith
item1.ADR;type=HOME;type=pref:;;456 Oak Ave;Portland;OR;97201;US
item1.X-ABADR:us
TEL;type=CELL;type=VOICE;type=pref:(555) 987-6543
END:VCARD`;

      const result = parseVCard(vcard);

      expect(result.valid).toHaveLength(1);
      const contact = result.valid[0];
      expect(contact.name).toBe('Jane Smith');
      expect(contact.address).toBe('456 Oak Ave');
      expect(contact.city).toBe('Portland');
    });

    it('should handle Outlook export format', () => {
      const vcard = `BEGIN:VCARD
VERSION:2.1
N;LANGUAGE=en-us:Doe;John
FN:John Doe
EMAIL;PREF;INTERNET:john@outlook.com
TEL;CELL:555-123-4567
ADR;WORK:;;One Microsoft Way;Redmond;WA;98052;USA
END:VCARD`;

      const result = parseVCard(vcard);

      expect(result.valid).toHaveLength(1);
      const contact = result.valid[0];
      expect(contact.name).toBe('John Doe');
      expect(contact.address).toBe('One Microsoft Way');
    });
  });

  describe('validateVCardContact', () => {
    it('should validate a complete contact', () => {
      const contact: VCardContact = {
        name: 'John Doe',
        address: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
        country: 'US',
      };

      expect(validateVCardContact(contact)).toBeNull();
    });

    it('should reject contact without name', () => {
      const contact: VCardContact = {
        name: '',
        address: '123 Main St',
        city: 'Springfield',
      };

      const error = validateVCardContact(contact);
      expect(error).toContain('Name is required');
    });

    it('should reject contact without address or city', () => {
      const contact: VCardContact = {
        name: 'John Doe',
      };

      const error = validateVCardContact(contact);
      expect(error).toContain('Address or city is required');
    });

    it('should accept contact with only city (no address)', () => {
      const contact: VCardContact = {
        name: 'John Doe',
        city: 'Springfield',
      };

      expect(validateVCardContact(contact)).toBeNull();
    });

    it('should accept contact with only address (no city)', () => {
      const contact: VCardContact = {
        name: 'John Doe',
        address: '123 Main St',
      };

      expect(validateVCardContact(contact)).toBeNull();
    });
  });

  describe('vCardToRecipient', () => {
    it('should convert complete vCard contact to recipient', () => {
      const contact: VCardContact = {
        name: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        address: '123 Main St',
        address2: 'Apt 4B',
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
        country: 'US',
        email: 'john@example.com',
        phone: '+15551234567',
      };

      const recipient = vCardToRecipient(contact);

      expect(recipient).toEqual({
        name: 'John Doe',
        address1: '123 Main St',
        address2: 'Apt 4B',
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
        country: 'US',
      });
    });

    it('should default country to US if not provided', () => {
      const contact: VCardContact = {
        name: 'John Doe',
        address: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
      };

      const recipient = vCardToRecipient(contact);

      expect(recipient.country).toBe('US');
    });

    it('should handle missing optional fields', () => {
      const contact: VCardContact = {
        name: 'Jane Smith',
        city: 'Portland',
      };

      const recipient = vCardToRecipient(contact);

      expect(recipient.name).toBe('Jane Smith');
      expect(recipient.address1).toBe('');
      expect(recipient.address2).toBeUndefined();
      expect(recipient.city).toBe('Portland');
      expect(recipient.state).toBe('');
      expect(recipient.zip).toBe('');
      expect(recipient.country).toBe('US');
    });
  });
});
