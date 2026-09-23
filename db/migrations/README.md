# Migrations

Plain numbered SQL files, applied in order with `psql`. No migration
framework/runner is wired in yet — for a project this size, tracking
applied migrations by filename is enough; introduce a tool (e.g.
`node-pg-migrate`, Flyway, or Prisma Migrate) if this grows past a
handful of contributors or needs automatic rollback support.

## Current migrations

| File | Description |
|---|---|
| `0001_baseline.sql` | Full initial schema — identical to [`../schema.sql`](../schema.sql), tracked here as history's starting point. |
| `0002_add_recommendation_source.sql` | Adds `recommendation_history.source` (nullable-with-default) to track which candidate-profile source — manual profile, uploaded resume, resume builder, or merge — produced each recommendation. |
| `0003_ml_feedback.sql` | Adds `ml_feedback`, durable storage for the user ratings that train the feedback-calibration model. Previously these lived in a JSON file inside the ML container and were lost on container recreation. Additive; applied automatically-ish by the ML service too (it issues an idempotent `CREATE TABLE IF NOT EXISTS` on startup). |
| `0004_analysis_run_isolation.sql` | Adds `recommendation_history.analysis_run_id` + `candidate_snapshot` — groups the rows from one `generate()` call and freezes the exact candidate evidence that produced them. |
| `0005_analysis_runs.sql` | Promotes the analysis run to a first-class `analysis_runs` table (one row per `generate()` call, carrying `candidate_fingerprint`, `engine_version`, `dataset_version`, `status`) and adds `recommendation_history.candidate_fingerprint` for fingerprint-aware dedup. See `backend/src/repositories/recommendationRepository.js`. |
| `0006_feedback_provenance.sql` | Links `ml_feedback` to the exact `recommendation_history`/`analysis_runs` row it rates (recommendation_id, analysis_run_id, career_id, engine_version, dataset_version), enforces "at most one rating per recommendation_id" (partial unique index, latest wins), and adds `recommendation_history.feedback_rating`/`feedback_submitted_at` as the backend-side mirror. Requires `ml_feedback` and `recommendation_history` to live in the same database — see the migration file for why that's true here. |
| `0007_missing_indexes.sql` | Fixes real drift found by actually running the fresh-install and migration-chain paths side by side and diffing the resulting schemas: `idx_recommendation_history_user_source_created` was present in `db/schema.sql` but no migration had ever actually created it, so every database that reached its current state via the migration chain (rather than a fresh `schema.sql` init) was silently missing it. |
| `0008_resume_builder_sections.sql` | Adds Resume Builder personal-info columns (`full_name`, `headline`, `location`, `linkedin_url`, `github_url`, `portfolio_url`) and repeatable-section JSONB arrays (`education_json`, `internships_json`, `projects_json`, `certifications_json`) to `resumes`, following the existing `experience_json` convention. Scoped entirely to `resumes` — `profiles` (which feeds the recommendation engine/ATS) is untouched. |

## Applying migrations

**New database:**

```bash
createdb career_guidance
psql career_guidance -f db/migrations/0001_baseline.sql
```

(Equivalently, `psql career_guidance -f db/schema.sql` — same effect,
used by the quick-start in the README/SETUP.md. Run one or the other,
never both.)

**Existing database, adding a new migration later:** create the next
file as `000N_description.sql` (e.g. `0002_add_game_sessions.sql`),
containing only the incremental `ALTER TABLE` / `CREATE TABLE`
statements needed, then:

```bash
psql career_guidance -f db/migrations/000N_description.sql
```

## Conventions for future migrations

- One logical change per file — don't bundle unrelated schema changes.
- Prefer additive, backward-compatible changes (`ADD COLUMN ... NULL`,
  new tables) over destructive ones where possible, so a running
  backend on the previous schema version doesn't immediately break.
- If a column is renamed or dropped, do it in two migrations across two
  deploys (add new / dual-write, then remove old) rather than one, for
  zero-downtime deploys.
- Keep [`../schema.sql`](../schema.sql) as the canonical "fresh install"
  snapshot in sync with the cumulative effect of all migration files —
  update it whenever a new migration is added, so a brand-new local
  setup via `db/schema.sql` still matches production.
