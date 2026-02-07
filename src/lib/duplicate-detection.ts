/**
 * Duplicate Recipient Detection
 *
 * Detects potential duplicate recipients based on:
 * - Name similarity (fuzzy matching)
 * - Address normalization (case, spacing, abbreviations)
 * - Partial matches (same person at different addresses)
 */

export interface RecipientForDuplicateCheck {
  id: string;
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface DuplicateMatch {
  recipient1: RecipientForDuplicateCheck;
  recipient2: RecipientForDuplicateCheck;
  matchType: 'exact' | 'likely' | 'possible';
  matchReasons: string[];
  confidence: number; // 0-100
}

/**
 * Normalize a string for comparison
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
}

/**
 * Normalize an address for comparison
 */
function normalizeAddress(address: string): string {
  return normalizeString(address)
    .replace(/\bstreet\b/g, 'st')
    .replace(/\bavenue\b/g, 'ave')
    .replace(/\broad\b/g, 'rd')
    .replace(/\bdrive\b/g, 'dr')
    .replace(/\blane\b/g, 'ln')
    .replace(/\bcourt\b/g, 'ct')
    .replace(/\bcircle\b/g, 'cir')
    .replace(/\bapartment\b/g, 'apt')
    .replace(/\bsuite\b/g, 'ste')
    .replace(/\bnorth\b/g, 'n')
    .replace(/\bsouth\b/g, 's')
    .replace(/\beast\b/g, 'e')
    .replace(/\bwest\b/g, 'w')
    .replace(/\bnorthwest\b/g, 'nw')
    .replace(/\bnortheast\b/g, 'ne')
    .replace(/\bsouthwest\b/g, 'sw')
    .replace(/\bsoutheast\b/g, 'se');
}

/**
 * Calculate Levenshtein distance between two strings
 * (measure of similarity - lower = more similar)
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score (0-100) between two strings
 */
function similarityScore(a: string, b: string): number {
  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 100;
  return Math.round((1 - distance / maxLength) * 100);
}

/**
 * Check if two recipients are duplicates
 */
export function checkDuplicate(
  r1: RecipientForDuplicateCheck,
  r2: RecipientForDuplicateCheck
): DuplicateMatch | null {
  // Don't compare a recipient with itself
  if (r1.id === r2.id) return null;

  const matchReasons: string[] = [];
  let confidence = 0;

  // Normalize all fields
  const name1 = normalizeString(r1.name);
  const name2 = normalizeString(r2.name);
  const addr1 = normalizeAddress(r1.address1);
  const addr2 = normalizeAddress(r2.address1);
  const city1 = normalizeString(r1.city);
  const city2 = normalizeString(r2.city);
  const state1 = normalizeString(r1.state);
  const state2 = normalizeString(r2.state);
  const zip1 = r1.zip.replace(/[^0-9]/g, '');
  const zip2 = r2.zip.replace(/[^0-9]/g, '');

  // Check name similarity
  const nameSimilarity = similarityScore(name1, name2);
  if (nameSimilarity >= 90) {
    matchReasons.push('Identical names');
    confidence += 30;
  } else if (nameSimilarity >= 70) {
    matchReasons.push('Very similar names');
    confidence += 20;
  } else if (nameSimilarity >= 50) {
    matchReasons.push('Similar names');
    confidence += 10;
  }

  // Check address similarity
  const addrSimilarity = similarityScore(addr1, addr2);
  if (addrSimilarity >= 90) {
    matchReasons.push('Identical addresses');
    confidence += 40;
  } else if (addrSimilarity >= 70) {
    matchReasons.push('Very similar addresses');
    confidence += 25;
  } else if (addrSimilarity >= 50) {
    matchReasons.push('Similar addresses');
    confidence += 10;
  }

  // Check city match
  if (city1 === city2) {
    matchReasons.push('Same city');
    confidence += 10;
  }

  // Check state match
  if (state1 === state2) {
    matchReasons.push('Same state');
    confidence += 10;
  }

  // Check ZIP code match (first 5 digits)
  const zip1Short = zip1.substring(0, 5);
  const zip2Short = zip2.substring(0, 5);
  if (zip1Short === zip2Short && zip1Short.length === 5) {
    matchReasons.push('Same ZIP code');
    confidence += 10;
  }

  // Determine match type based on confidence
  let matchType: 'exact' | 'likely' | 'possible' = 'possible';

  if (confidence >= 80) {
    matchType = 'exact';
  } else if (confidence >= 50) {
    matchType = 'likely';
  }

  // Only return matches with at least 40% confidence
  if (confidence < 40 || matchReasons.length === 0) {
    return null;
  }

  return {
    recipient1: r1,
    recipient2: r2,
    matchType,
    matchReasons,
    confidence,
  };
}

/**
 * Find all duplicate recipients in a list
 */
export function findDuplicates(
  recipients: RecipientForDuplicateCheck[]
): DuplicateMatch[] {
  const duplicates: DuplicateMatch[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < recipients.length; i++) {
    for (let j = i + 1; j < recipients.length; j++) {
      const match = checkDuplicate(recipients[i], recipients[j]);

      if (match) {
        // Create a unique key for this pair to avoid duplicates
        const pairKey = [match.recipient1.id, match.recipient2.id].sort().join('-');

        if (!seen.has(pairKey)) {
          duplicates.push(match);
          seen.add(pairKey);
        }
      }
    }
  }

  // Sort by confidence (highest first)
  return duplicates.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Group recipients that are all duplicates of each other
 */
export function groupDuplicates(
  duplicates: DuplicateMatch[]
): RecipientForDuplicateCheck[][] {
  const groups: Map<string, Set<string>> = new Map();

  // Build adjacency graph
  for (const match of duplicates) {
    const id1 = match.recipient1.id;
    const id2 = match.recipient2.id;

    if (!groups.has(id1)) {
      groups.set(id1, new Set([id1]));
    }
    if (!groups.has(id2)) {
      groups.set(id2, new Set([id2]));
    }

    // Merge the two groups
    const group1 = groups.get(id1)!;
    const group2 = groups.get(id2)!;

    const merged = new Set(Array.from(group1).concat(Array.from(group2)));

    for (const id of Array.from(merged)) {
      groups.set(id, merged);
    }
  }

  // Extract unique groups
  const uniqueGroups = new Map<string, Set<string>>();
  for (const [_, group] of Array.from(groups.entries())) {
    const key = Array.from(group).sort().join(',');
    uniqueGroups.set(key, group);
  }

  // Convert to array of recipient arrays
  const allRecipients = new Map<string, RecipientForDuplicateCheck>();
  for (const match of duplicates) {
    allRecipients.set(match.recipient1.id, match.recipient1);
    allRecipients.set(match.recipient2.id, match.recipient2);
  }

  return Array.from(uniqueGroups.values()).map(group =>
    Array.from(group)
      .map(id => allRecipients.get(id))
      .filter((r): r is RecipientForDuplicateCheck => r !== undefined)
  ).filter(group => group.length > 1);
}
