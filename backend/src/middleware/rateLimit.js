const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// -----------------------------------------------------------------------
// Rate limiting (fixed window, in-process).
//
// Deliberately dependency-free: the project has no rate-limit package in
// package.json/package-lock.json, and adding one would desync the
// committed lockfile right before setup. This covers the actual threat
// for a single-instance EC2 deployment — credential stuffing on
// /auth/login, upload/CPU abuse on resume + skill extraction, and
// hammering the Adzuna-backed job endpoints (which have a real upstream
// quota).
//
// Known limitation, stated rather than hidden: counters live in this
// process's memory, so they reset on restart and are NOT shared across
// multiple backend instances. That is correct for the current
// single-container deployment. If the backend is ever scaled
// horizontally, swap the `hits` Map below for Redis (or put the limit on
// the load balancer/WAF) — the middleware's interface would not change.
// -----------------------------------------------------------------------

const hits = new Map(); // key -> { count, resetAt }

// Periodic sweep so the Map doesn't grow unbounded with one entry per
// IP forever. unref() so this timer never keeps the process alive.
const SWEEP_INTERVAL_MS = 60 * 1000;
const sweeper = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of hits) {
    if (entry.resetAt <= now) hits.delete(key);
  }
}, SWEEP_INTERVAL_MS);
if (typeof sweeper.unref === 'function') sweeper.unref();

function clientKey(req, bucket) {
  // Authenticated requests are keyed per user so one user behind a shared
  // NAT/campus IP can't exhaust everyone else's budget; anonymous ones
  // fall back to IP. req.ip respects the `trust proxy` setting configured
  // in app.js, so this is the real client IP behind nginx.
  const identity = req.user?.id ? `user:${req.user.id}` : `ip:${req.ip || 'unknown'}`;
  return `${bucket}|${identity}`;
}

/**
 * @param {object} options
 * @param {string} options.bucket   Name used in the counter key + logs.
 * @param {number} options.windowMs Window length in milliseconds.
 * @param {number} options.max      Allowed requests per window (before multiplier).
 * @param {string} [options.message] Message returned on 429.
 */
function rateLimit({ bucket, windowMs, max, message }) {
  const effectiveMax = Math.max(1, Math.round(max * env.rateLimitMultiplier));

  return function rateLimitMiddleware(req, res, next) {
    if (!env.rateLimitEnabled) return next();

    const key = clientKey(req, bucket);
    const now = Date.now();
    let entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    entry.count += 1;

    const remaining = Math.max(0, effectiveMax - entry.count);
    const resetSeconds = Math.ceil((entry.resetAt - now) / 1000);
    res.setHeader('RateLimit-Limit', effectiveMax);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', resetSeconds);

    if (entry.count > effectiveMax) {
      res.setHeader('Retry-After', resetSeconds);
      // Log the bucket and a coarse identity only — never request bodies
      // (section 11: no credentials or resume content in logs).
      logger.warn('rate limit exceeded', { bucket, key, limit: effectiveMax });
      return next(
        new ApiError(
          429,
          message || `Too many requests. Please try again in ${resetSeconds} second(s).`
        )
      );
    }

    return next();
  };
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// Named buckets, kept here so every limit in the app is visible in one
// place rather than scattered as magic numbers across route files.
const limiters = {
  // Blanket backstop for the whole /api surface.
  global: rateLimit({ bucket: 'global', windowMs: 15 * MINUTE, max: 600 }),

  // Credential endpoints: the tightest bucket, since this is where
  // brute-force/credential-stuffing actually happens.
  auth: rateLimit({
    bucket: 'auth',
    windowMs: 15 * MINUTE,
    max: 10,
    message: 'Too many authentication attempts. Please wait a few minutes and try again.',
  }),

  // File upload + parsing: bounded by CPU/memory cost per request, not
  // by abuse volume alone.
  resumeUpload: rateLimit({
    bucket: 'resume_upload',
    windowMs: HOUR,
    max: 20,
    message: 'Too many resume uploads in the last hour. Please try again later.',
  }),

  // PDF generation (pdfkit render + storage write).
  resumeGenerate: rateLimit({ bucket: 'resume_generate', windowMs: HOUR, max: 30 }),

  // Skill extraction / normalization — text processing per call.
  skillExtraction: rateLimit({ bucket: 'skill_extraction', windowMs: HOUR, max: 60 }),

  // Recommendations fan out to the ML service (and, for the top results,
  // to Adzuna) on every call.
  recommendations: rateLimit({
    bucket: 'recommendations',
    windowMs: HOUR,
    max: 40,
    message: 'Too many recommendation requests in the last hour. Please try again later.',
  }),

  // Feedback is cheap but triggers a model retrain in the ML service.
  feedback: rateLimit({ bucket: 'feedback', windowMs: HOUR, max: 60 }),

  // Test generation/submission.
  skillTests: rateLimit({ bucket: 'skill_tests', windowMs: HOUR, max: 60 }),

  // Anything that can reach the third-party job API, which has its own
  // upstream quota we must not burn through.
  jobs: rateLimit({ bucket: 'jobs', windowMs: 15 * MINUTE, max: 60 }),

  // Trend aggregation runs table scans over cached postings.
  trends: rateLimit({ bucket: 'trends', windowMs: 15 * MINUTE, max: 60 }),
};

module.exports = { rateLimit, limiters };
