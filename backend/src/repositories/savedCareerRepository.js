const { query } = require('../config/db');

async function save(userId, careerName, notes) {
  const { rows } = await query(
    `INSERT INTO saved_careers (user_id, career_name, notes)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, career_name) DO UPDATE SET notes = EXCLUDED.notes
     RETURNING *`,
    [userId, careerName, notes ?? null]
  );
  return rows[0];
}

async function remove(userId, careerName) {
  await query(`DELETE FROM saved_careers WHERE user_id = $1 AND career_name = $2`, [userId, careerName]);
}

async function listByUser(userId) {
  const { rows } = await query(
    `SELECT * FROM saved_careers WHERE user_id = $1 ORDER BY saved_at DESC`,
    [userId]
  );
  return rows;
}

module.exports = { save, remove, listByUser };
