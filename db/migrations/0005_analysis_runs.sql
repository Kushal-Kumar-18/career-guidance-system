-- Analysis Run as a first-class entity, and candidate fingerprinting for
-- dedup/identity (master prompt sections B, C, E).
--
-- Why this migration exists on top of 0004_analysis_run_isolation.sql:
-- 0004 gave every recommendation_history row an analysis_run_id and a
-- candidate_snapshot, but the "analysis run" itself was never a row
-- anywhere — it was only ever an ID value shared by N recommendation_
-- history rows. That meant:
--   - engine_version / dataset_version / the candidate_fingerprint used
--     for identity were either not recorded at all, or would have had
--     to be duplicated onto every single recommendation_history row for
--     one run (denormalized N times instead of stored once).
--   - There was nowhere to record run-level status (e.g. a run that
--     produced zero results after MIN_FIT_SCORE_TO_SHOW filtering) or a
--     request-level idempotency key independent of recommendation rows.
--
-- analysis_runs is that first-class row: one per real
-- recommendationService.generate() call (or one reused across duplicate
-- calls that collapse into it — see recommendationRepository.generateBatch).
-- recommendation_history.analysis_run_id now has a real row to point at.
--
-- candidate_fingerprint is added to BOTH analysis_runs (authoritative)
-- and recommendation_history (denormalized, indexed) so the dedupe path
-- in recommendationRepository can filter on it directly without a join —
-- see that file for why "user + source + time window + result" alone is
-- not a safe dedupe key (two different candidates can produce identical
-- top results and must NOT be collapsed into one run).
--
-- Additive and backward-compatible: recommendation_history's new column
-- is nullable, so a row inserted by application code still on the
-- previous version simply omits it (no default needed — the column's
-- absence is meaningful: "written before fingerprinting existed", same
-- convention as analysis_run_id/candidate_snapshot in 0004). No existing
-- data is backfilled or fabricated a fingerprint it never had.

CREATE TABLE IF NOT EXISTS analysis_runs (
    id                    UUID PRIMARY KEY,
    user_id               INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source                VARCHAR(30) NOT NULL,
    -- Nullable, not NOT NULL: a future backfill of pre-existing
    -- recommendation_history.analysis_run_id groups (from 0004, before
    -- this migration existed) has no recorded fingerprint to put here —
    -- inventing one would misrepresent history. Every run written by the
    -- CURRENT application code always sets this (see
    -- recommendationRepository.generateBatch) — the column is only
    -- nullable to honestly represent runs that predate fingerprinting.
    candidate_fingerprint TEXT,
    candidate_snapshot    JSONB NOT NULL,
    engine_version        VARCHAR(100),
    dataset_version       VARCHAR(100),
    requested_top_k       INTEGER,
    result_hash           TEXT,
    status                VARCHAR(20) NOT NULL DEFAULT 'completed',
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The dedupe/identity lookup pattern is always "this user's runs for
-- this source, most recent first" (optionally filtered further by
-- candidate_fingerprint in application code) — see
-- recommendationRepository.findRecentIdenticalBatchTx.
CREATE INDEX IF NOT EXISTS idx_analysis_runs_user_source_created
  ON analysis_runs(user_id, source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_fingerprint
  ON analysis_runs(user_id, candidate_fingerprint, created_at DESC);

CREATE TRIGGER trg_analysis_runs_updated_at
BEFORE UPDATE ON analysis_runs
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- recommendation_history keeps its own analysis_run_id (0004) so
-- existing NULL legacy rows and existing queries are untouched; this FK
-- just makes the relationship real now that analysis_runs exists.
--
-- NOT VALID is required, not optional, here: analysis_runs is a brand
-- new, empty table, while recommendation_history may already contain
-- non-NULL analysis_run_id values written under 0004 (which had no
-- parent table to reference). A validating ADD CONSTRAINT would scan
-- the whole table and FAIL on every environment that already has such
-- rows. NOT VALID adds the constraint for all NEW/updated rows
-- immediately (the guarantee this phase actually needs going forward)
-- without requiring a backfill of analysis_runs for historical data —
-- fabricating historical analysis_runs rows (a fingerprint/engine/
-- dataset version that was never recorded) would misrepresent history,
-- the same reasoning 0004 already applied to analysis_run_id itself.
-- Run `ALTER TABLE recommendation_history VALIDATE CONSTRAINT
-- fk_recommendation_history_analysis_run;` later once/if historical
-- analysis_run_id values are confirmed to either be NULL or backfilled.
ALTER TABLE recommendation_history
  ADD CONSTRAINT fk_recommendation_history_analysis_run
  FOREIGN KEY (analysis_run_id) REFERENCES analysis_runs(id) ON DELETE SET NULL
  NOT VALID;

ALTER TABLE recommendation_history
  ADD COLUMN IF NOT EXISTS candidate_fingerprint TEXT;

CREATE INDEX IF NOT EXISTS idx_recommendation_history_fingerprint
  ON recommendation_history(user_id, source, candidate_fingerprint, created_at DESC);
