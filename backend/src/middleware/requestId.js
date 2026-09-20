const crypto = require('node:crypto');

// -----------------------------------------------------------------------
// Observability (master prompt Phase 2 section F): every request gets a
// stable id, used consistently across the access log line, any error log
// line for that request, and the response header — so a single request
// can be traced end to end without correlating on timestamps alone.
//
// Trusts an upstream-supplied X-Request-Id when present (the Nginx
// config sets one via $request_id — see frontend/nginx.conf) rather than
// always minting a fresh one, so a request can be traced all the way
// from the edge through the backend using ONE id, not two unrelated
// ones. Falls back to generating one for requests that reach the
// backend directly (local dev without Nginx in front, tests).
// -----------------------------------------------------------------------
function requestId(req, res, next) {
  const incoming = req.headers['x-request-id'];
  req.id = typeof incoming === 'string' && incoming.trim() ? incoming.trim().slice(0, 100) : crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
}

module.exports = requestId;
