const { query } = require('../config/db');

async function findByEmailOrUsername(identifier) {
  const { rows } = await query(
    `SELECT * FROM users WHERE email = $1 OR username = $1 LIMIT 1`,
    [identifier]
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await query(`SELECT * FROM users WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function create({ username, email, passwordHash, role = 'user' }) {
  const { rows } = await query(
    `INSERT INTO users (username, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, username, email, role, created_at`,
    [username, email, passwordHash, role]
  );
  return rows[0];
}

async function touchLastLogin(id) {
  await query(`UPDATE users SET last_login = now() WHERE id = $1`, [id]);
}

// Admin-only listing — never selects password_hash.
async function listAll() {
  const { rows } = await query(
    `SELECT id, username, email, role, created_at, last_login FROM users ORDER BY created_at DESC`
  );
  return rows;
}

async function deleteById(id) {
  await query(`DELETE FROM users WHERE id = $1`, [id]);
}

module.exports = { findByEmailOrUsername, findById, create, touchLastLogin, listAll, deleteById };
