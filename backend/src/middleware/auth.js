const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

// Section 18: JWT with secure handling. Token is sent as a Bearer header.
// NOTE: the frontend (services/api.js) currently persists this token in
// localStorage so a page refresh doesn't log the user out — that is an
// XSS-exposure tradeoff, not an oversight, but it means the token is
// NOT limited to in-memory storage. If tightening this later, the safer
// options are (a) an httpOnly refresh cookie + short-lived in-memory
// access token, or (b) keeping localStorage but shortening expiresIn
// below and adding refresh. Whichever is chosen, keep this comment and
// SECURITY.md in sync with the actual storage mechanism.
function signToken(user) {
  return jwt.sign({ sub: user.id, username: user.username, role: user.role }, env.authSecret, {
    expiresIn: '7d',
  });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Authentication required.'));
  }
  try {
    const payload = jwt.verify(token, env.authSecret);
    req.user = { id: payload.sub, username: payload.username, role: payload.role };
    return next();
  } catch (err) {
    return next(new ApiError(401, 'Invalid or expired token.'));
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return next(new ApiError(403, 'Admin privileges required.'));
  }
  return next();
}

// Populates req.user if a valid token is present, but doesn't reject
// the request otherwise. Used by routes that behave differently for
// logged-in vs anonymous users (e.g. public career browsing + save button).
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme === 'Bearer' && token) {
    try {
      const payload = jwt.verify(token, env.authSecret);
      req.user = { id: payload.sub, username: payload.username, role: payload.role };
    } catch (err) {
      // ignore invalid token for optional auth
    }
  }
  next();
}

module.exports = { signToken, requireAuth, requireAdmin, optionalAuth };
