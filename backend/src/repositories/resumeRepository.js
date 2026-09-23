const { query } = require('../config/db');

async function upsert(userId, fields) {
  const {
    phone = null,
    summary = null,
    institution = null,
    graduation_year = null,
    experience_json = [],
    // Resume Builder personal-info fields (section 1) -- see
    // db/migrations/0008_resume_builder_sections.sql.
    full_name = null,
    headline = null,
    location = null,
    linkedin_url = null,
    github_url = null,
    portfolio_url = null,
    // Repeatable sections (3/5/6/7/8), same JSONB-array convention
    // already established by experience_json.
    education_json = [],
    internships_json = [],
    projects_json = [],
    certifications_json = [],
  } = fields;

  const { rows } = await query(
    `INSERT INTO resumes (
       user_id, phone, summary, institution, graduation_year, experience_json,
       full_name, headline, location, linkedin_url, github_url, portfolio_url,
       education_json, internships_json, projects_json, certifications_json
     )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     ON CONFLICT (user_id) DO UPDATE SET
       phone = EXCLUDED.phone,
       summary = EXCLUDED.summary,
       institution = EXCLUDED.institution,
       graduation_year = EXCLUDED.graduation_year,
       experience_json = EXCLUDED.experience_json,
       full_name = EXCLUDED.full_name,
       headline = EXCLUDED.headline,
       location = EXCLUDED.location,
       linkedin_url = EXCLUDED.linkedin_url,
       github_url = EXCLUDED.github_url,
       portfolio_url = EXCLUDED.portfolio_url,
       education_json = EXCLUDED.education_json,
       internships_json = EXCLUDED.internships_json,
       projects_json = EXCLUDED.projects_json,
       certifications_json = EXCLUDED.certifications_json,
       last_updated = now()
     RETURNING *`,
    [
      userId, phone, summary, institution, graduation_year, JSON.stringify(experience_json),
      full_name, headline, location, linkedin_url, github_url, portfolio_url,
      JSON.stringify(education_json), JSON.stringify(internships_json),
      JSON.stringify(projects_json), JSON.stringify(certifications_json),
    ]
  );
  return rows[0];
}

async function findByUserId(userId) {
  const { rows } = await query(`SELECT * FROM resumes WHERE user_id = $1`, [userId]);
  return rows[0] || null;
}

async function updateAtsScore(userId, score) {
  await query(`UPDATE resumes SET ats_score = $2, last_updated = now() WHERE user_id = $1`, [userId, score]);
}

module.exports = { upsert, findByUserId, updateAtsScore };
