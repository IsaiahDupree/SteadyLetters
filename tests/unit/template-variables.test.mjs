import { describe, it, expect } from '@jest/globals';
import {
  parseTemplateVariables,
  extractTemplateVariables,
  validateTemplateVariables,
  AVAILABLE_VARIABLES,
} from '../../src/lib/template-variables.js';

describe('Template Variable System', () => {
  const mockContext = {
    name: 'John Doe',
    address1: '123 Main St',
    address2: 'Apt 4B',
    city: 'San Francisco',
    state: 'CA',
    zip: '94102',
    country: 'US',
    custom1: 'VIP Customer',
    custom2: 'Account #12345',
    custom3: null,
    custom4: null,
  };

  const mockDate = new Date('2026-02-07T12:00:00Z');

  describe('parseTemplateVariables', () => {
    it('should replace {{name}} with recipient name', () => {
      const template = 'Hello {{name}}, welcome!';
      const result = parseTemplateVariables(template, mockContext);
      expect(result).toBe('Hello John Doe, welcome!');
    });

    it('should replace {{firstName}} with first name', () => {
      const template = 'Hi {{firstName}},';
      const result = parseTemplateVariables(template, mockContext);
      expect(result).toBe('Hi John,');
    });

    it('should replace {{lastName}} with last name', () => {
      const template = 'Dear Mr. {{lastName}},';
      const result = parseTemplateVariables(template, mockContext);
      expect(result).toBe('Dear Mr. Doe,');
    });

    it('should handle names with multiple parts', () => {
      const multiPartName = {
        ...mockContext,
        name: 'Mary Jane Watson Smith',
      };
      const template = '{{firstName}} and {{lastName}}';
      const result = parseTemplateVariables(template, multiPartName);
      expect(result).toBe('Mary and Jane Watson Smith');
    });

    it('should replace {{date}} with formatted date', () => {
      const template = 'Today is {{date}}.';
      const result = parseTemplateVariables(template, mockContext, mockDate);
      expect(result).toBe('Today is February 7, 2026.');
    });

    it('should replace {{month}} with month name', () => {
      const template = 'Happy {{month}}!';
      const result = parseTemplateVariables(template, mockContext, mockDate);
      expect(result).toBe('Happy February!');
    });

    it('should replace {{year}} with year', () => {
      const template = 'Copyright {{year}}';
      const result = parseTemplateVariables(template, mockContext, mockDate);
      expect(result).toBe('Copyright 2026');
    });

    it('should replace {{address}} with full address', () => {
      const template = 'Mailing to: {{address}}';
      const result = parseTemplateVariables(template, mockContext);
      expect(result).toBe('Mailing to: 123 Main St, Apt 4B');
    });

    it('should handle address without address2', () => {
      const noAddress2 = { ...mockContext, address2: null };
      const template = 'Address: {{address}}';
      const result = parseTemplateVariables(template, noAddress2);
      expect(result).toBe('Address: 123 Main St');
    });

    it('should replace {{city}}, {{state}}, {{zip}}', () => {
      const template = '{{city}}, {{state}} {{zip}}';
      const result = parseTemplateVariables(template, mockContext);
      expect(result).toBe('San Francisco, CA 94102');
    });

    it('should replace custom fields', () => {
      const template = 'Status: {{custom1}} - {{custom2}}';
      const result = parseTemplateVariables(template, mockContext);
      expect(result).toBe('Status: VIP Customer - Account #12345');
    });

    it('should replace null custom fields with empty string', () => {
      const template = 'Field3: {{custom3}}, Field4: {{custom4}}';
      const result = parseTemplateVariables(template, mockContext);
      expect(result).toBe('Field3: , Field4: ');
    });

    it('should handle multiple variables in one template', () => {
      const template = `Dear {{firstName}} {{lastName}},

Thank you for your order dated {{date}}.

Shipping to:
{{address}}
{{city}}, {{state}} {{zip}}

Best regards,
The Team`;

      const result = parseTemplateVariables(template, mockContext, mockDate);

      expect(result).toContain('Dear John Doe,');
      expect(result).toContain('February 7, 2026');
      expect(result).toContain('123 Main St, Apt 4B');
      expect(result).toContain('San Francisco, CA 94102');
    });

    it('should handle repeated variables', () => {
      const template = 'Hi {{name}}, {{name}} is a great name!';
      const result = parseTemplateVariables(template, mockContext);
      expect(result).toBe('Hi John Doe, John Doe is a great name!');
    });

    it('should not modify text that looks like variables but is not', () => {
      const template = 'Price: {price} or [name]';
      const result = parseTemplateVariables(template, mockContext);
      expect(result).toBe('Price: {price} or [name]');
    });
  });

  describe('extractTemplateVariables', () => {
    it('should extract all variables from template', () => {
      const template = 'Hello {{name}}, today is {{date}} in {{city}}.';
      const variables = extractTemplateVariables(template);
      expect(variables).toEqual(['{{name}}', '{{date}}', '{{city}}']);
    });

    it('should not duplicate variables', () => {
      const template = '{{name}} and {{name}} again';
      const variables = extractTemplateVariables(template);
      expect(variables).toEqual(['{{name}}']);
    });

    it('should return empty array for template with no variables', () => {
      const template = 'Just plain text.';
      const variables = extractTemplateVariables(template);
      expect(variables).toEqual([]);
    });

    it('should extract custom field variables', () => {
      const template = '{{custom1}} {{custom2}} {{custom3}} {{custom4}}';
      const variables = extractTemplateVariables(template);
      expect(variables).toEqual(['{{custom1}}', '{{custom2}}', '{{custom3}}', '{{custom4}}']);
    });
  });

  describe('validateTemplateVariables', () => {
    it('should validate template with all valid variables', () => {
      const template = 'Hello {{name}}, today is {{date}}.';
      const result = validateTemplateVariables(template);
      expect(result.valid).toBe(true);
      expect(result.invalidVariables).toEqual([]);
    });

    it('should detect invalid variables', () => {
      const template = 'Hello {{invalidVar}}, {{anotherInvalid}}';
      const result = validateTemplateVariables(template);
      expect(result.valid).toBe(false);
      expect(result.invalidVariables).toEqual(['{{invalidVar}}', '{{anotherInvalid}}']);
    });

    it('should validate all available variables as valid', () => {
      const allVariables = AVAILABLE_VARIABLES.map(v => v.key).join(' ');
      const result = validateTemplateVariables(allVariables);
      expect(result.valid).toBe(true);
      expect(result.invalidVariables).toEqual([]);
    });

    it('should validate mixed valid and invalid variables', () => {
      const template = '{{name}} is valid, but {{fakeVar}} is not';
      const result = validateTemplateVariables(template);
      expect(result.valid).toBe(false);
      expect(result.invalidVariables).toEqual(['{{fakeVar}}']);
    });

    it('should validate template with no variables as valid', () => {
      const template = 'Just plain text';
      const result = validateTemplateVariables(template);
      expect(result.valid).toBe(true);
      expect(result.invalidVariables).toEqual([]);
    });
  });

  describe('AVAILABLE_VARIABLES', () => {
    it('should export all expected variables', () => {
      const variableKeys = AVAILABLE_VARIABLES.map(v => v.key);
      expect(variableKeys).toContain('{{name}}');
      expect(variableKeys).toContain('{{firstName}}');
      expect(variableKeys).toContain('{{lastName}}');
      expect(variableKeys).toContain('{{date}}');
      expect(variableKeys).toContain('{{month}}');
      expect(variableKeys).toContain('{{year}}');
      expect(variableKeys).toContain('{{address}}');
      expect(variableKeys).toContain('{{city}}');
      expect(variableKeys).toContain('{{state}}');
      expect(variableKeys).toContain('{{zip}}');
      expect(variableKeys).toContain('{{custom1}}');
      expect(variableKeys).toContain('{{custom2}}');
      expect(variableKeys).toContain('{{custom3}}');
      expect(variableKeys).toContain('{{custom4}}');
    });

    it('should have descriptions for all variables', () => {
      AVAILABLE_VARIABLES.forEach(variable => {
        expect(variable.description).toBeTruthy();
        expect(variable.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty name gracefully', () => {
      const emptyName = { ...mockContext, name: '' };
      const template = 'Hello {{firstName}} {{lastName}}!';
      const result = parseTemplateVariables(template, emptyName);
      expect(result).toBe('Hello  !');
    });

    it('should handle single-word name', () => {
      const singleName = { ...mockContext, name: 'Madonna' };
      const template = '{{firstName}} {{lastName}}';
      const result = parseTemplateVariables(template, singleName);
      expect(result).toBe('Madonna ');
    });

    it('should handle template with special regex characters', () => {
      const context = { ...mockContext, name: 'John (Doe)' };
      const template = 'Name: {{name}}';
      const result = parseTemplateVariables(template, context);
      expect(result).toBe('Name: John (Doe)');
    });

    it('should handle December 31st correctly', () => {
      const newYearsEve = new Date('2025-12-31T23:59:59Z');
      const template = '{{date}} is almost {{year}}';
      const result = parseTemplateVariables(template, mockContext, newYearsEve);
      expect(result).toContain('December 31, 2025');
    });
  });
});
