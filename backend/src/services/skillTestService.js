const skillTestRepository = require('../repositories/skillTestRepository');
const activityRepository = require('../repositories/activityRepository');
const profileRepository = require('../repositories/profileRepository');
const candidateProfileService = require('./candidateProfileService');
const { QUESTION_BANK } = require('../data/questionBank');
const ApiError = require('../utils/ApiError');

function normalizeKey(skill) {
  return String(skill || '').trim().toLowerCase();
}

// Fallback generator for skills without a curated bank entry — produces
// generic-but-relevant conceptual questions so every claimed skill can
// still be tested. Documented fallback (see questionBank.js header).
function generateTemplateQuestions(skill, count, difficulty) {
  const templates = [
    {
      question_text: `Which of these best describes core knowledge of "${skill}"?`,
      options: [
        `Understanding fundamental concepts and common use cases of ${skill}`,
        `Ignoring best practices entirely`,
        `Only knowing the name, not how it works`,
        `Unrelated to professional practice`,
      ],
      correct_answer: 0,
    },
    {
      question_text: `What is a good first step when learning ${skill} for a new project?`,
      options: [
        `Skip documentation and guess`,
        `Review fundamentals and official documentation`,
        `Avoid any practice projects`,
        `Never ask for help or feedback`,
      ],
      correct_answer: 1,
    },
    {
      question_text: `Which statement about applying ${skill} in real projects is most accurate?`,
      options: [
        `It requires no practice to become proficient`,
        `Hands-on practice and iteration improve proficiency over time`,
        `Reading alone is sufficient for mastery`,
        `It has no relevant best practices`,
      ],
      correct_answer: 1,
    },
    {
      question_text: `When evaluating your own proficiency in ${skill}, which is a reliable signal?`,
      options: [
        `Ability to apply it correctly to solve real problems`,
        `Having heard of it once`,
        `Owning a book about it`,
        `None of the above`,
      ],
      correct_answer: 0,
    },
    {
      question_text: `What commonly separates beginner from advanced use of ${skill}?`,
      options: [
        `Advanced users avoid using it at all`,
        `Advanced users understand edge cases, trade-offs, and best practices`,
        `There is no meaningful difference`,
        `Advanced users use it less often`,
      ],
      correct_answer: 1,
    },
  ];
  return templates.slice(0, count).map((t) => ({ ...t, difficulty }));
}

async function generateTest(userId, { skillName, difficulty = 'intermediate', totalQuestions = 5 }) {
  const key = normalizeKey(skillName);
  const bankQuestions = QUESTION_BANK[key] || [];

  let selected = bankQuestions.filter((q) => !difficulty || q.difficulty === difficulty);
  if (selected.length < totalQuestions) {
    selected = bankQuestions; // widen to all difficulties for this skill
  }
  if (selected.length < totalQuestions) {
    selected = selected.concat(generateTemplateQuestions(skillName, totalQuestions - selected.length, difficulty));
  }
  selected = selected.slice(0, totalQuestions);

  const test = await skillTestRepository.createTest(userId, { skillName, difficulty, totalQuestions: selected.length });
  const questions = await skillTestRepository.addQuestions(test.id, selected);
  await activityRepository.log(userId, 'skill_test_generated', { skill: skillName });

  // Don't leak correct_answer to the client before submission.
  const safeQuestions = questions.map(({ correct_answer, ...q }) => q);
  return { test, questions: safeQuestions };
}

function proficiencyLevel(percentage) {
  if (percentage >= 85) return 'Expert';
  if (percentage >= 65) return 'Proficient';
  if (percentage >= 40) return 'Intermediate';
  return 'Beginner';
}

async function submitTest(userId, testId, answers) {
  const test = await skillTestRepository.getTest(testId, userId);
  if (!test) throw new ApiError(404, 'Skill test not found.');
  if (test.status === 'completed') throw new ApiError(409, 'This test has already been submitted.');

  const questions = await skillTestRepository.getQuestions(testId);
  if (!Array.isArray(answers) || answers.length !== questions.length) {
    throw new ApiError(422, `Expected ${questions.length} answers.`);
  }

  let correctCount = 0;
  const breakdown = questions.map((q, idx) => {
    const isCorrect = answers[idx] === q.correct_answer;
    if (isCorrect) correctCount += 1;
    return { question_id: q.id, selected: answers[idx], correct_answer: q.correct_answer, is_correct: isCorrect };
  });

  const percentage = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;
  const level = proficiencyLevel(percentage);

  await skillTestRepository.markCompleted(testId);
  const result = await skillTestRepository.saveResult(userId, testId, {
    skillName: test.skill_name,
    score: correctCount,
    percentage,
    proficiencyLevel: level,
    answers: breakdown,
  });
  await activityRepository.log(userId, 'skill_test_submitted', { skill: test.skill_name, percentage });

  return { result, breakdown };
}

async function listResults(userId) {
  return skillTestRepository.listResultsByUser(userId);
}

// The skills the Skill Test page offers are read straight off the user's
// own profile row -- whichever way those skills got there (typed into
// the profile form, or extracted from a resume and applied via
// POST /api/profile/apply-resume). There is deliberately no hardcoded
// catalogue here: an empty profile yields an empty list, and the client
// tells the user to fill in their profile first.
//
// Each entry is annotated with the user's most recent verified result
// for that skill, which is the same record recommendationService already
// feeds to the ML service as `verified_skills` -- so retaking a test is
// what refines the recommendation evidence/score.
async function listProfileSkills(userId) {
  const profile = await profileRepository.findByUserId(userId);
  const skills = candidateProfileService.toList(profile ? profile.skills : '');
  const verified = await skillTestRepository.verifiedSkillsForUser(userId);

  const verifiedByKey = new Map(
    Object.entries(verified).map(([name, v]) => [normalizeKey(name), v])
  );

  return skills.map((name) => {
    const key = normalizeKey(name);
    const result = verifiedByKey.get(key) || null;
    return {
      skill_name: name,
      // Curated questions exist for this skill; otherwise the documented
      // template fallback in generateTemplateQuestions() is used.
      curated: Boolean(QUESTION_BANK[key]),
      verified: Boolean(result),
      proficiency_level: result ? result.proficiency_level : null,
      percentage: result ? result.percentage : null,
    };
  });
}

module.exports = { generateTest, submitTest, listResults, listProfileSkills };
