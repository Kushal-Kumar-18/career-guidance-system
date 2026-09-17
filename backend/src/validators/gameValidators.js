const ApiError = require('../utils/ApiError');

// Validates the body of POST /api/game/play. `scenarios` is the
// scoring-key array echoed back from GET /api/game/generate, and
// `choices` maps scenario id -> chosen choice id (e.g. { s1: 'a' }).
// The controller already checks presence of career/choices/scenarios;
// this adds structural validation before gameService does any scoring.
function validatePlayGame(body) {
  const errors = {};
  const { career, choices, scenarios } = body || {};

  if (!career || typeof career !== 'string' || !career.trim()) {
    errors.career = 'career is required.';
  }

  if (!scenarios || !Array.isArray(scenarios) || scenarios.length === 0) {
    errors.scenarios = 'scenarios must be a non-empty array (echoed from /game/generate).';
  } else if (
    scenarios.some(
      (s) => !s || typeof s.id !== 'string' || !Array.isArray(s.choices) || s.choices.length === 0
    )
  ) {
    errors.scenarios = 'each scenario must have an id and a non-empty choices array.';
  }

  if (!choices || typeof choices !== 'object' || Array.isArray(choices) || Object.keys(choices).length === 0) {
    errors.choices = 'choices must be a non-empty object mapping scenario id to chosen choice id.';
  }

  if (Object.keys(errors).length) {
    throw new ApiError(422, 'Validation failed', errors);
  }

  return { career: career.trim(), choices, scenarios };
}

module.exports = { validatePlayGame };
