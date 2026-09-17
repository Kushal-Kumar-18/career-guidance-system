const ApiError = require('../utils/ApiError');

const MAX_SUMMARY_LEN = 3000;
const MAX_SHORT_LEN = 255;
const PHONE_RE = /^[+()\-.\s\d]{7,30}$/;

// Validates the body of PUT /api/resume. `experience` (renamed to
// experience_json by the controller) is the free-form work-history
// list — validated for shape (must be an array of objects) without
// being overly prescriptive about its exact fields, since the resume
// builder UI evolves independently of this validator.
function validateResumeUpdate(body) {
  const errors = {};
  const { phone, summary, institution, graduation_year, experience } = body || {};

  if (phone !== undefined && phone !== null && phone !== '') {
    if (typeof phone !== 'string' || !PHONE_RE.test(phone)) {
      errors.phone = 'phone must be a valid phone number.';
    }
  }

  if (summary !== undefined && summary !== null) {
    if (typeof summary !== 'string') {
      errors.summary = 'summary must be a string.';
    } else if (summary.length > MAX_SUMMARY_LEN) {
      errors.summary = `summary must be ${MAX_SUMMARY_LEN} characters or fewer.`;
    }
  }

  if (institution !== undefined && institution !== null) {
    if (typeof institution !== 'string' || institution.length > MAX_SHORT_LEN) {
      errors.institution = `institution must be a string of ${MAX_SHORT_LEN} characters or fewer.`;
    }
  }

  if (graduation_year !== undefined && graduation_year !== null && graduation_year !== '') {
    const yearStr = String(graduation_year);
    if (!/^\d{4}$/.test(yearStr)) {
      errors.graduation_year = 'graduation_year must be a 4-digit year.';
    }
  }

  if (experience !== undefined && experience !== null) {
    if (!Array.isArray(experience)) {
      errors.experience = 'experience must be an array.';
    } else if (experience.some((item) => typeof item !== 'object' || item === null || Array.isArray(item))) {
      errors.experience = 'each experience entry must be an object.';
    }
  }

  if (Object.keys(errors).length) {
    throw new ApiError(422, 'Validation failed', errors);
  }

  return { phone, summary, institution, graduation_year, experience };
}

module.exports = { validateResumeUpdate };
