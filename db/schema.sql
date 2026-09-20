-- =====================================================================
-- Career Guidance System — PostgreSQL schema
-- Translated 1:1 in concept from the existing SQLite schema in
-- database.py and job_database.py, with proper types/constraints/indexes
-- added per section 10 of the architecture doc.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid(), if needed later

-- ---------------------------------------------------------------------
-- Core auth / profile (from database.py)
-- ---------------------------------------------------------------------

CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(64)  NOT NULL UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT         NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'user',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    last_login    TIMESTAMPTZ
);

CREATE TABLE profiles (
    id                   SERIAL PRIMARY KEY,
    user_id              INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    education            TEXT,
    skills               TEXT,              -- kept as delimited text for now, matches original; JSONB migration candidate later
    interests            TEXT,
    experience_years      INTEGER,
    certifications       TEXT,
    projects             TEXT,
    preferred_location    TEXT,
    salary_expectation    TEXT,
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE analysis_runs (
    id                    UUID PRIMARY KEY,
    user_id               INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source                VARCHAR(30) NOT NULL,
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
CREATE INDEX idx_analysis_runs_user_source_created ON analysis_runs(user_id, source, created_at DESC);
CREATE INDEX idx_analysis_runs_fingerprint ON analysis_runs(user_id, candidate_fingerprint, created_at DESC);

CREATE TABLE recommendation_history (
    id                   SERIAL PRIMARY KEY,
    user_id              INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    career_name          VARCHAR(255) NOT NULL,
    match_score          INTEGER,
    skill_gaps           JSONB,
    recommended_courses  JSONB,
    -- Which candidate-profile source produced this recommendation:
    -- 'profile' | 'resume_upload' | 'resume_builder' | 'merge'.
    -- See db/migrations/0002_add_recommendation_source.sql.
    source               VARCHAR(30) NOT NULL DEFAULT 'profile',
    -- Shared identity for every row written by one logical
    -- generate-recommendations action. NULL for rows written before
    -- this column existed, and always trusted over (user_id, source,
    -- career_name) matching for anything that needs to reference an
    -- exact analysis run, e.g. feedback provenance. See
    -- db/migrations/0004_analysis_run_isolation.sql.
    analysis_run_id      UUID REFERENCES analysis_runs(id) ON DELETE SET NULL,
    -- The exact candidate evidence (canonical education/skills/
    -- interests/experience/certifications/projects, source, verified
    -- skills actually used) that produced this specific row. NULL for
    -- pre-migration rows. See db/migrations/0004_analysis_run_isolation.sql
    -- and db/migrations/0005_analysis_runs.sql.
    candidate_snapshot    JSONB,
    -- Denormalized copy of analysis_runs.candidate_fingerprint for this
    -- row's run, so dedupe queries don't need a join. NULL for rows
    -- written before fingerprinting existed. See
    -- db/migrations/0005_analysis_runs.sql.
    candidate_fingerprint TEXT,
    -- Backend-side mirror of "this recommendation has been rated" -
    -- same latest-wins duplicate semantics as ml_feedback above. See
    -- db/migrations/0006_feedback_provenance.sql.
    feedback_rating       SMALLINT CHECK (feedback_rating BETWEEN 1 AND 5),
    feedback_submitted_at TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_recommendation_history_user ON recommendation_history(user_id);
CREATE INDEX idx_recommendation_history_analysis_run ON recommendation_history(analysis_run_id);
CREATE INDEX idx_recommendation_history_user_source_created ON recommendation_history(user_id, source, created_at DESC);
CREATE INDEX idx_recommendation_history_fingerprint ON recommendation_history(user_id, source, candidate_fingerprint, created_at DESC);

CREATE TABLE activity_logs (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action     VARCHAR(100) NOT NULL,
    details    TEXT,
    timestamp  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);

CREATE TABLE saved_careers (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    career_name VARCHAR(255) NOT NULL,
    notes       TEXT,
    saved_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, career_name)
);
CREATE INDEX idx_saved_careers_user ON saved_careers(user_id);

CREATE TABLE resumes (
    id               SERIAL PRIMARY KEY,
    user_id          INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    phone            VARCHAR(30),
    summary          TEXT,
    institution      TEXT,
    graduation_year  VARCHAR(10),
    experience_json  JSONB,
    ats_score        REAL,
    last_updated     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE game_results (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    career              VARCHAR(255) NOT NULL,
    performance_score   INTEGER NOT NULL DEFAULT 0,
    stress_score        INTEGER NOT NULL DEFAULT 0,
    learning_score      INTEGER NOT NULL DEFAULT 0,
    performance_level   VARCHAR(50),
    badges_earned       INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_game_results_user ON game_results(user_id);

-- ---------------------------------------------------------------------
-- Skill verification (from database.py "NEW TABLES" section)
-- ---------------------------------------------------------------------

CREATE TABLE skill_tests (
    id               SERIAL PRIMARY KEY,
    user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_name       VARCHAR(255) NOT NULL,
    difficulty       VARCHAR(20) NOT NULL DEFAULT 'intermediate',
    total_questions  INTEGER NOT NULL DEFAULT 5,
    status           VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_skill_tests_user ON skill_tests(user_id);

CREATE TABLE test_questions (
    id              SERIAL PRIMARY KEY,
    test_id         INTEGER NOT NULL REFERENCES skill_tests(id) ON DELETE CASCADE,
    question_text   TEXT NOT NULL,
    options         JSONB NOT NULL,
    correct_answer  INTEGER NOT NULL,
    difficulty      VARCHAR(20) NOT NULL DEFAULT 'intermediate'
);
CREATE INDEX idx_test_questions_test ON test_questions(test_id);

CREATE TABLE skill_test_results (
    id                 SERIAL PRIMARY KEY,
    user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_id            INTEGER NOT NULL REFERENCES skill_tests(id) ON DELETE CASCADE,
    skill_name         VARCHAR(255) NOT NULL,
    score              REAL NOT NULL,
    percentage         REAL NOT NULL,
    proficiency_level  VARCHAR(50),
    answers            JSONB,
    completed_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_skill_test_results_user ON skill_test_results(user_id);
CREATE INDEX idx_skill_test_results_skill ON skill_test_results(skill_name);

-- ---------------------------------------------------------------------
-- Job market / trends (from job_database.py)
-- ---------------------------------------------------------------------

CREATE TABLE job_postings (
    id               SERIAL PRIMARY KEY,
    title            VARCHAR(255) NOT NULL,
    company          VARCHAR(255),
    location         VARCHAR(255),
    description      TEXT,
    salary_min       REAL,
    salary_max       REAL,
    contract_type    VARCHAR(50),
    source           VARCHAR(50),
    url              TEXT,
    career_category  VARCHAR(255),
    fetched_date     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(title, company, location)
);
CREATE INDEX idx_job_postings_category ON job_postings(career_category);

CREATE TABLE skill_demand (
    id               SERIAL PRIMARY KEY,
    skill_name       VARCHAR(255) NOT NULL,
    demand_count     INTEGER NOT NULL DEFAULT 0,
    percentage       REAL NOT NULL DEFAULT 0,
    career_category  VARCHAR(255),
    date_recorded    DATE NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE(skill_name, career_category, date_recorded)
);
CREATE INDEX idx_skill_demand_category ON skill_demand(career_category);

CREATE TABLE skill_trends (
    id               SERIAL PRIMARY KEY,
    skill_name       VARCHAR(255) NOT NULL,
    trend_7d         INTEGER NOT NULL DEFAULT 0,
    trend_30d        INTEGER NOT NULL DEFAULT 0,
    trend_90d        INTEGER NOT NULL DEFAULT 0,
    career_category  VARCHAR(255),
    last_updated     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_skill_trends_skill ON skill_trends(skill_name);

CREATE TABLE location_demand (
    id               SERIAL PRIMARY KEY,
    location         VARCHAR(255) NOT NULL,
    skill_name       VARCHAR(255) NOT NULL,
    job_count        INTEGER NOT NULL DEFAULT 0,
    avg_salary       REAL,
    career_category  VARCHAR(255),
    date_recorded    DATE NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE(location, skill_name, career_category, date_recorded)
);

CREATE TABLE market_insights (
    id                  SERIAL PRIMARY KEY,
    career_category     VARCHAR(255) NOT NULL,
    total_jobs          INTEGER NOT NULL DEFAULT 0,
    unique_skills       INTEGER NOT NULL DEFAULT 0,
    avg_skills_per_job  REAL NOT NULL DEFAULT 0,
    top_location        VARCHAR(255),
    analysis_data       JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- ML feedback (written by the Python ML service when
-- FEEDBACK_STORE=postgres — see ml-service/app/storage/feedback_store.py)
--
-- User ratings of recommendations they actually received. This is the
-- only training data the feedback-calibration model ever sees, and it
-- cannot be regenerated, so it lives in the database rather than in the
-- ML container's filesystem. No user_id by design: the backend verifies
-- ownership before forwarding, and the model only needs the profile
-- shape, not the identity behind it.
-- ---------------------------------------------------------------------

CREATE TABLE ml_feedback (
    id            SERIAL PRIMARY KEY,
    recorded_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    career        VARCHAR(255) NOT NULL,
    rating        REAL NOT NULL CHECK (rating >= 1 AND rating <= 5),
    user_profile  JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Provenance (section A): links a rating back to the EXACT
    -- recommendation/analysis it refers to, and the engine/dataset
    -- version active when that recommendation was produced. Nullable —
    -- legacy rows predate this. See db/migrations/0006_feedback_provenance.sql.
    recommendation_id INTEGER REFERENCES recommendation_history(id) ON DELETE SET NULL,
    analysis_run_id    UUID REFERENCES analysis_runs(id) ON DELETE SET NULL,
    career_id          TEXT,
    engine_version     VARCHAR(100),
    dataset_version    VARCHAR(100)
);
CREATE INDEX idx_ml_feedback_career ON ml_feedback(career);
CREATE INDEX idx_ml_feedback_recorded_at ON ml_feedback(recorded_at);
CREATE INDEX idx_ml_feedback_analysis_run ON ml_feedback(analysis_run_id);
-- Duplicate-feedback semantics: at most one row per recommendation_id
-- (latest rating wins via upsert — see app/storage/feedback_store.py).
-- Multiple NULLs are fine (legacy/unlinked rows); only a real,
-- non-null recommendation_id must be unique.
CREATE UNIQUE INDEX uq_ml_feedback_recommendation_id
  ON ml_feedback(recommendation_id)
  WHERE recommendation_id IS NOT NULL;

-- ---------------------------------------------------------------------
-- Trigger to keep profiles.updated_at current (Postgres has no
-- ON UPDATE CURRENT_TIMESTAMP shorthand like MySQL/SQLite conventions)
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_analysis_runs_updated_at
BEFORE UPDATE ON analysis_runs
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
