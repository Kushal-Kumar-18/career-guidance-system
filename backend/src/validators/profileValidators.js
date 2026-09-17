const ApiError = require('../utils/ApiError');

const MAX_TEXT_LEN = 2000; // generous ceiling for skills/interests/etc free text
const MAX_SHORT_LEN = 255;

const TEXT_FIELDS = ['education', 'skills', 'interests', 'certifications', 'projects'];
const SHORT_FIELDS = ['preferred_location', 'salary_expectation'];

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

// `experience_years` maps to an INTEGER column. Previously an empty
// string fell straight through validation and was handed to Postgres as
// '' for an INTEGER parameter, which raised 22P02 (invalid input syntax)
// and surfaced as a 500 on PUT /api/profile -- the exact failure seen
// when applying resume-extracted details. A blank/absent value now
// normalizes to null, and fractional values are rounded so a guess like
// 2.5 can never reach the INTEGER column untouched either.
function normalizeExperienceYears(value) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return NaN; // caller reports a validation error
  return Math.round(Math.min(Math.max(n, 0), 80));
}

// Validates the body of PUT /api/profile. Every field is optional (a
// user may update just one at a time), but whatever IS sent must be the
// right shape. Only keys actually present in the request are returned,
// so a partial update never blanks out the fields it didn't mention.
function validateProfileUpdate(body) {
  const errors = {};
  const src = body || {};
  const out = {};

  for (const key of TEXT_FIELDS) {
    if (!(key in src)) continue;
    const value = src[key];
    if (value === null || value === undefined) {
      out[key] = null;
      continue;
    }
    if (typeof value !== 'string') {
      errors[key] = `${key} must be a string.`;
    } else if (value.length > MAX_TEXT_LEN) {
      errors[key] = `${key} must be ${MAX_TEXT_LEN} characters or fewer.`;
    } else {
      out[key] = value;
    }
  }

  for (const key of SHORT_FIELDS) {
    if (!(key in src)) continue;
    const value = src[key];
    if (value === null || value === undefined) {
      out[key] = null;
      continue;
    }
    if (typeof value !== 'string') {
      errors[key] = `${key} must be a string.`;
    } else if (value.length > MAX_SHORT_LEN) {
      errors[key] = `${key} must be ${MAX_SHORT_LEN} characters or fewer.`;
    } else {
      out[key] = value;
    }
  }

  if ('experience_years' in src) {
    const n = normalizeExperienceYears(src.experience_years);
    if (Number.isNaN(n)) {
      errors.experience_years = 'experience_years must be a number between 0 and 80.';
    } else {
      out.experience_years = n;
    }
  }

  if (Object.keys(errors).length) {
    throw new ApiError(422, 'Validation failed', errors);
  }

  return out;
}

// Accepts either an array (how resume extraction naturally produces
// skills/certifications/interests) or a comma-separated string (how the
// profile form produces them) and returns a trimmed CSV string, which is
// what the `profiles` table and the ML pipeline both expect.
function toCsv(value) {
  const list = Array.isArray(value)
    ? value
    : typeof value === 'string'
    ? value.split(',')
    : [];
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    const item = String(raw === null || raw === undefined ? '' : raw).trim();
    if (!item) continue;
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out.join(', ').slice(0, MAX_TEXT_LEN);
}

function toText(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean).join('\n').slice(0, MAX_TEXT_LEN);
  }
  return String(value).trim().slice(0, MAX_TEXT_LEN);
}

// Validates the body of POST /api/profile/apply-resume. The client sends
// the extraction *after the user reviewed it*, plus how it should be
// applied. Everything is coerced into the canonical profile shape here
// so the service never has to guess whether a field arrived as an array
// or a string.
function validateResumeApply(body) {
  const errors = {};
  const { extracted, mode } = body || {};

  if (!extracted || typeof extracted !== 'object' || Array.isArray(extracted)) {
    errors.extracted = 'extracted must be an object of reviewed resume fields.';
  }
  const resolvedMode = mode === undefined || mode === null || mode === '' ? 'merge' : String(mode);
  if (!['merge', 'overwrite'].includes(resolvedMode)) {
    errors.mode = "mode must be either 'merge' or 'overwrite'.";
  }

  if (Object.keys(errors).length) {
    throw new ApiError(422, 'Validation failed', errors);
  }

  const rawYears =
    extracted.experience_years !== undefined && extracted.experience_years !== null
      ? extracted.experience_years
      : extracted.experience_years_guess;
  const years = normalizeExperienceYears(rawYears);

  return {
    mode: resolvedMode,
    extracted: {
      education: toText(extracted.education),
      skills: toCsv(extracted.skills),
      interests: toCsv(extracted.interests),
      certifications: toCsv(extracted.certifications),
      projects: toText(extracted.projects),
      experience_years: Number.isNaN(years) || years === undefined ? null : years,
    },
  };
}

module.exports = {
  validateProfileUpdate,
  validateResumeApply,
  isNonEmptyString,
  MAX_TEXT_LEN,
};
