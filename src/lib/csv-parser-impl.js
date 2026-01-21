import { recipientSchema } from './validations/recipient';

/**
 * Expected CSV columns (case-insensitive):
 * - name
 * - address1 (or address, street, address_line_1)
 * - address2 (optional - or address_line_2)
 * - city
 * - state
 * - zip (or zipcode, postal_code, zip_code)
 * - country (optional - defaults to US)
 */
const COLUMN_MAPPINGS = {
  name: ['name', 'full_name', 'fullname', 'recipient'],
  address1: ['address1', 'address', 'street', 'address_line_1', 'addressline1'],
  address2: ['address2', 'address_line_2', 'addressline2'],
  city: ['city'],
  state: ['state', 'province'],
  zip: ['zip', 'zipcode', 'postal_code', 'zip_code', 'postalcode'],
  country: ['country'],
};

function normalizeColumnName(column) {
  const normalized = column.toLowerCase().trim();

  for (const [key, aliases] of Object.entries(COLUMN_MAPPINGS)) {
    if (aliases.includes(normalized)) {
      return key;
    }
  }

  return null;
}

/**
 * Parse CSV text into structured recipient data
 * @param {string} csvText - The CSV content to parse
 * @returns {{ valid: Array, invalid: Array, totalRows: number }}
 */
export function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');

  if (lines.length < 2) {
    throw new Error('CSV must contain at least a header row and one data row');
  }

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  const columnMap = new Map();

  headers.forEach((header, index) => {
    const normalized = normalizeColumnName(header);
    if (normalized) {
      columnMap.set(index, normalized);
    }
  });

  // Verify required columns exist
  const requiredColumns = ['name', 'address1', 'city', 'state', 'zip'];
  const foundColumns = Array.from(columnMap.values());
  const missingColumns = requiredColumns.filter(col => !foundColumns.includes(col));

  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  // Parse data rows
  const valid = [];
  const invalid = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = parseCSVLine(line);
    const rowData = {};

    // Map values to columns
    values.forEach((value, index) => {
      const columnName = columnMap.get(index);
      if (columnName) {
        rowData[columnName] = value.trim();
      }
    });

    // Validate the row
    const result = recipientSchema.safeParse(rowData);

    if (result.success) {
      valid.push({
        data: result.data,
        rowNumber: i + 1,
        isValid: true,
        errors: [],
      });
    } else {
      const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      invalid.push({
        data: rowData,
        rowNumber: i + 1,
        isValid: false,
        errors,
      });
    }
  }

  return {
    valid,
    invalid,
    totalRows: lines.length - 1, // Exclude header
  };
}

/**
 * Parse a single CSV line handling quoted values
 * @param {string} line - A single line from the CSV
 * @returns {string[]}
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add the last field
  result.push(current);

  return result;
}

/**
 * Generate a sample CSV template
 * @returns {string}
 */
export function generateCSVTemplate() {
  const headers = ['name', 'address1', 'address2', 'city', 'state', 'zip', 'country'];
  const exampleRow = [
    'John Doe',
    '123 Main St',
    'Apt 4B',
    'New York',
    'NY',
    '10001',
    'US',
  ];

  return [
    headers.join(','),
    exampleRow.join(','),
  ].join('\n');
}
