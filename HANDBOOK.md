# Handbook — start here

**If you are an AI coding tool (or a human) opening this ZIP with no
prior conversation history, read this file first.** It's the single
entry point that explains what this project is, what state it's in,
how it's organized, the conventions it follows, and what to do next —
everything needed to keep working on it without having seen any of the
chat history that produced it.

---

## 1. What this is

A full-stack rebuild of a legacy Flask/Jinja/SQLite "career guidance"
application into:

```
React 19 + Vite (frontend/)
        ↓ REST/JSON
Node.js + Express (backend/)
        ↓ SQL              ↓ REST/JSON
PostgreSQL 16 (db/)   Python FastAPI ML service (ml-service/)
```

It recommends careers to a user based on their profile/skills using a
trained ML model + fuzzy matching, and around that core also provides:
auth, profile management, career exploration/comparison/roadmaps,
skill verification (generated quizzes), resume building + ATS scoring,
job-market search/trends, a gamified "day in the life" simulator, and
an analytics/admin dashboard.

**Scope boundary, updated as of the AWS pass:** the application is now
deployed to AWS on a single EC2 instance (Docker Compose + Nginx,
provisioned by Terraform) — see [§2](#2-current-status--read-this-before-assuming-anything-is-broken-or-missing)
and [docs/AWS_ARCHITECTURE.md](./docs/AWS_ARCHITECTURE.md). Deliberately
small: no ECS/Fargate/ALB/RDS/ECR — see that doc for why.

## 2. Current status — read this before assuming anything is broken or missing

**The application is feature-complete; AWS deployment infrastructure is
written but not yet run against a live AWS account.** Specifically:

- All domains listed in §1 have real `controllers/services/repositories`
  (backend) and real pages (frontend) — no `501` placeholders remain.
- Every backend JS file passes `node --check` (syntax-verified as of
  the last change in this ZIP), including the new `S3Storage` adapter
  in `storageService.js` — verified to load correctly with the real
  `@aws-sdk/client-s3` package installed, not just syntax-checked.
- `docker-compose.yml` (local dev) and `docker-compose.prod.yml` (EC2)
  were written to spec and validated as syntactically correct YAML, but
  **neither has been build-tested against a live Docker daemon** in any
  environment this project has passed through. This is the single
  biggest unverified item on the application side.
- `infrastructure/terraform/` was parsed with `terraform-config-inspect`
  (no syntax errors, all resource/variable references resolve) and its
  bootstrap script (`user_data.sh.tftpl`) was rendered and syntax-checked
  with `bash -n` — but **no real Terraform CLI or AWS credentials were
  available**, so no `terraform validate`/`plan`/`apply` has ever been
  run. See [docs/AWS_ARCHITECTURE.md](./docs/AWS_ARCHITECTURE.md#how-this-was-verified-and-what-wasnt)
  for the exact verification boundary.
- A partial automated test suite now exists for the backend
  (`backend/tests/`, run via `npm test` — see Pass 8 in
  [CHANGELOG.md](./CHANGELOG.md)): no-DB regression tests for the
  candidate-profile convergence pipeline and resume-upload extraction,
  using `proxyquire` to mock the repository/mlClient boundary and
  generated PDF/DOCX fixtures. It does not cover every domain (careers,
  skill tests, game, admin, etc. are still only manually verified) — all
  prior verification for those remains manual, live API exercising
  against a running stack in an earlier session (see README's "Testing
  status" table), which predates the later doc/validator/Docker/AWS
  passes, so **re-verify those after any further changes**.
- Pass 8 added three new candidate-profile sources for career
  recommendations (uploaded resume, Resume Builder, merge) behind the
  existing `POST /recommendations` endpoint and one new endpoint
  (`POST /resume/upload`) — see
  [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md#candidate-profile-convergence-three-input-sources-one-pipeline).
  The ML service/model/scoring logic were not touched; `source` omitted
  reproduces the exact prior behavior.

If you're picking this up to continue work, the highest-value next
action is: run the app locally (native, per
[docs/LOCAL_SETUP.md](./docs/LOCAL_SETUP.md)) to confirm nothing broke
in the storage/CORS changes, *then* work through
[docs/AWS_SETUP_GUIDE.md](./docs/AWS_SETUP_GUIDE.md) end-to-end — that
will be the actual first real-world test of the Terraform config (see
[§6](#6-whats-next--not-done-yet)).

## 3. Map of every document in this repo

Read in this order for full context; skip around after that as needed.

| Doc | Read this for |
|---|---|
| **This file** | Orientation — read first |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System design, layering, cross-cutting concerns |
| [docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) | Every REST endpoint, method, auth requirement |
| [docs/DATABASE.md](./docs/DATABASE.md) | Schema, relationships, JSONB usage, migrations |
| [docs/AI_ML.md](./docs/AI_ML.md) | ML service design, request flow, model details |
| [docs/SECURITY.md](./docs/SECURITY.md) | Auth, token storage tradeoffs, validation, admin surface |
| [docs/LOCAL_SETUP.md](./docs/LOCAL_SETUP.md) | Running all services locally (native or Docker Compose) |
| [SETUP.md](./SETUP.md) | Local setup **plus** connecting the project to Git/GitHub |
| [README.md](./README.md) | Feature list, project structure, known limitations, AWS deployment summary |
| [docs/AWS_ARCHITECTURE.md](./docs/AWS_ARCHITECTURE.md) | AWS deployment design — single EC2 + Docker Compose + Nginx, and why |
| [docs/AWS_SETUP_GUIDE.md](./docs/AWS_SETUP_GUIDE.md) | Deploying to AWS from a fresh account, start to finish |
| [docs/AWS_TROUBLESHOOTING.md](./docs/AWS_TROUBLESHOOTING.md) | Fixing the AWS deployment when something breaks |
| [docs/AWS_COST_AND_TEARDOWN.md](./docs/AWS_COST_AND_TEARDOWN.md) | What this costs, and how to safely tear it down |
| [docs/INTERVIEW_HANDBOOK.md](./docs/INTERVIEW_HANDBOOK.md) | Explaining the AWS deployment decisions out loud |
| [CHANGELOG.md](./CHANGELOG.md) | What changed, in what pass, and why — chronological |
| [PHASE1_NOTES.md](./PHASE1_NOTES.md) | Original Phase 1 handoff notes (historical — kept for context on what was inherited vs. built fresh) |
| [db/MIGRATION_NOTES.md](./db/MIGRATION_NOTES.md) | SQLite → Postgres data migration, if you have the legacy `.db` file |
| [db/migrations/README.md](./db/migrations/README.md) | Migration file conventions for future schema changes |

## 4. Repo layout

```
career-guidance-modernized/
├── HANDBOOK.md              ← you are here
├── CHANGELOG.md
├── README.md
├── SETUP.md
├── PHASE1_NOTES.md
├── docker-compose.yml              local-dev only
├── docker-compose.prod.yml         EC2 production stack (Nginx + backend + ml-service + postgres)
├── .env.example                    Postgres credentials for docker-compose.prod.yml
├── .dockerignore                   (+ one per service — see below)
├── .gitignore
├── docs/                     ARCHITECTURE, API_DOCUMENTATION, DATABASE,
│                              AI_ML, LOCAL_SETUP, SECURITY,
│                              AWS_ARCHITECTURE, AWS_SETUP_GUIDE,
│                              AWS_TROUBLESHOOTING, AWS_COST_AND_TEARDOWN,
│                              INTERVIEW_HANDBOOK
├── infrastructure/terraform/  AWS infra: VPC, security group, EC2, IAM,
│   │                          optional S3, CloudWatch — see docs/AWS_*.md
│   ├── provider.tf, versions.tf, variables.tf, outputs.tf
│   ├── network.tf, security.tf, iam.tf, s3.tf, cloudwatch.tf, ec2.tf
│   ├── user_data.sh.tftpl     EC2 bootstrap (Docker, Compose, CloudWatch agent)
│   └── terraform.tfvars.example
├── db/
│   ├── schema.sql             canonical "fresh install" schema snapshot
│   ├── migrations/            numbered migration history (0001_baseline.sql + README)
│   ├── seeds/dev_seed.sql     demo user (demo@example.com / password123)
│   ├── migrate_sqlite_to_postgres.py
│   └── MIGRATION_NOTES.md
├── backend/                   Node/Express — routes → controllers → services → repositories
│   ├── .dockerignore
│   ├── src/{routes,controllers,services,repositories,validators,middleware,config,data,utils}/
│   │   └── services/storageService.js   LocalStorage + S3Storage (STORAGE_DRIVER env var)
│   ├── storage/                local file storage (resume PDFs) — git-ignored
│   └── server.js
├── ml-service/                 Python FastAPI — wraps the trained model + dataset
│   ├── .dockerignore
│   └── app/{main.py, predictors/, data/, services/, config.py}
└── frontend/                   React 19 + Vite SPA
    ├── .dockerignore
    ├── Dockerfile              local-dev image (serves build via `serve`, :4173)
    ├── Dockerfile.prod         EC2 image (serves build via Nginx, :80, reverse-proxies /api)
    ├── nginx.conf              used only by Dockerfile.prod
    └── src/{pages,components,layouts,context,hooks,services}/
```

## 5. Conventions this codebase follows — match these in any new code

**Backend (Node/Express), strictly layered:**

```
routes/*.routes.js       → declares HTTP method + path + middleware guards only
controllers/*.controller.js → thin: validate → call service → shape response
services/*.js             → business logic; the only layer allowed to call mlClient
repositories/*.js         → the ONLY place raw/parameterized SQL is allowed to live
validators/*.js           → throws ApiError(422, { field: message }) on bad input
```

- Every controller action is wrapped in `asyncHandler()`
  (`backend/src/utils/asyncHandler.js`) so rejected promises reach
  `middleware/errorHandler.js` instead of crashing the process.
- Every response uses `ok(res, data)` / `created(res, data)` from
  `backend/src/utils/apiResponse.js` — the envelope is always
  `{ success: true, data }` or `{ success: false, error: { message,
  details? } }`. Never hand-roll `res.json(...)` in a controller.
- Errors are thrown as `new ApiError(status, message, details?)`
  (`backend/src/utils/ApiError.js`), never `res.status().json()`'d
  directly from a controller/service.
- **Validators**: if an endpoint accepts a body, it should have a
  `validators/xValidators.js` file mirroring
  `validators/authValidators.js`'s pattern (type checks, length bounds,
  enum checks, throws structured `ApiError(422, ...)`), wired in at the
  top of the controller action before the service call. This was
  retrofitted onto `profile`, `resume`, `skill-tests`, and `game/play`
  in a later pass — if you add a new mutating endpoint, add its
  validator the same way rather than inline `if (!x) throw ...` checks.
- Config is environment-variable only (`backend/src/config/env.js`) —
  never hard-code a host, port, or file path.
- **Storage**: `storageService.js` exports one of two drivers based on
  `STORAGE_DRIVER` — `local` (default, `LocalStorage`) or `s3`
  (`S3Storage`, using `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`,
  lazy-`require`d so local dev never needs those packages installed).
  Both implement the same async `save/read/resolveUrl` interface —
  `resolveUrl` is `async` on both (even though `LocalStorage` doesn't
  need to await anything) so callers always `await` it uniformly. If
  you add a third driver, match that interface exactly.
- **CORS**: controlled by `CORS_ALLOWED_ORIGINS` (comma-separated) in
  `app.js` — empty in local dev (any origin allowed), locked to
  specific origins when set. Don't revert to a bare `cors()` call.

**ML service (FastAPI):** the Node backend is the *only* caller. Never
re-implement matching/scoring/recommendation logic in JavaScript —
extend `ml-service/app/main.py` and the predictor instead, and have
Node proxy to it via `backend/src/services/mlClient.js`.

**Frontend (React/Vite):** all backend calls go through the single
`frontend/src/services/api.js` client — never `fetch()` directly from a
component/page. Every data-fetching page follows the
loading/error/empty-state pattern (`components/LoadingState.jsx`,
`ErrorState.jsx`, `EmptyState.jsx`, `hooks/useAsync.js`).

**Do not touch without a real, demonstrated bug** (per explicit
instruction carried through every pass of this project):

```
career_dataset.py, enhanced_career_roadmap.py, job_api.py,
job_database.py, trend_analyzer.py, skill_extractor.py,
project_skill_extractor.py, skill_test_generator.py, game_engine.py,
resume_builder.py, ml-service/requirements.txt version pins (see
docs/AI_ML.md for why)
```

> Note: `advanced_ml_predictor.py` and
> `ml-service/app/data/ml_models/perfect_model_v5.pkl` were previously on
> this list but were substantially rewritten in a later pass — the
> original recommendation engine trained its "ML model" on labels
> derived from its own fuzzy score (circular, no independent signal) and
> exposed a fabricated `success_probability`. The engine now lives in
> `ml-service/app/engine/` (see [docs/AI_ML.md](./docs/AI_ML.md));
> `advanced_ml_predictor.py` is a thin compatibility shim over it, and
> `perfect_model_v5.pkl` has been removed in favor of a
> feedback-calibration model that only trains on real user ratings.

## 6. What's next — not done yet

In priority order:

1. **Run the AWS deployment for real.** `infrastructure/terraform/`
   and `docker-compose.prod.yml` were written and checked as
   thoroughly as possible without a live AWS account or Terraform
   binary in this environment (`terraform-config-inspect` for HCL
   parsing, `bash -n` for the bootstrap script, YAML validation for
   Compose — see [docs/AWS_ARCHITECTURE.md](./docs/AWS_ARCHITECTURE.md#how-this-was-verified-and-what-wasnt)).
   **No `terraform apply` has ever actually run.** Work through
   [docs/AWS_SETUP_GUIDE.md](./docs/AWS_SETUP_GUIDE.md) end to end —
   this is genuinely the first real test of that infrastructure, and
   expect to hit and fix at least a few things
   ([docs/AWS_TROUBLESHOOTING.md](./docs/AWS_TROUBLESHOOTING.md) covers
   the likely ones).
2. **Build-test Docker locally first**, before even getting to AWS:
   `docker compose config` (lint) → `docker compose up --build` →
   verify all four local-dev services come up. Neither
   `docker-compose.yml` nor `docker-compose.prod.yml` has been
   build-tested against a live daemon anywhere this project has been.
3. **Extend the automated test suite.** Pass 8 added a first slice
   (`backend/tests/`, plain Node + `proxyquire`, no framework) covering
   only the candidate-profile pipeline and resume extraction. Jest for
   the rest of `backend/`, Vitest for `frontend/`, pytest for
   `ml-service/` are all still unstarted.
4. **Re-verify the full local feature list** (native run, per
   [docs/LOCAL_SETUP.md](./docs/LOCAL_SETUP.md)) since the
   storage/CORS changes in the AWS pass touch code every feature runs
   through (`storageService.js`, `app.js`), and Pass 8 added a new
   `multer` dependency and a new DB column that haven't been exercised
   against a live Postgres/ML-service stack — only mocked in
   `backend/tests/`. In particular: `POST /resume/upload` end-to-end
   against the real ml-service `/extract-skills` endpoint (mocked as
   unreachable in this session's testing), and the frontend
   upload-review-analyze flow clicked through in a browser.
5. **Once AWS deployment is confirmed working**, candidates for a
   follow-up pass (not started, and each optional): a real TLS
   certificate on Nginx (currently HTTP-only), an Elastic IP so the
   instance's address doesn't change on stop/start, a CI/CD pipeline
   instead of manual `git pull && docker compose up` over SSH, and (if
   the project ever needs to scale beyond one instance) revisiting the
   ECS/Fargate + RDS + ALB architecture that was deliberately set aside
   in favor of this smaller one — see
   [docs/AWS_ARCHITECTURE.md](./docs/AWS_ARCHITECTURE.md#why-this-shape-not-ecsfargaterdsalb).

**Not needed for this deployment / explicitly out of scope per the
low-cost master prompt:** Redis, SQS, SNS, OpenSearch, ALB, ECS/Fargate,
ECR, RDS, CloudFront, Route 53, Kubernetes, NAT Gateway.

## 7. If you're an AI tool asked to "continue this project"

1. Read this file, then skim [CHANGELOG.md](./CHANGELOG.md) so you
   know what's already been fixed (don't re-propose fixes already
   applied — check there first).
2. Read [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) and this file's
   §5 before writing any code, so new code matches existing patterns.
3. Check §2 and §6 above for current status and the prioritized next
   steps — default to picking up at the top of §6 unless the user asks
   for something else specifically.
4. After any change to `backend/src/**/*.js`, run a syntax sweep:
   `find src server.js -name "*.js" | xargs -I{} node --check {}` from
   inside `backend/`.
5. If your task specifically extends the API surface, update
   [docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) and, if it
   changes the schema, add a new numbered file to `db/migrations/`
   (see that folder's README) and keep `db/schema.sql` in sync.
6. Log what you did in [CHANGELOG.md](./CHANGELOG.md) under a new
   entry, in the same style as the existing entries, so the *next*
   tool/person has an accurate trail — this is how this handbook stays
   trustworthy over time.
