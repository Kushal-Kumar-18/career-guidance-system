const { query } = require('../config/db');

async function createTest(userId, { skillName, difficulty, totalQuestions }) {
  const { rows } = await query(
    `INSERT INTO skill_tests (user_id, skill_name, difficulty, total_questions, status)
     VALUES ($1, $2, $3, $4, 'pending')
     RETURNING *`,
    [userId, skillName, difficulty, totalQuestions]
  );
  return rows[0];
}

async function addQuestions(testId, questions) {
  const inserted = [];
  for (const q of questions) {
    const { rows } = await query(
      `INSERT INTO test_questions (test_id, question_text, options, correct_answer, difficulty)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [testId, q.question_text, JSON.stringify(q.options), q.correct_answer, q.difficulty]
    );
    inserted.push(rows[0]);
  }
  return inserted;
}

async function getTest(testId, userId) {
  const { rows } = await query(`SELECT * FROM skill_tests WHERE id = $1 AND user_id = $2`, [testId, userId]);
  return rows[0] || null;
}

async function getQuestions(testId) {
  const { rows } = await query(`SELECT * FROM test_questions WHERE test_id = $1 ORDER BY id ASC`, [testId]);
  return rows;
}

async function markCompleted(testId) {
  await query(`UPDATE skill_tests SET status = 'completed' WHERE id = $1`, [testId]);
}

async function saveResult(userId, testId, { skillName, score, percentage, proficiencyLevel, answers }) {
  const { rows } = await query(
    `INSERT INTO skill_test_results (user_id, test_id, skill_name, score, percentage, proficiency_level, answers)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [userId, testId, skillName, score, percentage, proficiencyLevel, JSON.stringify(answers)]
  );
  return rows[0];
}

async function listResultsByUser(userId) {
  const { rows } = await query(
    `SELECT * FROM skill_test_results WHERE user_id = $1 ORDER BY completed_at DESC`,
    [userId]
  );
  return rows;
}

async function verifiedSkillsForUser(userId) {
  // Returns { skillName: { proficiency_level, percentage, score } } — shape the
  // ML service expects for `verified_skills` (section: Skill Verification -> verified skills).
  const { rows } = await query(
    `SELECT DISTINCT ON (skill_name) skill_name, proficiency_level, percentage, score
     FROM skill_test_results WHERE user_id = $1 ORDER BY skill_name, completed_at DESC`,
    [userId]
  );
  const out = {};
  for (const r of rows) {
    out[r.skill_name] = {
      proficiency_level: r.proficiency_level,
      percentage: r.percentage,
      score: r.score,
    };
  }
  return out;
}

module.exports = {
  createTest,
  addQuestions,
  getTest,
  getQuestions,
  markCompleted,
  saveResult,
  listResultsByUser,
  verifiedSkillsForUser,
};
