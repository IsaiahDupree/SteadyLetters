/**
 * Template Variable System
 *
 * Supports dynamic variables in letter templates:
 * - {{name}} - Recipient's name
 * - {{firstName}} - First word of recipient's name
 * - {{lastName}} - Rest of recipient's name after first word
 * - {{date}} - Current date (formatted)
 * - {{month}} - Current month name
 * - {{year}} - Current year
 * - {{custom1}}, {{custom2}}, {{custom3}}, {{custom4}} - Custom fields from recipient
 * - {{address}} - Full recipient address
 * - {{city}} - Recipient's city
 * - {{state}} - Recipient's state
 * - {{zip}} - Recipient's zip code
 */

export const AVAILABLE_VARIABLES = [
  { key: '{{name}}', description: "Recipient's full name" },
  { key: '{{firstName}}', description: "Recipient's first name" },
  { key: '{{lastName}}', description: "Recipient's last name" },
  { key: '{{date}}', description: 'Current date (e.g., January 7, 2026)' },
  { key: '{{month}}', description: 'Current month (e.g., January)' },
  { key: '{{year}}', description: 'Current year (e.g., 2026)' },
  { key: '{{address}}', description: "Recipient's street address" },
  { key: '{{city}}', description: "Recipient's city" },
  { key: '{{state}}', description: "Recipient's state" },
  { key: '{{zip}}', description: "Recipient's zip code" },
  { key: '{{custom1}}', description: 'Custom field 1' },
  { key: '{{custom2}}', description: 'Custom field 2' },
  { key: '{{custom3}}', description: 'Custom field 3' },
  { key: '{{custom4}}', description: 'Custom field 4' },
];

/**
 * Parse a template and replace variables with actual values
 * @param {string} template
 * @param {object} context
 * @param {Date} date
 * @returns {string}
 */
export function parseTemplateVariables(template, context, date = new Date()) {
  let result = template;

  // Extract first and last name
  const nameParts = context.name.trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Format date
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const formattedDate = `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear().toString();

  // Full address
  const fullAddress = context.address2
    ? `${context.address1}, ${context.address2}`
    : context.address1;

  // Variable replacements
  const replacements = {
    '{{name}}': context.name,
    '{{firstName}}': firstName,
    '{{lastName}}': lastName,
    '{{date}}': formattedDate,
    '{{month}}': month,
    '{{year}}': year,
    '{{address}}': fullAddress,
    '{{city}}': context.city,
    '{{state}}': context.state,
    '{{zip}}': context.zip,
    '{{custom1}}': context.custom1 || '',
    '{{custom2}}': context.custom2 || '',
    '{{custom3}}': context.custom3 || '',
    '{{custom4}}': context.custom4 || '',
  };

  // Replace all variables
  for (const [variable, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(escapeRegex(variable), 'g'), value);
  }

  return result;
}

/**
 * Escape special regex characters
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract all variables used in a template
 * @param {string} template
 * @returns {string[]}
 */
export function extractTemplateVariables(template) {
  const regex = /{{(\w+)}}/g;
  const matches = [];
  let match;

  while ((match = regex.exec(template)) !== null) {
    if (!matches.includes(match[0])) {
      matches.push(match[0]);
    }
  }

  return matches;
}

/**
 * Validate that all variables in template are supported
 * @param {string} template
 * @returns {{valid: boolean, invalidVariables: string[]}}
 */
export function validateTemplateVariables(template) {
  const usedVariables = extractTemplateVariables(template);
  const validVariableKeys = AVAILABLE_VARIABLES.map(v => v.key);
  const invalidVariables = usedVariables.filter(
    variable => !validVariableKeys.includes(variable)
  );

  return {
    valid: invalidVariables.length === 0,
    invalidVariables,
  };
}
