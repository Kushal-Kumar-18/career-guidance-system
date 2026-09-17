const gameService = require('../services/gameService');
const { validatePlayGame } = require('../validators/gameValidators');
const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');

const generate = asyncHandler(async (req, res) => {
  const { career } = req.query;
  if (!career) throw new ApiError(422, 'career query param is required.');
  const data = await gameService.generateGame(career);
  created(res, data);
});

const play = asyncHandler(async (req, res) => {
  const { career, choices, scenarios } = validatePlayGame(req.body);
  const result = await gameService.playGame(req.user.id, career, choices, scenarios);
  ok(res, result);
});

const history = asyncHandler(async (req, res) => {
  const data = await gameService.history(req.user.id);
  ok(res, data);
});

module.exports = { generate, play, history };
