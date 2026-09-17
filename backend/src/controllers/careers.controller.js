const careerService = require('../services/careerService');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');

const list = asyncHandler(async (req, res) => {
  const { q, limit, offset } = req.query;
  const result = await careerService.listCareers(q, limit ? parseInt(limit, 10) : undefined, offset ? parseInt(offset, 10) : undefined);
  ok(res, result.data, 200);
  // Note: meta (total/limit/offset) intentionally available on result if the
  // frontend needs pagination info later; kept response shape simple per
  // section 8's { success, data } convention.
});

const detail = asyncHandler(async (req, res) => {
  const career = await careerService.getCareerDetail(req.params.name);
  ok(res, career);
});

const roadmap = asyncHandler(async (req, res) => {
  const career = await careerService.getCareerDetail(req.params.name);
  ok(res, careerService.buildRoadmap(career));
});

const mythsReality = asyncHandler(async (req, res) => {
  const career = await careerService.getCareerDetail(req.params.name);
  ok(res, careerService.buildMythsReality(career));
});

const compare = asyncHandler(async (req, res) => {
  const names = (req.query.names || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (names.length < 2) throw new ApiError(422, 'Provide at least 2 career names via ?names=A,B');
  const data = await careerService.compareCareers(names);
  ok(res, data);
});

const investment = asyncHandler(async (req, res) => {
  const career = await careerService.getCareerDetail(req.params.name);
  ok(res, careerService.buildInvestment(career));
});

const weeklyPlan = asyncHandler(async (req, res) => {
  const career = await careerService.getCareerDetail(req.params.name);
  const hours = req.query.hours ? parseInt(req.query.hours, 10) : 20;
  ok(res, careerService.buildWeeklyPlan(career, hours));
});

const saveCareer = asyncHandler(async (req, res) => {
  const saved = await careerService.saveCareer(req.user.id, req.params.name, req.body?.notes);
  ok(res, saved);
});

const unsaveCareer = asyncHandler(async (req, res) => {
  await careerService.unsaveCareer(req.user.id, req.params.name);
  ok(res, { removed: true });
});

const listSaved = asyncHandler(async (req, res) => {
  const data = await careerService.listSavedCareers(req.user.id);
  ok(res, data);
});

module.exports = { list, detail, roadmap, mythsReality, compare, investment, weeklyPlan, saveCareer, unsaveCareer, listSaved };
