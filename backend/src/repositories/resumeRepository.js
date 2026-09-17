const { query } = require('../config/db');

async function upsert(userId, fields) {
  const {
    phone = null,
    summary = null,
    institution = null,
    graduation_year = null,
    experience_json = [],
  } = fields;

  const { rows } = await query(
    `INSERT INTO resumes (user_id, phone, summary, institution, graduation_year, experience_json)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (user_id) DO UPDATE SET
       phone = EXCLUDED.phone,
       summary = EXCLUDED.summary,
       institution = EXCLUDED.institution,
       graduation_year = EXCLUDED.graduation_year,
       experience_json = EXCLUDED.experience_json,
       last_updated = now()
     RETURNING *`,
    [userId, phone, summary, institution, graduation_year, JSON.stringify(experience_json)]
  );
  return rows[0];
}

async function findByUserId(userId) {
  const { rows } = await query(`SELECT * FROM resumes WHERE user_id = $1`, [userId]);
  return rows[0] || null;
}

async function updateAtsScore(userId, score) {
  await query(`UPDATE resumes SET ats_score = $2, last_updated = now() WHERE user_id = $1`, [userId, score]);
}

module.exports = { upsert, findByUserId, updateAtsScore };
