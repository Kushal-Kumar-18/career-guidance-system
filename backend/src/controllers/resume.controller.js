const resumeService = require('../services/resumeService');
const resumeExtractionService = require('../services/resumeExtractionService');
const { validateResumeUpdate } = require('../validators/resumeValidators');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');
const activityRepository = require('../repositories/activityRepository');

const getMine = asyncHandler(async (req, res) => {
  const resume = await resumeService.getResume(req.user.id);
  ok(res, resume);
});

const update = asyncHandler(async (req, res) => {
  const {
    phone, summary, institution, graduation_year, experience,
    full_name, headline, location, linkedin_url, github_url, portfolio_url,
    education, internships, projects, certifications,
  } = validateResumeUpdate(req.body);
  const resume = await resumeService.updateResume(req.user.id, {
    phone,
    summary,
    institution,
    graduation_year,
    experience_json: experience || [],
    full_name,
    headline,
    location,
    linkedin_url,
    github_url,
    portfolio_url,
    education_json: education || [],
    internships_json: internships || [],
    projects_json: projects || [],
    certifications_json: certifications || [],
  });
  ok(res, resume);
});

const preview = asyncHandler(async (req, res) => {
  const data = await resumeService.buildResumeData(req.user.id);
  ok(res, data);
});

const generate = asyncHandler(async (req, res) => {
  const { url, data } = await resumeService.generatePdf(req.user.id);
  // `download_url` is an authenticated API route, not a public static
  // file path — the client must call it with its Bearer token.
  ok(res, { download_url: url, preview: data });
});

// Streams the caller's own generated resume PDF. Authentication is
// enforced by requireAuth on the router; ownership is enforced by
// resumeService deriving the storage key from req.user.id alone, so
// there is no id/path parameter a caller could tamper with. This
// replaces the old unauthenticated /files/... static route.
const download = asyncHandler(async (req, res) => {
  const { buffer, filename } = await resumeService.getGeneratedPdf(req.user.id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Length', buffer.length);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  // Personal data: never let a shared/intermediate cache hold onto it.
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.send(buffer);
});

// Source B (master prompt section 5/6): parses an uploaded PDF/DOCX
// resume and returns a best-effort extraction for the user to review —
// nothing is persisted here. The reviewed result is later sent back to
// POST /api/recommendations as `candidate` with source=resume_upload.
const uploadAndExtract = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(422, 'No file was uploaded (expected field "resume").');
  const result = await resumeExtractionService.extractFromBuffer(
    req.file.buffer,
    req.file.mimetype,
    req.file.originalname
  );
  // Log only metadata — never the extracted resume content itself
  // (section 11: never log full resume contents / personal information).
  await activityRepository.log(req.user.id, 'resume_uploaded', {
    file_type: req.file.mimetype,
    size_bytes: req.file.size,
  });
  ok(res, result);
});

module.exports = { getMine, update, preview, generate, download, uploadAndExtract };
