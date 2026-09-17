# Phase 1 — Foundations

Scope: PostgreSQL schema + migration script, Express backend skeleton,
Python ML microservice wrapping the existing recommender. No auth, no
feature routes yet — those are Phases 2–4 (see bottom of this file).

## What's done and verified

### 1. Database (`db/`)
- `schema.sql` — full Postgres translation of every table in the legacy
  `database.py` and `job_database.py` (11 tables total), with real foreign
  keys, indexes, JSONB for previously-stringified JSON columns, and a
  trigger to replace SQLite's implicit `updated_at` behavior.
- `migrate_sqlite_to_postgres.py` — migrates existing data from
  `career_guidance.db` into the new schema, handling the renamed columns
  (`password`→`password_hash`, `experience`→`experience_years`,
  `options_json`→`options`, `answers_json`→`answers`).
- **Not yet run against a live Postgres** — this sandbox can't install
  postgresql-server (the Ubuntu security mirror needed for the package
  returned 404s during `apt-get install`). The schema and script are
  written and reviewed but you should run `schema.sql` then the migration
  script against your own Postgres instance and sanity-check row counts
  before trusting it fully.

### 2. Express backend (`backend/`)
- Layered structure: `routes → controllers → services`, with
  `repositories/`, `validators/`, `utils/` scaffolded for later phases.
- `config/env.js` centralizes all configuration through environment
  variables (no hard-coded hosts — section 26 of your doc).
- `config/db.js` — pg connection pool with a health check.
- `GET /api/health` — checks DB connectivity and ML service reachability.
  **Verified working**: returns 503 with a clear per-dependency status
  when Postgres/ML service are down, 200 when they're up.
- Every other domain from your doc's API list (`/api/auth`,
  `/api/careers`, `/api/resume`, etc.) is wired as an explicit
  placeholder returning `501` with the phase it's scheduled for — so the
  full API surface is visible now, nothing is silently missing.
- **Verified**: `npm install` succeeds, server boots, health and
  placeholder endpoints respond correctly.

### 3. Python ML service (`ml-service/`)
- FastAPI wrapping your existing `advanced_ml_predictor.py`
  (`AdvancedHybridCareerPredictor`) and `career_dataset.py`, copied
  in unmodified — no rewrite of the recommendation logic, per section 13.
- Endpoints: `GET /health`, `POST /recommend`, `POST /predict` (alias),
  `POST /skill-gap`.
- **Verified end-to-end** against your real `ml_models/perfect_model_v5.pkl`:
  - Model loads successfully and reports the *exact* original validation
    metrics (R²=0.9993, MAE=0.0036, 148 careers, HistGradientBoostingRegressor).
  - `/recommend` returns real ranked predictions with correct salary
    ranges, matched/missing skills, and reasoning text.
  - `/skill-gap` correctly returns matched vs. missing skills for a
    named career.

#### ML model compatibility (section 15 of your doc)
Your `requirements.txt` pins `scikit-learn==1.3.0`, `numpy==1.24.3`,
`python-Levenshtein==0.21.1`. None of those have prebuilt wheels for
Python 3.12 (this environment's only available interpreter), and
building 1.3.0 from source failed here. I used the closest available
pinned versions instead: `scikit-learn==1.3.2`, `pandas==2.1.4`,
`numpy==1.26.4`, `python-Levenshtein==0.27.1`. **I verified this doesn't
silently change behavior** — the loaded model reports identical
validation metrics to what your original app prints. If you deploy on
Python 3.10 or 3.11 you can use your exact original pins; either way,
document whichever you choose in `ml-service/requirements.txt`.

#### A real bug found and fixed
`AdvancedHybridCareerPredictor.__init__` does:
```python
try:
    from career_dataset import CAREER_DATABASE
    self.career_db = CAREER_DATABASE
except Exception:
    self.career_db = {}
```
This is a bare top-level import inside a silent `try/except`. In the
original Flask app it worked because `app.py` ran from the project root
with `career_dataset.py` next to it. Under FastAPI/uvicorn, with the
predictor copied into `app/predictors/`, the import failed silently —
predictions still returned scores, but `required_skills`, `skill_gaps`,
and `user_skills_matched` all came back empty, and `salary_range` fell
back to a generic default instead of your real per-career data. I fixed
this in `ml-service/app/services/predictor_singleton.py` by explicitly
adding the predictors directory to `sys.path` before import, and
verified the fix: skill gaps and real salary data now populate
correctly. **This class of silent-failure-via-bare-import will resurface
anywhere else in the codebase that does the same pattern** — worth a
grep for `except Exception:\s*pass`-style catches around imports before
Phase 3.

## Local setup

### Database
```bash
psql -U postgres -c "CREATE DATABASE career_guidance"
psql -U postgres -d career_guidance -f db/schema.sql
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/career_guidance \
  python db/migrate_sqlite_to_postgres.py /path/to/career_guidance.db
```

### Backend
```bash
cd backend
cp .env.example .env   # edit as needed
npm install
npm run dev             # http://localhost:4000
curl http://localhost:4000/api/health
```

### ML service
```bash
cd ml-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
curl http://localhost:8000/health
```

## Known limitations / explicitly deferred
- No auth, no feature endpoints beyond ML `/recommend`, `/predict`,
  `/skill-gap` — everything else is a `501` placeholder by design.
- Migration script has not been run against a live Postgres in this
  environment (see above) — validate row counts on your machine.
- Frontend (`frontend/`) directory created but empty — Phase 2+ per the
  React/Vite structure in section 5 of your doc.
- No Docker Compose yet — deliberately deferred per section 29
  ("Docker... not part of this task unless useful for local dev"); can
  add a `docker-compose.yml` for Postgres + backend + ml-service in
  Phase 2 if you want one-command local startup.

## Phase roadmap (unchanged from the plan you approved)
- **Phase 2** — `/api/auth`, `/api/profile`, React login/register/
  dashboard shell wired to Postgres.
- **Phase 3** — Core recommendation flow end-to-end: React → Express →
  ML service, using the endpoints already verified in this phase.
- **Phase 4** — Skill tests, roadmaps, resume/ATS, job market (Adzuna),
  gamification, analytics — each as its own verified vertical slice.
- **Phase 5** — Remove superseded Flask/Jinja code, write the final
  technical summary your doc asks for in section 36.

Phases 2–5 above were completed in an earlier pass (this file just
wasn't updated to say so) — by the time Phase 6 started, every backend
route in `routes/index.js` was already wired to a real
controller/service (no `501` placeholders left), and the React app had
working pages for auth, dashboard, profile, recommendations, careers,
career detail, roadmap, skills, resume+ATS, jobs+trends, and the game.

## Phase 6 — Closing the remaining feature-parity gaps

Comparing the modernized app against the original Flask app
(`app.py` + `enhanced_career_roadmap.py`) turned up a smaller list of
real gaps than expected — most of "the list" in the task doc (ATS,
trends) had actually already been folded into the Resume and Jobs
pages, just not as separate routes. What was genuinely missing:

### Backend
- `careerService.buildInvestment()` / `buildWeeklyPlan()` — ported from
  the original's `calculate_career_investment()` and
  `get_weekly_learning_plan()` (`enhanced_career_roadmap.py`), rebuilt
  on top of the existing `buildRoadmap()` output instead of a separate
  data source (the original's cost assumptions — ₹500 avg cert, 4
  courses × ₹2000, ₹5000 materials, ₹500/month tools — are preserved).
  Exposed as `GET /api/careers/:name/investment` and
  `GET /api/careers/:name/weekly-plan?hours=N`.
- Admin user management — `userRepository.listAll()` /
  `deleteById()` (never selects `password_hash`), wired to
  `GET /api/analytics/admin/users` and
  `DELETE /api/analytics/admin/users/:id` (both `requireAdmin`).
  Mirrors the original `admin.html`'s user table + delete action.
  Self-deletion is blocked with a `400`.
- `analyticsService.adminOverview()` extended with `profiles_completed`,
  `active_today`, and `total_games_played` — these existed in the
  original `db.get_statistics()` but were dropped in the initial
  conversion. Added `profileRepository.countAll()`,
  `activityRepository.countActiveToday()`, `gameRepository.countAll()`
  to support it.
- Fixed a stale/contradictory comment in `middleware/auth.js` that
  claimed the frontend keeps the JWT "in memory... not localStorage" —
  it actually uses `localStorage` (see `frontend/src/services/api.js`).
  The comment now documents the real tradeoff instead of misdescribing
  it; see `docs/SECURITY.md` for the full writeup and the two options
  if this needs tightening later.

### Frontend
- **`ComparePage.jsx`** (new, route `/compare`) — pick 2–3 careers,
  see salary/growth/education/skills side by side. `CareersPage` now
  has checkboxes (max 3) feeding into it, and `CareerDetailPage` links
  into it pre-filled with the current career.
- **`AnalyticsPage.jsx`** (new, route `/analytics`) — recommendation
  match-score bar chart, skill-test proficiency pie chart, simulation
  performance line chart, plus the same stat cards and activity feed as
  the dashboard. All from real `GET /analytics/dashboard` data via
  `recharts` (already a frontend dependency) — no hardcoded numbers.
- **`AdminPage.jsx`** (new, route `/admin`, gated by
  `user.role === 'admin'` via the new `AdminRoute` component) — system
  stat cards, top-recommended-careers list, and a user table with
  delete. The route guard is a UX convenience only; the real protection
  is `requireAdmin` on the backend.
- `CareerDetailPage.jsx` — added "Estimated investment" and "Weekly
  learning plan" (with an hours/week input) sections using the two new
  backend endpoints.
- `JobsPage.jsx` — added a "Top emerging skills" section using the
  already-existing (but previously unused) `GET /trends/emerging-skills`
  endpoint.
- `AppLayout.jsx` nav — added Analytics for everyone, Admin only when
  `user.role === 'admin'`.
- `api.js` — added `careerInvestment`, `careerWeeklyPlan`,
  `emergingSkills`, `adminOverview`, `adminListUsers`, `adminDeleteUser`.

### Verified this phase
- `cd frontend && npm install && npm run build` — succeeds, no errors
  (one expected "chunk >500kB" perf warning, not a defect).
- `node --check` on every backend file touched this phase — all pass.
- `require('./src/app.js')` with a fake `DATABASE_URL`/`AUTH_SECRET` —
  loads without throwing, confirming every new route/controller/service
  wire-up is syntactically and structurally correct.
- **Not verified**: an actual live Postgres + ML service + full
  click-through (no Postgres instance available in this sandbox — see
  Phase 1's note above about the same limitation). The new endpoints
  follow the exact same `asyncHandler`/`ok()`/`ApiError` pattern as
  every other verified endpoint in this codebase, and the queries were
  checked column-by-column against `db/schema.sql`, but they have not
  been run against a live database.
