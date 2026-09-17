const { query } = require('../config/db');

async function log(userId, action, details) {
  await query(
    `INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)`,
    [userId, action, typeof details === 'string' ? details : JSON.stringify(details ?? {})]
  );
}

async function listByUser(userId, limit = 100) {
  const { rows } = await query(
    `SELECT * FROM activity_logs WHERE user_id = $1 ORDER BY timestamp DESC LIMIT $2`,
    [userId, limit]
  );
  return rows;
}

async function countActiveToday() {
  const { rows } = await query(
    `SELECT COUNT(DISTINCT user_id)::int AS count FROM activity_logs WHERE timestamp::date = CURRENT_DATE`
  );
  return rows[0].count;
}

module.exports = { log, listByUser, countActiveToday };
