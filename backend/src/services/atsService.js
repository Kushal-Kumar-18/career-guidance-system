const resumeService = require('./resumeService');
const careerService = require('./careerService');
const resumeRepository = require('../repositories/resumeRepository');
const activityRepository = require('../repositories/activityRepository');

// Rule-based ATS engine (documented fresh implementation — see
// PHASE1_NOTES.md, the legacy ATS scoring module wasn't included in the
// handoff). Scores 0-100 across three weighted dimensions:
//   - Keyword relevance (50%): overlap between resume skills and the
//     target career's tracked skill vocabulary (same vocabulary the
//     recommender/skill-gap features use, so scores stay consistent).
//   - Completeness (30%): presence of standard resume sections.
//   - Formatting (20%): basic structural heuristics (length, contact
//     info, bullet-style experience entries).

function scoreKeywords(resumeSkills, careerSkills) {
  if (!careerSkills.length) return { score: 0, matched: [], missing: [] };
  const resumeSet = new Set(resumeSkills.map((s) => s.toLowerCase()));
  const matched = careerSkills.filter((s) => resumeSet.has(s.toLowerCase()));
  const missing = careerSkills.filter((s) => !resumeSet.has(s.toLowerCase()));
  const score = Math.round((matched.length / careerSkills.length) * 100);
  return { score, matched, missing };
}

function scoreCompleteness(data) {
  const checks = [
    { label: 'Summary', present: Boolean(data.summary && data.summary.length > 20) },
    { label: 'Education', present: Boolean(data.education) },
    { label: 'Skills (5+)', present: data.skills.length >= 5 },
    { label: 'Experience or Projects', present: (data.experience?.length > 0) || Boolean(data.projects) },
    { label: 'Certifications', present: data.certifications.length > 0 },
    { label: 'Contact info', present: Boolean(data.email) && Boolean(data.phone) },
  ];
  const presentCount = checks.filter((c) => c.present).length;
  const score = Math.round((presentCount / checks.length) * 100);
  return { score, checks };
}

function scoreFormatting(data) {
  const issues = [];
  const summaryLen = (data.summary || '').length;
  if (summaryLen > 0 && summaryLen < 40) issues.push('Summary is quite short — aim for 2-3 sentences.');
  if (summaryLen > 600) issues.push('Summary is long — ATS parsers and recruiters favor concise summaries.');
  if (!data.phone) issues.push('Missing phone number in contact details.');
  if (data.skills.length > 25) issues.push('Very long skills list — consider trimming to the most relevant ones.');
  if ((data.experience || []).some((e) => !e.description || e.description.length < 10)) {
    issues.push('One or more experience entries are missing a description.');
  }
  const score = Math.max(0, 100 - issues.length * 15);
  return { score, issues };
}

async function analyze(userId, targetCareer) {
  const data = await resumeService.buildResumeData(userId);
  const career = await careerService.getCareerDetail(targetCareer);

  const keyword = scoreKeywords(data.skills, career.skills || []);
  const completeness = scoreCompleteness(data);
  const formatting = scoreFormatting(data);

  const overall = Math.round(keyword.score * 0.5 + completeness.score * 0.3 + formatting.score * 0.2);

  const recommendations = [];
  if (keyword.missing.length) {
    recommendations.push(`Add these role-relevant skills if you have them: ${keyword.missing.slice(0, 8).join(', ')}.`);
  }
  completeness.checks.filter((c) => !c.present).forEach((c) => recommendations.push(`Add a "${c.label}" section to your profile/resume.`));
  formatting.issues.forEach((i) => recommendations.push(i));

  await resumeRepository.updateAtsScore(userId, overall);
  await activityRepository.log(userId, 'ats_analyzed', { target_career: targetCareer, score: overall });

  return {
    target_career: targetCareer,
    ats_score: overall,
    keyword_analysis: keyword,
    completeness,
    formatting,
    recommendations,
  };
}

module.exports = { analyze };
