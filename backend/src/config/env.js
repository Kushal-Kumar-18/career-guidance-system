require('dotenv').config();

// Centralized, validated access to environment configuration.
// Section 19 of the architecture doc: all config through env vars,
// no hard-coded hostnames.
const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

// Values that are fine as a local-dev convenience but must NEVER be
// accepted in production. Anything listed here (case-insensitive) is
// treated as "not a real secret" and causes a hard startup failure when
// NODE_ENV=production. See requiredInProduction() below.
const KNOWN_PLACEHOLDER_SECRETS = new Set([
  'dev-only-change-me',
  'change-me-in-every-environment',
  'change-me',
  'changeme',
  'secret',
  'password',
  'your-secret-here',
  'test',
]);

const MIN_PRODUCTION_SECRET_LENGTH = 32;

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// In development we keep the convenient fallback so `npm run dev` works
// with zero configuration. In production there is no fallback at all:
// the process refuses to start rather than silently signing tokens with
// a value that is published in this repository.
function requiredInProduction(name, devFallback, { secret = false } = {}) {
  const raw = process.env[name];
  // A variable that is present but blank (e.g. `AUTH_SECRET=` in a .env
  // file) counts as unset. Otherwise development would sign tokens with
  // an empty string, and production's "is it set?" check below would
  // pass on a value that isn't really there.
  const isBlank = raw === undefined || raw.trim() === '';

  if (!isProduction) {
    return isBlank ? devFallback : raw;
  }

  if (isBlank) {
    throw new Error(
      `${name} must be set explicitly when NODE_ENV=production. ` +
        `Refusing to start with the development fallback.`
    );
  }

  if (secret) {
    const value = raw.trim();
    if (KNOWN_PLACEHOLDER_SECRETS.has(value.toLowerCase())) {
      throw new Error(
        `${name} is set to a known placeholder value. Generate a real secret ` +
          `(e.g. \`openssl rand -base64 48\`) before starting in production.`
      );
    }
    if (value.length < MIN_PRODUCTION_SECRET_LENGTH) {
      throw new Error(
        `${name} must be at least ${MIN_PRODUCTION_SECRET_LENGTH} characters in production ` +
          `(got ${value.length}). Generate one with \`openssl rand -base64 48\`.`
      );
    }
  }

  return raw;
}

module.exports = {
  nodeEnv,
  isProduction,
  port: parseInt(process.env.PORT || '4000', 10),
  databaseUrl: requiredInProduction(
    'DATABASE_URL',
    'postgresql://postgres:postgres@localhost:5432/career_guidance'
  ),
  // Signing key for JWTs (see middleware/auth.js). Hard-fails in
  // production if missing, placeholder, or too short — a leaked/guessable
  // signing key means anyone can mint a token for any user, including an
  // admin one.
  authSecret: requiredInProduction('AUTH_SECRET', 'dev-only-change-me', { secret: true }),
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  mlServiceTimeoutMs: parseInt(process.env.ML_SERVICE_TIMEOUT_MS || '10000', 10),
  adzunaAppId: process.env.ADZUNA_APP_ID || '',
  adzunaAppKey: process.env.ADZUNA_APP_KEY || '',
  adzunaCountry: process.env.ADZUNA_COUNTRY || 'in',
  storageDriver: process.env.STORAGE_DRIVER || 'local', // local | s3
  // Max size (MB) accepted for an uploaded resume file (PDF/DOCX) at
  // POST /api/resume/upload — see middleware/upload.js.
  resumeUploadMaxMb: parseInt(process.env.RESUME_UPLOAD_MAX_MB || '5', 10),
  localStoragePath: process.env.LOCAL_STORAGE_PATH || './storage',
  // Only required when STORAGE_DRIVER=s3 (AWS deployment) — see
  // docs/AWS_ARCHITECTURE.md and infrastructure/terraform/s3.tf.
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  s3BucketName: process.env.S3_BUCKET_NAME || '',
  s3PresignedUrlTtlSeconds: parseInt(process.env.S3_PRESIGNED_URL_TTL_SECONDS || '900', 10),
  // Comma-separated allowed origins for CORS in production. Empty in
  // local dev, where cors() with no options allows any origin. In
  // production this MUST be non-empty — an empty list here would make
  // app.js fall through to cors(undefined), which sets
  // Access-Control-Allow-Origin: * (see the "CORS should not be
  // wildcard in production" requirement). Since Nginx is the only
  // publicly exposed container and the frontend calls the API
  // same-origin through it, this mainly guards against someone directly
  // hitting the backend cross-origin if it were ever accidentally
  // exposed — cheap insurance for a mistake this hard-fail makes
  // impossible to make silently, same as authSecret above.
  corsAllowedOrigins: (() => {
    const origins = (process.env.CORS_ALLOWED_ORIGINS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (isProduction && origins.length === 0) {
      throw new Error(
        'CORS_ALLOWED_ORIGINS must be set explicitly when NODE_ENV=production ' +
          '(comma-separated list of allowed origins, e.g. your EC2 public URL). ' +
          'Refusing to start with the wide-open CORS fallback used in development.'
      );
    }
    return origins;
  })(),
  // Rate limiting (middleware/rateLimit.js). Enabled by default; set
  // RATE_LIMIT_ENABLED=false only for local load-testing/debugging.
  rateLimitEnabled: (process.env.RATE_LIMIT_ENABLED || 'true').toLowerCase() !== 'false',
  // Multiplier applied to every limit — lets you loosen/tighten all
  // buckets at once per environment without editing code.
  rateLimitMultiplier: Math.max(0.1, parseFloat(process.env.RATE_LIMIT_MULTIPLIER || '1')),
  // Number of reverse proxies in front of Express (nginx in the EC2
  // deployment = 1). Required for rate limiting to key on the real
  // client IP rather than the proxy's.
  trustProxyHops: parseInt(process.env.TRUST_PROXY_HOPS || (isProduction ? '1' : '0'), 10),
};
