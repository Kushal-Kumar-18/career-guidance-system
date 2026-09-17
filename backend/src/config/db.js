const { Pool } = require('pg');
const env = require('./env');
const logger = require('../utils/logger');
const { sanitizeParams } = require('../utils/textEncoding');

const pool = new Pool({
  connectionString: env.databaseUrl,
  // Force UTF8 for every connection this pool opens, at connection
  // startup itself (before any query can run on it) -- not via a
  // post-connect query, which can race the first query on that
  // connection. Without this, the client encoding is whatever the
  // OS/driver negotiates by default -- on Windows that can end up as
  // WIN1252, which cannot represent most Unicode characters (accented
  // letters, arrows, bullets, emoji, etc. that resume text or profile
  // fields commonly contain) and throws a Postgres error the moment
  // one shows up, surfacing as a 500. Setting it here removes the
  // dependency on the host machine's locale entirely.
  options: '-c client_encoding=UTF8',
});

pool.on('error', (err) => {
  // Idle client errors shouldn't crash the whole process
  console.error('Unexpected Postgres pool error', err);
});

// Postgres error code for "value has no equivalent in the target
// encoding" -- the exact failure this app has hit with WIN1252
// databases (see diagnostics/README.txt). This only fires if the
// database itself was created with a non-UTF8 encoding, which the
// client_encoding option above cannot fix -- see
// diagnostics/recreate-db-utf8.js for the real, permanent fix.
const UNTRANSLATABLE_CHARACTER = '22P05';

async function query(text, params) {
  const safeParams = sanitizeParams(params);
  try {
    return await pool.query(text, safeParams);
  } catch (err) {
    if (err.code === UNTRANSLATABLE_CHARACTER) {
      // The curated replacement table in textEncoding.js missed
      // something. Fall back to stripping every character outside the
      // Latin-1 range entirely and retry once instead of failing the
      // request outright.
      logger.warn('Retrying query after stripping non-WIN1252 characters', { code: err.code });
      const forced = Array.isArray(safeParams)
        ? safeParams.map((p) => (typeof p === 'string' ? p.replace(/[^\x00-\xff]/g, '?') : p))
        : safeParams;
      return await pool.query(text, forced);
    }
    throw err;
  }
}

async function healthCheck() {
  const result = await pool.query('SELECT 1 AS ok');
  return result.rows[0].ok === 1;
}

module.exports = { pool, query, healthCheck };