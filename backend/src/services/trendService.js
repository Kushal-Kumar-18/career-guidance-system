const jobRepository = require('../repositories/jobRepository');
const careerService = require('./careerService');

// -----------------------------------------------------------------------
// Market-trend aggregation.
//
// IMPORTANT: every query here excludes synthetic postings (source =
// 'estimated' — see jobRepository.SYNTHETIC_SOURCES). Those rows are
// generated from our own curated career dataset whenever the Adzuna API
// is unconfigured or unavailable (jobService.fallbackPostings), so
// counting them as demand would be circular: the "market" would simply
// echo back the skill list we already had on file, dressed up as an
// observed percentage. Trends are therefore computed on real observed
// postings only, and every response reports how many real postings the
// numbers are based on (plus how many synthetic rows were skipped) so a
// caller can tell "low demand" apart from "no real data yet".
// -----------------------------------------------------------------------

// Shared shape for the "where did this number come from" block attached
// to every response in this module.
function provenance(realCount, syntheticExcluded) {
  return {
    postings_analyzed: realCount,
    synthetic_postings_excluded: syntheticExcluded,
    real_data_only: true,
    note: realCount
      ? 'Computed from real observed job postings only; synthetic fallback postings were excluded.'
      : 'No real job postings are cached for this career yet, so no demand signal can be computed. '
        + 'Configure ADZUNA_APP_ID/ADZUNA_APP_KEY and run a job search to collect real postings.',
  };
}

async function computeSkillDemandForCareer(careerName) {
  const career = await careerService.getCareerDetail(careerName);
  const [postings, syntheticExcluded] = await Promise.all([
    jobRepository.search({ category: careerName, limit: 200, offset: 0, excludeSynthetic: true }),
    jobRepository.countPostings({ category: careerName, onlySynthetic: true }),
  ]);

  const counts = {};
  for (const skill of career.skills || []) {
    counts[skill] = 0;
  }
  for (const posting of postings) {
    const haystack = `${posting.title} ${posting.description}`.toLowerCase();
    for (const skill of career.skills || []) {
      if (haystack.includes(skill.toLowerCase())) counts[skill] += 1;
    }
  }

  const totalMentions = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const rows = Object.entries(counts)
    .map(([skill_name, demand_count]) => ({
      skill_name,
      demand_count,
      // With no real postings every count is 0, so this is 0 too — an
      // honest "unknown", not a fabricated distribution.
      percentage: postings.length ? Math.round((demand_count / totalMentions) * 1000) / 10 : 0,
      career_category: careerName,
    }))
    .sort((a, b) => b.demand_count - a.demand_count);

  // Only ever persist a demand snapshot that was derived from real
  // postings — an all-zero row set from an empty sample would otherwise
  // be stored and later read back as if it were a measurement.
  if (postings.length) {
    await jobRepository.upsertSkillDemand(rows);
  }

  return {
    ...provenance(postings.length, syntheticExcluded),
    skill_demand: rows,
  };
}

async function marketInsights(careerName) {
  const [postings, syntheticExcluded] = await Promise.all([
    jobRepository.search({ category: careerName, limit: 500, offset: 0, excludeSynthetic: true }),
    jobRepository.countPostings({ category: careerName, onlySynthetic: true }),
  ]);
  const career = await careerService.getCareerDetail(careerName);

  const locationCounts = {};
  const skillsSeen = new Set();
  for (const p of postings) {
    if (p.location) locationCounts[p.location] = (locationCounts[p.location] || 0) + 1;
    for (const skill of career.skills || []) {
      if (`${p.title} ${p.description}`.toLowerCase().includes(skill.toLowerCase())) skillsSeen.add(skill);
    }
  }
  const topLocation = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const avgSkillsPerJob = postings.length ? skillsSeen.size / postings.length : 0;

  const insight = {
    career_category: careerName,
    total_jobs: postings.length,
    unique_skills: skillsSeen.size,
    avg_skills_per_job: Math.round(avgSkillsPerJob * 100) / 100,
    top_location: topLocation,
    // job_growth/salary_range are curated reference values from the
    // career dataset, never derived from postings — kept clearly
    // separate from the observed counts above.
    analysis_data: { job_growth: career.job_growth, salary_range: career.salary_range },
  };

  if (postings.length) {
    await jobRepository.upsertMarketInsight(insight);
  }

  return { ...insight, ...provenance(postings.length, syntheticExcluded) };
}

async function emergingSkills(careerName, topN = 10) {
  const result = await computeSkillDemandForCareer(careerName);
  return {
    ...provenance(result.postings_analyzed, result.synthetic_postings_excluded),
    emerging_skills: result.skill_demand.slice(0, topN),
  };
}

module.exports = { computeSkillDemandForCareer, marketInsights, emergingSkills };
