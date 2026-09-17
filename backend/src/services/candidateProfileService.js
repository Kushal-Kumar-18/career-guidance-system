// -----------------------------------------------------------------------
// Canonical Candidate Profile
// -----------------------------------------------------------------------
// This is the ONE normalized shape that manual profiles, uploaded resumes,
// and the in-app Resume Builder all converge to before touching the
// existing ML pipeline. It intentionally mirrors the `profiles` table /
// the `UserProfile` pydantic model in ml-service/app/main.py exactly —
// that shape is what advanced_ml_predictor.py already expects, so no new
// feature-engineering or model changes are needed (section 3/4/22 of the
// master prompt: reuse the existing pipeline, don't fork it).
//
//   { education, skills, interests, experience_years, certifications, projects }
//
// `skills` / `interests` / `certifications` are comma-separated strings
// (the format the model was trained against — see career_dataset.py /
// advanced_ml_predictor.py's `_normalize_text`), `experience_years` is a
// number, `projects` and `education` are free text.
//
// Every path below (profile row, reviewed resume-upload extraction,
// resume-builder data, or a merge of these) is funneled through
// `toCanonical()` so there is exactly one place that builds the object
// the ML client sends — see recommendationService.generate().

const MAX_LIST_ITEMS = 200; // sanity ceiling, mirrors validator limits elsewhere

function toList(value) {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

// Case-insensitive de-dupe while preserving the first-seen casing —
// matters because the same skill can legitimately arrive from two
// sources with different capitalization ("Python" vs "python") during a
// merge.
function dedupeList(list) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const key = item.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out.slice(0, MAX_LIST_ITEMS);
}

function joinList(list) {
  return dedupeList(list).join(', ');
}

function toExperienceYears(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, 80);
}

// Builds the canonical shape from any loosely-shaped input (list or CSV
// string fields are both accepted, since profile rows use CSV strings
// and reviewed resume-extraction data is more naturally arrays).
function toCanonical(input = {}) {
  return {
    education: (input.education || '').toString().trim(),
    skills: joinList(toList(input.skills)),
    interests: joinList(toList(input.interests)),
    experience_years: toExperienceYears(input.experience_years ?? input.experience ?? 0),
    certifications: joinList(toList(input.certifications)),
    projects: (input.projects || '').toString().trim(),
  };
}

// Source A — existing manual profile row (profiles table).
function fromProfile(profile) {
  if (!profile) return null;
  return toCanonical({
    education: profile.education,
    skills: profile.skills,
    interests: profile.interests,
    experience_years: profile.experience_years,
    certifications: profile.certifications,
    projects: profile.projects,
  });
}

// Source C — the in-app Resume Builder. `resumeData` is the object
// resumeService.buildResumeData() already produces (profile fields +
// resume-table fields, already merged server-side) — reused as-is here
// rather than re-deriving it, so there is exactly one place
// (resumeService.buildResumeData) that assembles "what's in the
// user's built resume".
function fromResumeBuilderData(resumeData) {
  if (!resumeData) return null;
  return toCanonical({
    education: resumeData.education,
    skills: resumeData.skills,
    interests: resumeData.interests,
    // The Resume Builder doesn't independently track total years of
    // experience (it stores a free-form job-history list); the
    // candidate's declared experience_years still comes from the
    // profile that resume was built from, exactly like the manual path.
    experience_years: resumeData.experience_years ?? 0,
    certifications: resumeData.certifications,
    projects: resumeData.projects,
  });
}

// Source B — a reviewed resume-upload extraction. `reviewed` is
// whatever the user confirmed/edited client-side after
// resumeExtractionService produced a best-effort extraction — never
// trusted un-reviewed (section 6 of the master prompt).
function fromReviewedExtraction(reviewed) {
  if (!reviewed) return null;
  return toCanonical(reviewed);
}

// "merge and review" (section 8): shallow field-by-field merge where
// values from `overlay` win when present/non-empty, otherwise `base` is
// kept. Both inputs are expected to already be canonical (or
// canonical-shaped) objects.
function merge(base, overlay) {
  const b = toCanonical(base || {});
  const o = toCanonical(overlay || {});
  const isEmpty = (v) => v === '' || v === null || v === undefined || v === 0;
  return {
    education: o.education || b.education,
    skills: joinList([...toList(b.skills), ...toList(o.skills)]),
    interests: joinList([...toList(b.interests), ...toList(o.interests)]),
    experience_years: !isEmpty(o.experience_years) ? o.experience_years : b.experience_years,
    certifications: joinList([...toList(b.certifications), ...toList(o.certifications)]),
    projects: [b.projects, o.projects].filter(Boolean).join('\n\n') || '',
  };
}

module.exports = {
  toCanonical,
  fromProfile,
  fromResumeBuilderData,
  fromReviewedExtraction,
  merge,
  toList,
};
