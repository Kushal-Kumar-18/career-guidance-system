const ApiError = require('../utils/ApiError');

const MAX_TEXT_LEN = 2000;
const VALID_SOURCES = new Set(['profile', 'resume_upload', 'resume_builder', 'merge']);

function isStringOrArray(v) {
  return typeof v === 'string' || Array.isArray(v);
}

// Validates the `candidate` object a client may send alongside
// POST /api/recommendations when `source` is 'resume_upload' or
// 'merge' — i.e. a user-reviewed candidate profile that did not come
// from the stored `profiles` row. Mirrors profileValidators' shape
// checks; `skills`/`interests`/`certifications` additionally accept
// arrays here (the review UI works with skill chips, not CSV text).
function validateCandidateProfile(candidate) {
  if (candidate === undefined || candidate === null) {
    throw new ApiError(422, 'candidate is required for this source.');
  }
  if (typeof candidate !== 'object' || Array.isArray(candidate)) {
    throw new ApiError(422, 'candidate must be an object.');
  }

  const errors = {};
  const { education, skills, interests, experience_years, certifications, projects } = candidate;

  for (const [key, value] of Object.entries({ skills, interests, certifications })) {
    if (value !== undefined && value !== null && !isStringOrArray(value)) {
      errors[key] = `${key} must be a string or an array of strings.`;
    }
  }
  for (const [key, value] of Object.entries({ education, projects })) {
    if (value !== undefined && value !== null && typeof value !== 'string') {
      errors[key] = `${key} must be a string.`;
    } else if (typeof value === 'string' && value.length > MAX_TEXT_LEN) {
      errors[key] = `${key} must be ${MAX_TEXT_LEN} characters or fewer.`;
    }
  }
  if (experience_years !== undefined && experience_years !== null && experience_years !== '') {
    const n = Number(experience_years);
    if (!Number.isFinite(n) || n < 0 || n > 80) {
      errors.experience_years = 'experience_years must be a number between 0 and 80.';
    }
  }

  if (Object.keys(errors).length) {
    throw new ApiError(422, 'Validation failed', errors);
  }
  return candidate;
}

function validateSource(source) {
  if (source === undefined || source === null || source === '') return 'profile';
  if (typeof source !== 'string' || !VALID_SOURCES.has(source)) {
    throw new ApiError(422, `source must be one of: ${Array.from(VALID_SOURCES).join(', ')}.`);
  }
  return source;
}

// Validates a POST /api/recommendations/feedback body: a career name the
// user was actually shown, plus a 1-5 satisfaction rating.
function validateFeedback(body) {
  const career = body?.career;
  const rating = Number(body?.rating);
  const errors = {};
  if (typeof career !== 'string' || !career.trim()) {
    errors.career = 'career is required.';
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    errors.rating = 'rating must be a number between 1 and 5.';
  }
  if (Object.keys(errors).length) {
    throw new ApiError(422, 'Validation failed', errors);
  }
  return { career: career.trim(), rating };
}

module.exports = { validateCandidateProfile, validateSource, validateFeedback, VALID_SOURCES };
