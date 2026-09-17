const careerService = require('./careerService');
const gameRepository = require('../repositories/gameRepository');
const activityRepository = require('../repositories/activityRepository');
const ApiError = require('../utils/ApiError');

// "A day in the life" career simulation. Documented fresh implementation
// (see PHASE1_NOTES.md — legacy gamification module not in the handoff).
// Each scenario offers 3 choices with hand-tuned performance/stress/
// learning deltas reflecting generally sound workplace judgment, using
// the real career's skills/name for flavor text.

function buildScenarios(career) {
  const skill = (career.skills || ['your core skill'])[0];
  return [
    {
      id: 's1',
      prompt: `It's your first week as a ${career.name}. A deadline is at risk because a task needs ${skill}, which you're still learning. What do you do?`,
      choices: [
        { id: 'a', text: 'Ask a teammate for a quick pairing session to learn as you go.', performance: 8, stress: 3, learning: 10 },
        { id: 'b', text: 'Quietly try to figure it out alone, even if it takes longer.', performance: 4, stress: 8, learning: 5 },
        { id: 'c', text: 'Escalate immediately and ask for the deadline to be pushed.', performance: 3, stress: 2, learning: 2 },
      ],
    },
    {
      id: 's2',
      prompt: `A stakeholder disagrees with your technical approach on a ${career.name} project. How do you respond?`,
      choices: [
        { id: 'a', text: 'Explain your reasoning with data/examples and stay open to feedback.', performance: 9, stress: 3, learning: 7 },
        { id: 'b', text: 'Defer entirely to their opinion to avoid conflict.', performance: 4, stress: 5, learning: 3 },
        { id: 'c', text: 'Insist on your approach without discussion.', performance: 3, stress: 7, learning: 2 },
      ],
    },
    {
      id: 's3',
      prompt: `You discover a mistake in work you delivered last week. What's your move?`,
      choices: [
        { id: 'a', text: 'Flag it proactively with a proposed fix.', performance: 10, stress: 4, learning: 6 },
        { id: 'b', text: 'Fix it quietly without telling anyone.', performance: 5, stress: 6, learning: 4 },
        { id: 'c', text: 'Wait to see if anyone notices.', performance: 1, stress: 9, learning: 1 },
      ],
    },
    {
      id: 's4',
      prompt: `You have free time between projects. How do you use it?`,
      choices: [
        { id: 'a', text: `Deepen your skills in ${skill} through a small self-project.`, performance: 7, stress: 2, learning: 10 },
        { id: 'b', text: 'Help a teammate with their backlog.', performance: 8, stress: 3, learning: 5 },
        { id: 'c', text: 'Coast until the next assignment arrives.', performance: 2, stress: 1, learning: 1 },
      ],
    },
  ];
}

async function generateGame(careerName) {
  const career = await careerService.getCareerDetail(careerName);
  const scenarios = buildScenarios(career);
  // No game-session table exists in the schema (section 10), so the game
  // is stateless: the full scenario (including scoring weights) is
  // returned to the client and echoed back on submit. This is a game, not
  // a graded assessment, so exposing weights up front is an acceptable
  // trade-off versus adding new persistence just for this.
  return { career: career.name, scenarios };
}

function levelFromScore(score) {
  if (score >= 85) return 'Outstanding';
  if (score >= 65) return 'Strong';
  if (score >= 45) return 'Developing';
  return 'Needs Practice';
}

async function playGame(userId, careerName, choices, scenarios) {
  // choices: { s1: 'a', s2: 'b', ... }; scenarios: the _scoringKey from generateGame
  if (!scenarios || !Array.isArray(scenarios)) throw new ApiError(422, 'scenarios (scoring key) is required.');

  let performance = 0;
  let stress = 0;
  let learning = 0;
  let answered = 0;

  for (const scenario of scenarios) {
    const chosenId = choices?.[scenario.id];
    const choice = scenario.choices.find((c) => c.id === chosenId);
    if (!choice) continue;
    performance += choice.performance;
    stress += choice.stress;
    learning += choice.learning;
    answered += 1;
  }

  if (!answered) throw new ApiError(422, 'No valid choices submitted.');

  const maxPer = 10 * answered;
  const performanceScore = Math.round((performance / maxPer) * 100);
  const stressScore = Math.round((stress / maxPer) * 100);
  const learningScore = Math.round((learning / maxPer) * 100);
  const badges = [performanceScore >= 80, stressScore <= 40, learningScore >= 70].filter(Boolean).length;

  const result = await gameRepository.saveResult(userId, {
    career: careerName,
    performance_score: performanceScore,
    stress_score: stressScore,
    learning_score: learningScore,
    performance_level: levelFromScore(performanceScore),
    badges_earned: badges,
  });
  await activityRepository.log(userId, 'game_played', { career: careerName, performanceScore });

  return result;
}

async function history(userId) {
  return gameRepository.listByUser(userId);
}

module.exports = { generateGame, playGame, history };
