// Regression tests for the "duplicate recommendation-history entries"
// fix: generating an identical set of recommendations moments apart
// (double-submit, a slow network causing a repeat click, a navigation
// effect firing twice) must not write a second, redundant batch of rows.
// A genuinely new or later result must still be recorded normally.
//
// No DB/ML service — the repository boundary is mocked with proxyquire,
// same approach as the other test files here.
//
// Run with: npm test

const assert = require('node:assert/strict');
const proxyquire = require('proxyquire').noPreserveCache();

const fakeProfile = {
  user_id: 1,
  education: 'B.Tech Computer Science',
  skills: 'Python, SQL',
  interests: 'Data',
  experience_years: 2,
  certifications: '',
  projects: 'A project',
};

function loadService({ predictionsQueue, dbState }) {
  return proxyquire('../src/services/recommendationService', {
    './mlClient': {
      recommend: async () => ({ data: predictionsQueue.shift() }),
    },
    './marketSignalService': {
      attachLiveOutlook: async (predictions) => predictions,
    },
    '../repositories/profileRepository': {
      findByUserId: async (userId) => (userId === 1 ? fakeProfile : null),
    },
    '../repositories/skillTestRepository': {
      verifiedSkillsForUser: async () => ({}),
    },
    '../repositories/recommendationRepository': {
      insertMany: async (userId, predictions, source) => {
        const rows = predictions.map((p, i) => ({
          id: dbState.nextId++,
          user_id: userId,
          career_name: p.career,
          match_score: Math.round(p.confidence ?? 0),
          source,
          created_at: new Date(dbState.now),
        }));
        dbState.rows.push(...rows);
        return rows;
      },
      // Faithful-enough reimplementation of the real SQL predicate so
      // this test actually exercises the matching rule (same user,
      // same source, within the window, identical career+score set)
      // rather than trivially asserting against a stub.
      findRecentIdenticalBatch: async (userId, source, predictions, windowSeconds = 20) => {
        const cutoff = dbState.now - windowSeconds * 1000;
        const candidates = dbState.rows
          .filter((r) => r.user_id === userId && r.source === source && r.created_at.getTime() > cutoff)
          .sort((a, b) => b.created_at - a.created_at)
          .slice(0, predictions.length);

        if (candidates.length !== predictions.length) return null;

        const toKey = (career, score) => `${String(career).trim().toLowerCase()}|${Math.round(score ?? 0)}`;
        const existingKeys = new Set(candidates.map((r) => toKey(r.career_name, r.match_score)));
        const incomingKeys = new Set(predictions.map((p) => toKey(p.career, p.confidence)));
        if (existingKeys.size !== incomingKeys.size) return null;
        for (const k of incomingKeys) if (!existingKeys.has(k)) return null;
        return candidates;
      },
    },
    '../repositories/activityRepository': {
      log: async (...args) => dbState.activity.push(args),
    },
  });
}

const IDENTICAL_RESULT = [
  { career: 'Data Scientist', confidence: 82, skill_gaps: ['Spark'], courses: [], reasoning: 'x', user_skills_matched: ['Python'] },
];

async function testRapidDuplicateIsCollapsed() {
  const dbState = { rows: [], activity: [], nextId: 1, now: Date.now() };
  const service = loadService({
    predictionsQueue: [IDENTICAL_RESULT, IDENTICAL_RESULT],
    dbState,
  });

  await service.generate(1, { topK: 5, source: 'profile' });
  assert.equal(dbState.rows.length, 1, 'first call should insert one row');

  // "Moments later" — same second, same source, same result (e.g. a
  // double-click before the button disabled, or React re-firing an
  // effect).
  await service.generate(1, { topK: 5, source: 'profile' });
  assert.equal(dbState.rows.length, 1, 'an identical near-instant repeat must not add a duplicate row');
  assert.equal(
    dbState.activity.filter((a) => a[1] === 'recommendations_generated').length,
    1,
    'a collapsed duplicate must not log a second "recommendations_generated" activity entry either'
  );

  console.log('  duplicate history: rapid identical repeat collapses to one row ✓');
}

async function testDifferentResultIsNotCollapsed() {
  const dbState = { rows: [], activity: [], nextId: 1, now: Date.now() };
  const different = [
    { career: 'Backend Developer', confidence: 91, skill_gaps: [], courses: [], reasoning: 'y', user_skills_matched: [] },
  ];
  const service = loadService({ predictionsQueue: [IDENTICAL_RESULT, different], dbState });

  await service.generate(1, { topK: 5, source: 'profile' });
  await service.generate(1, { topK: 5, source: 'profile' });

  assert.equal(dbState.rows.length, 2, 'a genuinely different result must still be recorded as its own row');
  assert.equal(dbState.rows[1].career_name, 'Backend Developer');

  console.log('  duplicate history: a different result is never collapsed ✓');
}

async function testDifferentSourceIsNotCollapsed() {
  const dbState = { rows: [], activity: [], nextId: 1, now: Date.now() };
  const service = loadService({ predictionsQueue: [IDENTICAL_RESULT, IDENTICAL_RESULT], dbState });

  await service.generate(1, { topK: 5, source: 'profile' });
  // Same result, but from a different candidate-profile source — this is
  // a meaningfully different event (e.g. "resume upload also lands on
  // this career") and must be recorded, not collapsed into the profile
  // batch.
  await service.generate(1, {
    topK: 5,
    source: 'resume_upload',
    candidate: { skills: ['Python'], education: '', experience_years: 0 },
  });

  assert.equal(dbState.rows.length, 2, 'an identical result from a different source must still get its own row');
  assert.equal(dbState.rows[0].source, 'profile');
  assert.equal(dbState.rows[1].source, 'resume_upload');

  console.log('  duplicate history: same result from a different source is never collapsed ✓');
}

async function testOutsideWindowIsNotCollapsed() {
  const dbState = { rows: [], activity: [], nextId: 1, now: Date.now() };
  const service = loadService({ predictionsQueue: [IDENTICAL_RESULT, IDENTICAL_RESULT], dbState });

  await service.generate(1, { topK: 5, source: 'profile' });
  assert.equal(dbState.rows.length, 1);

  // Move the mock clock forward past the de-dupe window — a legitimate
  // "recommended again later" must be recorded even if the result
  // happens to be identical to before.
  dbState.now += 60_000;
  await service.generate(1, { topK: 5, source: 'profile' });

  assert.equal(dbState.rows.length, 2, 'a repeat outside the de-dupe window must be recorded as a new event');

  console.log('  duplicate history: an identical result outside the window is still recorded ✓');
}

module.exports = async function run() {
  await testRapidDuplicateIsCollapsed();
  await testDifferentResultIsNotCollapsed();
  await testDifferentSourceIsNotCollapsed();
  await testOutsideWindowIsNotCollapsed();
  console.log('recommendation-dedupe.test.js: all assertions passed');
};
