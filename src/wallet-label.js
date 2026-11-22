// Optional user label for the PDF wallet (theQRL/offline-wallet-generator#15).
//
// This is the only free text a user can put into anything the tool produces,
// so it is validated by allowlist, not by escaping or stripping:
//
// - Only printable ASCII letters, digits, space and a small punctuation set
//   are accepted. That excludes everything with a meaning to the outputs it
//   could reach: PDF string delimiters and escapes ( ) \, the PDF comment
//   marker %, HTML metacharacters < > " `, control characters and newlines,
//   and all non-ASCII — which takes out bidi overrides (U+202E and friends,
//   which can visually reorder text such as an address), zero-width and
//   homoglyph characters, and glyphs jsPDF's built-in fonts cannot render.
// - Input that fails is rejected with a message, never silently altered: a
//   label that prints differently from what was typed is its own problem on
//   a document people keep for years.
// - The only normalisation is trimming and collapsing runs of spaces, which
//   cannot change what is printed in any meaningful way.
//
// The label is only ever passed to jsPDF's text() as a plain string. It must
// not be put into HTML, a filename, the JSON wallet or browser storage
// without re-reviewing this allowlist for that output.

export const MAX_WALLET_LABEL_LENGTH = 48;

export const WALLET_LABEL_ALLOWED_PUNCTUATION = "-_.,:;#'/&+!?@";

// Built from the constant above so the error message and the check cannot
// drift apart. Every punctuation character is escaped inside the class.
const ALLOWED = new RegExp(
  `^[A-Za-z0-9 ${WALLET_LABEL_ALLOWED_PUNCTUATION.replace(/[\\\]^-]/g, '\\$&')}]*$`,
);

export const WALLET_LABEL_RULES = `Letters, numbers, spaces and ${
  WALLET_LABEL_ALLOWED_PUNCTUATION.split('').join(' ')
} only, up to ${MAX_WALLET_LABEL_LENGTH} characters.`;

// Returns { valid: true, value } with the label to print ('' for none), or
// { valid: false, error }.
export function validateWalletLabel(input) {
  if (input === undefined || input === null) return { valid: true, value: '' };
  if (typeof input !== 'string') return { valid: false, error: 'Label must be text.' };

  // Checked before any normalisation so nothing is hidden by it.
  if (!ALLOWED.test(input)) {
    return { valid: false, error: `Label contains characters that are not allowed. ${WALLET_LABEL_RULES}` };
  }

  const value = input.trim().replace(/ {2,}/g, ' ');
  if (value.length > MAX_WALLET_LABEL_LENGTH) {
    return { valid: false, error: `Label is too long. ${WALLET_LABEL_RULES}` };
  }
  return { valid: true, value };
}
