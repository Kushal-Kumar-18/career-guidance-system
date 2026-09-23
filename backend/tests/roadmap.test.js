// Regression tests for the upgraded career roadmap feature
// (services/roadmapService.js + data/roadmapResources.js).
//
// These tests deliberately construct several SYNTHETIC careers spanning
// different domains (tech, marketing, healthcare, a SQL-only "not really
// a coder" career, and a "niche" one with no curated keyword match at
// all) rather than importing the real 300+-career Python dataset (which
// lives in ml-service and is out of scope for this upgrade) — the point
// is to prove the roadmap logic is genuinely data-driven and scales to
// *any* career shape, not to re-test the dataset itself.
//
// Run with: npm test

const assert = require('node:assert/strict');
const proxyquire = require('proxyquire').noPreserveCache();
const roadmapService = require('../src/services/roadmapService');
const roadmapResources = require('../src/data/roadmapResources');

const TECH_CAREER = {
  name: 'Software Developer',
  career_id: 'software-developer',
  domain: 'Technology & IT',
  skills: ['python', 'java', 'javascript', 'git', 'algorithms', 'data structures', 'api', 'rest'],
  interests: ['technology', 'problem solving'],
  education: ['B.Tech', 'BCA', 'Bootcamp'],
  salary_range: '₹3.5-15 LPA',
  job_growth: 'Very High',
  courses: ['Python Programming', 'Java Full Stack', 'Data Structures & Algorithms', 'Git & GitHub'],
};

const MARKETING_CAREER = {
  name: 'Digital Marketing Specialist',
  career_id: 'digital-marketing-specialist',
  domain: 'Marketing & Sales',
  skills: ['seo', 'content marketing', 'social media', 'digital marketing', 'analytics'],
  interests: ['branding', 'communication'],
  education: ['MBA Marketing', 'Any Graduate'],
  salary_range: '₹4-12 LPA',
  job_growth: 'High',
  courses: ['Digital Marketing Fundamentals', 'SEO Basics'],
};

const HEALTHCARE_CAREER = {
  name: 'Registered Nurse',
  career_id: 'registered-nurse',
  domain: 'Healthcare',
  skills: ['patient care', 'clinical assessment', 'nursing', 'anatomy'],
  interests: ['helping people', 'medicine'],
  education: ['B.Sc Nursing', 'GNM'],
  salary_range: '₹2.5-8 LPA',
  job_growth: 'High',
  courses: ['Fundamentals of Nursing'],
};

// A career that touches "tech" tools (SQL, cloud, Linux) without ever
// authoring/contributing code — this must NOT get open-source or
// coding-practice suggestions, unlike a genuine developer role.
const SQL_ONLY_CAREER = {
  name: 'Business Intelligence Analyst',
  career_id: 'bi-analyst',
  domain: 'Data & Artificial Intelligence',
  skills: ['sql', 'power bi', 'reporting', 'data analysis', 'stakeholder communication'],
  interests: ['data', 'business'],
  education: ['Any Graduate', 'MBA'],
  salary_range: '₹5-14 LPA',
  job_growth: 'High',
  courses: ['SQL for Analysts', 'Power BI Fundamentals'],
};

// A deliberately "niche" career with no curated keyword-group match, to
// prove the roadmap degrades to an honest empty state instead of
// inventing/guessing a resource for it.
const NICHE_CAREER = {
  name: 'Sommelier',
  career_id: 'sommelier',
  domain: 'Hospitality & Tourism',
  skills: ['wine tasting', 'flavor pairing', 'guest service'],
  interests: ['wine', 'hospitality'],
  education: ['WSET Certification', 'Hospitality Diploma'],
  salary_range: '₹3-9 LPA',
  job_growth: 'Moderate',
  courses: ['Wine Fundamentals'],
};

const SEARCH_ENGINE_HOSTS = ['coursera.org', 'edx.org', 'google.com/search', 'youtube.com/results', 'khanacademy.org/search', 'ocw.mit.edu/search'];

function assertValidResourceList(list, label) {
  assert.ok(Array.isArray(list), `${label} must be an array`);
  for (const r of list) {
    assert.ok(r.title && typeof r.title === 'string', `${label} entries need a title`);
    assert.ok(typeof r.url === 'string' && r.url.startsWith('https://'), `${label} entries must have an https:// url (got: ${r.url})`);
  }
}

// Enforces the review fix: a "learning resource" or "certification" must
// never be a search-results page or a mixed paid/free platform search —
// only job/internship search and open-source discovery are allowed to
// be live searches (see roadmapResources.js's header comment).
function assertNoSearchEngineFallback(list, label) {
  for (const r of list) {
    for (const host of SEARCH_ENGINE_HOSTS) {
      assert.ok(!r.url.includes(host), `${label} must not contain a search-engine fallback link (found ${host} in ${r.url})`);
    }
  }
}

function testBackwardCompatibleShape() {
  const roadmap = roadmapService.buildRoadmap(TECH_CAREER);

  // Fields every existing caller (careerService.buildInvestment,
  // buildWeeklyPlan, the old frontend RoadmapPage) already depends on.
  assert.equal(roadmap.career, TECH_CAREER.name);
  assert.match(roadmap.total_duration, /\d+/, 'total_duration must still contain a parseable number of months');
  assert.equal(roadmap.phases.length, 3);
  for (const phase of roadmap.phases) {
    assert.ok(phase.phase && phase.duration);
    assert.ok(Array.isArray(phase.focus_skills));
    assert.ok(Array.isArray(phase.milestones) && phase.milestones.length >= 1);
    assert.ok(Array.isArray(phase.resources));
  }
  assert.deepEqual(roadmap.certifications, TECH_CAREER.education);
  assert.ok(Array.isArray(roadmap.projects_suggested) && roadmap.projects_suggested.length >= 2);

  console.log('  roadmap: back-compat fields preserved ✓');
}

function testInvestmentAndWeeklyPlanStillWork() {
  // These two careerService functions build on top of buildRoadmap's
  // output and must keep working, unmodified, after the roadmap upgrade.
  const careerService = require('../src/services/careerService');
  const investment = careerService.buildInvestment(TECH_CAREER);
  assert.match(investment.time_investment, /\d+ months/);
  assert.ok(investment.financial_investment.startsWith('₹'));

  const weeklyPlan = careerService.buildWeeklyPlan(TECH_CAREER, 15);
  assert.equal(weeklyPlan.total_hours, 15);
  assert.ok(Array.isArray(weeklyPlan.focus_areas_week_1));

  console.log('  roadmap: buildInvestment/buildWeeklyPlan unaffected ✓');
}

function testGenericRoadmapNewFields() {
  const roadmap = roadmapService.buildRoadmap(TECH_CAREER);
  assert.equal(roadmap.personalized, false);
  assert.equal(roadmap.demonstrated_skills.length, 0, 'no candidate context -> nothing to call "demonstrated"');
  assert.deepEqual(roadmap.skills_to_learn, Array.from(new Set(TECH_CAREER.skills)));
  assert.ok(roadmap.overview.includes('Software Developer'));
  assert.ok(roadmap.overview.includes('Technology & IT'));
  assert.ok(!('video' in roadmap.resources), 'the unverifiable video/tutorial search fallback was removed entirely');
  assertValidResourceList(roadmap.resources.learn, 'resources.learn');
  assertValidResourceList(roadmap.resources.docs, 'resources.docs');
  assertValidResourceList(roadmap.resources.practice, 'resources.practice');
  assertValidResourceList(roadmap.job_search, 'job_search');
  assertValidResourceList(roadmap.internship_search, 'internship_search');
  assert.ok(roadmap.job_search.length >= 1);
  assert.ok(roadmap.next_steps.length >= 1);

  console.log('  roadmap: new generic-guide fields are well-formed ✓');
}

function testPersonalizedGapDrivesRoadmap() {
  const gap = {
    matched_skills: ['python', 'git'],
    missing_skills: ['java', 'javascript', 'algorithms', 'data structures', 'api', 'rest'],
  };
  const roadmap = roadmapService.buildRoadmap(TECH_CAREER, gap);

  assert.equal(roadmap.personalized, true);
  assert.deepEqual(roadmap.demonstrated_skills.sort(), ['git', 'python'].sort());
  assert.deepEqual(roadmap.skills_to_learn.sort(), gap.missing_skills.slice().sort());

  // Every focus_skill in every phase must come from the gap, never from
  // an already-demonstrated skill — this is the "never influences
  // recommendations, only reflects them for display" property.
  const allFocusSkills = roadmap.phases.flatMap((p) => p.focus_skills);
  for (const skill of allFocusSkills) {
    assert.ok(!roadmap.demonstrated_skills.includes(skill), `${skill} is already demonstrated and should not appear as a focus skill`);
  }

  console.log('  roadmap: personalized roadmap orders phases by the real skill gap ✓');
}

function testOpenSourceAndPracticeRequireGenuineCodeSignal() {
  const techRoadmap = roadmapService.buildRoadmap(TECH_CAREER);
  const nurseRoadmap = roadmapService.buildRoadmap(HEALTHCARE_CAREER);
  const sqlOnlyRoadmap = roadmapService.buildRoadmap(SQL_ONLY_CAREER);

  assert.ok(techRoadmap.open_source.length > 0, 'a genuine software role should get open-source suggestions');
  assert.ok(techRoadmap.resources.practice.length > 0, 'a genuine software role should get coding-practice suggestions');

  assert.equal(nurseRoadmap.open_source.length, 0, 'open-source section must not be forced onto a non-tech career');
  assert.equal(nurseRoadmap.resources.practice.length, 0);

  // SQL/Power BI/reporting alone does not mean the person authors or
  // contributes code — this must NOT trigger open-source/practice
  // suggestions just because the role is data-adjacent.
  assert.equal(sqlOnlyRoadmap.open_source.length, 0, 'SQL/BI tooling alone is not a genuine code-contribution signal');
  assert.equal(sqlOnlyRoadmap.resources.practice.length, 0);

  console.log('  roadmap: open-source/practice require a genuine code-contribution signal, not just "tech-adjacent" ✓');
}

function testCertificationsAreAlwaysGenuinelyFree() {
  const marketingRoadmap = roadmapService.buildRoadmap(MARKETING_CAREER);
  assert.ok(marketingRoadmap.free_certifications.length > 0);
  for (const cert of marketingRoadmap.free_certifications) {
    assert.ok(cert.url.startsWith('https://'));
    assert.ok(!('free' in cert) || cert.free !== false, 'every listed certification must be genuinely free — a paid-exam provider must never appear here');
  }

  // A cloud/security career must NOT get Microsoft Learn (or anything
  // else with a paid exam) listed as a "free certification" — it's a
  // free *learning* resource only, listed under resources.learn.
  const cloudCareer = { ...TECH_CAREER, name: 'Cloud Engineer', skills: ['aws', 'azure', 'cloud', 'networking'] };
  const cloudRoadmap = roadmapService.buildRoadmap(cloudCareer);
  assert.ok(
    !cloudRoadmap.free_certifications.some((c) => /microsoft/i.test(c.title)),
    'Microsoft Learn has a paid certification exam and must never appear under free_certifications'
  );

  const nicheRoadmap = roadmapService.buildRoadmap(NICHE_CAREER);
  // Sommelier's skills don't match any curated free-certification group —
  // the section must be an empty array (clean "unavailable" state), never
  // an invented certification.
  assert.deepEqual(nicheRoadmap.free_certifications, []);

  console.log('  roadmap: certifications are never shown unless genuinely free, never invented when unverifiable ✓');
}

function testNoSearchEngineFallbackAnywhereInLearningContent() {
  // The core review fix: nothing under resources.learn/docs/practice or
  // free_certifications may ever be a search-results page (Coursera/edX/
  // YouTube/Khan Academy/MIT OCW search, or a generic web search) —
  // those are not verifiable in advance and must never stand in for a
  // curated resource. Job/internship search and open-source discovery
  // are exempt by design (see roadmapResources.js).
  for (const career of [TECH_CAREER, MARKETING_CAREER, HEALTHCARE_CAREER, SQL_ONLY_CAREER, NICHE_CAREER]) {
    const roadmap = roadmapService.buildRoadmap(career);
    assertNoSearchEngineFallback(roadmap.resources.learn, `${career.name} resources.learn`);
    assertNoSearchEngineFallback(roadmap.resources.docs, `${career.name} resources.docs`);
    assertNoSearchEngineFallback(roadmap.resources.practice, `${career.name} resources.practice`);
    assertNoSearchEngineFallback(roadmap.free_certifications, `${career.name} free_certifications`);
  }

  console.log('  roadmap: no search-engine result is ever presented as a verified learning resource or certification ✓');
}

function testScalesAcrossDiverseCareersWithoutHardcoding() {
  // The whole point of this upgrade: the SAME code path must produce a
  // valid, well-formed roadmap for wildly different careers, including
  // one (Sommelier) with no curated keyword match at all — which is now
  // allowed to have EMPTY resource sections rather than a guessed link.
  for (const career of [TECH_CAREER, MARKETING_CAREER, HEALTHCARE_CAREER, SQL_ONLY_CAREER, NICHE_CAREER]) {
    const roadmap = roadmapService.buildRoadmap(career);
    assert.equal(roadmap.career, career.name);
    assert.ok(roadmap.topics.length > 0, `${career.name}: topics must not be empty`);
    assertValidResourceList(roadmap.resources.learn, `${career.name} resources.learn`);
    assertValidResourceList(roadmap.resources.docs, `${career.name} resources.docs`);
    assertValidResourceList(roadmap.job_search, `${career.name} job_search`);
    assertValidResourceList(roadmap.internship_search, `${career.name} internship_search`);
  }

  // The niche career legitimately has nothing curated — confirm that's
  // an honest empty state, not a crash and not an invented resource.
  const nicheRoadmap = roadmapService.buildRoadmap(NICHE_CAREER);
  assert.equal(nicheRoadmap.resources.learn.length, 0);
  assert.equal(nicheRoadmap.resources.docs.length, 0);

  console.log('  roadmap: scales across diverse careers (incl. a niche one with an honest empty state) with no hardcoded per-career logic ✓');
}

function testResourceDeduplication() {
  const careerWithDuplicateSkills = {
    ...TECH_CAREER,
    skills: ['python', 'python', 'Python', 'python programming'],
  };
  const roadmap = roadmapService.buildRoadmap(careerWithDuplicateSkills);
  const urls = roadmap.resources.learn.map((r) => r.url);
  assert.equal(urls.length, new Set(urls).size, 'learning resources must be de-duplicated by URL');

  console.log('  roadmap: resources are de-duplicated across repeated/near-duplicate skills ✓');
}

function testJobAndInternshipSearchAreDynamicNotStored() {
  const a = roadmapResources.buildJobSearch('Data Scientist');
  const b = roadmapResources.buildJobSearch('Nurse');
  assert.notDeepEqual(a, b, 'job search links must be built per career name, not a fixed stored list');
  assert.ok(a.every((r) => r.url.includes(encodeURIComponent('Data Scientist'))));

  const internships = roadmapResources.buildInternshipSearch('Data Scientist');
  assert.ok(internships.every((r) => r.url.toLowerCase().includes('intern')));

  console.log('  roadmap: job/internship links are generated search destinations, not stored listings ✓');
}

function testProjectSuggestionsAreCategoryAwareNotConcatenation() {
  const techRoadmap = roadmapService.buildRoadmap(TECH_CAREER);
  const marketingRoadmap = roadmapService.buildRoadmap(MARKETING_CAREER);
  const healthcareRoadmap = roadmapService.buildRoadmap(HEALTHCARE_CAREER);
  const nicheRoadmap = roadmapService.buildRoadmap(NICHE_CAREER);

  // Old behavior explicitly banned: "A project combining {skill} + {skill}".
  for (const roadmap of [techRoadmap, marketingRoadmap, healthcareRoadmap, nicheRoadmap]) {
    for (const p of roadmap.projects_suggested) {
      assert.ok(!/^A project combining .+ \+ .+$/.test(p), `project suggestion reads as a raw skill concatenation: "${p}"`);
    }
  }

  // Different categories should produce genuinely different phrasing,
  // not the same template with a word swapped in.
  assert.notDeepEqual(techRoadmap.projects_suggested, marketingRoadmap.projects_suggested);
  assert.ok(techRoadmap.projects_suggested.some((p) => /open.source|application|script/i.test(p)), 'a software career should get a build/contribute-flavored project');
  assert.ok(marketingRoadmap.projects_suggested.some((p) => /strategy|case study|company/i.test(p)), 'a marketing/business career should get a strategy/case-study-flavored project');
  assert.ok(healthcareRoadmap.projects_suggested.some((p) => /explainer|shadow|case/i.test(p)), 'a healthcare career should get an explainer/shadowing-flavored project');

  // Even the generic fallback (niche career, no category match) must
  // still be built from that career's OWN real data (its own top skill),
  // not a hardcoded string.
  assert.ok(nicheRoadmap.projects_suggested[0].includes(nicheRoadmap.topics[0]), 'the generic fallback must still be derived from this career\'s own topic, not a fixed string');

  console.log('  roadmap: project suggestions are category/domain-aware, not raw skill concatenation ✓');
}

function testPhaseMilestonesReflectRealCareerDataAndCertAvailability() {
  const marketingRoadmap = roadmapService.buildRoadmap(MARKETING_CAREER); // has free certs
  const nicheRoadmap = roadmapService.buildRoadmap(NICHE_CAREER); // has none

  const marketingSpecMilestones = marketingRoadmap.phases[2].milestones.join(' | ');
  const nicheSpecMilestones = nicheRoadmap.phases[2].milestones.join(' | ');

  assert.match(marketingSpecMilestones, /consider one of the genuinely free certifications below/i, 'when a genuinely free certification exists, the specialization phase should point to it');
  assert.doesNotMatch(nicheSpecMilestones, /consider one of the genuinely free certifications below/i, 'when no genuinely free certification exists, the specialization phase must not falsely point to one');

  // Foundation milestone must name real skills from THIS career, not a
  // generic "core concepts" phrase identical across every career.
  assert.ok(marketingRoadmap.phases[0].milestones[0].includes(marketingRoadmap.phases[0].focus_skills[0]));

  console.log('  roadmap: phase milestones derive from real career data and genuine certification availability ✓');
}

// --- Controller wiring: the personalized route must pass the gap into
// buildRoadmap (so focus_skills reflect it) rather than bolting gap
// fields onto an un-personalized roadmap as the old implementation did.
async function testPersonalizedControllerWiresGapIntoRoadmap() {
  let capturedGapArg;
  const fakeCareer = TECH_CAREER;
  const fakeGap = { matched_skills: ['python'], missing_skills: ['java', 'javascript'] };

  const controller = proxyquire('../src/controllers/roadmaps.controller', {
    '../services/careerService': {
      getCareerDetail: async () => fakeCareer,
      buildRoadmap: (career, gap) => {
        capturedGapArg = gap;
        const roadmapServiceInner = require('../src/services/roadmapService');
        return roadmapServiceInner.buildRoadmap(career, gap);
      },
    },
    '../services/skillService': {
      skillGap: async () => fakeGap,
    },
    '../repositories/profileRepository': {
      findByUserId: async () => ({ skills: 'python', interests: '', experience_years: 1, certifications: '', projects: '' }),
    },
    '../repositories/skillTestRepository': {
      verifiedSkillsForUser: async () => ({}),
    },
  });

  const req = { params: { career: 'Software Developer' }, user: { id: 1 } };
  let statusCode;
  let body;

  // asyncHandler (src/utils/asyncHandler.js) fires the handler but does
  // not return its promise to the caller, so this awaits res.json()
  // actually being invoked rather than the (fire-and-forget) wrapped
  // call itself.
  await new Promise((resolve, reject) => {
    const res = {
      status(code) { statusCode = code; return this; },
      json(payload) { body = payload; resolve(); return this; },
    };
    controller.personalized(req, res, reject);
  });

  assert.equal(statusCode, 200);
  assert.deepEqual(capturedGapArg, fakeGap, 'buildRoadmap must be called with the real gap, not undefined');
  assert.deepEqual(body.data.your_missing_skills, fakeGap.missing_skills);
  assert.deepEqual(body.data.your_matched_skills, fakeGap.matched_skills);
  assert.equal(body.data.personalized, true);

  console.log('  roadmap: personalized controller wires the skill gap into buildRoadmap ✓');
}

module.exports = async function run() {
  testBackwardCompatibleShape();
  testInvestmentAndWeeklyPlanStillWork();
  testGenericRoadmapNewFields();
  testPersonalizedGapDrivesRoadmap();
  testOpenSourceAndPracticeRequireGenuineCodeSignal();
  testCertificationsAreAlwaysGenuinelyFree();
  testNoSearchEngineFallbackAnywhereInLearningContent();
  testScalesAcrossDiverseCareersWithoutHardcoding();
  testResourceDeduplication();
  testJobAndInternshipSearchAreDynamicNotStored();
  testProjectSuggestionsAreCategoryAwareNotConcatenation();
  testPhaseMilestonesReflectRealCareerDataAndCertAvailability();
  await testPersonalizedControllerWiresGapIntoRoadmap();
  console.log('roadmap.test.js: all assertions passed');
};

if (require.main === module) {
  module.exports().catch((err) => {
    console.error('roadmap.test.js FAILED:', err);
    process.exit(1);
  });
}
