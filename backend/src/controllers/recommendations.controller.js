const recommendationService = require('../services/recommendationService');
const { validateSource, validateCandidateProfile, validateFeedback } = require('../validators/candidateValidators');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/apiResponse');

const generate = asyncHandler(async (req, res) => {
  const topK = req.body?.top_k ? parseInt(req.body.top_k, 10) : 5;
  const source = validateSource(req.body?.source);
  const candidate =
    source === 'resume_upload' || source === 'merge' ? validateCandidateProfile(req.body?.candidate) : undefined;

  const data = await recommendationService.generate(req.user.id, { topK, source, candidate });
  ok(res, data);
});

const history = asyncHandler(async (req, res) => {
  const data = await recommendationService.history(req.user.id);
  ok(res, data);
});

const feedback = asyncHandler(async (req, res) => {
  const { recommendationId, rating } = validateFeedback(req.body);
  const data = await recommendationService.submitFeedback(req.user.id, { recommendationId, rating });
  ok(res, data);
});

module.exports = { generate, history, feedback };
