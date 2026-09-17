-- =====================================================================
-- Migration 0001 — baseline schema
--
-- This is the same DDL as ../schema.sql, tracked here as the first
-- entry in migration history (see ./README.md). Applying db/schema.sql
-- directly and applying this file have an identical effect; only one
-- of the two should be run against a given database, not both.
-- =====================================================================
--
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

CREATE TABLE recommendation_history (
    id                   SERIAL PRIMARY KEY,
    user_id              INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    career_name          VARCHAR(255) NOT NULL,
    match_score          INTEGER,
    skill_gaps           JSONB,
    recommended_courses  JSONB,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_recommendation_history_user ON recommendation_history(user_id);

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
