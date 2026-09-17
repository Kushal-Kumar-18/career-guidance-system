const { query } = require('../config/db');

async function saveResult(userId, result) {
  const { rows } = await query(
    `INSERT INTO game_results (user_id, career, performance_score, stress_score, learning_score, performance_level, badges_earned)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [
      userId,
      result.career,
      result.performance_score,
      result.stress_score,
      result.learning_score,
      result.performance_level,
      result.badges_earned,
    ]
  );
  return rows[0];
}

async function listByUser(userId) {
  const { rows } = await query(
    `SELECT * FROM game_results WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

async function countAll() {
  const { rows } = await query(`SELECT COUNT(*)::int AS count FROM game_results`);
  return rows[0].count;
}

module.exports = { saveResult, listByUser, countAll };
