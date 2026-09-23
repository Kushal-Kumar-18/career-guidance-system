const ApiError = require('../utils/ApiError');

const MAX_SUMMARY_LEN = 3000;
const MAX_SHORT_LEN = 255;
const MAX_ENTRY_TEXT_LEN = 4000;
const MAX_ENTRIES = 30; // sanity ceiling per repeatable section
const PHONE_RE = /^[+()\-.\s\d]{7,30}$/;
// Loose: accepts bare domains ("linkedin.com/in/x") as well as full
// URLs, since that's the "clean URL" form the generated PDF displays.
// Not trying to be a strict URL RFC validator -- just catches obvious
// garbage (spaces, no dot) before it lands in a resumes.* column.
const URL_RE = /^[a-z0-9.-]+\.[a-z]{2,}([/?#].*)?$/i;

function validateShortText(value, field, errors, maxLen = MAX_SHORT_LEN) {
  if (value === undefined || value === null || value === '') return value === undefined ? undefined : '';
  if (typeof value !== 'string' || value.length > maxLen) {
    errors[field] = `${field} must be a string of ${maxLen} characters or fewer.`;
    return undefined;
  }
  return value;
}

function validateUrl(value, field, errors) {
  if (value === undefined || value === null || value === '') return value === undefined ? undefined : '';
  if (typeof value !== 'string' || value.length > MAX_SHORT_LEN) {
    errors[field] = `${field} must be a string of ${MAX_SHORT_LEN} characters or fewer.`;
    return undefined;
  }
  const bare = value.replace(/^https?:\/\//i, '').trim();
  if (bare && !URL_RE.test(bare)) {
    errors[field] = `${field} doesn't look like a valid URL.`;
    return undefined;
  }
  return value.trim();
}

// Shared shape check for every repeatable section (education, internships,
// experience, projects, certifications): must be an array of plain
// objects, with a sane per-entry field-length and entry-count ceiling so
// nothing outsized reaches the JSONB column. Deliberately not prescriptive
// about exact field names -- the Resume Builder UI owns that shape, same
// reasoning as the pre-existing `experience` validation this generalizes.
function validateEntryList(value, field, errors) {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    errors[field] = `${field} must be an array.`;
    return undefined;
  }
  if (value.length > MAX_ENTRIES) {
    errors[field] = `${field} must have ${MAX_ENTRIES} entries or fewer.`;
    return undefined;
  }
  for (const item of value) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      errors[field] = `each ${field} entry must be an object.`;
      return undefined;
    }
    for (const [key, val] of Object.entries(item)) {
      if (val !== null && val !== undefined && typeof val !== 'string' && typeof val !== 'number' && typeof val !== 'boolean') {
        errors[field] = `${field}.${key} must be a string, number, or boolean.`;
        return undefined;
      }
      if (typeof val === 'string' && val.length > MAX_ENTRY_TEXT_LEN) {
        errors[field] = `${field}.${key} must be ${MAX_ENTRY_TEXT_LEN} characters or fewer.`;
        return undefined;
      }
    }
  }
  return value;
}

// Validates the body of PUT /api/resume. Every field is optional so the
// Resume Builder can save one section at a time; whatever IS sent must be
// the right shape. `experience` (renamed to experience_json by the
// controller) and the other repeatable sections stay loosely typed on
// purpose -- validated for shape, not for prescriptive per-field rules --
// since the resume builder UI evolves independently of this validator.
function validateResumeUpdate(body) {
  const errors = {};
  const src = body || {};
  const {
    phone, summary, institution, graduation_year, experience,
    full_name, headline, location, linkedin_url, github_url, portfolio_url,
    education, internships, projects, certifications,
  } = src;

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

  const cleanFullName = validateShortText(full_name, 'full_name', errors);
  const cleanHeadline = validateShortText(headline, 'headline', errors);
  const cleanLocation = validateShortText(location, 'location', errors);
  const cleanLinkedin = validateUrl(linkedin_url, 'linkedin_url', errors);
  const cleanGithub = validateUrl(github_url, 'github_url', errors);
  const cleanPortfolio = validateUrl(portfolio_url, 'portfolio_url', errors);

  const cleanEducation = validateEntryList(education, 'education', errors);
  const cleanInternships = validateEntryList(internships, 'internships', errors);
  const cleanProjects = validateEntryList(projects, 'projects', errors);
  const cleanCertifications = validateEntryList(certifications, 'certifications', errors);

  if (Object.keys(errors).length) {
    throw new ApiError(422, 'Validation failed', errors);
  }

  return {
    phone, summary, institution, graduation_year, experience,
    full_name: cleanFullName, headline: cleanHeadline, location: cleanLocation,
    linkedin_url: cleanLinkedin, github_url: cleanGithub, portfolio_url: cleanPortfolio,
    education: cleanEducation, internships: cleanInternships,
    projects: cleanProjects, certifications: cleanCertifications,
  };
}

module.exports = { validateResumeUpdate };
