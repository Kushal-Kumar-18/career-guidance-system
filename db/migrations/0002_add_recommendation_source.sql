-- Adds tracking of which candidate-profile source produced a given
-- recommendation (manual profile, uploaded resume, resume builder, or a
-- merge of these) — see backend/src/services/recommendationService.js
-- and candidateProfileService.js.
--
-- Additive, backward-compatible: nullable-with-default, so a backend
-- still on the previous version keeps working against this schema
-- unchanged (existing INSERTs simply omit the column and get the
-- default).

ALTER TABLE recommendation_history
  ADD COLUMN IF NOT EXISTS source VARCHAR(30) NOT NULL DEFAULT 'profile';
