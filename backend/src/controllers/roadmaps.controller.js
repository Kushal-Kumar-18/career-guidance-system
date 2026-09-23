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

// Personalized roadmap: this user's current skill gap for the career
// (from the existing, unmodified /skill-gap ML endpoint) layered onto the
// same roadmap shape buildRoadmap always returns — focus_skills, the
// "skills to learn" list, and demonstrated_skills all reflect what THIS
// candidate actually has/is missing. The roadmap never feeds back into
// recommendations/scoring; it only reads a gap that was already computed
// for display.
const personalized = asyncHandler(async (req, res) => {
  const careerName = req.params.career;
  const career = await careerService.getCareerDetail(careerName);

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

  const roadmap = careerService.buildRoadmap(career, gap);

  // your_missing_skills / your_matched_skills kept for backward
  // compatibility with any existing consumer of this endpoint; the same
  // data is also now available as demonstrated_skills / skills_to_learn.
  ok(res, { ...roadmap, your_missing_skills: gap.missing_skills, your_matched_skills: gap.matched_skills });
});

module.exports = { forCareer, personalized };
