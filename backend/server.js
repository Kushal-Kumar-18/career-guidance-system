require('dotenv').config();

const app = require('./src/app');
const env = require('./src/config/env');

const server = app.listen(env.port, () => {
  console.log(`Career Guidance API listening on port ${env.port} [${env.nodeEnv}]`);
});

// Without this, `docker compose down` / `docker stop` (SIGTERM) or an
// EC2 reboot kills the process immediately — Node's default behavior
// for SIGTERM with no handler installed is to exit right away, dropping
// any in-flight request. server.close() stops accepting new connections
// and waits for in-flight ones to finish before the process exits, so a
// deploy/restart doesn't hand a live request a connection reset.
function shutdown(signal) {
  console.log(`${signal} received, shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
  // Belt-and-suspenders: if something is still holding a connection
  // open 10s later, exit anyway rather than hang forever and force
  // Docker to SIGKILL after its own stop-timeout.
  setTimeout(() => {
    console.error('Forcing shutdown after 10s timeout.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
