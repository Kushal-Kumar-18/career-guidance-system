-- Fixes real drift discovered by actually running BOTH database paths
-- side by side and diffing the resulting schemas (master prompt Phase 2
-- section I item 8/9): a fresh database (db/schema.sql, what Docker's
-- postgres init script runs) has always included
-- idx_recommendation_history_user_source_created — but no migration
-- file ever actually issued the CREATE INDEX for it. Any database that
-- reached its current state by applying migrations 0001-0006 in order
-- (i.e. every real upgraded production database) is therefore silently
-- missing this index, even though schema.sql implies it should exist.
--
-- Impact: recommendationRepository's dedupe/history queries filter on
-- exactly (user_id, source, created_at) — see
-- findRecentIdenticalBatchTx and listByUser — so a database missing
-- this index falls back to a sequential scan of recommendation_history
-- for those queries as the table grows.
--
-- IF NOT EXISTS makes this safe to run whether or not a given database
-- already has the index (e.g. one that started from a schema.sql-based
-- fresh init already has it, and this becomes a no-op there).

CREATE INDEX IF NOT EXISTS idx_recommendation_history_user_source_created
  ON recommendation_history(user_id, source, created_at DESC);
