const careerService = require('../services/careerService');
const skillService = require('../services/skillService');
const profileRepository = require('../repositories/profileRepository');
const skillTestRepository = require('../repositories/skillTestRepository');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');

// Generic roadmap for a career (public).
const forCareer = asyncHandler(async (req, res) => {
  const career = await careerService.getCareerDetail(req.params.career);
  ok(res, careerService.buildRoadmap(career));
});

// Personalized roadmap: generic roadmap + this user's current skill gap
// for the career, so focus_skills reflect what THEY are missing.
const personalized = asyncHandler(async (req, res) => {
  const careerName = req.params.career;
  const career = await careerService.getCareerDetail(careerName);
  const roadmap = careerService.buildRoadmap(career);

  const profile = await profileRepository.findByUserId(req.user.id);
  if (!profile) throw new ApiError(422, 'Complete your profile first.');
  const verifiedSkills = await skillTestRepository.verifiedSkillsForUser(req.user.id);
  const gap = await skillService.skillGap(
    careerName,
    {
      skills: profile.skills || '',
      interests: profile.interests || '',
      experience: profile.experience_years || 0,
      certifications: profile.certifications || '',
      projects: profile.projects || '',
    },
    verifiedSkills
  );

  ok(res, { ...roadmap, your_missing_skills: gap.missing_skills, your_matched_skills: gap.matched_skills });
});

module.exports = { forCareer, personalized };
