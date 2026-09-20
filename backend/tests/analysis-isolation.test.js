// Regression tests for analysis-run isolation and feedback provenance
// (master prompt Problems 2, 5, 6, 7): two substantially different
// analyses for the SAME user must not contaminate each other's
// recommendations, each generate() call must get its own
// analysis_run_id, and feedback must always resolve to the EXACT
// recommendation + candidate evidence it was actually rated against —
// never "whatever is newest for this career name" and never "whatever
// the profile currently says".
//
// No DB/ML service — repository boundary mocked with proxyquire, same
// approach as the other test files here.
//
// Run with: npm test

const assert = require('node:assert/strict');
const proxyquire = require('proxyquire').noPreserveCache();

// In-memory stand-in for recommendation_history, faithful enough to
// exercise generate()/submitFeedback()'s real contract with the
// repository (generateBatch returns rows carrying id/analysis_run_id/
// candidate_snapshot; findByIdForUser looks a row up by primary key).
function makeFakeDb() {
  const rows = [];
  let nextId = 1;
  return {
    rows,
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
    findByIdForUser: async (userId, id) => rows.find((r) => r.user_id === userId && r.id === id) || null,
    getAnalysisRun: async () => null,
    recordFeedback: async () => {},
    listByUser: async (userId) => rows.filter((r) => r.user_id === userId),
    insertMany: async () => [],
  };
}

// The fake ML client returns whatever prediction set is registered for
// the exact canonicalized skills string it receives — i.e. the test
// controls what "the ML model" says based on which candidate evidence
// actually reached it, the same way the real model responds to whatever
// candidateProfileService produced.
function loadService(db, { predictionsBySkills, sentToMl = [] }) {
  return proxyquire('../src/services/recommendationService', {
    './mlClient': {
      recommend: async (payload) => {
        const key = payload.user_profile.skills;
        const data = predictionsBySkills[key];
        if (!data) throw new Error(`Test setup error: no fake prediction registered for skills="${key}"`);
        return { data };
      },
      sendFeedback: async (payload) => {
        sentToMl.push(payload);
        return { data: { ok: true } };
      },
    },
    './marketSignalService': { attachLiveOutlook: async (p) => p },
    '../repositories/profileRepository': {
      // Deliberately unrelated to either resume below, to make sure a
      // resume-only analysis (source: 'resume_upload') never falls back
      // to this — see testDifferentAnalysesDoNotContaminateEachOther.
      findByUserId: async (userId) =>
        userId === 1
          ? { user_id: 1, education: 'MBA', skills: 'Excel, PowerPoint', interests: '', experience_years: 6, certifications: '', projects: '' }
          : null,
    },
    '../repositories/skillTestRepository': { verifiedSkillsForUser: async () => ({}) },
    '../repositories/recommendationRepository': db,
    '../repositories/activityRepository': { log: async () => {} },
  });
}

async function testDifferentAnalysesDoNotContaminateEachOther() {
  const db = makeFakeDb();
  const fullStackPredictions = [
    { career: 'Web Developer', confidence: 67, skill_gaps: [], courses: [] },
    { career: 'Software Developer', confidence: 57, skill_gaps: [], courses: [] },
  ];
  const landscapePredictions = [{ career: 'Landscape Architect', confidence: 71, skill_gaps: [], courses: [] }];

  const service = loadService(db, {
    predictionsBySkills: {
      'JavaScript, Python, React, Node.js, SQL': fullStackPredictions,
      'AutoCAD, SketchUp, Horticulture': landscapePredictions,
    },
  });

  // Resume A: a full-stack candidate, submitted as an independent
  // resume-only analysis — source: 'resume_upload' is what "Analyze
  // career from this resume" must send (see ResumePage.jsx); it must
  // NOT be combined with the unrelated (MBA/Excel) profile mocked above.
  const resultA = await service.generate(1, {
    topK: 5,
    source: 'resume_upload',
    candidate: { skills: ['JavaScript', 'Python', 'React', 'Node.js', 'SQL'], education: '', experience_years: 3 },
  });

  // Resume B: a substantially different (landscape architecture)
  // candidate, same user, same session, immediately after.
  const resultB = await service.generate(1, {
    topK: 5,
    source: 'resume_upload',
    candidate: { skills: ['AutoCAD', 'SketchUp', 'Horticulture'], education: '', experience_years: 5 },
  });

  assert.deepEqual(resultA.map((r) => r.career), ['Web Developer', 'Software Developer']);
  assert.deepEqual(resultB.map((r) => r.career), ['Landscape Architect']);
  assert.ok(
    !resultB.some((r) => r.career === 'Web Developer' || r.career === 'Software Developer'),
    'a substantially different resume must not carry over careers from the previous analysis'
  );

  // Each analysis got its own identity, shared across its own rows only.
  assert.equal(new Set(resultA.map((r) => r.analysis_run_id)).size, 1);
  assert.equal(new Set(resultB.map((r) => r.analysis_run_id)).size, 1);
  assert.notEqual(
    resultA[0].analysis_run_id,
    resultB[0].analysis_run_id,
    'independent analyses must get independent analysis_run_ids'
  );

  // And each stored row's frozen candidate evidence matches the resume
  // that actually produced it — not the user's separately-saved (and
  // here, deliberately unrelated) profile.
  const rowA = db.rows.find((r) => r.id === resultA[0].id);
  const rowB = db.rows.find((r) => r.id === resultB[0].id);
  assert.ok(rowA.candidate_snapshot.skills.includes('React'));
  assert.ok(!rowA.candidate_snapshot.skills.includes('AutoCAD'));
  assert.ok(rowB.candidate_snapshot.skills.includes('AutoCAD'));
  assert.ok(!rowB.candidate_snapshot.skills.includes('React'));
  assert.ok(!rowA.candidate_snapshot.skills.includes('Excel'), 'resume_upload must never inherit the stored profile\'s skills');

  console.log('  analysis isolation: two substantially different resumes never contaminate each other ✓');
}

async function testFeedbackAttachesToExactAnalysisEvenWhenCareerNameRepeats() {
  const db = makeFakeDb();
  const predictionsA = [{ career: 'Software Developer', confidence: 60, skill_gaps: [], courses: [] }];
  const predictionsB = [{ career: 'Software Developer', confidence: 74, skill_gaps: [], courses: [] }];
  const sentToMl = [];

  const service = loadService(db, {
    predictionsBySkills: {
      'Python, SQL': predictionsA,
      'Java, Spring': predictionsB,
    },
    sentToMl,
  });

  // Analysis A, then a NEWER analysis B for the same user — both
  // recommend "Software Developer", at different scores, from different
  // evidence (master prompt Problem 5's exact example).
  const resultA = await service.generate(1, {
    topK: 5,
    source: 'resume_upload',
    candidate: { skills: ['Python', 'SQL'], education: '', experience_years: 1 },
  });
  const resultB = await service.generate(1, {
    topK: 5,
    source: 'resume_upload',
    candidate: { skills: ['Java', 'Spring'], education: '', experience_years: 4 },
  });

  assert.notEqual(resultA[0].id, resultB[0].id);

  // The user rates the OLDER recommendation (analysis A) after the newer
  // one (analysis B) already exists.
  await service.submitFeedback(1, { recommendationId: resultA[0].id, rating: 5 });

  assert.equal(sentToMl.length, 1);
  assert.equal(sentToMl[0].career, 'Software Developer');
  assert.equal(
    sentToMl[0].user_profile.skills,
    'Python, SQL',
    'feedback on the OLDER recommendation must use the OLDER candidate evidence, not the newer analysis or the current profile'
  );

  // Rating the newer one afterwards must independently use ITS evidence.
  await service.submitFeedback(1, { recommendationId: resultB[0].id, rating: 3 });
  assert.equal(sentToMl.length, 2);
  assert.equal(sentToMl[1].user_profile.skills, 'Java, Spring');

  console.log('  analysis isolation: feedback stays attached to the exact recommendation rated, regardless of recency ✓');
}

module.exports = async function run() {
  await testDifferentAnalysesDoNotContaminateEachOther();
  await testFeedbackAttachesToExactAnalysisEvenWhenCareerNameRepeats();
  console.log('analysis-isolation.test.js: all assertions passed');
};

if (require.main === module) {
  module.exports().catch((err) => {
    console.error('analysis-isolation.test.js FAILED:', err);
    process.exit(1);
  });
}
