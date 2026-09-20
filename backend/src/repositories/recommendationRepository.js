const { query, withTransaction, queryWith } = require('../config/db');

// Shared insert logic used by both the simple, non-atomic `insertMany`
// and the guarded `generateBatch` path -- `runQuery` is either the pool
// (`query`) or a transaction-bound query function.
async function insertRows(runQuery, userId, predictions, source, analysisRunId, candidateSnapshot, candidateFingerprint) {
  const inserted = [];
  const snapshotJson = candidateSnapshot === undefined ? null : JSON.stringify(candidateSnapshot);
  for (const p of predictions) {
    const { rows } = await runQuery(
      `INSERT INTO recommendation_history
         (user_id, career_name, match_score, skill_gaps, recommended_courses, source, analysis_run_id, candidate_snapshot, candidate_fingerprint)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        userId,
        p.career,
        Math.round(p.confidence ?? 0),
        JSON.stringify(p.skill_gaps ?? []),
        JSON.stringify(p.courses ?? []),
        source,
        analysisRunId || null,
        snapshotJson,
        candidateFingerprint || null,
      ]
    );
    inserted.push(rows[0]);
  }
  return inserted;
}

// Writes the ONE analysis_runs row for a real (non-reused) generate()
// call -- see db/migrations/0005_analysis_runs.sql for why this is a
// first-class row rather than only an ID shared across
// recommendation_history rows: it's the one place engine_version,
// dataset_version, and the candidate_fingerprint used for identity are
// recorded ONCE per run instead of duplicated onto every result row.
async function insertAnalysisRun(
  runQuery,
  { analysisRunId, userId, source, candidateFingerprint, candidateSnapshot, engineVersion, datasetVersion, topK }
) {
  await runQuery(
    `INSERT INTO analysis_runs
       (id, user_id, source, candidate_fingerprint, candidate_snapshot, engine_version, dataset_version, requested_top_k, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'completed')`,
    [
      analysisRunId,
      userId,
      source,
      candidateFingerprint,
      JSON.stringify(candidateSnapshot || {}),
      engineVersion || null,
      datasetVersion || null,
      topK || null,
    ]
  );
}

// Simple, non-atomic entry point -- writes rows directly against the
// pool with no locking and no duplicate check. Kept for callers that
// don't need the guarantees `generateBatch` provides (e.g. tests,
// one-off scripts). The recommendation-generation flow itself must go
// through `generateBatch`, not this function directly.
async function insertMany(userId, predictions, source = 'profile', analysisRunId = null, candidateSnapshot = null, candidateFingerprint = null) {
  return insertRows(query, userId, predictions, source, analysisRunId, candidateSnapshot, candidateFingerprint);
}

async function listByUser(userId, limit = 50) {
  const { rows } = await query(
    `SELECT * FROM recommendation_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return rows;
}

// Guards against the duplicate-history problem: generating
// recommendations twice in quick succession from an UNCHANGED candidate
// (a double-submit, a slow network causing a repeat click, or a
// navigation effect firing twice) produced a whole new set of identical
// rows every time, even though nothing about the recommendation actually
// changed. This looks for a same-source, same-CANDIDATE batch, from the
// same user, created within `windowSeconds`, whose (career, rounded
// score) set is identical to what's about to be inserted -- and if
// found, that existing batch is reused instead of writing duplicates.
//
// candidateFingerprint is REQUIRED and checked FIRST, before the result
// comparison (master prompt section E): "user + source + time window +
// result" alone is not a safe dedupe key, because two DIFFERENT
// candidates (e.g. two different resumes analyzed back to back) can
// legitimately produce the exact same top-K careers/scores -- that must
// NOT collapse into one run. Only rows whose candidate_fingerprint
// matches the incoming candidate are even considered as dedupe
// candidates; a fingerprint mismatch always falls through to inserting a
// new, separate analysis run regardless of how similar the results look.
//
// The window is short and the comparison exact on purpose: a
// recommendation regenerated hours or days later, or with a different
// result, is a genuinely new data point worth its own history entry
// (e.g. "recommended again after I updated my profile" is meaningful),
// so this only collapses true near-instant repeats of the SAME
// candidate, not legitimate re-runs or different candidates.
//
// IMPORTANT: on its own, this check is a classic read-then-write race --
// two near-simultaneous callers can both run this SELECT, both see
// nothing yet (because neither has committed an INSERT), and both go on
// to insert. That is exactly how two ~1ms-apart duplicate analysis runs
// were produced in production. This function must only ever be called
// from inside `generateBatch`, which closes that race with a per-user
// advisory lock held for the duration of the check + insert.
async function findRecentIdenticalBatchTx(runQuery, userId, source, predictions, candidateFingerprint, windowSeconds) {
  if (!predictions.length) return null;
  // A run with no recorded fingerprint (fingerprinting not wired up by
  // this caller) can never safely be matched against anything else --
  // there is nothing to compare -- so it always creates a new run rather
  // than silently falling back to the pre-fingerprint "result content
  // only" comparison this fixes.
  if (!candidateFingerprint) return null;

  const { rows } = await runQuery(
    `SELECT * FROM recommendation_history
     WHERE user_id = $1 AND source = $2 AND candidate_fingerprint = $3
       AND created_at > now() - ($4 || ' seconds')::interval
     ORDER BY created_at DESC
     LIMIT $5`,
    [userId, source, candidateFingerprint, windowSeconds, predictions.length]
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
  // callers see #1 match first, matching what insertRows would produce.
  return predictions.map((p) =>
    rows.find((r) => toKey(r.career_name, r.match_score) === toKey(p.career, p.confidence))
  );
}

// Standalone, non-locked version of the check above. Exported for
// read-only/diagnostic use only (e.g. "would this be treated as a
// duplicate right now") -- the generation flow itself must use
// `generateBatch`, not this function, or it reintroduces the race.
async function findRecentIdenticalBatch(userId, source, predictions, candidateFingerprint, windowSeconds = 20) {
  return findRecentIdenticalBatchTx(query, userId, source, predictions, candidateFingerprint, windowSeconds);
}

// -----------------------------------------------------------------------
// The ONE write path for "one logical generate() call produces exactly
// one analysis run" (root cause of the duplicate ~1ms-apart runs and of
// the unsafe deduplication observed in production).
//
// Runs inside a single DB transaction that first takes a Postgres
// advisory lock scoped to this user (`pg_advisory_xact_lock`, released
// automatically on COMMIT/ROLLBACK). Because the lock is held for the
// remainder of the transaction, a second call for the same user has to
// wait for the first to finish committing (or rolling back) before it
// can even run its own duplicate check -- so it always sees the first
// call's rows if they're identical, instead of racing it. That is what
// the previous code (a SELECT, then later and separately an INSERT, as
// two unsynchronized statements) could not guarantee.
//
// A real (non-reused) call writes ONE analysis_runs row plus one
// recommendation_history row per recommended career, all sharing that
// run's id and candidate_fingerprint -- so a later feedback lookup by
// row id (see `findByIdForUser`) can always reconstruct the right
// context, and different candidate contexts are never merged even when
// their results happen to be identical (see findRecentIdenticalBatchTx
// above).
// -----------------------------------------------------------------------
async function generateBatch({
  userId,
  source,
  predictions,
  analysisRunId,
  candidateSnapshot,
  candidateFingerprint,
  engineVersion,
  datasetVersion,
  topK,
  windowSeconds = 20,
}) {
  return withTransaction(async (client) => {
    const runQuery = (text, params) => queryWith(client, text, params);

    await runQuery('SELECT pg_advisory_xact_lock(hashtext($1))', [`recommendation-generate:${userId}`]);

    const existing = await findRecentIdenticalBatchTx(runQuery, userId, source, predictions, candidateFingerprint, windowSeconds);
    if (existing) {
      return { rows: existing, reused: true };
    }

    await insertAnalysisRun(runQuery, {
      analysisRunId,
      userId,
      source,
      candidateFingerprint,
      candidateSnapshot,
      engineVersion,
      datasetVersion,
      topK,
    });
    const rows = await insertRows(runQuery, userId, predictions, source, analysisRunId, candidateSnapshot, candidateFingerprint);
    return { rows, reused: false };
  });
}

// Ownership + exact-identity lookup for feedback (see
// services/recommendationService.submitFeedback): resolves the EXACT
// recommendation row a user is rating, scoped to their own user_id, by
// primary key -- never by career name. A name-based "most recent row for
// this user+career" lookup can silently resolve to a DIFFERENT analysis
// than the one the user was actually looking at when they rated it, any
// time the same career appears in more than one analysis run for that
// user. Returns null if the row doesn't exist OR belongs to a different
// user, so the caller can't distinguish "not found" from "not yours" --
// both are simply "you can't rate that".
async function findByIdForUser(userId, recommendationId) {
  const { rows } = await query(
    `SELECT * FROM recommendation_history WHERE id = $1 AND user_id = $2 LIMIT 1`,
    [recommendationId, userId]
  );
  return rows[0] || null;
}

// Retained for any other caller that still wants "most recent row for
// this user+career" (e.g. ad-hoc admin/debug lookups, analytics). No
// longer used by the feedback path -- see `findByIdForUser` above, which
// is what provenance-sensitive lookups must use instead.
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

// Backend-side mirror of "this recommendation has been rated" (section
// A / duplicate-feedback semantics) — same latest-wins policy as the
// ml_feedback unique index in db/migrations/0006_feedback_provenance.sql:
// re-submitting for the same recommendationId overwrites the previous
// rating rather than erroring or accumulating duplicate rows.
async function recordFeedback(recommendationId, rating) {
  await query(
    `UPDATE recommendation_history SET feedback_rating = $2, feedback_submitted_at = now() WHERE id = $1`,
    [recommendationId, rating]
  );
}

// Looks up the analysis_runs row a recommendation belongs to, so
// submitFeedback can forward the ORIGINAL engine_version/dataset_version
// (what was actually active when this recommendation was produced) as
// part of feedback provenance (section A) — not whatever the ML service
// considers "current" at the moment feedback happens to be submitted,
// which could be a later engine/dataset build entirely.
async function getAnalysisRun(analysisRunId) {
  if (!analysisRunId) return null;
  const { rows } = await query(`SELECT * FROM analysis_runs WHERE id = $1 LIMIT 1`, [analysisRunId]);
  return rows[0] || null;
}

module.exports = {
  insertMany,
  listByUser,
  findRecentIdenticalBatch,
  findLatestForUserAndCareer,
  findByIdForUser,
  generateBatch,
  recordFeedback,
  getAnalysisRun,
};
