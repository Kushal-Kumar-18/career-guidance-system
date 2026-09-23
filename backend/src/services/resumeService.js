const PDFDocument = require('pdfkit');
const resumeRepository = require('../repositories/resumeRepository');
const profileRepository = require('../repositories/profileRepository');
const userRepository = require('../repositories/userRepository');
const skillTestRepository = require('../repositories/skillTestRepository');
const activityRepository = require('../repositories/activityRepository');
const storage = require('./storageService');
const ApiError = require('../utils/ApiError');

async function updateResume(userId, fields) {
  const resume = await resumeRepository.upsert(userId, fields);
  await activityRepository.log(userId, 'resume_updated', {});
  return resume;
}

async function buildResumeData(userId) {
  const [user, profile, resume, verifiedSkills] = await Promise.all([
    userRepository.findById(userId),
    profileRepository.findByUserId(userId),
    resumeRepository.findByUserId(userId),
    skillTestRepository.verifiedSkillsForUser(userId),
  ]);
  if (!profile) throw new ApiError(422, 'Complete your profile before generating a resume.');

  // Legacy fallback: resumes saved before the repeatable Education
  // section (db/migrations/0008_resume_builder_sections.sql) only ever
  // had a single institution/graduation_year pair alongside
  // profile.education. If education_json is still empty, synthesize one
  // entry from that legacy data so an existing user's resume doesn't
  // render with a blank Education section the first time they open the
  // upgraded builder.
  const legacyEducationEntry = (profile.education || resume?.institution || resume?.graduation_year)
    ? [{
        degree: profile.education || '',
        institution: resume?.institution || '',
        field: '',
        start_year: '',
        end_year: resume?.graduation_year || '',
        grade: '',
        coursework: '',
      }]
    : [];

  // Same idea for Certifications: profile.certifications is a flat,
  // comma-separated string that pre-dates the repeatable
  // certifications_json section. Map each item into a bare entry so
  // previously-entered certifications keep showing up until the user
  // re-enters them with full detail in the new UI.
  const legacyCertifications = (profile.certifications || '')
    .split(',').map((s) => s.trim()).filter(Boolean)
    .map((name) => ({ name, organization: '', date: '', credential_id: '', credential_url: '' }));

  return {
    // -----------------------------------------------------------------
    // Flat fields consumed elsewhere (candidateProfileService,
    // recommendationService, ATS scoring). Kept EXACTLY as before —
    // do not rename, remove, or reshape these; the recommendation
    // engine reads this object by these exact keys (see
    // candidateProfileService.fromResumeBuilderData). Skills continue
    // to come from profile.skills only — the Resume Builder reuses the
    // existing profile/skill system rather than forking it.
    // -----------------------------------------------------------------
    name: user.username,
    email: user.email,
    phone: resume?.phone || '',
    summary: resume?.summary || `Motivated professional with experience in ${profile.skills || 'multiple areas'}.`,
    education: profile.education || '',
    institution: resume?.institution || '',
    graduation_year: resume?.graduation_year || '',
    skills: (profile.skills || '').split(',').map((s) => s.trim()).filter(Boolean),
    verified_skills: Object.keys(verifiedSkills),
    interests: (profile.interests || '').split(',').map((s) => s.trim()).filter(Boolean),
    certifications: (profile.certifications || '').split(',').map((s) => s.trim()).filter(Boolean),
    projects: profile.projects || '',
    experience: resume?.experience_json || [],
    // Years of experience is a profile-level field (the Resume Builder
    // only tracks a free-form job-history list, not a total-years
    // figure) — surfaced here under its own key, additive, so
    // candidateProfileService.fromResumeBuilderData can read it without
    // colliding with `experience` (the job-history array) above.
    experience_years: profile.experience_years || 0,

    // -----------------------------------------------------------------
    // Resume Builder personal info + repeatable sections (additive).
    // Only consumed by renderPdf() and the Resume Builder UI — never by
    // the recommendation/ATS pipeline, so extending these never touches
    // that scoring/ranking path.
    // -----------------------------------------------------------------
    full_name: resume?.full_name || user.username,
    headline: resume?.headline || '',
    location: resume?.location || '',
    linkedin_url: resume?.linkedin_url || '',
    github_url: resume?.github_url || '',
    portfolio_url: resume?.portfolio_url || '',
    education_entries: resume?.education_json?.length ? resume.education_json : legacyEducationEntry,
    internship_entries: resume?.internships_json || [],
    project_entries: resume?.projects_json || [],
    certification_entries: resume?.certifications_json?.length ? resume.certifications_json : legacyCertifications,
  };
}

// -----------------------------------------------------------------------
// PDF generation — professional, ATS-friendly, single-file pdfkit layout.
//
// Design constraints (deliberate, don't relax without re-reading the
// master prompt for this feature):
//   - Standard font (Helvetica) only — no embedded/custom fonts, nothing
//     that could confuse an ATS parser.
//   - No images, icons, tables, or colored blocks — a couple of thin
//     gray rules under section headers are the only decoration.
//   - Plain text contact/URL line (no clickable-link gymnastics) so the
//     text always wraps correctly and extracts cleanly in a linear
//     top-to-bottom, left-to-right reading order.
//   - Sections render only when they have content — an empty
//     Internships/Projects/Certifications section is simply omitted
//     rather than printed with nothing under the heading.
//   - Pagination is left to pdfkit's normal text flow (it adds pages by
//     itself); `ensureSpace` only prevents a section HEADER from being
//     orphaned at the very bottom of a page.
// -----------------------------------------------------------------------

function contentWidth(doc) {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

function ensureSpace(doc, needed) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + needed > bottom) doc.addPage();
}

function sectionHeader(doc, title) {
  // Reserve room for the header itself PLUS roughly one line of body
  // content beneath it, so a header never gets stranded alone at the
  // bottom of a page with its content pushed to the next one.
  ensureSpace(doc, 48);
  doc.moveDown(0.7);
  doc.font('Helvetica-Bold').fontSize(11.5).fillColor('#161616')
    .text(title.toUpperCase(), { characterSpacing: 0.6 });
  const lineY = doc.y + 2;
  doc.moveTo(doc.page.margins.left, lineY)
    .lineTo(doc.page.width - doc.page.margins.right, lineY)
    .lineWidth(0.75).strokeColor('#bfbfbf').stroke();
  doc.moveDown(0.45);
  doc.font('Helvetica').fillColor('#222222').fontSize(10);
}

// Renders `left` and `right` (e.g. a title and a date range) on the same
// line, right-aligned against each other — the standard resume-entry
// row. Falls back to a single left-aligned line when there's no date.
function rowWithRightLabel(doc, left, right) {
  const margins = doc.page.margins;
  const fullWidth = contentWidth(doc);
  const startY = doc.y;
  if (right) {
    const rightWidth = doc.widthOfString(right) + 2;
    doc.text(left || '', margins.left, startY, { width: fullWidth - rightWidth - 10, continued: false });
    const afterLeftY = doc.y;
    doc.font('Helvetica').fontSize(9.5).fillColor('#555555')
      .text(right, margins.left + fullWidth - rightWidth, startY, { width: rightWidth, align: 'right', lineBreak: false });
    doc.y = Math.max(afterLeftY, doc.y);
    doc.x = margins.left;
  } else {
    doc.text(left || '', margins.left, startY, { width: fullWidth });
  }
}

function toDisplayList(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean).join(', ');
  return String(value || '').trim();
}

function cleanUrl(url) {
  return String(url || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}

// Splits a free-form description into bullet lines. Accepts either
// actual newlines or a single paragraph (rendered as one bullet), so it
// works whether the user wrote short responsibility lines or one prose
// summary.
function renderBullets(doc, text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const width = contentWidth(doc);
  doc.font('Helvetica').fontSize(9.7).fillColor('#333333');
  lines.forEach((line) => {
    ensureSpace(doc, 13);
    const bulletText = line.replace(/^[-•*]\s*/, '');
    doc.text(`\u2022  ${bulletText}`, doc.page.margins.left, doc.y, { width });
  });
}

function renderMeta(doc, text) {
  if (!text) return;
  ensureSpace(doc, 13);
  doc.font('Helvetica').fontSize(9.3).fillColor('#5a5a5a').text(text, { width: contentWidth(doc) });
}

function renderHeader(doc, data) {
  doc.font('Helvetica-Bold').fontSize(21).fillColor('#111111')
    .text(data.full_name || data.name || 'Your Name');

  if (data.headline) {
    doc.moveDown(0.12);
    doc.font('Helvetica').fontSize(11.5).fillColor('#3a3a3a').text(data.headline);
  }

  const contactLine = [
    data.location,
    data.email,
    data.phone,
    cleanUrl(data.linkedin_url),
    cleanUrl(data.github_url),
    cleanUrl(data.portfolio_url),
  ].filter(Boolean).join('   |   ');

  if (contactLine) {
    doc.moveDown(0.28);
    doc.font('Helvetica').fontSize(9.5).fillColor('#444444').text(contactLine, { width: contentWidth(doc) });
  }
}

function renderSummary(doc, summary) {
  if (!summary || !summary.trim()) return;
  sectionHeader(doc, 'Professional Summary');
  doc.font('Helvetica').fontSize(10).fillColor('#2a2a2a').text(summary.trim(), { width: contentWidth(doc) });
}

function renderEducation(doc, entries) {
  if (!entries.length) return;
  sectionHeader(doc, 'Education');
  entries.forEach((edu, idx) => {
    ensureSpace(doc, 44);
    const title = [edu.degree, edu.field].filter(Boolean).join(', ') || 'Education';
    const dateRange = [edu.start_year, edu.end_year].filter(Boolean).join(' \u2013 ');
    doc.font('Helvetica-Bold').fontSize(10.3).fillColor('#111111');
    rowWithRightLabel(doc, title, dateRange);
    if (edu.institution) {
      doc.font('Helvetica').fontSize(10).fillColor('#333333').text(edu.institution, { width: contentWidth(doc) });
    }
    const gradeBit = edu.grade ? `CGPA/Percentage: ${edu.grade}` : '';
    renderMeta(doc, gradeBit);
    if (edu.coursework) renderMeta(doc, `Relevant coursework: ${edu.coursework}`);
    if (idx !== entries.length - 1) doc.moveDown(0.4);
  });
}

function renderSkills(doc, data) {
  if (!data.skills.length) return;
  sectionHeader(doc, 'Skills');
  doc.font('Helvetica').fontSize(10).fillColor('#2a2a2a').text(data.skills.join(', '), { width: contentWidth(doc) });
  if (data.verified_skills.length) {
    doc.moveDown(0.15);
    doc.font('Helvetica').fontSize(9).fillColor('#3a7d44')
      .text(`Verified: ${data.verified_skills.join(', ')}`, { width: contentWidth(doc) });
  }
}

function renderInternships(doc, entries) {
  if (!entries.length) return;
  sectionHeader(doc, 'Internships');
  entries.forEach((it, idx) => {
    ensureSpace(doc, 46);
    const title = [it.role, it.company].filter(Boolean).join(' \u2014 ') || it.role || it.company || 'Internship';
    const dateRange = [it.start_date, it.end_date].filter(Boolean).join(' \u2013 ');
    doc.font('Helvetica-Bold').fontSize(10.3).fillColor('#111111');
    rowWithRightLabel(doc, title, dateRange);
    if (it.location) renderMeta(doc, it.location);
    if (it.description) renderBullets(doc, it.description);
    const tech = toDisplayList(it.technologies);
    if (tech) renderMeta(doc, `Technologies: ${tech}`);
    if (idx !== entries.length - 1) doc.moveDown(0.4);
  });
}

function renderExperience(doc, entries) {
  if (!entries.length) return;
  sectionHeader(doc, 'Experience');
  entries.forEach((exp, idx) => {
    ensureSpace(doc, 46);
    const title = [exp.title, exp.company].filter(Boolean).join(' \u2014 ') || exp.title || exp.company || 'Experience';
    // Prefer explicit start/end dates (structured entries from the
    // Resume Builder's newer form); fall back to the free-form
    // `duration` string that older/legacy entries used, so previously
    // saved experience entries keep rendering correctly.
    const dateRange = (exp.start_date || exp.end_date)
      ? [exp.start_date, exp.end_date].filter(Boolean).join(' \u2013 ')
      : (exp.duration || '');
    doc.font('Helvetica-Bold').fontSize(10.3).fillColor('#111111');
    rowWithRightLabel(doc, title, dateRange);
    if (exp.location) renderMeta(doc, exp.location);
    if (exp.description) renderBullets(doc, exp.description);
    const tech = toDisplayList(exp.technologies);
    if (tech) renderMeta(doc, `Technologies: ${tech}`);
    if (idx !== entries.length - 1) doc.moveDown(0.4);
  });
}

function renderProjects(doc, entries, legacyProjectsText) {
  if (!entries.length) {
    // Legacy fallback: no structured project entries yet, but the
    // profile has free-form project text — show it rather than nothing.
    if (legacyProjectsText && legacyProjectsText.trim()) {
      sectionHeader(doc, 'Projects');
      doc.font('Helvetica').fontSize(10).fillColor('#2a2a2a').text(legacyProjectsText.trim(), { width: contentWidth(doc) });
    }
    return;
  }
  sectionHeader(doc, 'Projects');
  entries.forEach((proj, idx) => {
    ensureSpace(doc, 44);
    doc.font('Helvetica-Bold').fontSize(10.3).fillColor('#111111');
    rowWithRightLabel(doc, proj.name || 'Project', '');
    if (proj.description) {
      doc.font('Helvetica').fontSize(9.7).fillColor('#333333').text(proj.description, { width: contentWidth(doc) });
    }
    if (proj.features) renderBullets(doc, proj.features);
    const tech = toDisplayList(proj.technologies);
    if (tech) renderMeta(doc, `Technologies: ${tech}`);
    const links = [
      proj.github_url ? `GitHub: ${cleanUrl(proj.github_url)}` : '',
      proj.demo_url ? `Live: ${cleanUrl(proj.demo_url)}` : '',
    ].filter(Boolean).join('   |   ');
    if (links) renderMeta(doc, links);
    if (idx !== entries.length - 1) doc.moveDown(0.4);
  });
}

function renderCertifications(doc, entries) {
  if (!entries.length) return;
  sectionHeader(doc, 'Certifications');
  entries.forEach((cert, idx) => {
    ensureSpace(doc, 30);
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#111111');
    rowWithRightLabel(doc, cert.name || 'Certification', cert.date || '');
    const metaBits = [
      cert.organization || '',
      cert.credential_id ? `Credential ID: ${cert.credential_id}` : '',
      cert.credential_url ? cleanUrl(cert.credential_url) : '',
    ].filter(Boolean).join('   |   ');
    if (metaBits) renderMeta(doc, metaBits);
    if (idx !== entries.length - 1) doc.moveDown(0.3);
  });
}

// PDF generation kept practical (pdfkit) rather than porting a specific
// legacy template — see PHASE1_NOTES.md, resume templates were not
// included in the handoff. Section order follows the Resume Builder's
// own section order (Personal Info header, Summary, Education, Skills,
// Internships, Experience, Projects, Certifications).
function renderPdf(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, bufferPages: true });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    renderHeader(doc, data);
    renderSummary(doc, data.summary);
    renderEducation(doc, data.education_entries || []);
    renderSkills(doc, data);
    renderInternships(doc, data.internship_entries || []);
    renderExperience(doc, data.experience || []);
    renderProjects(doc, data.project_entries || [], data.projects);
    renderCertifications(doc, data.certification_entries || []);

    doc.end();
  });
}

// -----------------------------------------------------------------------
// Resume PDF storage + access control.
//
// The stored object key is derived ONLY from the authenticated user's id
// — it is never taken from a request parameter. That is what makes
// ownership verification structural rather than a check that can be
// forgotten: there is no code path that lets user A name a path
// belonging to user B. Callers must pass the id from `req.user.id`
// (populated by requireAuth), never a client-supplied value.
// -----------------------------------------------------------------------
function storageKeyForUser(userId) {
  const id = parseInt(userId, 10);
  if (!Number.isInteger(id) || id <= 0) {
    // Defensive: a non-numeric id would otherwise be interpolated into
    // the object key and could escape the resumes/ prefix.
    throw new ApiError(400, 'Invalid user id.');
  }
  return `resumes/user-${id}.pdf`;
}

// Route the client uses to fetch the generated PDF. It is an
// authenticated API endpoint, not a static file path — the browser must
// send the Bearer token, so the frontend fetches it as a blob rather than
// pointing an <a href> at it (see frontend/src/services/api.js).
const DOWNLOAD_PATH = '/api/resume/download';

async function generatePdf(userId) {
  const data = await buildResumeData(userId);
  const buffer = await renderPdf(data);
  const relativePath = storageKeyForUser(userId);
  await storage.save(relativePath, buffer);
  await activityRepository.log(userId, 'resume_pdf_generated', {});
  return { url: DOWNLOAD_PATH, data };
}

// Reads back the caller's OWN generated PDF. `userId` comes from the
// verified JWT, so the key resolved here always belongs to the caller.
async function getGeneratedPdf(userId) {
  const relativePath = storageKeyForUser(userId);

  if (!(await storage.exists(relativePath))) {
    throw new ApiError(404, 'No generated resume found. Generate your resume PDF first.');
  }

  let buffer;
  try {
    buffer = await storage.read(relativePath);
  } catch (err) {
    // Treat a vanished object (deleted volume, missing S3 key) as "not
    // generated yet" rather than leaking storage internals to the client.
    throw new ApiError(404, 'No generated resume found. Generate your resume PDF first.');
  }

  return { buffer, filename: `resume-user-${userId}.pdf` };
}

async function getResume(userId) {
  return resumeRepository.findByUserId(userId);
}

module.exports = {
  updateResume,
  buildResumeData,
  generatePdf,
  getGeneratedPdf,
  getResume,
  storageKeyForUser,
  DOWNLOAD_PATH,
};