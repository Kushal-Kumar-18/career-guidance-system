const skillService = require('../services/skillService');
const profileRepository = require('../repositories/profileRepository');
const skillTestRepository = require('../repositories/skillTestRepository');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');

const predefined = asyncHandler(async (req, res) => {
  const data = await skillService.predefinedSkills();
  ok(res, data);
});

const extract = asyncHandler(async (req, res) => {
  const { text } = req.body || {};
  if (!text) throw new ApiError(422, 'text is required.');
  const data = await skillService.extractSkills(text);
  ok(res, { extracted_skills: data });
});

const normalize = asyncHandler(async (req, res) => {
  const { skills } = req.body || {};
  if (!Array.isArray(skills) || !skills.length) throw new ApiError(422, 'skills[] is required.');
  const data = await skillService.normalizeSkills(skills);
  ok(res, data);
});

const gap = asyncHandler(async (req, res) => {
  const { career } = req.query;
  if (!career) throw new ApiError(422, 'career query param is required.');
  const profile = await profileRepository.findByUserId(req.user.id);
  if (!profile) throw new ApiError(422, 'Complete your profile first.');
  const verifiedSkills = await skillTestRepository.verifiedSkillsForUser(req.user.id);
  const data = await skillService.skillGap(
    career,
    {
      skills: profile.skills || '',
      interests: profile.interests || '',
      experience: profile.experience_years || 0,
      certifications: profile.certifications || '',
      projects: profile.projects || '',
    },
    verifiedSkills
  );
  ok(res, data);
});

module.exports = { predefined, extract, normalize, gap };
