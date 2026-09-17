const { query } = require('../config/db');

async function insertMany(userId, predictions, source = 'profile') {
  const inserted = [];
  for (const p of predictions) {
    const { rows } = await query(
      `INSERT INTO recommendation_history (user_id, career_name, match_score, skill_gaps, recommended_courses, source)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userId,
        p.career,
        Math.round(p.confidence ?? 0),
        JSON.stringify(p.skill_gaps ?? []),
        JSON.stringify(p.courses ?? []),
        source,
      ]
    );
    inserted.push(rows[0]);
  }
  return inserted;
}

async function listByUser(userId, limit = 50) {
  const { rows } = await query(
    `SELECT * FROM recommendation_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return rows;
}

// Guards against the duplicate-history problem: generating
// recommendations twice in quick succession from an unchanged profile
// (a double-submit, a slow network causing a repeat click, or a
// navigation effect firing twice) produced a whole new set of identical
// rows every time, even though nothing about the recommendation actually
// changed. This looks for a same-source batch, from the same user,
// created within `windowSeconds`, whose (career, rounded score) set is
// identical to what's about to be inserted — and if found, that existing
// batch is reused instead of writing duplicates.
//
// The window is short and the comparison exact on purpose: a
// recommendation regenerated hours or days later, or with a different
// result, is a genuinely new data point worth its own history entry
// (e.g. "recommended again after I updated my profile" is meaningful),
// so this only collapses true near-instant repeats, not legitimate
// re-runs.
async function findRecentIdenticalBatch(userId, source, predictions, windowSeconds = 20) {
  if (!predictions.length) return null;

  const { rows } = await query(
    `SELECT * FROM recommendation_history
     WHERE user_id = $1 AND source = $2 AND created_at > now() - ($3 || ' seconds')::interval
     ORDER BY created_at DESC
     LIMIT $4`,
    [userId, source, windowSeconds, predictions.length]
  );

  if (rows.length !== predictions.length) return null;

  const toKey = (career, score) => `${String(career).trim().toLowerCase()}|${Math.round(score ?? 0)}`;
  const existingKeys = new Set(rows.map((r) => toKey(r.career_name, r.match_score)));
  const incomingKeys = new Set(predictions.map((p) => toKey(p.career, p.confidence)));

  if (existingKeys.size !== incomingKeys.size) return null;
  for (const key of incomingKeys) {
    if (!existingKeys.has(key)) return null;
  }

  // Rows came back newest-first; restore the original ranking order so
  // callers see #1 match first, matching what insertMany would produce.
  const bySortedRank = predictions.map((p) =>
    rows.find((r) => toKey(r.career_name, r.match_score) === toKey(p.career, p.confidence))
  );
  return bySortedRank;
}

// Ownership/provenance check for feedback (see
// services/recommendationService.submitFeedback): did THIS user actually
// receive a recommendation for THIS career? Compared case-insensitively
// on the trimmed name because the client echoes back the displayed
// career string. Returns the most recent matching row, or null.
async function findLatestForUserAndCareer(userId, careerName) {
  const { rows } = await query(
    `SELECT * FROM recommendation_history
     WHERE user_id = $1 AND lower(btrim(career_name)) = lower(btrim($2))
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId, careerName]
  );
  return rows[0] || null;
}

module.exports = { insertMany, listByUser, findLatestForUserAndCareer, findRecentIdenticalBatch };
