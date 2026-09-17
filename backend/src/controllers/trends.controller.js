const trendService = require('../services/trendService');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');

const skillDemand = asyncHandler(async (req, res) => {
  const { career } = req.query;
  if (!career) throw new ApiError(422, 'career query param is required.');
  const data = await trendService.computeSkillDemandForCareer(career);
  ok(res, data);
});

const emergingSkills = asyncHandler(async (req, res) => {
  const { career } = req.query;
  if (!career) throw new ApiError(422, 'career query param is required.');
  const data = await trendService.emergingSkills(career);
  ok(res, data);
});

const market = asyncHandler(async (req, res) => {
  const { career } = req.query;
  if (!career) throw new ApiError(422, 'career query param is required.');
  const data = await trendService.marketInsights(career);
  ok(res, data);
});

module.exports = { skillDemand, emergingSkills, market };
