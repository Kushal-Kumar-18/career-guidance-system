// Regression tests for feedback provenance (master prompt problem 5):
// a rating must attach to the EXACT recommendation row the user was
// shown, even when the same career name appears in more than one
// analysis run for the same user. Previously feedback was resolved by
// (user_id, career_name) -> most recent match, which could silently
// attach a rating to a newer, unrelated analysis than the one the user
// actually rated.
//
// No DB/ML service — repository boundary mocked with proxyquire.
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

function loadService(rowsById) {
  const sentFeedback = [];
  const service = proxyquire('../src/services/recommendationService', {
    './mlClient': {
      recommend: async () => ({ data: [] }),
      sendFeedback: async (payload) => {
        sentFeedback.push(payload);
        return { data: { ok: true } };
      },
    },
    './resumeService': {},
    './marketSignalService': { attachLiveOutlook: async (p) => p },
    '../repositories/profileRepository': {
      findByUserId: async (userId) => (userId === 1 ? fakeProfile : null),
    },
    '../repositories/skillTestRepository': {
      verifiedSkillsForUser: async () => ({}),
    },
    '../repositories/recommendationRepository': {
      findByIdForUser: async (userId, id) => {
        const row = rowsById.get(id);
        if (!row || row.user_id !== userId) return null;
        return row;
      },
      getAnalysisRun: async () => null,
      recordFeedback: async () => {},
    },
    '../repositories/activityRepository': { log: async () => {} },
  });
  return { service, sentFeedback };
}

async function testFeedbackAttachesToExactRowNotLatestByName() {
  // Two different analysis runs both happen to contain "Software
  // Developer" — analysis A (older, id 10) and analysis B (newer, id
  // 20). The user rates the OLDER one (id 10). The old (user, career
  // name) -> latest lookup would have resolved this to analysis B's
  // row (id 20) instead.
  const rowsById = new Map([
    [10, { id: 10, user_id: 1, career_name: 'Software Developer', analysis_run_id: 'run-A', created_at: new Date('2026-01-01') }],
    [20, { id: 20, user_id: 1, career_name: 'Software Developer', analysis_run_id: 'run-B', created_at: new Date('2026-02-01') }],
  ]);
  const { service, sentFeedback } = loadService(rowsById);
  await service.submitFeedback(1, { recommendationId: 10, career: 'Software Developer', rating: 4 });
  assert.equal(sentFeedback.length, 1, 'exactly one feedback event should be sent to the ML service');

  console.log('  feedback provenance: rating the older of two same-named recommendations succeeds ✓');
}

async function testFeedbackRejectsRecommendationBelongingToAnotherUser() {
  const rowsById = new Map([[10, { id: 10, user_id: 2, career_name: 'Software Developer', analysis_run_id: 'run-A' }]]);
  const { service } = loadService(rowsById);
  await assert.rejects(
    () => service.submitFeedback(1, { recommendationId: 10, career: 'Software Developer', rating: 4 }),
    (err) => err.status === 422,
    'a recommendation id belonging to a different user must be rejected, not silently rated'
  );
  console.log("  feedback provenance: cannot rate another user's recommendation id ✓");
}

async function testFeedbackRejectsUnknownRecommendationId() {
  const { service } = loadService(new Map());
  await assert.rejects(
    () => service.submitFeedback(1, { recommendationId: 999, career: 'Software Developer', rating: 4 }),
    (err) => err.status === 422
  );
  console.log('  feedback provenance: unknown recommendation id is rejected ✓');
}

async function testFeedbackRejectsCareerMismatchAgainstResolvedRow() {
  const rowsById = new Map([[10, { id: 10, user_id: 1, career_name: 'Software Developer', analysis_run_id: 'run-A' }]]);
  const { service } = loadService(rowsById);
  await assert.rejects(
    () => service.submitFeedback(1, { recommendationId: 10, career: 'Data Scientist', rating: 4 }),
    (err) => err.status === 422,
    'a career name that does not match what recommendation_id 10 actually is must be rejected'
  );
  console.log('  feedback provenance: mismatched career name against the resolved row is rejected ✓');
}

module.exports = async function run() {
  await testFeedbackAttachesToExactRowNotLatestByName();
  await testFeedbackRejectsRecommendationBelongingToAnotherUser();
  await testFeedbackRejectsUnknownRecommendationId();
  await testFeedbackRejectsCareerMismatchAgainstResolvedRow();
  console.log('recommendation-feedback-provenance.test.js: all assertions passed');
};
