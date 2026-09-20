-- Analysis Run Isolation.
--
-- Adds the "one analysis run -> one immutable candidate snapshot -> one
-- recommendation set" invariant to recommendation_history — see
-- backend/src/services/recommendationService.js (generate/submitFeedback)
-- and backend/src/repositories/recommendationRepository.js.
--
-- analysis_run_id groups the rows written by a single
-- recommendationService.generate() call (one row per recommended
-- career), so a set of recommendations can be told apart from a
-- different analysis run for the same user, even when they share the
-- same `source`.
--
-- candidate_snapshot stores the EXACT candidate evidence used to
-- produce that run: which source it came from, the canonical
-- education/skills/interests/experience/certifications/projects that
-- were sent to the ML service, and which verified_skills (if any) were
-- included. This is what closes two leaks:
--   1. Verified-skill isolation: previously, account-level verified
--      skills were fetched and sent for every recommendation request
--      regardless of source, so a brand-new resume-upload analysis
--      could be silently influenced by skills verified long before that
--      resume existed. The candidate_snapshot now records, per run,
--      exactly which verified skills (if any) were actually used.
--   2. Feedback provenance: previously, submitting feedback on an old
--      recommendation re-derived the candidate profile from the
--      account's CURRENT profile row, so a newer analysis (a different
--      resume, an edited profile) could leak into feedback about an
--      older recommendation. Feedback now reconstructs the candidate
--      profile from the specific recommendation's own candidate_snapshot.
--
-- Additive, backward-compatible: both columns are nullable with no
-- default, so a backend still on the previous version keeps working
-- against this schema unchanged (existing INSERTs simply omit them and
-- get NULL); recommendationService.submitFeedback falls back to the
-- pre-fix behavior (rebuild from current profile) for any row where
-- candidate_snapshot is NULL, so pre-migration history keeps working.
--
-- pgcrypto (for gen_random_uuid()) is already enabled by
-- 0001_baseline.sql / db/schema.sql; analysis_run_id itself is always
-- generated application-side (crypto.randomUUID() in
-- recommendationService.js) rather than by a column default, so no
-- DEFAULT expression is needed here.

ALTER TABLE recommendation_history
  ADD COLUMN IF NOT EXISTS analysis_run_id UUID,
  ADD COLUMN IF NOT EXISTS candidate_snapshot JSONB;

CREATE INDEX IF NOT EXISTS idx_recommendation_history_analysis_run
  ON recommendation_history(analysis_run_id);
