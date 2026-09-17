const { query } = require('../config/db');

// Postings whose `source` is in this list were not observed in the real
// job market — they're representative rows synthesized from the curated
// career dataset when the Adzuna API is unconfigured or unreachable (see
// services/jobService.js `fallbackPostings`). They are fine to SHOW in
// the jobs browser, where they are clearly labeled, but they must never
// be counted as market demand: doing so would turn "we had no live data"
// into a confident-looking skill-demand percentage derived from our own
// dataset. Analytics callers pass { excludeSynthetic: true }.
const SYNTHETIC_SOURCES = ['estimated'];

async function upsertPostings(postings) {
  let count = 0;
  for (const p of postings) {
    await query(
      `INSERT INTO job_postings (title, company, location, description, salary_min, salary_max, contract_type, source, url, career_category)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (title, company, location) DO UPDATE SET
         description = EXCLUDED.description,
         salary_min = EXCLUDED.salary_min,
         salary_max = EXCLUDED.salary_max,
         fetched_date = now()`,
      [
        p.title,
        p.company,
        p.location,
        p.description,
        p.salary_min,
        p.salary_max,
        p.contract_type,
        p.source,
        p.url,
        p.career_category,
      ]
    );
    count += 1;
  }
  return count;
}

async function search({ category, location, limit = 20, offset = 0, excludeSynthetic = false }) {
  const conditions = [];
  const params = [];
  if (category) {
    params.push(`%${category}%`);
    conditions.push(`career_category ILIKE $${params.length}`);
  }
  if (location) {
    params.push(`%${location}%`);
    conditions.push(`location ILIKE $${params.length}`);
  }
  if (excludeSynthetic) {
    params.push(SYNTHETIC_SOURCES);
    // `source` is nullable on older rows; NOT IN would drop NULLs, so
    // treat a missing source as "not known to be synthetic" and keep it.
    conditions.push(`(source IS NULL OR source <> ALL($${params.length}::text[]))`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit);
  params.push(offset);
  const { rows } = await query(
    `SELECT * FROM job_postings ${where} ORDER BY fetched_date DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
}

async function upsertSkillDemand(rowsIn) {
  for (const r of rowsIn) {
    await query(
      `INSERT INTO skill_demand (skill_name, demand_count, percentage, career_category, date_recorded)
       VALUES ($1,$2,$3,$4, CURRENT_DATE)
       ON CONFLICT (skill_name, career_category, date_recorded) DO UPDATE SET
         demand_count = EXCLUDED.demand_count,
         percentage = EXCLUDED.percentage`,
      [r.skill_name, r.demand_count, r.percentage, r.career_category]
    );
  }
}

async function topSkillDemand(category, limit = 15) {
  const { rows } = await query(
    `SELECT skill_name, demand_count, percentage FROM skill_demand
     WHERE ($1::text IS NULL OR career_category = $1)
     ORDER BY date_recorded DESC, demand_count DESC LIMIT $2`,
    [category ?? null, limit]
  );
  return rows;
}

async function upsertMarketInsight(insight) {
  const { rows } = await query(
    `INSERT INTO market_insights (career_category, total_jobs, unique_skills, avg_skills_per_job, top_location, analysis_data)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [
      insight.career_category,
      insight.total_jobs,
      insight.unique_skills,
      insight.avg_skills_per_job,
      insight.top_location,
      JSON.stringify(insight.analysis_data ?? {}),
    ]
  );
  return rows[0];
}

async function latestMarketInsight(category) {
  const { rows } = await query(
    `SELECT * FROM market_insights WHERE career_category = $1 ORDER BY created_at DESC LIMIT 1`,
    [category]
  );
  return rows[0] || null;
}

// Optional filter object so analytics can report real vs synthetic
// volume separately. Called with no arguments it keeps its original
// behaviour (count everything).
async function countPostings({ category, onlySynthetic = false, excludeSynthetic = false } = {}) {
  const conditions = [];
  const params = [];
  if (category) {
    params.push(`%${category}%`);
    conditions.push(`career_category ILIKE $${params.length}`);
  }
  if (onlySynthetic) {
    params.push(SYNTHETIC_SOURCES);
    conditions.push(`source = ANY($${params.length}::text[])`);
  } else if (excludeSynthetic) {
    params.push(SYNTHETIC_SOURCES);
    conditions.push(`(source IS NULL OR source <> ALL($${params.length}::text[]))`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await query(`SELECT COUNT(*)::int AS count FROM job_postings ${where}`, params);
  return rows[0].count;
}

module.exports = {
  SYNTHETIC_SOURCES,
  upsertPostings,
  search,
  upsertSkillDemand,
  topSkillDemand,
  upsertMarketInsight,
  latestMarketInsight,
  countPostings,
};
