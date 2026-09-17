const { query } = require('../config/db');

// Columns a caller may write. Anything outside this list is ignored, so
// stray keys the frontend echoes back (id, user_id, updated_at) can never
// reach the SQL statement.
const WRITABLE_COLUMNS = [
  'education',
  'skills',
  'interests',
  'experience_years',
  'certifications',
  'projects',
  'preferred_location',
  'salary_expectation',
];

async function findByUserId(userId) {
  const { rows } = await query(`SELECT * FROM profiles WHERE user_id = $1`, [userId]);
  return rows[0] || null;
}

// Partial upsert: only the columns actually present in `fields` are
// written. The previous version defaulted every absent column to null,
// so saving one field silently blanked the rest -- which also wiped
// resume-applied data the moment the user saved anything else. Absent
// keys are now left exactly as they are in the existing row.
async function upsert(userId, fields = {}) {
  const columns = WRITABLE_COLUMNS.filter((c) => fields[c] !== undefined);

  if (columns.length === 0) {
    // Nothing to write; make sure a row exists and return it.
    const { rows } = await query(
      `INSERT INTO profiles (user_id) VALUES ($1)
       ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
       RETURNING *`,
      [userId]
    );
    return rows[0];
  }

  const values = columns.map((c) => {
    const v = fields[c];
    // Belt-and-braces for the INTEGER column: never hand Postgres ''.
    if (c === 'experience_years') {
      if (v === null || v === '') return null;
      const n = Number(v);
      return Number.isFinite(n) ? Math.round(n) : null;
    }
    return v;
  });

  const placeholders = columns.map((_, i) => `$${i + 2}`);
  const assignments = columns.map((c) => `${c} = EXCLUDED.${c}`).concat('updated_at = now()');

  const { rows } = await query(
    `INSERT INTO profiles (user_id, ${columns.join(', ')})
     VALUES ($1, ${placeholders.join(', ')})
     ON CONFLICT (user_id) DO UPDATE SET ${assignments.join(', ')}
     RETURNING *`,
    [userId, ...values]
  );
  return rows[0];
}

async function countAll() {
  const { rows } = await query(`SELECT COUNT(*)::int AS count FROM profiles`);
  return rows[0].count;
}

module.exports = { findByUserId, upsert, countAll, WRITABLE_COLUMNS };
