-- Extends the `resumes` table so the Resume Builder can support the full
-- section set (Personal Info links, repeatable Education, Internships,
-- Projects, and Certifications) without touching any other table.
--
-- Scope note: this is intentionally confined to `resumes`. The `profiles`
-- table (education/skills/interests/certifications/projects as flat
-- text) keeps powering the recommendation engine, ATS scoring, and
-- candidateProfileService exactly as before -- nothing here changes that
-- pipeline. Skills specifically continue to live ONLY on `profiles.skills`
-- (see resumeService.buildResumeData / candidateProfileService), reusing
-- the existing skill/profile system rather than forking it.
--
-- New repeatable sections are stored as JSONB arrays, matching the
-- existing convention already used for `experience_json`. Each row
-- defaults to an empty array so application code never has to
-- null-check them, and existing rows are backfilled the same way.
--
-- All additive, nullable-or-defaulted columns -- safe to run against a
-- live database with a previous-version backend still deployed.

ALTER TABLE resumes
  ADD COLUMN IF NOT EXISTS full_name            TEXT,
  ADD COLUMN IF NOT EXISTS headline             TEXT,
  ADD COLUMN IF NOT EXISTS location             TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url         TEXT,
  ADD COLUMN IF NOT EXISTS github_url           TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_url        TEXT,
  ADD COLUMN IF NOT EXISTS education_json       JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS internships_json     JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS projects_json        JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS certifications_json  JSONB NOT NULL DEFAULT '[]'::jsonb;
