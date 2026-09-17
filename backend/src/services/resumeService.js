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

  return {
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
  };
}

// PDF generation kept practical/simple (pdfkit) rather than porting a
// specific legacy template — see PHASE1_NOTES.md, resume templates were
// not included in the handoff.
function renderPdf(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(22).text(data.name, { continued: false });
    doc.fontSize(10).fillColor('#555').text([data.email, data.phone].filter(Boolean).join('  |  '));
    doc.moveDown();

    doc.fillColor('#000').fontSize(14).text('Summary');
    doc.moveTo(doc.x, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke();
    doc.fontSize(10).text(data.summary);
    doc.moveDown();

    doc.fontSize(14).text('Education');
    doc.moveTo(doc.x, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke();
    doc.fontSize(10).text(`${data.education}${data.institution ? ' — ' + data.institution : ''}${data.graduation_year ? ' (' + data.graduation_year + ')' : ''}`);
    doc.moveDown();

    if (data.experience?.length) {
      doc.fontSize(14).text('Experience');
      doc.moveTo(doc.x, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke();
      data.experience.forEach((exp) => {
        doc.fontSize(11).text(`${exp.title || ''} ${exp.company ? '— ' + exp.company : ''}`);
        if (exp.duration) doc.fontSize(9).fillColor('#666').text(exp.duration);
        doc.fillColor('#000').fontSize(10).text(exp.description || '');
        doc.moveDown(0.5);
      });
      doc.moveDown(0.5);
    }

    if (data.projects) {
      doc.fontSize(14).text('Projects');
      doc.moveTo(doc.x, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke();
      doc.fontSize(10).text(data.projects);
      doc.moveDown();
    }

    doc.fontSize(14).text('Skills');
    doc.moveTo(doc.x, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke();
    doc.fontSize(10).text(data.skills.join(', ') || '—');
    if (data.verified_skills.length) {
      doc.fontSize(9).fillColor('#0a7').text(`Verified: ${data.verified_skills.join(', ')}`);
      doc.fillColor('#000');
    }
    doc.moveDown();

    if (data.certifications.length) {
      doc.fontSize(14).text('Certifications');
      doc.moveTo(doc.x, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke();
      doc.fontSize(10).text(data.certifications.join(', '));
      doc.moveDown();
    }

    if (data.interests.length) {
      doc.fontSize(14).text('Interests');
      doc.moveTo(doc.x, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke();
      doc.fontSize(10).text(data.interests.join(', '));
    }

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
