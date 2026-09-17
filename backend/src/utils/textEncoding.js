// Guards every SQL write against the "character with byte sequence ...
// has no equivalent in encoding WIN1252" crash (see
// diagnostics/README.txt). The real, permanent fix is recreating the
// database as UTF8 -- that on-disk encoding can't be changed in place
// (see diagnostics/recreate-db-utf8.js) -- but until that migration
// runs, this keeps normal user input (resumes, profile text, free-text
// answers) from taking the whole request down with a 500.
//
// Ordinary accented Latin text (café, naïve, Zürich, São Paulo) is
// untouched: Windows-1252 and Unicode agree on all of Basic Latin and
// the Latin-1 Supplement block except the 0x80-0x9F range, which is
// where "smart" typography (curly quotes, en/em dashes, ellipsis,
// bullets) and symbols like arrows or checkmarks live -- exactly the
// characters a pasted Word doc or PDF resume tends to carry, and
// exactly what this replaces with a plain-ASCII equivalent.

const REPLACEMENTS = {
  '\u2018': "'", '\u2019': "'", '\u201A': ',', '\u2032': "'", // single quotes/prime
  '\u201C': '"', '\u201D': '"', '\u201E': '"', '\u2033': '"', // double quotes
  '\u2013': '-', '\u2014': '-', '\u2212': '-', // en dash, em dash, minus
  '\u2026': '...', // ellipsis
  '\u2022': '-', '\u25CF': '-', '\u25E6': '-', // bullets
  '\u2192': '->', '\u2190': '<-', '\u2191': '^', '\u2193': 'v',
  '\u2197': '->', '\u2196': '<-', '\u2198': '->', '\u2199': '<-', // arrows
  '\u2713': '', '\u2714': '', '\u2717': '', '\u2718': '', // check/cross marks
  '\u00A0': ' ', // non-breaking space
  '\u2122': '(TM)', '\u00AE': '(R)', '\u00A9': '(C)',
};

// Windows-1252 is identical to Unicode for U+00A0-U+00FF except it has
// no 0x81/0x8D/0x8F/0x90/0x9D code points -- none of those are real
// Unicode characters anyway, so "is this in Basic Latin or Latin-1
// Supplement" is a safe representability test for anything left after
// the explicit swaps above.
function isWin1252Safe(codePoint) {
  return codePoint <= 0xff;
}

function sanitizeForLegacyEncoding(value) {
  if (typeof value !== 'string' || value.length === 0) return value;
  let changed = false;
  let out = '';
  for (const ch of value) {
    if (REPLACEMENTS[ch] !== undefined) {
      out += REPLACEMENTS[ch];
      changed = true;
      continue;
    }
    const codePoint = ch.codePointAt(0);
    if (isWin1252Safe(codePoint)) {
      out += ch;
    } else {
      out += '?';
      changed = true;
    }
  }
  return changed ? out : value;
}

// Applies sanitizeForLegacyEncoding to every string in a params array
// (repositories pass params as a flat array of query bind values),
// leaving numbers/booleans/null/objects (jsonb params) untouched.
function sanitizeParams(params) {
  if (!Array.isArray(params)) return params;
  let changed = false;
  const next = params.map((p) => {
    if (typeof p !== 'string') return p;
    const sanitized = sanitizeForLegacyEncoding(p);
    if (sanitized !== p) changed = true;
    return sanitized;
  });
  return changed ? next : params;
}

module.exports = { sanitizeForLegacyEncoding, sanitizeParams };
