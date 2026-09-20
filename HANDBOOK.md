# Handbook — Career Guidance App: Recommendation Engine Hardening

Scope: application code only (backend, ML service, frontend, database).
Docker/hosting/deployment work is intentionally excluded from this
handbook and this zip.

Everything below was actually run and verified in a sandboxed
environment (real Postgres 16, real ML service, real backend, real
HTTP calls) — not just written and assumed to work. See "How to verify
it yourself" at the end to repeat that.

---

## 1. What this fixes, in plain terms

**Before:** two different resumes/profiles for the same user could
contaminate each other's recommendations; a verified skill from your
profile could leak into an unrelated resume's scoring; regenerating
recommendations quickly could either create silent duplicates or (worse)
silently merge two genuinely different candidates that happened to
produce the same top results; a failed "analyze this resume" attempt's
Retry button would silently switch to analyzing your *profile* instead
of retrying the resume; feedback ratings couldn't be reliably traced
back to which exact recommendation they were for; the dataset was stuck
at 148 careers with no `Full Stack Developer`; the UI showed a
market/feedback-adjusted number labeled as "% fit" instead of the actual
fit score.

**After:** every one of those is fixed and covered by an automated test
that fails if the bug comes back. The dataset is now 309 careers
(including Full Stack Developer), with a working career-metadata layer
(`career_id`/`domain` per career).

---

## 2. Files in this zip, by what they do

### Database (`db/`)
| File | What it does |
|---|---|
| `db/schema.sql` | The full current schema, for a fresh database. Fixed real drift bugs (see §4). |
| `db/migrations/0001_baseline.sql` | Unchanged logic, fixed a stale comment. |
| `db/migrations/0005_analysis_runs.sql` | **New.** Makes "one analysis run" a real database row (`analysis_runs` table) instead of just an ID shared across recommendation rows. Adds candidate fingerprinting. |
| `db/migrations/0006_feedback_provenance.sql` | **New.** Links feedback ratings to the exact recommendation/run/dataset-version that produced them. Enforces "one rating per recommendation, latest wins." |
| `db/migrations/0007_missing_indexes.sql` | **New.** Fixes a real bug found by testing: an index existed in `schema.sql` that no migration actually created, so upgraded databases were silently missing it. |
| `db/migrations/README.md` | Updated to document the above. |

**You must run migrations 0005, 0006, 0007 against your existing
database**, in that order, if you have one already. If you're starting
fresh, `db/schema.sql` already includes everything.

### ML service (`ml-service/`)
| File | What it does |
|---|---|
| `ml-service/app/data/career_dataset.py` | **The updated dataset — 309 careers**, including Full Stack Developer. Same structure as before (`skills`/`interests`/`education`/`salary_range`/`job_growth`/`courses` per career), so nothing downstream needed to change shape-wise. |
| `ml-service/app/data/career_metadata.py` | **Generated file** — do not hand-edit. Gives every career a stable `career_id` (URL-safe slug) and a `domain` (derived from the dataset's own section headers). Regenerate with the script below whenever the dataset changes. |
| `ml-service/scripts/generate_career_metadata.py` | Run this after ANY edit to `career_dataset.py` (career added/removed/renamed, or moved to a different section): `python scripts/generate_career_metadata.py` from inside `ml-service/`. It fails loudly instead of guessing if something's ambiguous. |
| `ml-service/app/engine/recommender.py` | Each recommendation now includes `career_id`, `domain`, `dataset_version`, and `rank_score` (see §3). Removed a field (`readiness_label`) that was just a duplicate of another field under a different name. |
| `ml-service/app/main.py` | `/health` now correctly returns an error status when the model fails to load (it always said "OK" before, even when broken). `/recommend` and `/feedback` carry more provenance. |
| `ml-service/app/predictors/advanced_ml_predictor.py` | Passes the new fields through. |
| `ml-service/app/storage/feedback_store.py` | **This file was missing entirely from your original export** — the code imported it and a full test file existed for it, but the file itself wasn't there. Reconstructed from that test file's specification. Handles both a JSON-file feedback log (default) and a Postgres-backed one (`FEEDBACK_STORE=postgres`), with "latest rating wins" behavior for repeat ratings. |
| `ml-service/tests/*.py` | New/updated tests (see §5). |

### Backend (`backend/`)
| File | What it does |
|---|---|
| `backend/src/services/recommendationService.js` | Computes a "candidate fingerprint" per analysis (see §3), records exactly which verified skills were used, and fetches the *original* engine/dataset version when you rate an old recommendation (not whatever version is "current" now). |
| `backend/src/repositories/recommendationRepository.js` | Fixed the duplicate-detection logic (see §3) and added the database calls for feedback provenance. |
| `backend/src/services/candidateFingerprint.js` | **New.** Computes that fingerprint — same candidate always hashes the same way regardless of casing/order/format differences. |
| `backend/src/middleware/requestId.js` | **New.** Every request gets an id, useful for tracing a bug report back to a specific log line. |
| `backend/src/middleware/errorHandler.js`, `backend/src/app.js` | Wire the above in; error responses now include that id. |
| `backend/tests/*.test.js` | New/updated tests (see §5). |

### Frontend (`frontend/`)
| File | What it does |
|---|---|
| `frontend/src/pages/RecommendationsPage.jsx` | **Fixed a real bug:** the "Retry" button, after a failed resume-based analysis, silently retried using your *profile* instead of the resume — dropping the resume data with no warning. Also fixed the main score display to show the actual fit score instead of a market/feedback-adjusted number mislabeled as "fit". |

### Docs (`docs/`)
`API_DOCUMENTATION.md`, `AI_ML.md` — corrected to match what the code
actually does now (they still described a removed field and the wrong
request format for one endpoint).

---

## 3. The three core concepts, explained once

- **Candidate fingerprint**: a fixed-length hash of a candidate's
  skills/education/experience/etc. Two requests for the *same* candidate
  always get the same fingerprint (even if skills arrive as a list vs. a
  comma-separated string, different order, different casing). Two
  *different* candidates never share one. Used to correctly tell apart
  "you clicked generate twice by accident" (should collapse into one
  result) from "two different resumes happened to score identically"
  (must NOT collapse — this was a real bug before).
- **Analysis run**: one row per "generate recommendations" click, now a
  real database row (`analysis_runs`) recording the fingerprint, which
  engine/dataset version produced it, and a frozen snapshot of exactly
  what candidate evidence was used — so rating an old recommendation
  later always uses the evidence that actually produced it, not your
  current profile.
- **`fit_score` vs `rank_score`**: `fit_score` is pure candidate-career
  alignment. `rank_score` is `fit_score` plus small adjustments
  (feedback calibration, market relevance) — it's what recommendations
  are sorted by, but it is NOT what should be labeled "fit" to a user.
  The UI was showing the second number under the first name; fixed.

---

## 4. Bugs found and fixed (the ones worth knowing about)

1. Two different candidates producing identical top results were
   incorrectly merged into one analysis (fixed via fingerprinting).
2. `schema.sql` had a `candidate_snapshot` column and an index that no
   migration ever actually created — meaning a database built by running
   migrations in order (rather than fresh from `schema.sql`) was
   silently missing them.
3. `ml-service`'s `/health` endpoint always returned "200 OK" even when
   the model failed to load.
4. The feedback endpoint's documentation said `{ recommendationId }`
   (camelCase); the real code expects `{ recommendation_id }`
   (snake_case) — the frontend already had this right, only the doc was
   wrong.
5. `app/storage/feedback_store.py` was referenced by the code and had a
   full test suite, but the file itself didn't exist in your export.
6. The frontend Retry button dropped the resume/candidate data on retry.
7. A duplicate/stray old migration file (`backend/db/migrations/0004_analysis_identity.sql`)
   existed in the wrong directory — removed (not included in this zip
   since it's a deletion).

---

## 5. Tests — what to run

```bash
# Backend
cd backend && npm install && npm test

# ML service
cd ml-service && pip install -r requirements.txt && python3 -m pytest tests/ -q

# Frontend (build only — no test suite exists for it)
cd frontend && npm install && npm run build
```

Expected: **10/10 backend test files pass, 75/75 ML tests pass,
frontend build succeeds.** All confirmed in this session.

---

## 6. What YOU need to do to integrate this

1. **Copy every file in this zip over the matching path in your repo**,
   preserving the folder structure.
2. **Delete** `backend/db/migrations/0004_analysis_identity.sql` if it
   exists in your copy — it's a stray duplicate of
   `db/migrations/0004_analysis_run_isolation.sql`.
3. **Run migrations 0005, 0006, 0007** against your existing database
   (in that order), or use the fresh `db/schema.sql` for a new database.
4. **Restart the ML service** — it will regenerate `career_metadata.py`
   consistency-check at import time; if you ever hand-edit
   `career_dataset.py` again, re-run
   `python scripts/generate_career_metadata.py` from `ml-service/`
   afterward, or the service will refuse to start (by design, to catch
   drift).
5. Re-run the three test commands in §5 to confirm your environment
   matches what was verified here.

---

## 7. Follow-up fixes (this pass) — the 4 limitations above are now resolved

1. **Dataset domain mis-categorization — actually a bug in MY OWN generator
   script, not the dataset.** `generate_career_metadata.py`'s section-header
   regex didn't include the em-dash (—) character used in 5 of the newer
   section headers (e.g. `TECHNOLOGY & IT — ADDITIONAL SPECIALIZATIONS`).
   Those headers silently failed to match, so every career under them —
   49 careers across 5 sections, including Full Stack/Frontend/Backend
   Developer — inherited the WRONG domain from whichever section came
   before. Fixed the regex, and added a check that makes any future
   header-parsing failure fail loudly instead of silently mis-assigning
   again. `Full Stack Developer`'s domain is now correctly
   `Technology & IT — Additional Specializations`. Two new tests pin this
   (one specific, one general-purpose: it re-reads every section's own
   declared `(N careers)` count and checks the actual assignment matches).
2. **Performance** — profiled a real request and found the actual cause:
   a word-boundary regex was being rebuilt and recompiled from scratch on
   every single skill comparison (~110,000 recompiles for one request),
   because Python's built-in regex cache only holds 512 patterns and gets
   thrashed once 309 careers' vocabularies are compared. Added a small
   cache keyed on the repeated string. Measured: **~0.6s → ~0.29s per
   request**, same results (full test suite still green). Zero
   behavior change, pure speed.
3. **Security** — went deeper than the earlier grep pass:
   confirmed dynamic SQL `WHERE` clauses never interpolate raw values
   (checked every repository file); confirmed every query touching
   user-owned data is scoped by `user_id`; found and fixed one real gap —
   JWT verification didn't pin `algorithms: ['HS256']` explicitly, which
   is the standard defense against algorithm-confusion attacks. Fixed in
   both `requireAuth` and `optionalAuth`.
4. **No frontend tests** — added a minimal test setup (Vitest +
   React Testing Library, since the project already uses Vite) and wrote
   two real tests: one for the Retry bug (proven to actually catch the
   regression — I temporarily reverted the fix, watched the test fail
   with the exact wrong payload, then restored it and watched it pass),
   and one for the fit-score display fix. Run with `npm test`.

### Updated file list (new/changed on top of the previous zip)
| File | What changed |
|---|---|
| `ml-service/scripts/generate_career_metadata.py` | Fixed the em-dash regex bug; added a loud-failure check for unparsed headers. |
| `ml-service/app/data/career_metadata.py` | Regenerated — 309 careers, 36 correct domains (was 31, with 49 careers wrongly assigned). |
| `ml-service/app/engine/text_match.py` | Cached word-boundary regex compilation — ~2x faster scoring, zero behavior change. |
| `ml-service/tests/test_candidate_isolation_and_dataset.py` | Added 2 tests pinning the domain-assignment fix. |
| `backend/src/middleware/auth.js` | Pinned `algorithms: ['HS256']` on both `jwt.verify()` calls. |
| `frontend/vite.config.js`, `frontend/package.json` | Added Vitest config + `npm test` script. |
| `frontend/src/test/setup.js` | **New.** Vitest/jest-dom setup file. |
| `frontend/src/pages/RecommendationsPage.test.jsx` | **New.** Regression tests for the Retry bug and the fit-score display fix (verified to actually catch the bugs, not just pass). |

### Remaining, honest limitations (genuinely not fixed)
- The `renderWithResumeUploadState`-style component tests only cover
  `RecommendationsPage` — no tests exist yet for `ResumePage`,
  `ProfilePage`, etc. One well-targeted regression test suite, not full
  coverage.
- Security audit is still not a formal penetration test — it's a
  targeted, evidence-based review (SQL injection, ownership scoping,
  JWT handling, rate limiting), not exhaustive.
- Domain labels for the 36 sections are still whatever the dataset's own
  section headers say (e.g. "Emerging & Specialized" containing Data
  Privacy Officer, Ethical Hacker, etc.) — that's the dataset's actual
  content organization, not a bug; if you want different groupings,
  that's a content decision, not a code fix.
