// Regression tests for the pre-setup hardening fixes. Same approach as
// the other test files here: no Postgres, no ML service, no network —
// the repository/storage boundary is stubbed with proxyquire so this
// tests the Node-side wiring and the decisions made in it.
//
// Each block guards one fix, and each is written so that reverting the
// fix makes it fail (rather than just asserting the new code runs).
//
// Run with: npm test

const assert = require('node:assert/strict');
const path = require('node:path');
const proxyquire = require('proxyquire').noPreserveCache();

// ---------------------------------------------------------------------
// Fix 1 — generated resumes are not publicly served, and a user can only
// ever read their own file.
// ---------------------------------------------------------------------
async function testResumeAccessControl() {
  const app = require('../src/app');

  // The express.static('/files') mount is gone. Walk the router stack
  // and assert nothing is registered under /files any more — this is the
  // check that fails if someone re-adds the static mount.
  const mountedPaths = (app._router?.stack || [])
    .map((layer) => layer.regexp?.source || '')
    .join(' ');
  assert.ok(
    !mountedPaths.includes('files'),
    'No route should be mounted at /files — resumes must not be statically served.'
  );

  // The storage driver must not hand out a publicly reachable URL.
  const storage = require('../src/services/storageService');
  assert.equal(
    typeof storage.resolveUrl,
    'undefined',
    'LocalStorage must not expose resolveUrl() — it returned a guessable public /files path.'
  );
  assert.equal(typeof storage.exists, 'function');

  // The storage key is derived from the authenticated user id alone, so
  // there is no parameter a caller could point at someone else's file.
  const reads = [];
  const resumeService = proxyquire('../src/services/resumeService', {
    './storageService': {
      save: async () => ({ path: 'ignored', driver: 'local' }),
      exists: async () => true,
      read: async (relativePath) => {
        reads.push(relativePath);
        return Buffer.from('%PDF-1.4 fake');
      },
    },
    '../repositories/activityRepository': { log: async () => {} },
  });

  assert.equal(resumeService.storageKeyForUser(7), 'resumes/user-7.pdf');
  assert.equal(resumeService.storageKeyForUser('7'), 'resumes/user-7.pdf');

  // Anything that isn't a positive integer id is rejected rather than
  // interpolated into the object key (path traversal / prefix escape).
  for (const bad of ['../../etc/passwd', 'user-1.pdf', '', null, undefined, -3, 0]) {
    assert.throws(
      () => resumeService.storageKeyForUser(bad),
      /Invalid user id/,
      `storageKeyForUser(${JSON.stringify(bad)}) should be rejected`
    );
  }

  const { buffer, filename } = await resumeService.getGeneratedPdf(42);
  assert.deepEqual(reads, ['resumes/user-42.pdf']);
  assert.ok(buffer.length > 0);
  assert.equal(filename, 'resume-user-42.pdf');

  // A missing object reads as "not generated yet", not a storage error.
  const missingStorage = proxyquire('../src/services/resumeService', {
    './storageService': {
      save: async () => ({}),
      exists: async () => false,
      read: async () => {
        throw new Error('should not be called');
      },
    },
    '../repositories/activityRepository': { log: async () => {} },
  });
  await assert.rejects(() => missingStorage.getGeneratedPdf(42), /No generated resume found/);

  // Every resume route sits behind requireAuth, including the new one.
  const routeSource = require('node:fs').readFileSync(
    path.join(__dirname, '..', 'src', 'routes', 'resume.routes.js'),
    'utf8'
  );
  assert.ok(routeSource.includes('router.use(requireAuth)'));
  assert.ok(routeSource.includes("router.get('/download'"));

  console.log('  fix 1: resume files are authenticated + ownership-scoped ✓');
}

// ---------------------------------------------------------------------
// Fix 2 — production refuses to start on a placeholder AUTH_SECRET.
// ---------------------------------------------------------------------
function loadEnvWith(overrides) {
  const saved = { ...process.env };
  Object.assign(process.env, overrides);
  try {
    delete require.cache[require.resolve('../src/config/env')];
    return require('../src/config/env');
  } finally {
    for (const key of Object.keys(process.env)) delete process.env[key];
    Object.assign(process.env, saved);
    delete require.cache[require.resolve('../src/config/env')];
  }
}

function testAuthSecretValidation() {
  const realSecret = 'PZ9mS2vQx7LkT4wBn6RdYc8FhJ3aGeUv';
  assert.equal(realSecret.length >= 32, true);

  // Development keeps the zero-config fallback.
  const dev = loadEnvWith({ NODE_ENV: 'development', AUTH_SECRET: '' });
  assert.equal(dev.authSecret, 'dev-only-change-me');

  // Production: missing, placeholder, and too-short values all hard-fail.
  assert.throws(
    () => loadEnvWith({ NODE_ENV: 'production', AUTH_SECRET: '', DATABASE_URL: 'postgres://x/y' }),
    /AUTH_SECRET must be set explicitly/
  );
  assert.throws(
    () =>
      loadEnvWith({
        NODE_ENV: 'production',
        AUTH_SECRET: 'change-me-in-every-environment',
        DATABASE_URL: 'postgres://x/y',
      }),
    /known placeholder/,
    'The value shipped in .env.example must be rejected in production.'
  );
  assert.throws(
    () =>
      loadEnvWith({ NODE_ENV: 'production', AUTH_SECRET: 'short', DATABASE_URL: 'postgres://x/y' }),
    /at least 32 characters/
  );
  // Case-insensitive, so "CHANGE-ME" doesn't sneak through.
  assert.throws(
    () =>
      loadEnvWith({
        NODE_ENV: 'production',
        AUTH_SECRET: 'CHANGE-ME-IN-EVERY-ENVIRONMENT',
        DATABASE_URL: 'postgres://x/y',
      }),
    /known placeholder/
  );
  // DATABASE_URL loses its fallback in production too.
  assert.throws(
    () => loadEnvWith({ NODE_ENV: 'production', AUTH_SECRET: realSecret, DATABASE_URL: '' }),
    /DATABASE_URL must be set explicitly/
  );

  // A real secret starts cleanly.
  const prod = loadEnvWith({
    NODE_ENV: 'production',
    AUTH_SECRET: realSecret,
    DATABASE_URL: 'postgres://x/y',
  });
  assert.equal(prod.authSecret, realSecret);
  assert.equal(prod.isProduction, true);

  console.log('  fix 2: production rejects placeholder/short AUTH_SECRET ✓');
}

// ---------------------------------------------------------------------
// Fix 3 — synthetic 'estimated' postings never reach trend analytics.
// ---------------------------------------------------------------------
async function testSyntheticPostingsExcluded() {
  const searchCalls = [];
  const upsertedDemand = [];
  const upsertedInsights = [];

  const trendService = proxyquire('../src/services/trendService', {
    '../repositories/jobRepository': {
      search: async (opts) => {
        searchCalls.push(opts);
        // Stand in for a cache that holds ONLY synthetic rows: the
        // excludeSynthetic filter means the caller sees nothing.
        return opts.excludeSynthetic ? [] : [{ title: 'x', description: 'python', location: 'Pune' }];
      },
      countPostings: async () => 3,
      upsertSkillDemand: async (rows) => upsertedDemand.push(rows),
      upsertMarketInsight: async (i) => upsertedInsights.push(i),
    },
    './careerService': {
      getCareerDetail: async () => ({
        skills: ['Python', 'SQL'],
        job_growth: 'High',
        salary_range: '₹6-12 LPA',
      }),
    },
  });

  const demand = await trendService.computeSkillDemandForCareer('Data Scientist');

  // Every read must have asked for real postings only.
  assert.ok(searchCalls.length > 0);
  for (const call of searchCalls) {
    assert.equal(
      call.excludeSynthetic,
      true,
      'Trend queries must exclude synthetic postings from market-demand maths.'
    );
  }

  // With no real postings the result is an honest zero, clearly labeled.
  assert.equal(demand.postings_analyzed, 0);
  assert.equal(demand.synthetic_postings_excluded, 3);
  assert.equal(demand.real_data_only, true);
  assert.match(demand.note, /No real job postings/);
  for (const row of demand.skill_demand) {
    assert.equal(row.percentage, 0, 'No real data must not produce a fabricated percentage.');
  }

  // Nothing is persisted from an empty sample — otherwise it would be
  // read back later as though it were a measurement.
  assert.equal(upsertedDemand.length, 0, 'An all-zero demand snapshot must not be stored.');

  const insights = await trendService.marketInsights('Data Scientist');
  assert.equal(insights.total_jobs, 0);
  assert.equal(insights.synthetic_postings_excluded, 3);
  assert.equal(upsertedInsights.length, 0);
  // Curated reference values stay available, just clearly separated.
  assert.equal(insights.analysis_data.job_growth, 'High');

  const emerging = await trendService.emergingSkills('Data Scientist');
  assert.ok(Array.isArray(emerging.emerging_skills));
  assert.equal(emerging.postings_analyzed, 0);

  console.log('  fix 3: synthetic postings excluded from trend analytics ✓');
}

// ---------------------------------------------------------------------
// Fix 5 — feedback is only accepted for a recommendation the user
// actually received.
// ---------------------------------------------------------------------
async function testFeedbackRequiresRealRecommendation() {
  const sentToMl = [];
  const activity = [];
  const historyRows = [
    { id: 11, user_id: 1, career_name: 'Backend Developer', created_at: '2026-01-01T00:00:00Z' },
  ];

  const service = proxyquire('../src/services/recommendationService', {
    './mlClient': {
      recommend: async () => ({ data: [] }),
      sendFeedback: async (payload) => {
        sentToMl.push(payload);
        return { data: { ok: true } };
      },
    },
    './resumeService': { buildResumeData: async () => ({}) },
    './marketSignalService': { attachLiveOutlook: async (p) => p },
    '../repositories/profileRepository': {
      findByUserId: async () => ({
        user_id: 1,
        education: 'B.Tech',
        skills: 'Python',
        interests: 'Backend',
        experience_years: 2,
        certifications: '',
        projects: '',
      }),
    },
    '../repositories/skillTestRepository': { verifiedSkillsForUser: async () => ({}) },
    '../repositories/recommendationRepository': {
      insertMany: async () => [],
      listByUser: async () => historyRows,
      findLatestForUserAndCareer: async (userId, career) =>
        historyRows.find(
          (r) => r.user_id === userId && r.career_name.toLowerCase() === String(career).trim().toLowerCase()
        ) || null,
    },
    '../repositories/activityRepository': { log: async (...args) => activity.push(args) },
  });

  // A career this user was never recommended is refused...
  await assert.rejects(
    () => service.submitFeedback(1, { career: 'Neurosurgeon', rating: 5 }),
    /only rate a career that was actually recommended/,
    'Feedback for an un-recommended career must be rejected — it is the only training signal in the system.'
  );
  assert.equal(sentToMl.length, 0, 'Rejected feedback must never reach the ML service.');

  // ...and another user cannot rate someone else's recommendation.
  await assert.rejects(
    () => service.submitFeedback(2, { career: 'Backend Developer', rating: 5 }),
    /only rate a career that was actually recommended/
  );
  assert.equal(sentToMl.length, 0);

  // A genuine one goes through, and forwards the STORED career name.
  const result = await service.submitFeedback(1, { career: '  backend developer ', rating: 4 });
  assert.deepEqual(result, { ok: true });
  assert.equal(sentToMl.length, 1);
  assert.equal(
    sentToMl[0].career,
    'Backend Developer',
    'The stored career name must be forwarded, not the client-supplied string.'
  );
  assert.equal(sentToMl[0].rating, 4);

  const feedbackLog = activity.find((a) => a[1] === 'recommendation_feedback');
  assert.ok(feedbackLog, 'Feedback should be logged as activity.');
  assert.equal(feedbackLog[2].recommendation_id, 11);

  console.log('  fix 5: feedback validated against recommendation history ✓');
}

// ---------------------------------------------------------------------
// Fix 6 — rate limiting actually returns 429 past the configured limit.
// ---------------------------------------------------------------------
function testRateLimiting() {
  const { rateLimit } = require('../src/middleware/rateLimit');

  const limiter = rateLimit({ bucket: 'unit-test', windowMs: 60_000, max: 3 });

  function call(ip) {
    const headers = {};
    const req = { ip, headers: {} };
    const res = { setHeader: (k, v) => (headers[k] = v) };
    let error = null;
    limiter(req, res, (err) => (error = err || null));
    return { error, headers };
  }

  for (let i = 0; i < 3; i += 1) {
    const { error } = call('10.0.0.1');
    assert.equal(error, null, `request ${i + 1} should be allowed`);
  }

  const blocked = call('10.0.0.1');
  assert.ok(blocked.error, 'The 4th request in the window should be rejected.');
  assert.equal(blocked.error.status, 429);
  assert.ok(blocked.headers['Retry-After'] > 0);

  // Buckets are per-client, so one noisy IP doesn't lock everyone out.
  assert.equal(call('10.0.0.2').error, null);

  // Authenticated requests are keyed per user, not per shared IP.
  const reqA = { ip: '10.0.0.9', headers: {}, user: { id: 100 } };
  const reqB = { ip: '10.0.0.9', headers: {}, user: { id: 200 } };
  const noop = { setHeader: () => {} };
  const perUser = rateLimit({ bucket: 'unit-test-user', windowMs: 60_000, max: 1 });
  let errA = null;
  let errB = null;
  perUser(reqA, noop, (e) => (errA = e || null));
  perUser(reqB, noop, (e) => (errB = e || null));
  assert.equal(errA, null);
  assert.equal(errB, null, 'Two different users behind one IP must not share a budget.');

  console.log('  fix 6: rate limiting returns 429 past the limit ✓');
}

module.exports = async function run() {
  await testResumeAccessControl();
  testAuthSecretValidation();
  await testSyntheticPostingsExcluded();
  await testFeedbackRequiresRealRecommendation();
  testRateLimiting();
  console.log('security-hardening.test.js: all assertions passed');
};
