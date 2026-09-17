# Career Guidance System — Modernized

> **New to this repo, or picking it back up after a break (human or AI
> tool)? Read [HANDBOOK.md](./HANDBOOK.md) first** — it's the single
> orientation doc covering current status, conventions, and what's
> next. This README is the feature/structure reference; the handbook
> is the "start here."

A full-stack rebuild of the legacy Flask/Jinja/SQLite career guidance app
into React + Node/Express + PostgreSQL + a Python ML microservice, per the
architecture brief. **This covers the application only — no AWS/hosting
work was done, per the brief's explicit scope restriction.**

---

## What was converted

| Legacy | Modernized |
|---|---|
| Jinja server-rendered templates | React 19 + Vite SPA (`frontend/`) |
| Flask routes | Node.js + Express REST API, layered `routes → controllers → services → repositories` (`backend/`) |
| SQLite | PostgreSQL 16, normalized schema with FKs/indexes/constraints (`db/schema.sql`) |
| In-process ML calls | Standalone FastAPI ML microservice, called over HTTP (`ml-service/`) |
| Ad-hoc auth | JWT + bcrypt, `requireAuth`/`requireAdmin`/`optionalAuth` middleware |

## What was preserved

- **The 148-career dataset** (`career_dataset.py`) — skills, salary
  ranges, job growth, education paths, courses — used as the single
  source of truth by careers, recommendations, roadmaps, skill-gap, ATS,
  and job-market features (no fabricated career data).
- Every feature area named in the brief: auth, profile, skill
  verification (extraction/normalization/tests/proficiency), explainable
  fit-score recommendations, career exploration/comparison/roadmap/myths,
  skill-gap analysis, resume builder + PDF, ATS scoring, job market +
  Adzuna integration with graceful fallback, gamification, analytics.

> **The recommendation engine itself was substantially rewritten**, not
> preserved as-is — the original `AdvancedHybridCareerPredictor` trained
> its "ML model" on labels derived from its own fuzzy-matching score
> (a circular setup that couldn't add any independent signal) and
> exposed a fabricated `success_probability` field with no outcome data
> behind it. It's been replaced with a transparent, evidence-weighted
> fit scorer plus a real feedback-calibration model that only ever
> learns from actual user ratings. See [docs/AI_ML.md](./docs/AI_ML.md)
> for the full rationale and design.

## What was improved

- **Architecture**: clean separation of concerns (routes/controllers/
  services/repositories on the backend; components/pages/hooks/services
  on the frontend); ML kept in its own service instead of embedded.
- **Security**: bcrypt (cost 12) password hashing, JWT auth with route
  guards, `helmet`, input validation on auth endpoints, no secrets
  committed (`.env.example` only), parameterized SQL throughout (no
  string-built queries).
- **API structure**: consistent `{ success, data }` / `{ success, error }`
  envelopes, correct HTTP status codes, centralized error handling
  (Postgres constraint violations mapped to 409/400 automatically).
- **Frontend**: proper SPA with client-side routing, protected routes,
  centralized API service (one file, one place to change base URLs/auth),
  loading/error/empty states on every data-fetching page, responsive
  layout down to mobile.
- **Maintainability**: no giant files, no duplicated business logic, a
  storage abstraction (section 27) so resume files aren't hard-tied to
  the local filesystem, environment-variable configuration throughout.

---

## New project structure

```
career-guidance-modernized/
├── backend/                     Node.js + Express REST API
│   └── src/
│       ├── config/               env, db pool
│       ├── controllers/          thin HTTP handlers
│       ├── services/             business logic (14 domains)
│       ├── repositories/         all SQL lives here
│       ├── middleware/           auth (JWT), error handler
│       ├── validators/           request validation
│       ├── data/                 curated skill-test question bank
│       ├── routes/               one file per domain, wired in index.js
│       └── app.js / server.js
├── ml-service/                   Python FastAPI microservice
│   └── app/
│       ├── predictors/           AdvancedHybridCareerPredictor (preserved)
│       ├── data/                 career_dataset.py (148 careers, preserved)
│       ├── services/             predictor singleton loader
│       └── main.py               /recommend /skill-gap /careers /extract-skills ...
├── frontend/                     React 19 + Vite SPA
│   └── src/
│       ├── components/           CareerCard, SkillChips, Loading/Error/Empty states...
│       ├── pages/                Dashboard, Profile, Recommendations, Careers, Skills, Resume, Jobs, Game...
│       ├── layouts/               AppLayout (trail-map sidebar nav)
│       ├── context/               AuthContext
│       ├── hooks/                 useAsync
│       └── services/api.js       single fetch client for the whole backend
├── db/
│   ├── schema.sql                 PostgreSQL schema (canonical "fresh install" snapshot)
│   ├── migrations/                numbered migration history, starting from 0001_baseline.sql
│   ├── seeds/dev_seed.sql         synthetic demo user (password123)
│   ├── migrate_sqlite_to_postgres.py   legacy → Postgres migration (Phase 1)
│   └── MIGRATION_NOTES.md
├── docs/                          ARCHITECTURE, API_DOCUMENTATION, DATABASE, AI_ML,
│                                    LOCAL_SETUP, SECURITY — see below
├── docker-compose.yml             local-dev convenience only (untested — see Known limitations)
├── docker-compose.prod.yml        EC2 production stack (Nginx + backend + ml-service + postgres)
├── .env.example                   Postgres credentials shared by docker-compose.prod.yml's services
├── .dockerignore                  repo-wide ignore patterns (frontend/, backend/, ml-service/ each also have their own)
├── infrastructure/terraform/      AWS infrastructure (EC2, VPC, IAM, S3, CloudWatch) — see docs/AWS_*.md
└── PHASE1_NOTES.md                Phase 1 handoff notes (context/history)
```

---

## Documentation

| Doc | Covers |
|---|---|
| [HANDBOOK.md](./HANDBOOK.md) | **Start here** — orientation, current status, conventions, what's next |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Service layout, backend layering, cross-cutting concerns |
| [docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) | Every REST endpoint, method, auth requirement |
| [docs/DATABASE.md](./docs/DATABASE.md) | Schema, relationships, JSONB usage, migrations |
| [docs/AI_ML.md](./docs/AI_ML.md) | ML service design, request flow, model details |
| [docs/LOCAL_SETUP.md](./docs/LOCAL_SETUP.md) | Running all services locally (native or Docker Compose) |
| [docs/SECURITY.md](./docs/SECURITY.md) | Auth, token storage tradeoffs, validation, admin surface |
| [SETUP.md](./SETUP.md) | Local setup **plus** connecting the project to Git/GitHub |
| [docs/AWS_ARCHITECTURE.md](./docs/AWS_ARCHITECTURE.md) | The AWS deployment's design and why it's shaped this way |
| [docs/AWS_SETUP_GUIDE.md](./docs/AWS_SETUP_GUIDE.md) | Deploying to AWS from a fresh account, start to finish |
| [docs/AWS_TROUBLESHOOTING.md](./docs/AWS_TROUBLESHOOTING.md) | Fixing the AWS deployment when something breaks |
| [docs/AWS_COST_AND_TEARDOWN.md](./docs/AWS_COST_AND_TEARDOWN.md) | What this costs, and how to safely tear it down |
| [docs/INTERVIEW_HANDBOOK.md](./docs/INTERVIEW_HANDBOOK.md) | Explaining the AWS deployment decisions out loud |
| [CHANGELOG.md](./CHANGELOG.md) | What changed, in what pass, and why |

## Local setup

> **Full step-by-step guide (including connecting this project to Git/GitHub):
> see [SETUP.md](./SETUP.md) or [docs/LOCAL_SETUP.md](./docs/LOCAL_SETUP.md).** The quick version:

Requires Node 20+, Python 3.11+, and a local PostgreSQL 16 (or Docker,
if you have it — the compose file wasn't build-tested in this sandbox).

```bash
# 1. Database
createdb career_guidance
psql career_guidance -f db/schema.sql
psql career_guidance -f db/seeds/dev_seed.sql   # optional demo user

# 2. ML service
cd ml-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000

# 3. Backend (new terminal)
cd backend
npm install
cp .env.example .env   # set DATABASE_URL, AUTH_SECRET, ML_SERVICE_URL
node server.js          # http://localhost:4000

# 4. Frontend (new terminal)
cd frontend
npm install
npm run dev              # http://localhost:5173 (proxies /api to :4000)
```

Demo login (from `dev_seed.sql`): `demo@example.com` / `password123`.

---

## Environment variables

**backend/.env**
```
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://user:pass@localhost:5432/career_guidance
AUTH_SECRET=<generate a real random value>
ML_SERVICE_URL=http://localhost:8000
ML_SERVICE_TIMEOUT_MS=10000
ADZUNA_APP_ID=            # optional — falls back to labeled estimated postings if unset
ADZUNA_APP_KEY=
ADZUNA_COUNTRY=in
STORAGE_DRIVER=local
LOCAL_STORAGE_PATH=./storage
```

**ml-service/.env** — see `ml-service/.env.example` (model path, host/port).

**frontend/.env** — `VITE_API_BASE_URL` (leave unset for local dev; Vite
proxies `/api` to the backend).

---

## Testing status

Every flow below was exercised **live** against a running Postgres 16 +
FastAPI ML service + Express backend + Vite frontend in this session
(not just code review):

| Flow | Status |
|---|---|
| Register / login / me / logout / route guards (401/403) | ✅ verified |
| Profile create/update/retrieve | ✅ verified |
| Recommendations: generate (real ML call) + history | ✅ verified — real model output (confidence, skill_gaps, courses, reasoning) |
| Career explore/search/detail/roadmap/myths | ✅ verified against live 148-career dataset |
| Skill gap analysis | ✅ verified |
| Skill verification: generate test → submit → proficiency → verified-skills feed into recommendations | ✅ verified end-to-end |
| Resume: update → preview → generate PDF → download real PDF file | ✅ verified (PDF downloaded and confirmed valid) |
| ATS: keyword/completeness/formatting scoring | ✅ verified |
| Jobs: search with Adzuna fallback, cached listing | ✅ verified (fallback path, since no Adzuna key configured in this sandbox) |
| Trends: skill demand, market insights | ✅ verified |
| Gamification: generate scenario, play, score, history | ✅ verified |
| Analytics dashboard | ✅ verified |
| Frontend: `npm run build` production build | ✅ succeeds, no errors |
| Frontend dev server ↔ backend ↔ ML service, all three running together | ✅ verified together in one process group |
| Backend `src/**/*.js` syntax check (`node --check`) | ✅ all pass |

**Not tested in this sandbox:** the `docker-compose.yml`/Dockerfiles
(no Docker daemon available here), live Adzuna API calls (no
credentials, and `api.adzuna.com` isn't reachable from this sandbox's
network allowlist — the fallback path was verified instead), and manual
click-through of every React page in a real browser (verified via
production build success + API integration, not visual QA).

---

## Known limitations

- **ATS scoring, skill-test question generation, resume PDF layout,
  gamification scenarios, and roadmap/myths generation are fresh
  implementations, not ports.** The Phase 1 handoff included the trained
  ML model and the 148-career dataset, but not the legacy Flask
  route/business-logic source for these specific features — they aren't
  in this repository. Each is clearly commented in code (search for
  "PHASE1_NOTES.md" in comments) pointing to this fact. If you have the
  original source for any of these, they can be ported in directly in
  place of the current implementation.
- **Job-market data is only as good as what's cached.** Without an
  Adzuna API key, `/api/jobs/search` returns clearly-labeled
  (`source: "estimated"`) representative postings derived from the real
  career dataset, not live listings. Trends/skill-demand are computed
  from whatever postings are cached, so they're thin until real Adzuna
  data (or another job source) is flowing.
- **The gamification "game" is stateless** — there's no `game_sessions`
  table in the schema, so scenario scoring weights are sent to the
  client and echoed back on submit rather than kept server-side. Fine
  for a non-graded simulation; would need a sessions table if this
  needs to be tamper-proof.
- **Docker artifacts are unverified.** `docker-compose.yml` and the three
  Dockerfiles were written to spec — including a Postgres healthcheck
  gating backend startup, per-service `.dockerignore` files, and a
  `VITE_API_BASE_URL` build arg so the containerized frontend can reach
  the containerized backend (see [docs/LOCAL_SETUP.md](./docs/LOCAL_SETUP.md#option-b--docker-compose))
  — but this sandbox has no Docker daemon to build/run them against.
  Validate before relying on them.
- **Backend/frontend still have no automated test suite** (Jest/Vitest)
  beyond the dependency-free scripts in `backend/tests/`. The ML service
  now has a pytest suite (`ml-service/tests/`, run via `pytest` from
  `ml-service/`) covering the recommendation engine, the feedback model,
  and the FastAPI endpoints — see [docs/AI_ML.md](./docs/AI_ML.md).

---

## AWS deployment

**This application is now deployed to AWS** using a single EC2
instance running Docker Compose behind Nginx, provisioned with
Terraform — see [docs/AWS_ARCHITECTURE.md](./docs/AWS_ARCHITECTURE.md)
for the full design and [docs/AWS_SETUP_GUIDE.md](./docs/AWS_SETUP_GUIDE.md)
to provision it yourself from a fresh AWS account.

> **Not yet run against a live AWS account** — the Terraform, Docker
> Compose, and Nginx configuration were written and checked as
> thoroughly as possible without AWS credentials or a Terraform binary
> in this environment (see that doc's "How this was verified"), but the
> first real `terraform apply` and deployment is still ahead of you.

**Deliberately small on purpose:** EC2 + Docker Compose + Nginx, not
ECS/Fargate/ALB/RDS/ECR — chosen for cost, hands-on learning value, and
being personally explainable end-to-end. See
[docs/INTERVIEW_HANDBOOK.md](./docs/INTERVIEW_HANDBOOK.md) for why, and
[docs/AWS_COST_AND_TEARDOWN.md](./docs/AWS_COST_AND_TEARDOWN.md) before
you apply anything — nothing here is guaranteed free.

**What changed in the application to support this:**
- `backend/src/services/storageService.js` gained a real `S3Storage`
  implementation (optional, `STORAGE_DRIVER=s3`) alongside the existing
  `LocalStorage` — same interface, no caller changes.
- CORS is now configurable (`CORS_ALLOWED_ORIGINS`) instead of wide open,
  for production use.
- `frontend/Dockerfile.prod` + `frontend/nginx.conf` — a production
  image that serves the React build via Nginx and reverse-proxies
  `/api` to the backend, used only in
  `docker-compose.prod.yml` (the local-dev `docker-compose.yml` and
  `frontend/Dockerfile` are unchanged).
- `docker-compose.prod.yml` + root `.env.example` — the EC2 deployment
  stack (only Nginx publishes a host port; backend/ml-service/postgres
  are internal-only).
- `infrastructure/terraform/` — the AWS infrastructure itself.

No React/Node/PostgreSQL/Python application logic was rewritten for
this — only deployment-related configuration, per this stage's explicit
scope restriction.
