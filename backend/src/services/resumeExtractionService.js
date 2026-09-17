const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');
const skillService = require('./skillService');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// -----------------------------------------------------------------------
// Uploaded-resume extraction (section 5 of the master prompt).
//
// Text extraction: pdf-parse (PDF) / mammoth (DOCX) — both are the
// established, widely-used libraries for this and need no ML-service
// involvement.
//
// Skill extraction/normalization: delegates to skillService, which
// forwards to the existing ml-service `/extract-skills` and
// `/normalize-skills` endpoints — the SAME vocabulary and normalization
// the recommender itself uses (advanced_ml_predictor.py's
// `_normalize_skill_for_matching`). This is intentional reuse (section 3
// and 13): skills detected here are guaranteed to be skills the model
// can actually recognize later, and no second skill-matching
// implementation is created.
//
// Section splitting below is a light heuristic over common resume
// headings. It does not invent information — anything not found is
// simply omitted (empty field + a warning), left for the user to fill
// in during review (section 6).
// -----------------------------------------------------------------------

const SECTION_ALIASES = {
  summary: ['summary', 'objective', 'profile', 'about me', 'professional summary'],
  skills: ['skills', 'technical skills', 'core competencies', 'skill set', 'technologies'],
  education: ['education', 'academic background', 'academic qualifications', 'qualifications'],
  experience: ['experience', 'work experience', 'employment history', 'professional experience', 'work history'],
  projects: ['projects', 'academic projects', 'personal projects', 'key projects'],
  certifications: ['certifications', 'certificates', 'licenses & certifications', 'courses & certifications'],
  interests: ['interests', 'hobbies', 'personal interests', 'extracurricular activities'],
};

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,4}\d{3,4}/;

function normalizeHeading(line) {
  return line
    .replace(/[:：]\s*$/, '')
    .trim()
    .toLowerCase();
}

function isLikelyHeading(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 40) return false;
  const norm = normalizeHeading(trimmed);
  for (const aliases of Object.values(SECTION_ALIASES)) {
    if (aliases.includes(norm)) return true;
  }
  // Fallback heuristic: short, ALL-CAPS-ish line with no sentence
  // punctuation — common for resumes that use unusual heading text.
  const letters = trimmed.replace(/[^a-zA-Z]/g, '');
  return letters.length > 2 && letters === letters.toUpperCase() && !/[.,]/.test(trimmed);
}

function classifyHeading(line) {
  const norm = normalizeHeading(line);
  for (const [key, aliases] of Object.entries(SECTION_ALIASES)) {
    if (aliases.includes(norm)) return key;
  }
  // Fallback: fuzzy-ish contains check for unusual headings, e.g. "MY SKILLS"
  for (const [key, aliases] of Object.entries(SECTION_ALIASES)) {
    if (aliases.some((a) => norm.includes(a))) return key;
  }
  return null;
}

// Splits raw resume text into { sectionKey: [lines...] }. Text before
// the first recognized heading is kept under `_preamble` (name/contact
// info usually lives there).
function splitIntoSections(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const sections = { _preamble: [] };
  let current = '_preamble';

  for (const line of lines) {
    if (!line) continue;
    if (isLikelyHeading(line)) {
      const key = classifyHeading(line);
      if (key) {
        current = key;
        sections[key] = sections[key] || [];
        continue;
      }
    }
    sections[current] = sections[current] || [];
    sections[current].push(line);
  }
  return sections;
}

function splitCommaOrBulletList(lines) {
  const joined = lines.join(', ');
  return joined
    .split(/[,•|·\u2022\n]/)
    .map((s) => s.replace(/^[-*\s]+/, '').trim())
    .filter(Boolean);
}

// Best-effort experience-entry parser: groups lines into blocks
// separated by blank-ish boundaries (a new "Title — Company" style line
// followed by a duration-looking line). Deliberately conservative — the
// review step is where the user fixes anything this gets wrong.
function parseExperienceEntries(lines) {
  const DURATION_RE = /(19|20)\d{2}.{0,15}(present|current|(19|20)\d{2})/i;
  const entries = [];
  let current = null;

  for (const line of lines) {
    const isNewEntry = DURATION_RE.test(line) || /—|-\s|\|/.test(line) && line.length < 100 && !current;
    if (DURATION_RE.test(line) && current && !current.duration) {
      current.duration = (line.match(DURATION_RE) || [line])[0];
      const rest = line.replace(DURATION_RE, '').replace(/^[\s|,-]+/, '').trim();
      if (rest) current.title = current.title || rest;
      continue;
    }
    if (!current || (isNewEntry && current.description)) {
      current = { title: '', company: '', duration: '', description: '' };
      entries.push(current);
    }
    if (!current.title) {
      const [titlePart, companyPart] = line.split(/—|-\s|\|/);
      current.title = (titlePart || line).trim();
      if (companyPart) current.company = companyPart.trim();
    } else {
      current.description = current.description ? `${current.description} ${line}` : line;
    }
  }
  return entries.filter((e) => e.title).slice(0, 20);
}

async function extractText(buffer, mimetype) {
  try {
    if (mimetype === 'application/pdf') {
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        // pdf-parse v2 appends "-- N of M --" page-range markers to the
        // extracted text; strip them so they don't get parsed as
        // resume content (e.g. bleeding into whatever the last
        // detected section was).
        return (result.text || '').replace(/--\s*\d+\s+of\s+\d+\s*--/gi, '');
      } finally {
        // pdf-parse v2 holds worker/document resources open until
        // explicitly destroyed — always release them, success or failure.
        await parser.destroy();
      }
    }
    // DOCX
    const parsed = await mammoth.extractRawText({ buffer });
    return parsed.value || '';
  } catch (err) {
    logger.error('Resume text extraction failed', { mimetype, message: err.message });
    throw new ApiError(422, 'Could not read that file — it may be corrupted, empty, or password-protected.');
  }
}

async function extractFromBuffer(buffer, mimetype, originalName) {
  if (!buffer || !buffer.length) {
    throw new ApiError(422, 'The uploaded file is empty.');
  }

  const text = await extractText(buffer, mimetype);
  if (!text || !text.trim()) {
    throw new ApiError(422, 'No readable text was found in that file. If it is a scanned image, try a text-based export instead.');
  }

  const sections = splitIntoSections(text);
  const warnings = [];

  const email = (text.match(EMAIL_RE) || [])[0] || '';
  const phone = (sections._preamble.join(' ').match(PHONE_RE) || [])[0] || '';

  const summary = (sections.summary || []).join(' ').trim();
  const education = (sections.education || []).join(' ').trim();
  const projects = (sections.projects || []).join('\n').trim();

  let skillsListRaw = sections.skills ? splitCommaOrBulletList(sections.skills) : [];
  const certifications = sections.certifications ? splitCommaOrBulletList(sections.certifications) : [];
  const interests = sections.interests ? splitCommaOrBulletList(sections.interests) : [];
  const experience = sections.experience ? parseExperienceEntries(sections.experience) : [];

  if (!sections.skills) warnings.push('No "Skills" section was detected — matching skills from the rest of the document instead.');
  if (!sections.education) warnings.push('No "Education" section was detected.');
  if (!sections.experience) warnings.push('No "Experience" section was detected.');

  // Reuse the existing ML-service skill vocabulary/normalization
  // (section 3/5/13): match the whole document, not just the Skills
  // section, since skills are often also mentioned inline under
  // Experience/Projects and the recommender should see all of them.
  let detectedSkills = [];
  try {
    detectedSkills = await skillService.extractSkills(text);
  } catch (err) {
    // Non-fatal — the ML service being briefly unavailable shouldn't
    // block the user from reviewing whatever was parsed structurally.
    logger.error('Skill extraction against ML service failed during resume parse', { message: err.message });
    warnings.push('Automatic skill matching was unavailable; please add your skills manually below.');
  }

  // Merge: anything literally listed under a "Skills" heading is kept
  // even if it wasn't in the model's known vocabulary (so we don't
  // silently drop a real skill the user wrote down), plus whatever the
  // vocabulary-based extractor found elsewhere in the document.
  const skillsSet = new Map();
  for (const s of [...skillsListRaw, ...detectedSkills]) {
    const key = s.toLowerCase();
    if (!skillsSet.has(key)) skillsSet.set(key, s);
  }

  const experienceYearsGuess = (() => {
    const years = [...text.matchAll(/(19|20)\d{2}/g)].map((m) => parseInt(m[0], 10));
    if (years.length < 2) return null;
    const span = Math.max(...years) - Math.min(...years);
    return span > 0 && span < 50 ? span : null;
  })();

  return {
    source_file: originalName || 'resume',
    warnings,
    extracted: {
      email,
      phone,
      summary,
      education,
      skills: Array.from(skillsSet.values()),
      certifications,
      interests,
      projects,
      experience,
      // A rough guess only — surfaced separately (not folded into
      // `experience_years`) so the review UI can clearly label it as a
      // guess the user should confirm, per "never silently trust"
      // (section 6).
      experience_years_guess: experienceYearsGuess,
    },
  };
}

module.exports = { extractFromBuffer };
