-- Feedback provenance (master prompt Phase 2 section A) + duplicate-
-- feedback semantics.
--
-- Prerequisite fact this migration relies on: the ML service and the
-- backend share ONE Postgres database (see docker-compose.yml /
-- docker-compose.prod.yml — both point FEEDBACK_DATABASE_URL and
-- DATABASE_URL at the same `postgres` service / `career_guidance` db).
-- That means ml_feedback (0003_ml_feedback.sql) and
-- recommendation_history/analysis_runs (0004/0005) can be linked with a
-- real foreign key rather than an unenforced convention.
--
-- Before this migration, a feedback row only recorded (career, rating,
-- user_profile) — nothing tied it back to the EXACT recommendation,
-- analysis run, or the engine/dataset version that produced the
-- recommendation being rated. That made it impossible to later ask "what
-- was recommendation #482 exactly, that this rating refers to" or to
-- tell whether a rating was collected under scoring rules that have
-- since changed.
--
-- Additive and backward-compatible: every new column is nullable, so
-- existing ml_feedback rows (collected before this migration) are left
-- exactly as they are — not backfilled with fabricated provenance they
-- never had.

ALTER TABLE ml_feedback
  ADD COLUMN IF NOT EXISTS recommendation_id INTEGER REFERENCES recommendation_history(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS analysis_run_id    UUID REFERENCES analysis_runs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS career_id          TEXT,
  ADD COLUMN IF NOT EXISTS engine_version     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS dataset_version    VARCHAR(100);

-- Duplicate-feedback semantics: AT MOST ONE feedback row per
-- recommendation_id. A person can change their mind and re-rate the
-- same recommendation, so this is enforced as "latest rating wins"
-- (upsert on conflict — see PostgresFeedbackStore.append in
-- app/storage/feedback_store.py), not "reject the second submission".
-- A partial unique index (WHERE recommendation_id IS NOT NULL) is used
-- because legacy rows and any future feedback with no known
-- recommendation_id must NOT be treated as duplicates of each other —
-- multiple NULLs are fine, but multiple rows for the SAME real
-- recommendation_id are not.
CREATE UNIQUE INDEX IF NOT EXISTS uq_ml_feedback_recommendation_id
  ON ml_feedback(recommendation_id)
  WHERE recommendation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ml_feedback_analysis_run ON ml_feedback(analysis_run_id);

-- Backend-side mirror of "this recommendation has been rated" (separate
-- from the ml_feedback row above, which lives in a table the backend
-- doesn't otherwise query): lets ownership-scoped reads/writes of
-- feedback state stay entirely within recommendation_history, and lets
-- the backend enforce/report duplicate semantics without a cross-table
-- join into ml_feedback for every history read. Same "latest wins"
-- policy: submitting feedback again for the same recommendation_id
-- UPDATEs these two columns in place rather than erroring.
ALTER TABLE recommendation_history
  ADD COLUMN IF NOT EXISTS feedback_rating       SMALLINT CHECK (feedback_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS feedback_submitted_at TIMESTAMPTZ;
