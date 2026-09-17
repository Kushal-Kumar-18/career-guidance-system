const skillTestService = require('../services/skillTestService');
const { validateGenerateTest, validateSubmitAnswers } = require('../validators/skillTestValidators');
const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/apiResponse');

const generate = asyncHandler(async (req, res) => {
  const { skill_name, difficulty, total_questions } = validateGenerateTest(req.body);
  const data = await skillTestService.generateTest(req.user.id, {
    skillName: skill_name,
    difficulty: difficulty || 'intermediate',
    totalQuestions: total_questions ? parseInt(total_questions, 10) : 5,
  });
  created(res, data);
});

const submit = asyncHandler(async (req, res) => {
  const { testId, answers } = validateSubmitAnswers(req.params, req.body);
  const data = await skillTestService.submitTest(req.user.id, testId, answers);
  ok(res, data);
});

const results = asyncHandler(async (req, res) => {
  const data = await skillTestService.listResults(req.user.id);
  ok(res, data);
});

// GET /api/skill-tests/skills -- the caller's own profile skills, each
// annotated with its latest verification result. Drives the Skill Test
// page's selectable list (no hardcoded skills anywhere).
const profileSkills = asyncHandler(async (req, res) => {
  const data = await skillTestService.listProfileSkills(req.user.id);
  ok(res, data);
});

module.exports = { generate, submit, results, profileSkills };
