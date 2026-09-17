// Shared profile logic, kept in one place so the Dashboard, Profile page,
// Skill Assessments page and Resume page all agree on what "complete",
// "verified" and "matched" mean. Previously each page would have had to
// re-derive this, which is how two screens end up disagreeing about the
// same user.
//
// Nothing here invents data: every function takes real API output and
// reshapes it. There are no synthesized scores or placeholder values.

/** Splits a comma/newline-separated field into a clean list. */
export function parseList(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(/[,\n;]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Case/whitespace-insensitive key so "Node.js" and "node.js " match. */
export function skillKey(skill) {
  return String(skill || '').trim().toLowerCase();
}

/** Deduplicates a skill list, keeping the first spelling the user used. */
export function dedupeSkills(skills) {
  const seen = new Set();
  const out = [];
  for (const skill of skills) {
    const key = skillKey(skill);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(String(skill).trim());
  }
  return out;
}

// The fields that make a profile useful to the recommendation engine,
// weighted by how much they actually affect the result. Skills carry the
// most weight because the fit score is driven by skill overlap; location
// is excluded entirely since it doesn't feed scoring, and counting it
// would tell people to fill in something that changes nothing.
const COMPLETENESS_FIELDS = [
  { key: 'skills', label: 'Skills', weight: 30, action: 'List the skills you already have', list: true },
  { key: 'education', label: 'Education', weight: 15, action: 'Add your education' },
  { key: 'interests', label: 'Interests', weight: 15, action: 'Add what kind of work interests you', list: true },
  { key: 'projects', label: 'Projects', weight: 20, action: 'Describe a project or two' },
  { key: 'certifications', label: 'Certifications', weight: 10, action: 'Add any certifications', list: true },
  { key: 'experience_years', label: 'Years of experience', weight: 10, action: 'Set your years of experience', numeric: true },
];

function fieldFilled(profile, field) {
  const value = profile?.[field.key];
  if (field.numeric) return value !== null && value !== undefined && value !== '';
  if (field.list) return parseList(value).length > 0;
  return Boolean(String(value || '').trim());
}

/**
 * Scores how complete a profile is, and names exactly what's missing.
 * Returns { percent, filled[], missing[] } where each entry carries the
 * label and the action text the UI shows as a prompt.
 */
export function profileCompleteness(profile) {
  const filled = [];
  const missing = [];
  let earned = 0;

  for (const field of COMPLETENESS_FIELDS) {
    if (fieldFilled(profile, field)) {
      earned += field.weight;
      filled.push(field);
    } else {
      missing.push(field);
    }
  }

  const total = COMPLETENESS_FIELDS.reduce((sum, f) => sum + f.weight, 0);
  return { percent: Math.round((earned / total) * 100), filled, missing };
}

/**
 * Indexes skill-test results by skill, keeping each skill's best score.
 * A user can retake a test, and the fairest reading of "how good are you
 * at X" is their best demonstrated result, not their most recent one.
 */
export function verifiedSkillIndex(testResults = []) {
  const index = new Map();
  for (const result of testResults) {
    const key = skillKey(result.skill_name);
    if (!key) continue;
    const existing = index.get(key);
    if (!existing || Number(result.percentage) > Number(existing.percentage)) {
      index.set(key, result);
    }
  }
  return index;
}

/**
 * Classifies every skill on the profile as verified or self-reported,
 * and surfaces verified skills that aren't on the profile yet (which
 * happens when someone tests a skill before adding it).
 */
export function classifyProfileSkills(profile, testResults = []) {
  const verified = verifiedSkillIndex(testResults);
  const profileSkills = dedupeSkills(parseList(profile?.skills));

  const classified = profileSkills.map((name) => {
    const result = verified.get(skillKey(name));
    return {
      name,
      verified: Boolean(result),
      percentage: result ? Number(result.percentage) : null,
      proficiency: result ? result.proficiency_level : null,
    };
  });

  const onProfile = new Set(profileSkills.map(skillKey));
  const verifiedNotOnProfile = [...verified.values()]
    .filter((r) => !onProfile.has(skillKey(r.skill_name)))
    .map((r) => ({
      name: r.skill_name,
      verified: true,
      percentage: Number(r.percentage),
      proficiency: r.proficiency_level,
    }));

  return {
    all: classified,
    verified: classified.filter((s) => s.verified),
    unverified: classified.filter((s) => !s.verified),
    verifiedNotOnProfile,
  };
}

/**
 * Merges extracted resume fields into an existing profile.
 *
 * Merge is the default (and `overwrite` is opt-in) because silently
 * replacing a profile someone curated by hand with whatever a parser
 * pulled out of a PDF loses real information — resume parsing is
 * best-effort, and an omission in the parse is not a statement that the
 * user no longer has that skill.
 *
 * List fields union without duplicates; free-text fields keep the
 * existing value and only fall back to the extracted one when empty, so
 * a hand-written summary is never clobbered by a parsed fragment.
 * experience_years takes the larger of the two.
 */
export function mergeResumeIntoProfile(profile, extracted, { overwrite = false } = {}) {
  const base = profile || {};
  if (overwrite) {
    return {
      ...base,
      education: extracted.education || '',
      skills: parseList(extracted.skills).join(', '),
      interests: parseList(extracted.interests).join(', '),
      certifications: parseList(extracted.certifications).join(', '),
      projects: extracted.projects || '',
      experience_years: Number(extracted.experience_years) || 0,
    };
  }

  const mergeList = (a, b) => dedupeSkills([...parseList(a), ...parseList(b)]).join(', ');
  const preferExisting = (existing, incoming) =>
    String(existing || '').trim() ? existing : incoming || '';

  return {
    ...base,
    education: preferExisting(base.education, extracted.education),
    skills: mergeList(base.skills, extracted.skills),
    interests: mergeList(base.interests, extracted.interests),
    certifications: mergeList(base.certifications, extracted.certifications),
    projects: preferExisting(base.projects, extracted.projects),
    experience_years: Math.max(
      Number(base.experience_years) || 0,
      Number(extracted.experience_years) || 0
    ),
  };
}

/**
 * Describes what a merge would change, so the user can see the effect
 * before committing to it rather than after.
 */
export function describeMerge(profile, extracted) {
  const before = dedupeSkills(parseList(profile?.skills));
  const beforeKeys = new Set(before.map(skillKey));
  const incoming = dedupeSkills(parseList(extracted?.skills));
  const newSkills = incoming.filter((s) => !beforeKeys.has(skillKey(s)));

  const fields = [];
  for (const key of ['education', 'projects']) {
    const hasExisting = Boolean(String(profile?.[key] || '').trim());
    const hasIncoming = Boolean(String(extracted?.[key] || '').trim());
    if (hasIncoming && !hasExisting) fields.push(key);
  }

  return { newSkills, fields };
}

/**
 * Buckets a career's required skills against what the user has, which is
 * what the recommendation card's evidence bar and the skill-gap lists
 * both render.
 */
export function buildEvidence({ careerSkills = [], matchedSkills = [], gaps = [], testResults = [] }) {
  const verified = verifiedSkillIndex(testResults);
  const matchedKeys = new Set(matchedSkills.map(skillKey));

  const verifiedMatched = [];
  const selfReported = [];
  for (const skill of matchedSkills) {
    if (verified.has(skillKey(skill))) verifiedMatched.push(skill);
    else selfReported.push(skill);
  }

  const missing = gaps.filter((g) => !matchedKeys.has(skillKey(g)));
  const total = verifiedMatched.length + selfReported.length + missing.length;

  return {
    verified: verifiedMatched,
    selfReported,
    missing,
    total,
    // Guard against dividing by zero when a career has no skill list.
    verifiedPct: total ? (verifiedMatched.length / total) * 100 : 0,
    selfReportedPct: total ? (selfReported.length / total) * 100 : 0,
    missingPct: total ? (missing.length / total) * 100 : 0,
  };
}
