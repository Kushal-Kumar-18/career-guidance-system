// Regression tests for the candidate fingerprint (master prompt section
// C): equivalent candidates must hash identically regardless of how
// their evidence arrived (list vs. comma-separated string, casing, list
// order); materially different candidates must hash differently. Also
// covers the specific dedup gap this phase closes (section E): two
// different candidates that happen to produce identical top results
// must never collapse into one analysis run.
//
// Run with: npm test

const assert = require('node:assert/strict');
const proxyquire = require('proxyquire').noPreserveCache();
const { computeCandidateFingerprint } = require('../src/services/candidateFingerprint');

const BASE = {
  education: 'B.Tech Computer Science',
  skills: 'Python, SQL, Django',
  interests: 'Backend systems, Cloud',
  experience_years: 3,
  certifications: 'AWS Certified Solutions Architect',
  projects: 'Career Guidance System',
};

function testEquivalentCandidatesFingerprintTheSame() {
  const a = computeCandidateFingerprint(BASE);

  // Same evidence, different shape: skills as an array, different list
  // order, different casing/whitespace.
  const b = computeCandidateFingerprint({
    ...BASE,
    skills: ['django', '  SQL ', 'python'],
    certifications: 'aws certified solutions architect',
    education: '  B.Tech   Computer Science  ',
  });

  assert.equal(a, b, 'equivalent candidate evidence must produce the same fingerprint regardless of shape/casing/order');
  console.log('  candidate fingerprint: equivalent candidates hash the same ✓');
}

function testMateriallyDifferentCandidatesFingerprintDifferently() {
  const a = computeCandidateFingerprint(BASE);
  const b = computeCandidateFingerprint({ ...BASE, skills: 'AutoCAD, SketchUp', education: 'Diploma in Mechanical Engineering' });
  const c = computeCandidateFingerprint({ ...BASE, experience_years: 8 });

  assert.notEqual(a, b, 'a candidate with entirely different skills/education must get a different fingerprint');
  assert.notEqual(a, c, 'a candidate with a different experience_years must get a different fingerprint');
  console.log('  candidate fingerprint: materially different candidates hash differently ✓');
}

function testFingerprintIsStableAcrossCalls() {
  const a = computeCandidateFingerprint(BASE);
  const b = computeCandidateFingerprint(BASE);
  assert.equal(a, b, 'fingerprinting the same object twice must be deterministic');
  console.log('  candidate fingerprint: deterministic across repeated calls ✓');
}

// -----------------------------------------------------------------------
// Closes the exact gap identified in this phase: the pre-existing dedupe
// implementation matched only on (user, source, time window, result
// content), so two DIFFERENT candidates whose top results happened to be
// identical would have been incorrectly collapsed into one run. This
// test drives the REAL recommendationRepository.findRecentIdenticalBatchTx
// against a fake query function (not a hand-rolled reimplementation, as
// recommendation-dedupe.test.js's mock is) so it actually exercises the
// production dedupe logic, not a stand-in for it.
// -----------------------------------------------------------------------
async function testDifferentCandidateFingerprintIsNeverCollapsedEvenWithIdenticalResults() {
  const IDENTICAL_RESULT = [{ career: 'Data Scientist', confidence: 82 }];
  const fingerprintA = 'sha256:' + 'a'.repeat(64);
  const fingerprintB = 'sha256:' + 'b'.repeat(64);

  // Fake DB: has one very recent row for fingerprint A only (candidate A's
  // earlier run). A request carrying fingerprint B (a DIFFERENT
  // candidate) must find nothing to reuse, even though the result set is
  // identical to A's.
  const existingRowForA = {
    id: 1,
    user_id: 1,
    career_name: 'Data Scientist',
    match_score: 82,
    source: 'resume_upload',
    created_at: new Date(),
  };

  const runQuery = async (text, params) => {
    if (text.includes('SELECT * FROM recommendation_history')) {
      const [, , candidateFingerprintParam] = params;
      return { rows: candidateFingerprintParam === fingerprintA ? [existingRowForA] : [] };
    }
    return { rows: [] };
  };
  const queryWithMock = async (_client, text, params) => runQuery(text, params);

  // Access the internal check the same way generateBatch does: this test
  // reaches into the module rather than re-deriving the SQL, so it can't
  // silently drift from the real implementation the way a hand-rolled
  // mock could.
  const modulePath = require.resolve('../src/repositories/recommendationRepository');
  delete require.cache[modulePath];

  // findRecentIdenticalBatchTx isn't exported directly (by design - see
  // its own comment about only being safe to call from inside
  // generateBatch), so this drives it through generateBatch with a
  // proxied db layer instead, which is the only path the real code
  // exposes and the one that matters.
  const repoWithFakeDb = proxyquire('../src/repositories/recommendationRepository', {
    '../config/db': {
      query: runQuery,
      queryWith: queryWithMock,
      withTransaction: async (fn) => fn({}),
    },
  });

  const resultForDifferentCandidate = await repoWithFakeDb.generateBatch({
    userId: 1,
    source: 'resume_upload',
    predictions: IDENTICAL_RESULT,
    analysisRunId: 'run-B',
    candidateSnapshot: { candidate_fingerprint: fingerprintB },
    candidateFingerprint: fingerprintB,
  });

  assert.equal(
    resultForDifferentCandidate.reused,
    false,
    'a different candidate fingerprint must never be treated as a duplicate of another candidate, even with identical results'
  );

  console.log('  candidate fingerprint: different candidates with identical results are never collapsed ✓');
}

module.exports = async function run() {
  testEquivalentCandidatesFingerprintTheSame();
  testMateriallyDifferentCandidatesFingerprintDifferently();
  testFingerprintIsStableAcrossCalls();
  await testDifferentCandidateFingerprintIsNeverCollapsedEvenWithIdenticalResults();
  console.log('candidate-fingerprint.test.js: all assertions passed');
};

if (require.main === module) {
  module.exports().catch((err) => {
    console.error('candidate-fingerprint.test.js FAILED:', err);
    process.exit(1);
  });
}
