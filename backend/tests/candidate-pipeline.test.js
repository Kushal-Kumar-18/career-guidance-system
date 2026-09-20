// No-DB regression test for the candidate-profile convergence pipeline
// (master prompt sections 2, 20, 21). Mocks the repository/mlClient
// boundary with proxyquire so this runs fast, in CI, without Postgres
// or the Python ML service — it is testing the Node-side wiring, not
// the model itself (the model/ml-service already has its own
// verification — see ml-service/README and HANDBOOK.md).
//
// Run with: npm test

const assert = require('node:assert/strict');
const proxyquire = require('proxyquire').noPreserveCache();

const fakeProfile = {
  user_id: 1,
  education: 'B.Tech Computer Science',
  skills: 'Python, Django, PostgreSQL, AWS',
  interests: 'Backend systems, Cloud',
  experience_years: 3,
  certifications: 'AWS Certified Solutions Architect',
  projects: 'Career Guidance System',
};

let lastMlPayload = null;
const insertedRows = [];

function loadService() {
  return proxyquire('../src/services/recommendationService', {
    './mlClient': {
      recommend: async (payload) => {
        lastMlPayload = payload;
        return {
          data: [
            {
              career: 'Backend Developer',
              confidence: 87.5,
              skill_gaps: ['Kubernetes'],
              courses: ['K8s 101'],
              reasoning: 'Matches Python/Django/PostgreSQL',
              user_skills_matched: ['Python', 'Django'],
            },
          ],
        };
      },
    },
    './resumeService': {
      buildResumeData: async () => ({
        name: 'jane',
        email: 'jane@example.com',
        education: fakeProfile.education,
        skills: fakeProfile.skills.split(',').map((s) => s.trim()),
        interests: fakeProfile.interests.split(',').map((s) => s.trim()),
        certifications: fakeProfile.certifications.split(',').map((s) => s.trim()),
        projects: fakeProfile.projects,
        experience: [{ title: 'SWE', company: 'Acme' }],
        experience_years: fakeProfile.experience_years,
      }),
    },
    '../repositories/profileRepository': {
      findByUserId: async (userId) => (userId === 1 ? fakeProfile : null),
    },
    '../repositories/skillTestRepository': {
      verifiedSkillsForUser: async () => ({ Python: true }),
    },
    '../repositories/recommendationRepository': {
      // generate() now writes through the atomic generateBatch() path
      // (see recommendationService.js / recommendationRepository.js)
      // instead of calling insertMany/findRecentIdenticalBatch directly.
      // This test exercises distinct sources/candidates per call and
      // doesn't care about the dedupe/locking behavior itself (covered
      // separately in recommendation-dedupe.test.js), so this mock just
      // always inserts and hands back rows with an id, preserving this
      // file's existing assertions about insertedRows.
      generateBatch: async ({ userId, source, predictions, analysisRunId, candidateSnapshot }) => {
        insertedRows.push({ userId, source, count: predictions.length, analysisRunId, candidateSnapshot });
        const rows = predictions.map((p, i) => ({
          id: insertedRows.length * 100 + i,
          user_id: userId,
          career_name: p.career,
          match_score: Math.round(p.confidence ?? 0),
          source,
          analysis_run_id: analysisRunId,
          candidate_snapshot: candidateSnapshot,
        }));
        return { rows, reused: false };
      },
    },
    '../repositories/activityRepository': {
      log: async () => {},
    },
  });
}

async function run() {
  const recommendationService = loadService();

  // --- Source A: manual profile (default / unchanged behavior) ---
  await recommendationService.generate(1, { topK: 5 });
  assert.equal(insertedRows.at(-1).source, 'profile');
  assert.equal(lastMlPayload.user_profile.skills, 'Python, Django, PostgreSQL, AWS');
  assert.equal(lastMlPayload.user_profile.experience, 3);

  // --- Source C: resume builder (structured data, no PDF round-trip) ---
  await recommendationService.generate(1, { topK: 5, source: 'resume_builder' });
  assert.equal(insertedRows.at(-1).source, 'resume_builder');
  assert.equal(lastMlPayload.user_profile.experience, 3);

  // --- Source B: reviewed resume-upload extraction ---
  await recommendationService.generate(1, {
    topK: 3,
    source: 'resume_upload',
    candidate: {
      education: 'M.C.A, RVITM',
      skills: ['SQL', 'Python', 'Apache Spark'],
      interests: ['Cricket'],
      experience_years: '2',
      certifications: ['AWS Cloud Practitioner'],
      projects: 'ETL pipeline project',
    },
  });
  assert.equal(insertedRows.at(-1).source, 'resume_upload');
  assert.ok(lastMlPayload.user_profile.skills.includes('SQL'));

  // --- Section 21 "consistency test": the same skills entered through
  // the manual path and through a resume-upload path must converge to
  // the same skills string after canonicalization. ---
  await recommendationService.generate(1, { topK: 5, source: 'profile' });
  const manualSkills = lastMlPayload.user_profile.skills;
  await recommendationService.generate(1, {
    topK: 5,
    source: 'resume_upload',
    candidate: { skills: ['Python', 'Django', 'PostgreSQL', 'AWS'], education: 'x', experience_years: 0 },
  });
  const resumeSkills = lastMlPayload.user_profile.skills;
  assert.equal(manualSkills, resumeSkills, 'manual and resume-upload paths must converge to the same skills string');

  // --- Source: merge (profile + reviewed resume, case-insensitive dedup) ---
  await recommendationService.generate(1, {
    topK: 3,
    source: 'merge',
    candidate: { skills: ['python', 'Kubernetes'], education: '', experience_years: '', projects: 'Extra project' },
  });
  assert.equal(insertedRows.at(-1).source, 'merge');
  assert.equal(lastMlPayload.user_profile.education, 'B.Tech Computer Science'); // falls back to profile
  assert.equal(lastMlPayload.user_profile.skills.split(', ').length, 5); // 4 profile + Kubernetes, "python" deduped against "Python"
  assert.ok(lastMlPayload.user_profile.projects.includes('Career Guidance System'));
  assert.ok(lastMlPayload.user_profile.projects.includes('Extra project'));

  // --- Every call gets its own analysis-run identity (master prompt
  // Problems 6/7): each entry in insertedRows came from a distinct
  // generate() call above, so no two should share an analysisRunId, and
  // each one's candidateSnapshot should be the shape sent to the ML
  // client for that same call. ---
  const runIds = insertedRows.map((r) => r.analysisRunId);
  assert.equal(new Set(runIds).size, runIds.length, 'every generate() call must get its own analysis_run_id');
  assert.ok(runIds.every((id) => typeof id === 'string' && id.length > 0));

  // --- Error paths ---
  await assert.rejects(
    () => recommendationService.generate(999, { topK: 5 }),
    (err) => err.status === 422
  );
  await assert.rejects(
    () => recommendationService.generate(1, { topK: 5, source: 'resume_upload' }),
    (err) => err.status === 422
  );
  await assert.rejects(
    () => recommendationService.generate(1, { topK: 5, source: 'not_a_real_source' }),
    (err) => err.status === 422
  );

  console.log('candidate-pipeline.test.js: all assertions passed (%d recommendation calls exercised)', insertedRows.length);
}

module.exports = run;

if (require.main === module) {
  run().catch((err) => {
    console.error('candidate-pipeline.test.js FAILED:', err);
    process.exit(1);
  });
}
