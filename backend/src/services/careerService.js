const mlClient = require('./mlClient');
const savedCareerRepository = require('../repositories/savedCareerRepository');

async function listCareers(q, limit, offset) {
  const res = await mlClient.listCareers();
  let data = res.data;
  if (q) {
    const qLower = q.toLowerCase();
    data = data.filter((c) => c.name.toLowerCase().includes(qLower));
  }
  const total = data.length;
  const page = data.slice(offset || 0, (offset || 0) + (limit || total));
  return { data: page, meta: { total, limit: limit || total, offset: offset || 0 } };
}

async function getCareerDetail(name) {
  const res = await mlClient.getCareer(name);
  return res.data;
}

// Deterministic roadmap generator built from the real preserved career
// data (skills + courses) — see PHASE1_NOTES.md: the legacy roadmap/myth
// content modules were not included in the handoff, so this is a fresh,
// documented implementation over real career data rather than a port.
function buildRoadmap(career) {
  const skills = career.skills || [];
  const courses = career.courses || [];
  const third = Math.max(1, Math.ceil(skills.length / 3));

  const phases = [
    {
      phase: 'Foundation',
      duration: '0-3 months',
      focus_skills: skills.slice(0, third),
      milestones: [
        `Get comfortable with the core concepts behind ${career.name}`,
        `Complete an introductory course covering ${courses[0] || skills[0] || 'fundamentals'}`,
      ],
      resources: courses.slice(0, 2),
    },
    {
      phase: 'Skill Building',
      duration: '3-6 months',
      focus_skills: skills.slice(third, third * 2),
      milestones: [
        'Build 1-2 small guided projects applying the foundation skills',
        'Start a portfolio piece that demonstrates practical ability',
      ],
      resources: courses.slice(2, 4),
    },
    {
      phase: 'Specialization & Portfolio',
      duration: '6-12 months',
      focus_skills: skills.slice(third * 2),
      milestones: [
        'Ship one substantial, original project for your portfolio',
        'Pursue a relevant certification if the field values one',
        'Start applying / networking in the field',
      ],
      resources: courses.slice(4),
    },
  ].map((p) => ({ ...p, focus_skills: p.focus_skills.length ? p.focus_skills : skills.slice(0, 3) }));

  return {
    career: career.name,
    total_duration: '6-12 months (varies by prior experience)',
    phases,
    certifications: career.education || [],
    projects_suggested: [
      `A project demonstrating ${skills[0] || 'a core skill'} for ${career.name}`,
      `A project combining ${skills.slice(0, 2).join(' + ') || 'two core skills'}`,
    ],
  };
}

// Generated "myths vs reality" — templated from job_growth/salary_range so
// content stays grounded in real per-career data instead of being invented.
function buildMythsReality(career) {
  return [
    {
      myth: `${career.name} is impossible to break into without a specific degree.`,
      reality: `Typical education paths include ${(career.education || []).join(', ') || 'several routes'}, but demonstrated skills and projects often matter more than the exact degree.`,
    },
    {
      myth: `The market for ${career.name} is saturated.`,
      reality: `Current job growth outlook is reported as "${career.job_growth || 'stable'}" based on the tracked career data.`,
    },
    {
      myth: `You need every listed skill before applying.`,
      reality: `Employers typically look for a strong subset of the ${(career.skills || []).length} tracked skills plus willingness to learn the rest on the job.`,
    },
  ];
}

async function compareCareers(names) {
  const details = await Promise.all(names.map((n) => getCareerDetail(n)));
  return details;
}

// Ported from the original Flask app's calculate_career_investment()
// (enhanced_career_roadmap.py). Re-derives a rough time + money estimate
// from the roadmap we already build, rather than a separate data source.
function buildInvestment(career) {
  const roadmap = buildRoadmap(career);

  // total_duration looks like "6-12 months (varies by prior experience)" —
  // pull the first number out of it the same way the original regex did.
  const monthsMatch = (roadmap.total_duration || '').match(/\d+/);
  const months = monthsMatch ? parseInt(monthsMatch[0], 10) : 12;

  const certifications = roadmap.certifications || [];
  const avgCertCost = certifications.length ? 500 : 500; // original had no real cost data either; keep the same default

  const courseCost = 4 * 2000; // 4 courses @ ~₹2000 each, same assumption as the original
  const materialsCost = 5000;
  const toolsCost = months * 500;
  const totalCost = avgCertCost + courseCost + materialsCost + toolsCost;

  return {
    career: career.name,
    time_investment: `${months} months`,
    time_investment_hours: months * 80, // ~20 hrs/week
    financial_investment: `₹${Math.round(totalCost).toLocaleString('en-IN')}`,
    breakdown: {
      certifications: `₹${Math.round(avgCertCost).toLocaleString('en-IN')}`,
      courses: `₹${courseCost.toLocaleString('en-IN')}`,
      materials: `₹${materialsCost.toLocaleString('en-IN')}`,
      tools_internet: `₹${Math.round(toolsCost).toLocaleString('en-IN')}`,
    },
    free_alternative_available: true,
    potential_roi: career.salary_range || 'Varies by experience and location',
  };
}

// Ported from the original get_weekly_learning_plan(). hoursPerWeek is
// user-configurable the same way the original accepted hours_per_week.
function buildWeeklyPlan(career, hoursPerWeek = 20) {
  const roadmap = buildRoadmap(career);
  const firstPhase = roadmap.phases?.[0];
  const hrs = Number(hoursPerWeek) > 0 ? Number(hoursPerWeek) : 20;

  return {
    career: career.name,
    total_hours: hrs,
    breakdown: {
      'Learning (40%)': `${Math.round(hrs * 0.4)} hours - Video courses, tutorials, reading`,
      'Practice (40%)': `${Math.round(hrs * 0.4)} hours - Hands-on projects and exercises`,
      'Review (10%)': `${Math.round(hrs * 0.1)} hours - Reviewing concepts, notes`,
      'Community (10%)': `${Math.round(hrs * 0.1)} hours - Forums, networking, asking questions`,
    },
    daily_schedule: {
      'Weekdays (Mon-Fri)': `${Math.round((hrs / 7) * 5)} hours - a couple hours after work/school`,
      'Weekends (Sat-Sun)': `${Math.round((hrs / 7) * 2)} hours - longer focused sessions`,
    },
    focus_areas_week_1: (firstPhase?.focus_skills || []).slice(0, 3),
    tips: [
      'Stay consistent - daily practice is better than cramming',
      'Take breaks every 45-60 minutes',
      'Build projects to reinforce learning',
      'Join study groups for accountability',
      'Track your progress weekly',
    ],
  };
}

module.exports = {
  listCareers,
  getCareerDetail,
  buildRoadmap,
  buildMythsReality,
  buildInvestment,
  buildWeeklyPlan,
  compareCareers,
  saveCareer: savedCareerRepository.save,
  unsaveCareer: savedCareerRepository.remove,
  listSavedCareers: savedCareerRepository.listByUser,
};
