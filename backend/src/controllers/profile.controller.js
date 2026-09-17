const profileService = require('../services/profileService');
const { validateProfileUpdate, validateResumeApply } = require('../validators/profileValidators');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/apiResponse');

const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getProfile(req.user.id);
  ok(res, { profile });
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const payload = validateProfileUpdate(req.body);
  const profile = await profileService.updateProfile(req.user.id, payload);
  ok(res, { profile });
});

// POST /api/profile/apply-resume -- persists a resume extraction the
// user has already reviewed on the Resume page. Same { profile }
// response shape as the other two handlers, so the client can reuse the
// existing profile-loading path unchanged.
const applyResumeToProfile = asyncHandler(async (req, res) => {
  const { extracted, mode } = validateResumeApply(req.body);
  const profile = await profileService.applyResumeExtraction(req.user.id, extracted, mode);
  ok(res, { profile, mode });
});

module.exports = { getMyProfile, updateMyProfile, applyResumeToProfile };
