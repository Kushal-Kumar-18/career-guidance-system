const ApiError = require('../utils/ApiError');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegister(body) {
  const errors = {};
  const { username, email, password } = body || {};

  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    errors.username = 'Username must be at least 3 characters.';
  }
  if (!email || !EMAIL_RE.test(email)) {
    errors.email = 'A valid email is required.';
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  if (Object.keys(errors).length) {
    throw new ApiError(422, 'Validation failed', errors);
  }

  return { username: username.trim(), email: email.trim().toLowerCase(), password };
}

function validateLogin(body) {
  const errors = {};
  const { identifier, password } = body || {};
  if (!identifier) errors.identifier = 'Email or username is required.';
  if (!password) errors.password = 'Password is required.';
  if (Object.keys(errors).length) {
    throw new ApiError(422, 'Validation failed', errors);
  }
  return { identifier: identifier.trim(), password };
}

module.exports = { validateRegister, validateLogin };
