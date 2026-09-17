// Minimal structured logger. Swappable for pino/winston later without
// touching call sites (section 30: structured logging).
const level = process.env.LOG_LEVEL || 'info';
const levels = { error: 0, warn: 1, info: 2, debug: 3 };

function log(lvl, msg, meta) {
  if (levels[lvl] > levels[level]) return;
  const entry = { time: new Date().toISOString(), level: lvl, msg, ...(meta ? { meta } : {}) };
  const line = JSON.stringify(entry);
  if (lvl === 'error') console.error(line);
  else console.log(line);
}

module.exports = {
  error: (msg, meta) => log('error', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
};
