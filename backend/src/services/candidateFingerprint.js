const crypto = require('node:crypto');
const candidateProfileService = require('./candidateProfileService');

// -----------------------------------------------------------------------
// Candidate Fingerprint (master prompt section C).
//
// A deterministic identity for "this exact candidate evidence", used to
// tell apart two analyses that happen to produce identical top results
// (which must stay separate — see recommendationRepository.generateBatch)
// from two requests that really are the same logical analysis repeated
// (which must collapse). Two canonical candidates that are equivalent in
// every field that matters to scoring get the SAME fingerprint even if
// they arrived through different code paths (e.g. skills as an array vs.
// a comma-separated string); two candidates that differ in any
// scoring-relevant field get a DIFFERENT fingerprint.
//
// Deliberately excludes nothing that affects scoring and adds nothing
// that doesn't: education/skills/interests/experience_years/
// certifications/projects/verified skills are exactly the fields sent to
// the ML service (see recommendationService.generate — user_profile AND
// verified_skills) and exactly the fields candidateProfileService
// .toCanonical produces plus the caller's verified-skill lookup. Ordering
// within a list (skills, interests, certifications) must NOT change the
// fingerprint — "Python, SQL" and "SQL, Python" are the same candidate
// evidence — so each list is sorted before hashing; toCanonical's own
// case-insensitive de-duplication already collapses "Python"/"python" to
// one entry with a stable first-seen casing, and this fingerprint
// additionally lower-cases everything so casing differences alone never
// produce a different fingerprint.
//
// verifiedSkills matters here because it changes the actual score even
// when every canonical field is identical: a candidate who claims Python
// and a candidate who claims Python AND has it VERIFIED via a skill test
// are different scoring inputs (see evidence.py's skill_evidence tiers),
// so treating them as "the same candidate" for fingerprint/dedupe
// purposes would let two genuinely different analyses collapse into one
// — the exact class of bug this fingerprint exists to prevent for every
// other field. Only the skill NAMES that are verified matter for
// identity (not pass/fail detail, timestamps, or score), so this reduces
// verifiedSkills down to a sorted, lower-cased list of keys before
// hashing, same normalization discipline as every other field here.
// -----------------------------------------------------------------------

function normalizeForFingerprint(canonical, verifiedSkills) {
  const c = candidateProfileService.toCanonical(canonical || {});
  const sortedLower = (csv) =>
    candidateProfileService
      .toList(csv)
      .map((s) => s.toLowerCase())
      .sort();

  const verifiedSkillNames = Object.keys(verifiedSkills || {})
    .map((s) => s.toLowerCase())
    .sort();

  return {
    education: c.education.toLowerCase().replace(/\s+/g, ' ').trim(),
    skills: sortedLower(c.skills),
    interests: sortedLower(c.interests),
    experience_years: c.experience_years,
    certifications: sortedLower(c.certifications),
    projects: c.projects.toLowerCase().replace(/\s+/g, ' ').trim(),
    verified_skills: verifiedSkillNames,
  };
}

// Stable stringify: normalizeForFingerprint always returns the same key
// set in the same shape, so JSON.stringify's key order is already
// deterministic here (V8 preserves insertion order for string keys) —
// no need for a general-purpose stable-stringify, just documenting why
// this is safe rather than leaving it implicit.
function computeCandidateFingerprint(canonical, verifiedSkills) {
  const normalized = normalizeForFingerprint(canonical, verifiedSkills);
  const json = JSON.stringify(normalized);
  const hex = crypto.createHash('sha256').update(json).digest('hex');
  return `sha256:${hex}`;
}

module.exports = { computeCandidateFingerprint, normalizeForFingerprint };
