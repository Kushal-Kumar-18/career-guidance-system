# Database

PostgreSQL 16. Full DDL: [`db/schema.sql`](../db/schema.sql). Baseline
migration: [`db/migrations/0001_baseline.sql`](../db/migrations/0001_baseline.sql)
(same content, tracked as a migration — see that folder's README for
how to add the next one).

## Entities

### Auth / profile

| Table | Purpose |
|---|---|
| `users` | Account, bcrypt `password_hash`, `role` (`user`/`admin`) |
| `profiles` | One-to-one with `users`; education, skills (delimited text), interests, experience, certifications, projects, location, salary expectation |
| `activity_logs` | Generic audit trail of user actions |

### Recommendations & careers

| Table | Purpose |
|---|---|
| `recommendation_history` | Each ML recommendation run: career, match score, skill gaps (JSONB), recommended courses (JSONB), and which candidate-profile `source` (`profile`/`resume_builder`/`resume_upload`/`merge`) produced it — see [`0002_add_recommendation_source.sql`](../db/migrations/0002_add_recommendation_source.sql) |
| `saved_careers` | User bookmarks, unique per `(user_id, career_name)` |

### Skill verification

| Table | Purpose |
|---|---|
| `skill_tests` | A generated quiz: skill, difficulty, question count, status |
| `test_questions` | Questions belonging to a `skill_tests` row, options as JSONB, correct answer index |
| `skill_test_results` | Scored outcome per test: score, percentage, proficiency level, answers (JSONB) |

### Resume / ATS

| Table | Purpose |
|---|---|
| `resumes` | One-to-one with `users`; phone, summary, institution, graduation year, experience (JSONB), last computed ATS score |

### Gamification

| Table | Purpose |
|---|---|
| `game_results` | Scenario simulation outcomes: performance/stress/learning scores, level, badges |

### Job market / trends

| Table | Purpose |
|---|---|
| `job_postings` | Cached postings (Adzuna or labeled estimates), unique per `(title, company, location)` |
| `skill_demand` | Per-skill demand counts/percentages by category and date |
| `skill_trends` | 7/30/90-day trend deltas per skill |
| `location_demand` | Demand + average salary per `(location, skill, category, date)` |
| `market_insights` | Aggregated per-category stats (total jobs, unique skills, top location) |

> `job_postings.source` distinguishes real observed postings (`adzuna`)
> from representative rows synthesized from the curated career dataset
> when the job API is unconfigured (`estimated`). **Only real postings
> feed `skill_demand` and `market_insights`** — counting synthesized rows
> as demand would make the "market" echo back our own dataset. See
> `backend/src/services/trendService.js` and
> `jobRepository.SYNTHETIC_SOURCES`.

### ML feedback

| Table | Purpose |
|---|---|
| `ml_feedback` | User ratings (1-5) of recommendations they actually received, plus the profile snapshot at rating time — the only training data the feedback-calibration model ever sees. Written by the Python ML service when `FEEDBACK_STORE=postgres`. See [`0003_ml_feedback.sql`](../db/migrations/0003_ml_feedback.sql) |

Two notes on `ml_feedback`, both deliberate:

- **No `user_id` / foreign key.** The backend verifies that the rating
  refers to one of that user's own `recommendation_history` rows *before*
  forwarding it, and the model only needs the profile shape — so keeping
  identity out of the training store limits the personal data in it. It
  is therefore the one table not cleaned up by user deletion, by design.
- **Raw snapshots, not feature vectors.** Features are recomputed against
  the current career dataset on every retrain, so improving the dataset
  or the scorer retroactively improves the model.

## Relationships

Every user-scoped table has `user_id INTEGER REFERENCES users(id) ON
DELETE CASCADE` — deleting a user cleans up their profile, saved
careers, resumes, test history, game results, and recommendation
history automatically. `test_questions` cascades from `skill_tests`.
(`ml_feedback` is intentionally excluded — see the note above.)

## Indexes

Foreign-key columns used in lookups (`user_id` on most tables,
`career_category` on job-market tables, `skill_name` where queried
directly) are indexed — see the `CREATE INDEX` statements in
`schema.sql`. `profiles.updated_at` is kept current via a trigger
(`touch_updated_at()`) since Postgres has no `ON UPDATE
CURRENT_TIMESTAMP` shorthand.

## JSONB usage

`recommendation_history.skill_gaps` / `.recommended_courses`,
`test_questions.options`, `skill_test_results.answers`, `resumes.experience_json`,
and `market_insights.analysis_data` are JSONB — structured data that's
read/written as a unit by the application layer rather than queried
column-by-column, so JSONB (flexible, no migration needed to add a
field) was preferred over normalizing into more tables.

## Migrating existing SQLite data

If you have the legacy application's SQLite database file, use
`db/migrate_sqlite_to_postgres.py` rather than hand-writing SQL — it
handles known column renames (`users.password` → `password_hash`,
`profiles.experience` → `experience_years`) and preserves existing
bcrypt hashes. Full instructions and a validation checklist are in
[`db/MIGRATION_NOTES.md`](../db/MIGRATION_NOTES.md).

## Seeding

`db/seeds/dev_seed.sql` inserts one synthetic demo user
(`demo@example.com` / `password123`) with a filled-out profile — for
local development only, never run against a shared or production
database.
