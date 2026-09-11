/**
 * Intelligent normalization pipeline for form field questions, labels, and aliases.
 * Handles case, punctuation, hyphens, abbreviations (No., Num., Mob., etc.),
 * and parenthetical noise.
 */

// Common parenthetical/bracketed instructional notes to clean
const PARENTHETICAL_NOISE_REGEX = /\((?:optional|required|mandatory|digits only|numbers only|with country code|including country code|e\.?g\.?[^)]*|ex\.?[^)]*|in lpa|in usd|in days|annual|total|as per passport|as in passport|as shown on passport)\)/gi;

/**
 * Expands common abbreviations in form questions before tokenization.
 * Examples:
 * - "Contact No." -> "Contact number"
 * - "Mobile No" -> "Mobile number"
 * - "CONTACT-NUMBER" -> "contact number"
 * - "Passport No." -> "Passport number"
 * - "Mob. No." -> "Mobile number"
 */
export function expandAbbreviations(text: string): string {
  if (!text) return '';
  let s = text;

  // Replace '#' with ' number '
  s = s.replace(/#/g, ' number ');

  // Dot-based abbreviations
  s = s.replace(/\bno\./gi, 'number');
  s = s.replace(/\bnum\./gi, 'number');
  s = s.replace(/\bnbr\./gi, 'number');
  s = s.replace(/\bmob\./gi, 'mobile');
  s = s.replace(/\btel\./gi, 'telephone');
  s = s.replace(/\bph\./gi, 'phone');
  s = s.replace(/\byrs?\./gi, 'years');
  s = s.replace(/\bexp\./gi, 'experience');
  s = s.replace(/\borg\./gi, 'organization');
  s = s.replace(/\buniv\./gi, 'university');
  s = s.replace(/\binst\./gi, 'institution');
  s = s.replace(/\bgrad\./gi, 'graduation');
  s = s.replace(/\bdept\./gi, 'department');
  s = s.replace(/\bpos\./gi, 'position');
  s = s.replace(/\baddr\./gi, 'address');
  s = s.replace(/\bapt\./gi, 'apartment');
  s = s.replace(/\bste\./gi, 'suite');

  // Contextual word abbreviations without trailing dot:
  // e.g. "contact no", "mobile no", "phone no", "passport no", "cell no", "tel no"
  s = s.replace(
    /\b(contact|phone|mobile|cell|telephone|tel|mob|passport|pin|zip|id|doc|document|ref|serial)\s+no\b/gi,
    '$1 number'
  );

  // Standalone common abbreviations:
  s = s.replace(/\bnum\b/gi, 'number');
  s = s.replace(/\bmob\b/gi, 'mobile');
  s = s.replace(/\byrs\b/gi, 'years');

  return s;
}

/**
 * Standard question text normalization:
 * - Expands abbreviations
 * - Converts to lower case
 * - Replaces non-alphanumeric punctuation and hyphens with spaces
 * - Collapses multiple spaces and trims
 */
export function normalizeQuestionText(text: string): string {
  if (!text) return '';
  const expanded = expandAbbreviations(text);
  return expanded
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Cleans parenthetical and bracketed instructional noise from question text.
 * e.g. "Contact Number (with country code)" -> "contact number"
 * e.g. "Notice Period (in days)" -> "notice period"
 */
export function cleanQuestionNoise(text: string): string {
  if (!text) return '';
  const cleaned = text.replace(PARENTHETICAL_NOISE_REGEX, ' ');
  return normalizeQuestionText(cleaned);
}
