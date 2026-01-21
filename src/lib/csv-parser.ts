import type { RecipientInput } from './validations/recipient';

export interface ParsedRow {
  data: RecipientInput;
  rowNumber: number;
  isValid: boolean;
  errors: string[];
}

export interface ParseResult {
  valid: ParsedRow[];
  invalid: ParsedRow[];
  totalRows: number;
}

// Re-export from the JS implementation for runtime use
export { parseCSV, generateCSVTemplate } from './csv-parser-impl.js';
