const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const env = require('../config/env');

function notFound(req, res) {
  res.status(404).json({ success: false, error: { message: `Route not found: ${req.method} ${req.originalUrl}` } });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      success: false,
      error: { message: err.message, ...(err.details ? { details: err.details } : {}) },
      request_id: req.id,
    });
  }

  // Multer (resume upload) errors — e.g. file too large, unexpected
  // field name. Never let these fall through to the generic 500 below,
  // since their .message is safe and useful to show the user.
  if (err.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'That file is too large.'
        : err.code === 'LIMIT_UNEXPECTED_FILE'
        ? 'Unexpected file field.'
        : 'Could not process the uploaded file.';
    return res.status(422).json({ success: false, error: { message }, request_id: req.id });
  }

  // Postgres unique_violation
  if (err.code === '23505') {
    return res.status(409).json({ success: false, error: { message: 'Resource already exists.' }, request_id: req.id });
  }
  // Postgres foreign_key_violation
  if (err.code === '23503') {
    return res
      .status(400)
      .json({ success: false, error: { message: 'Referenced resource does not exist.' }, request_id: req.id });
  }

  // request_id here is what lets an operator find this exact failure in
  // the access log / any upstream (Nginx) log for the same request,
  // without needing to correlate on timestamps alone (section F).
  logger.error('Unhandled error', { request_id: req.id, message: err.message, stack: err.stack });
  const status = err.status || 500;
  // In production, unrecognized errors only ever show a generic message
  // to the client (the real detail goes to the server log above) --
  // leaking internals in a 500 response is an information-disclosure
  // risk. Outside production, surfacing the real message here saves a
  // trip to the server terminal while debugging.
  const message =
    status === 500 ? (env.isProduction ? 'Internal server error' : `Internal server error: ${err.message}`) : err.message;
  res.status(status).json({ success: false, error: { message }, request_id: req.id });
}

module.exports = { notFound, errorHandler };
