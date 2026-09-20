// Regression tests for ANALYSIS RUN ISOLATION and FEEDBACK PROVENANCE
// (see src/services/recommendationService.js, src/repositories/
// recommendationRepository.js, db/schema.sql, db/migrations/
// 0004_analysis_run_isolation.sql, 0005_analysis_runs.sql).
//
// Covers the master-prompt scenarios that candidate-pipeline.test.js and
// recommendation-dedupe.test.js don't:
//   - every recommendation row carries a stable analysis_run_id +
//     candidate_snapshot (the exact evidence that produced it)
//   - a resume-upload analysis's snapshot contains ONLY that resume's
//     evidence, never leftover profile-only evidence
//   - feedback on an older recommendation is scored against THAT
//     recommendation's own candidate_snapshot, not the account's
//     current profile — even when a newer analysis (a different resume,
//     an edited profile) has happened in between
//   - a legacy row with no candidate_snapshot (pre-migration data)
//     degrades gracefully to the previous behavior instead of failing
//
// REWRITTEN (see master prompt section K: "rewrite stale tests to match
// the current production API" rather than weaken them to pass). The
// previous version of this file mocked recommendationRepository with
// `insertMany`/`findRecentIdenticalBatch`, and called
// `submitFeedback(userId, { career, rating })` with no recommendationId
// at all — an API recommendationService stopped exposing when feedback
// moved to id-based provenance (see recommendation-feedback-provenance
// .test.js). Because proxyquire calls through to the REAL module for any
// property a stub doesn't define, the stale mock silently let
// `generateBatch`/`findByIdForUser` fall through to the real
// Postgres-backed repository, which then failed with ECONNREFUSED in any
// environment without a live database — the tests were "passing" only
// by accident, whenever nothing exercised those code paths. This version
// mocks the actual current repository surface (`generateBatch`,
// `findByIdForUser`, `listByUser`) so it runs anywhere, with no DB/ML
// service required.
//
// Run with: npm test

const assert = require('node:assert/strict');
const proxyquire = require('proxyquire').noPreserveCache();

const originalProfile = {
  user_id: 1,
  education: 'B.Tech Computer Science',
  skills: 'Python, Django, PostgreSQL, AWS',
  interests: 'Backend systems, Cloud',
  experience_years: 3,
  certifications: 'AWS Certified Solutions Architect',
  projects: 'Career Guidance System',
};

// Mutated later in the test to simulate the account moving on (profile
// edit / new resume) after a recommendation has already been generated.
let currentProfile = { ...originalProfile };

let lastMlPayload = null;
let lastFeedbackPayload = null;
const recommendPredictionsQueue = [];

// Faithful-enough in-memory reimplementation of the real
// recommendationRepository surface: `generateBatch` writes one row per
// prediction, all sharing one analysis_run_id and one candidate_snapshot
// (mirroring db/migrations/0005_analysis_runs.sql), and `findByIdForUser`
// resolves by primary key scoped to the owning user, exactly like the
// real SQL in recommendationRepository.js.
function fakeRecommendationRepository() {
  let nextId = 1;
  const rows = [];

  return {
    generateBatch: async ({ userId, source, predictions, analysisRunId, candidateSnapshot }) => {
      const inserted = predictions.map((p) => ({
        id: nextId++,
        user_id: userId,
        career_name: p.career,
        match_score: Math.round(p.confidence ?? 0),
        source,
        analysis_run_id: analysisRunId,
        candidate_snapshot: candidateSnapshot,
        created_at: new Date(),
      }));
      rows.push(...inserted);
      return { rows: inserted, reused: false };
    },
    findByIdForUser: async (userId, id) => {
      const row = rows.find((r) => r.id === id);
      if (!row || row.user_id !== userId) return null;
      return row;
    },
    getAnalysisRun: async () => null,
    recordFeedback: async () => {},
    listByUser: async (userId) => rows.filter((r) => r.user_id === userId),
    _debug: { rows },
  };
}

function loadService(recRepoMock) {
  return proxyquire('../src/services/recommendationService', {
    './mlClient': {
      recommend: async (payload) => {
        lastMlPayload = payload;
        return { data: recommendPredictionsQueue.shift() };
      },
      sendFeedback: async (payload) => {
        lastFeedbackPayload = payload;
        return { data: { ok: true } };
      },
    },
    './resumeService': { buildResumeData: async () => ({}) },
    './marketSignalService': { attachLiveOutlook: async (p) => p },
    '../repositories/profileRepository': {
      findByUserId: async (userId) => (userId === 1 ? currentProfile : null),
    },
    '../repositories/skillTestRepository': {
      verifiedSkillsForUser: async () => ({}),
    },
    '../repositories/recommendationRepository': recRepoMock,
    '../repositories/activityRepository': { log: async () => {} },
  });
}

const BACKEND_DEV = [
  { career: 'Backend Developer', confidence: 88, skill_gaps: [], courses: [], reasoning: 'x', user_skills_matched: [] },
];
const DATA_SCIENTIST = [
  { career: 'Data Scientist', confidence: 79, skill_gaps: [], courses: [], reasoning: 'y', user_skills_matched: [] },
];

async function testEveryRowHasAnalysisRunIdAndSnapshot() {
  currentProfile = { ...originalProfile };
  const recRepo = fakeRecommendationRepository();
  const service = loadService(recRepo);
  recommendPredictionsQueue.push(BACKEND_DEV, DATA_SCIENTIST);

  await service.generate(1, { topK: 5, source: 'profile' });
  await service.generate(1, {
    topK: 5,
    source: 'resume_upload',
    candidate: { skills: ['SQL', 'Spark'], education: 'M.C.A', experience_years: 2 },
  });

  const rows = recRepo._debug.rows;
  assert.equal(rows.length, 2);
  assert.ok(rows.every((r) => r.analysis_run_id), 'every row must have an analysis_run_id');
  assert.ok(
    rows.every((r) => r.candidate_snapshot && r.candidate_snapshot.skills),
    'every row must have a candidate_snapshot with the candidate skills'
  );
  assert.notEqual(
    rows[0].analysis_run_id,
    rows[1].analysis_run_id,
    'two separate generate() calls must produce two distinct analysis_run_id values'
  );

  const uploadRow = rows.find((r) => r.source === 'resume_upload');
  assert.ok(uploadRow.candidate_snapshot.skills.includes('SQL'));
  assert.ok(
    !uploadRow.candidate_snapshot.skills.toLowerCase().includes('django'),
    "a resume_upload snapshot must not contain the profile's skills — it is an independent context"
  );
  assert.ok(
    uploadRow.candidate_snapshot.candidate_fingerprint,
    'the snapshot must carry the candidate_fingerprint used for this run (section C/F)'
  );
  assert.deepEqual(
    uploadRow.candidate_snapshot.verified_skills_used,
    {},
    'the snapshot must record which verified skills were actually used for this run (section D/F)'
  );

  console.log('  analysis-run-isolation: every row gets a distinct analysis_run_id + complete candidate_snapshot ✓');
}

async function testFeedbackUsesOriginalSnapshotNotCurrentProfile() {
  currentProfile = { ...originalProfile };
  const recRepo = fakeRecommendationRepository();
  const service = loadService(recRepo);
  recommendPredictionsQueue.push(BACKEND_DEV);

  await service.generate(1, { topK: 5, source: 'profile' });
  assert.equal(lastMlPayload.user_profile.skills, 'Python, Django, PostgreSQL, AWS');
  const recommendationId = recRepo._debug.rows[0].id;

  // The account "moves on": the user edits their profile (or, just as
  // validly here, this represents a later, different analysis run)
  // AFTER the recommendation above was generated.
  currentProfile = { ...originalProfile, skills: 'Rust, Kubernetes, Terraform', education: 'PhD Astrophysics' };

  await service.submitFeedback(1, { recommendationId, rating: 5 });

  assert.equal(
    lastFeedbackPayload.user_profile.skills,
    'Python, Django, PostgreSQL, AWS',
    "feedback must be scored against the recommendation's OWN candidate_snapshot"
  );
  assert.ok(
    !lastFeedbackPayload.user_profile.skills.includes('Rust'),
    'feedback must not leak the current (since-edited) profile into an older recommendation'
  );

  console.log('  analysis-run-isolation: feedback uses the original candidate_snapshot, not the current profile ✓');
}

async function testLegacyRowWithoutSnapshotFallsBackToCurrentProfile() {
  currentProfile = { ...originalProfile, skills: 'Go, Kafka' };
  const recRepo = fakeRecommendationRepository();
  const service = loadService(recRepo);

  // Simulate a pre-migration row: has everything except analysis_run_id
  // / candidate_snapshot, exactly as existing rows will look right after
  // 0004_analysis_run_isolation.sql is applied (nullable, no backfill).
  recRepo._debug.rows.push({
    id: 1,
    user_id: 1,
    career_name: 'Legacy Career',
    match_score: 50,
    source: 'profile',
    analysis_run_id: null,
    candidate_snapshot: null,
    created_at: new Date(),
  });

  await service.submitFeedback(1, { recommendationId: 1, rating: 3 });

  assert.equal(
    lastFeedbackPayload.user_profile.skills,
    'Go, Kafka',
    'a legacy row with no candidate_snapshot must fall back to the current profile, same as pre-fix behavior'
  );

  console.log('  analysis-run-isolation: legacy rows without a candidate_snapshot degrade gracefully ✓');
}

module.exports = async function run() {
  await testEveryRowHasAnalysisRunIdAndSnapshot();
  await testFeedbackUsesOriginalSnapshotNotCurrentProfile();
  await testLegacyRowWithoutSnapshotFallsBackToCurrentProfile();
  console.log('analysis-run-isolation.test.js: all assertions passed');
};

if (require.main === module) {
  module.exports().catch((err) => {
    console.error('analysis-run-isolation.test.js FAILED:', err);
    process.exit(1);
  });
}
