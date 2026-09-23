// Career-learning roadmap builder.
//
// SCOPE: this file is strictly downstream presentation logic. It reads
// the career record already returned by the (unmodified) ML service
// career catalog endpoint (name, domain, skills, courses, education,
// salary_range, job_growth) and, when personalizing for a signed-in
// user, the (unmodified) /skill-gap result already computed by
// roadmaps.controller.js. It never calls the recommendation/ranking
// endpoints, never touches candidate isolation, analysis runs, feedback,
// or resume logic, and never influences those systems' outputs. It also
// never reads ml-service's internal skill-tier weights/scoring — the
// only "ordering" signal used is the position order the dataset's own
// curators already wrote each career's skill list in (see
// splitIntoPhases below), which is read-only and downstream by
// construction: it cannot feed back into recommendation scoring.
//
// SCALING: nothing here is keyed by career name. Every section is
// derived from the career's own curated data plus a small, fixed set of
// domain/skill CATEGORIES (not 300+ per-career branches) — see
// PROJECT_CATEGORIES below for the clearest example of this pattern.
'use strict';

const resources = require('../data/roadmapResources');

function dedupe(list) {
  return Array.from(new Set((list || []).filter(Boolean)));
}

// Shared, null-safe "does this career's skill list mention any of these
// keywords" check, used by every PROJECT_CATEGORIES test below so a
// career record with a missing/empty skills array never throws.
function skillsMatchAny(career, keywords) {
  const skills = career.skills || [];
  return keywords.some((k) => skills.some((s) => resources.containsKeyword(String(s || '').toLowerCase(), k)));
}

// Splits a skill list into three ordered chunks. The dataset's curators
// consistently list a career's most defining skills first (see
// ml-service/app/data/skill_importance.py's documented position-score
// signal) — this reuses that same real, already-authored ordering
// convention rather than re-deriving importance itself, so "Foundation"
// naturally ends up skewed toward the more essential/common skills. This
// is read-only: it never writes back to that dataset or to any scoring
// system.
function splitIntoPhases(orderedSkills) {
  const third = Math.max(1, Math.ceil(orderedSkills.length / 3));
  return {
    foundation: orderedSkills.slice(0, third),
    building: orderedSkills.slice(third, third * 2),
    specialization: orderedSkills.slice(third * 2),
  };
}

function buildOverview(career) {
  const parts = [];
  if (career.domain) parts.push(`${career.name} is part of the ${career.domain} field.`);
  if (career.job_growth) parts.push(`Current tracked job-growth outlook: ${career.job_growth}.`);
  if (career.salary_range) parts.push(`Typical salary range: ${career.salary_range}.`);
  if ((career.education || []).length) {
    parts.push(`Common education paths include ${career.education.slice(0, 4).join(', ')}.`);
  }
  return parts.join(' ');
}

// ---------------------------------------------------------------------
// Project suggestions: a small, fixed set of DOMAIN/SKILL CATEGORIES
// (not one branch per career — there are ~10 categories total, reused
// across all 300+ careers) so a project idea actually reads as relevant
// to the kind of work the career involves, instead of the previous
// "A project combining {skill 1} + {skill 2}" template that just
// concatenated two skill strings regardless of what they were.
// Each category's `build` function still pulls its specifics (the
// career name, its top skill/topic, a real course title) from that
// career's own data — so two careers in the same category still get
// differently-worded, career-specific suggestions.
// ---------------------------------------------------------------------
const PROJECT_CATEGORIES = [
  {
    name: 'software',
    test: (career) => resources.isCodeContributionRelevant(career),
    build: (career, topics) => [
      `Build a small, working application or script that uses ${topics[0] || 'a core skill from this career'} to solve a real problem you personally run into — finished and usable beats "tutorial-followed."`,
      `Pick one open-source project relevant to ${career.name} and make one genuine contribution (a bug fix, a doc improvement, a small feature) — see Open-Source Opportunities below.`,
    ],
  },
  {
    name: 'data',
    test: (career) => skillsMatchAny(career, ['data analysis', 'data science', 'statistics', 'machine learning', 'tableau', 'power bi', 'data visualization']),
    build: (career, topics) => [
      `Find a public dataset relevant to ${career.name} and produce a short analysis with 2-3 clear findings and a visualization.`,
      `Recreate one real report or dashboard you'd expect in this role (e.g. covering ${topics[0] || 'a core metric'}), and write a one-paragraph summary of what it shows and why it matters.`,
    ],
  },
  {
    name: 'design',
    test: (career) => (career.domain || '').toLowerCase().includes('design') || skillsMatchAny(career, ['ui', 'ux', 'figma', 'graphic design', 'illustrator', 'photoshop']),
    build: (career) => [
      `Redesign an existing product/screen/material you use regularly, framed as a ${career.name} case study: the problem, your process, before/after.`,
      `Put together a short portfolio piece explaining your design decisions for one project — reviewers weigh reasoning as much as the final visual.`,
    ],
  },
  {
    name: 'marketing_sales_business',
    test: (career) => skillsMatchAny(career, ['marketing', 'seo', 'sales', 'crm', 'digital marketing', 'social media', 'management', 'strategy', 'negotiation', 'business development']),
    build: (career) => [
      `Write a mini strategy/case study for a real or realistic business scenario in ${career.domain || 'this field'}, proposing a specific plan and how you'd measure success.`,
      `Pick a company you admire and analyze one thing they do well relevant to ${career.name} — write up what you'd keep, what you'd change, and why.`,
    ],
  },
  {
    name: 'healthcare',
    test: (career) => skillsMatchAny(career, ['patient', 'nursing', 'clinical', 'medical', 'anatomy', 'pharmacology', 'healthcare']),
    build: (career, topics) => [
      `Create a clear, lay-audience educational explainer on one common condition or procedure relevant to ${career.name} (e.g. related to ${topics[0] || 'a core topic'}) — a strong way to demonstrate understanding without giving individual medical advice.`,
      `Shadow or informally interview someone in this role and write up what a typical day/case actually involves, compared to what you expected.`,
    ],
  },
  {
    name: 'education',
    test: (career) => skillsMatchAny(career, ['teaching', 'curriculum', 'pedagogy', 'education']),
    build: (career, topics) => [
      `Design a short lesson plan or workshop teaching one core concept (e.g. ${topics[0] || 'a key topic'}), including a simple way to check whether learners actually understood it.`,
      `Create a small learning resource (a guide, a short video, a worksheet) for a topic relevant to ${career.name} and get feedback from one real learner.`,
    ],
  },
  {
    name: 'legal',
    test: (career) => skillsMatchAny(career, ['legal', 'law', 'compliance', 'contracts', 'regulation']),
    build: (career, topics) => [
      `Write a plain-language explainer of one real law/regulation relevant to ${career.name} (e.g. related to ${topics[0] || 'a core topic'}), aimed at someone with no legal background.`,
      `Summarize a real (public) case or ruling relevant to this field and explain, in your own words, why the outcome matters.`,
    ],
  },
  {
    name: 'hands_on_trade',
    test: (career) => ['Skilled Trades & Vocational Careers', 'Architecture & Construction', 'Engineering (Non-IT)', 'Aviation & Maritime', 'Agriculture & Environment'].includes(career.domain),
    build: (career, topics) => [
      `Document one hands-on job or repair you complete (e.g. involving ${topics[0] || 'a core skill'}) with before/after photos and a short written process log — concrete, verifiable evidence of the work beats a list of skills.`,
      `Put together a simple portfolio/checklist of the safety standards and tools relevant to ${career.name}, and use it to review your own recent work.`,
    ],
  },
  {
    name: 'research_science',
    test: (career) => skillsMatchAny(career, ['research', 'lab', 'biology', 'chemistry', 'physics', 'science']),
    build: (career, topics) => [
      `Write a short literature review (3-5 sources) on one open question relevant to ${career.name}, summarizing what's known and what isn't.`,
      `If it's safe and feasible, design and run a small experiment or observation related to ${topics[0] || 'a core topic'}, and write it up like a mini research report.`,
    ],
  },
];

// Generic fallback for any career that doesn't match one of the
// categories above — still built from that career's own real data
// (its own top skill/topic and, if it has one, a real course title),
// not a copy-pasted line shared verbatim by unrelated careers.
function genericProjectSuggestions(career, topics, courses) {
  const out = [
    `Apply ${topics[0] || 'a core skill for this career'} to one small real-world problem you personally care about, and write up what you did and learned.`,
  ];
  if (courses[0]) {
    out.push(`Work through "${courses[0]}" and turn what you learn into one concrete, finished output rather than just notes.`);
  } else {
    out.push(`Talk to (or shadow) someone currently working as a ${career.name}, and turn what you learn into a short write-up of what the role actually involves day-to-day.`);
  }
  return out;
}

function buildProjectSuggestions(career, topics, courses) {
  const category = PROJECT_CATEGORIES.find((c) => c.test(career));
  const suggestions = category ? category.build(career, topics, courses) : genericProjectSuggestions(career, topics, courses);
  return dedupe(suggestions).slice(0, 3);
}

/**
 * Builds the roadmap for a career.
 *
 * @param {object} career - career detail from careerService.getCareerDetail
 *   (name, domain, skills[], courses[], education[], salary_range, job_growth).
 * @param {object} [gap] - optional, from the existing skillService.skillGap
 *   call already made by the personalized controller action:
 *   { matched_skills: string[], missing_skills: string[] }.
 *   When omitted, the roadmap is the generic (non-personalized) version.
 */
function buildRoadmap(career, gap) {
  const allSkills = dedupe(career.skills || []);
  const courses = dedupe(career.courses || []);
  const personalized = !!gap;

  // "Skills to learn/strengthen" — for a personalized roadmap this is the
  // user's actual gap (already computed by the ML service's /skill-gap
  // endpoint, untouched here), kept in the career's own curated order so
  // more essential skills still surface first. For the generic/public
  // roadmap it's simply every skill the career tracks.
  const missingSet = personalized ? new Set((gap.missing_skills || []).map((s) => s.toLowerCase())) : null;
  const skillsToLearn = personalized ? allSkills.filter((s) => missingSet.has(s.toLowerCase())) : allSkills;
  const demonstratedSkills = personalized ? dedupe(gap.matched_skills || []) : [];

  const phasePool = skillsToLearn.length ? skillsToLearn : allSkills;
  const { foundation, building, specialization } = splitIntoPhases(phasePool);

  // Important topics/concepts — the career's curated skills + course
  // names, deduplicated and capped, shown as a compact reference list
  // distinct from the "skills to learn" gap list.
  const topics = dedupe([...allSkills, ...courses]).slice(0, 12);

  const learningResources = resources.buildLearningResources(topics.length ? topics : allSkills, { max: 8 });
  const practiceResources = resources.buildPracticeResources(career);
  const openSourceResources = resources.buildOpenSourceResources(career);
  const skillsLower = allSkills.map((s) => s.toLowerCase());
  const freeCertifications = resources.findCertifications(skillsLower);
  const hasFreeCerts = freeCertifications.length > 0;

  // Phase milestones now derive from THIS career's own data (its actual
  // foundation/building/specialization skills, its own domain, and
  // whether a genuinely free certification was actually found for it)
  // instead of one identical sentence assumed to fit every career (e.g.
  // the old "pursue a relevant certification if the field values one"
  // line was shown for every single career regardless of whether one
  // exists).
  const foundationFocus = (foundation.length ? foundation : allSkills.slice(0, 3)).slice(0, 2).join(' and ') || 'the core fundamentals';
  const buildingFocus = (building.length ? building : allSkills.slice(0, 3))[0] || foundation[0] || allSkills[0] || 'a core skill';
  const specializationFocus = (specialization.length ? specialization : allSkills.slice(0, 3))[0] || allSkills[0] || 'your strongest skill';

  const phases = [
    {
      phase: 'Foundation',
      duration: '0-3 months',
      focus_skills: foundation.length ? foundation : allSkills.slice(0, 3),
      milestones: [
        `Get comfortable with ${foundationFocus} — the skills ${career.name} relies on most.`,
        `Complete an introductory resource covering ${courses[0] || allSkills[0] || 'the fundamentals'}.`,
      ],
      resources: courses.slice(0, 2),
    },
    {
      phase: 'Skill Building',
      duration: '3-6 months',
      focus_skills: building.length ? building : allSkills.slice(0, 3),
      milestones: [
        `Turn ${buildingFocus} into a small practical project (see Suggested Projects below) rather than only reading/watching about it.`,
        `Start a portfolio piece that demonstrates practical ability in ${career.domain || 'this field'}.`,
      ],
      resources: courses.slice(2, 4),
    },
    {
      phase: 'Specialization & Portfolio',
      duration: '6-12 months',
      focus_skills: specialization.length ? specialization : allSkills.slice(0, 3),
      milestones: [
        `Complete one substantial project that showcases ${specializationFocus}.`,
        hasFreeCerts
          ? 'Consider one of the genuinely free certifications below to formalize your skills.'
          : `Share your work publicly (a portfolio, a relevant online community, or your professional network) — a formal certification isn't essential for every path in ${career.domain || 'this field'}.`,
        'Start applying and networking for roles in the field.',
      ],
      resources: courses.slice(4),
    },
  ];

  const projectsSuggested = buildProjectSuggestions(career, topics, courses);

  const nextSteps = [
    'Verify a few of your strongest skills with a skill test so your matches carry stronger evidence.',
    `Start the Foundation phase: ${foundation[0] || allSkills[0] || 'pick one core skill'} first.`,
    'Build one small practice project before moving to the next phase.',
    'Revisit this roadmap in a few weeks — your skill gap will change as you learn.',
  ];

  return {
    // --- Back-compat fields (unchanged shape/semantics) ---
    career: career.name,
    total_duration: '6-12 months (varies by prior experience)',
    phases,
    certifications: career.education || [],
    projects_suggested: projectsSuggested,

    // --- New, additive fields for the upgraded roadmap ---
    career_id: career.career_id,
    domain: career.domain,
    overview: buildOverview(career),
    personalized,
    demonstrated_skills: demonstratedSkills,
    skills_to_learn: skillsToLearn,
    topics,
    resources: {
      learn: learningResources.learn,
      docs: learningResources.docs,
      practice: practiceResources,
    },
    open_source: openSourceResources,
    free_certifications: freeCertifications,
    job_search: resources.buildJobSearch(career.name),
    internship_search: resources.buildInternshipSearch(career.name),
    next_steps: nextSteps,
  };
}

module.exports = { buildRoadmap };
