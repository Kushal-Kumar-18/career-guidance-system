const ApiError = require('../utils/ApiError');

const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

// Validates the body of POST /api/skill-tests. The controller already
// checked skill_name was present; this adds shape/range validation for
// the rest so a malformed difficulty or an absurd question count can't
// reach skillTestService.
function validateGenerateTest(body) {
  const errors = {};
  const { skill_name, difficulty, total_questions } = body || {};

  if (!skill_name || typeof skill_name !== 'string' || !skill_name.trim()) {
    errors.skill_name = 'skill_name is required.';
  } else if (skill_name.length > 255) {
    errors.skill_name = 'skill_name must be 255 characters or fewer.';
  }

  if (difficulty !== undefined && difficulty !== null && difficulty !== '') {
    if (!VALID_DIFFICULTIES.includes(String(difficulty).toLowerCase())) {
      errors.difficulty = `difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}.`;
    }
  }

  if (total_questions !== undefined && total_questions !== null && total_questions !== '') {
    const n = Number(total_questions);
    if (!Number.isInteger(n) || n < 1 || n > 25) {
      errors.total_questions = 'total_questions must be an integer between 1 and 25.';
    }
  }

  if (Object.keys(errors).length) {
    throw new ApiError(422, 'Validation failed', errors);
  }

  return {
    skill_name: skill_name.trim(),
    difficulty: difficulty ? String(difficulty).toLowerCase() : undefined,
    total_questions,
  };
}

// Validates the body of POST /api/skill-tests/:id/submit.
function validateSubmitAnswers(params, body) {
  const errors = {};
  const testId = Number(params?.id);
  if (!Number.isInteger(testId) || testId < 1) {
    errors.id = 'A valid test id is required in the URL.';
  }

  const { answers } = body || {};
  if (!Array.isArray(answers) || answers.length === 0) {
    errors.answers = 'answers must be a non-empty array of selected option indices.';
  } else if (answers.some((a) => !Number.isInteger(a) || a < 0)) {
    errors.answers = 'each answer must be a non-negative integer option index.';
  }

  if (Object.keys(errors).length) {
    throw new ApiError(422, 'Validation failed', errors);
  }

  return { testId, answers };
}

module.exports = { validateGenerateTest, validateSubmitAnswers };
