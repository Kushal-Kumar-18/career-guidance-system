# Data Migration Notes (SQLite → PostgreSQL)

## Context
The legacy application's SQLite tables were not included in the Phase 1
handoff (only the trained ML model, the 148-career dataset, and a schema
inferred from the described legacy `database.py` structure were
provided). This means there is no legacy `.sqlite` file in this repo to
migrate data *from* — `db/schema.sql` is a **clean-room PostgreSQL
schema** designed to match the entities described in the architecture
document (section 10), not a line-for-line port of an existing SQLite
DDL.

## What's implemented
- `db/schema.sql` — full normalized PostgreSQL schema: users, profiles,
  recommendation_history, activity_logs, saved_careers, skill_tests,
  test_questions, skill_test_results, resumes, game_results,
  job_postings, skill_demand, market_insights. Primary keys, foreign
  keys, indexes, constraints, and timestamps throughout, plus an
  `updated_at` trigger.
- `db/seeds/dev_seed.sql` — one synthetic demo user + profile for local
  development. No real/production data.

## If you have the original SQLite database
Phase 1 already shipped `db/migrate_sqlite_to_postgres.py` for this —
use it rather than writing a new migration:

```bash
pip install psycopg2-binary
export DATABASE_URL=postgresql://user:pass@localhost:5432/career_guidance
psql "$DATABASE_URL" -f db/schema.sql        # schema first
python db/migrate_sqlite_to_postgres.py path/to/career_guidance.db
```

It handles the known column renames (`users.password` →
`password_hash`, `profiles.experience` → `experience_years`, etc.),
upserts users/profiles idempotently, and preserves existing bcrypt
password hashes as-is (the new backend also verifies with bcrypt, so no
rehash/reset is needed). It is **append-only** for history/log tables —
don't run it twice against the same target without truncating first.

After loading, validate with the checklist below.

## Migration validation checklist (section 12)
- [ ] Row counts per table match between SQLite source and Postgres target
- [ ] Foreign key integrity holds (no orphaned `profiles.user_id`, etc.)
- [ ] Spot-check 5-10 users' profile + skill-test + recommendation data
      renders correctly through the API
- [ ] No production credentials or PII were committed to seed files
