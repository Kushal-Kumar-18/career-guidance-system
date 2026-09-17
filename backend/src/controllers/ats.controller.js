const atsService = require('../services/atsService');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');

const analyze = asyncHandler(async (req, res) => {
  const { target_career } = req.body || {};
  if (!target_career) throw new ApiError(422, 'target_career is required.');
  const result = await atsService.analyze(req.user.id, target_career);
  ok(res, result);
});

module.exports = { analyze };
