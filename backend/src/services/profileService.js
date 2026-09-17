const profileRepository = require('../repositories/profileRepository');
const activityRepository = require('../repositories/activityRepository');
const candidateProfileService = require('./candidateProfileService');
const { MAX_TEXT_LEN } = require('../validators/profileValidators');

async function getProfile(userId) {
  return profileRepository.findByUserId(userId);
}

async function updateProfile(userId, fields) {
  const profile = await profileRepository.upsert(userId, fields);
  await activityRepository.log(userId, 'profile_update', { fields: Object.keys(fields) });
  return profile;
}

function cap(value) {
  return typeof value === 'string' ? value.slice(0, MAX_TEXT_LEN) : value;
}

// Joins free-text blocks without duplicating content that is already
// there -- applying the same resume twice shouldn't double the projects
// section.
function joinText(base, incoming) {
  const b = (base || '').trim();
  const o = (incoming || '').trim();
  if (!o) return b;
  if (!b) return o;
  if (b.includes(o)) return b;
  return `${b}\n\n${o}`;
}

// Writes a reviewed resume extraction into the user's profile -- the
// "Apply to profile" step of: Upload -> Extract -> Review -> Apply ->
// recommendations use the updated data.
//
// `mode: 'merge'` (default) preserves everything already on the profile
// and only adds what the resume contributes; `mode: 'overwrite'` is the
// explicit opt-in that replaces the resume-derived fields outright.
// Either way, fields the resume has no opinion about
// (preferred_location, salary_expectation) are never touched, because
// profileRepository.upsert now only writes the columns it is given.
async function applyResumeExtraction(userId, extracted, mode = 'merge') {
  const existing = await profileRepository.findByUserId(userId);
  const incoming = candidateProfileService.toCanonical(extracted);
  const base = existing ? candidateProfileService.fromProfile(existing) : null;

  let resolved;
  if (mode === 'overwrite' || !base) {
    resolved = incoming;
  } else {
    // candidateProfileService.merge already unions + de-dupes the list
    // fields and keeps the base value when the overlay is empty; the
    // only thing it can't know is that repeated applies shouldn't stack
    // the same projects text, which joinText handles below.
    resolved = candidateProfileService.merge(base, incoming);
    resolved.projects = joinText(base.projects, incoming.projects);
    // merge() lets the overlay win outright, but experience_years from a
    // resume is a parsed guess -- it should be able to raise the user's
    // own figure, never quietly lower it.
    resolved.experience_years = Math.max(
      Number(base.experience_years) || 0,
      Number(incoming.experience_years) || 0
    );
  }

  const fields = {
    education: cap(resolved.education || ''),
    skills: cap(resolved.skills || ''),
    interests: cap(resolved.interests || ''),
    certifications: cap(resolved.certifications || ''),
    projects: cap(resolved.projects || ''),
  };

  // Only write experience_years when we actually have a value, so an
  // extraction that couldn't guess it leaves the user's own number
  // alone instead of resetting it to 0.
  const years = Number(resolved.experience_years);
  if (Number.isFinite(years) && years > 0) {
    fields.experience_years = Math.round(years);
  } else if (mode === 'overwrite') {
    fields.experience_years = null;
  }

  const profile = await profileRepository.upsert(userId, fields);
  // Metadata only -- never the extracted resume content itself.
  await activityRepository.log(userId, 'profile_resume_applied', {
    mode,
    fields: Object.keys(fields),
  });
  return profile;
}

module.exports = { getProfile, updateProfile, applyResumeExtraction };
