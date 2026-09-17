const db = require('../config/db');
const env = require('../config/env');

async function getSystemHealth() {
  const status = { api: 'ok', database: 'unknown', mlService: 'unknown' };

  try {
    await db.healthCheck();
    status.database = 'ok';
  } catch (err) {
    status.database = `error: ${err.message}`;
  }

  try {
    const resp = await fetch(`${env.mlServiceUrl}/health`, { signal: AbortSignal.timeout(2000) });
    status.mlService = resp.ok ? 'ok' : `error: HTTP ${resp.status}`;
  } catch (err) {
    status.mlService = `unreachable: ${err.message}`;
  }

  return status;
}

module.exports = { getSystemHealth };
