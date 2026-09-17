# Architecture

## Overview

The Career Guidance System is split into three independently-runnable
services plus a PostgreSQL database:

```
┌────────────────┐      HTTP/JSON       ┌─────────────────┐      HTTP/JSON      ┌───────────────────┐
│   frontend      │  ───────────────▶   │    backend       │  ─────────────▶   │   ml-service        │
│ React 19 + Vite │  ◀───────────────   │ Node/Express API │  ◀─────────────   │ Python FastAPI      │
│ :5173 (dev)     │                      │ :4000            │                    │ :8000                │
└────────────────┘                      └─────────┬────────┘                    └──────────┬──────────┘
                                                     │ SQL                                     │ in-process
                                                     ▼                                          ▼
                                          ┌────────────────────┐                    AdvancedHybridCareerPredictor
                                          │ PostgreSQL 16       │                    + 148-career dataset
                                          │ :5432                │                    + trained model (.pkl)
                                          └────────────────────┘
```

Only the backend talks to the database and to the ML service; the
frontend never calls the ML service or Postgres directly. This keeps a
single, consistent access/authorization layer at the API boundary.

## Candidate-profile convergence (three input sources, one pipeline)

Career recommendations can be requested from three different sources,
but they all converge on the exact same candidate shape and the exact
same ML call before reaching the (unchanged) trained model:

```
Manual Profile ─────────────────────┐
                                     │
Uploaded Resume (PDF/DOCX)          │
   → resumeExtractionService        │
   → user reviews/edits (frontend)  ├──▶ candidateProfileService.toCanonical()
                                     │        { education, skills, interests,
Resume Builder                      │          experience_years, certifications, projects }
   → resumeService.buildResumeData  │                        │
   (already-assembled structured    │                        ▼
    data — no PDF round-trip)  ─────┘             mlClient.recommend()  (ONE call site)
                                                            │
                                                            ▼
                                              existing ML service / trained model
                                              (advanced_ml_predictor.py, unchanged)
```

- `backend/src/services/candidateProfileService.js` — the single
  canonical shape and the converters into it (`fromProfile`,
  `fromResumeBuilderData`, `fromReviewedExtraction`, `merge`).
- `backend/src/services/resumeExtractionService.js` — PDF/DOCX text
  extraction + heuristic section parsing for the "uploaded resume"
  source; reuses the existing ML-service skill vocabulary
  (`skillService.extractSkills`) rather than a second skill-matching
  implementation. Never persists anything — the caller (frontend) shows
  the result for review before it's used.
- `backend/src/services/recommendationService.js` —
  `resolveCandidateProfile()` is the only place that branches on
  `source`; every branch ends at the same `mlClient.recommend()` call,
  so the ML service itself has no notion of which source a candidate
  came from. See `POST /recommendations` in
  [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md#candidate-profile-sources-post-recommendations-body).

## Layers (backend)

`routes → controllers → services → repositories`

- **routes/** — one file per domain (`careers.routes.js`,
  `resume.routes.js`, ...), wired together in `routes/index.js` and
  mounted at `/api`. Routes declare HTTP method + path + which
  middleware guards apply (`requireAuth`, `requireAdmin`,
  `optionalAuth`) and nothing else.
- **controllers/** — thin HTTP handlers: pull data off `req`, call a
  validator if the endpoint accepts a body, call the service, shape the
  response with `ok()`/`created()` from `utils/apiResponse.js`. No SQL,
  no business logic.
- **services/** — business logic. This is where recommendation
  orchestration, resume generation, ATS scoring, skill-gap computation,
  and calls out to the ML service (`services/mlClient.js`) live.
- **repositories/** — every parameterized SQL query lives here, one
  file per aggregate (`userRepository.js`, `profileRepository.js`,
  etc.). Services never write SQL inline; repositories never contain
  business rules.
- **validators/** — request-shape validation, throwing a structured
  `ApiError(422, ...)` on bad input before a controller reaches the
  service layer.
- **middleware/** — `auth.js` (JWT verification → `requireAuth` /
  `requireAdmin` / `optionalAuth`), `errorHandler.js` (maps thrown
  `ApiError`s and Postgres constraint violations to HTTP responses).

## ML service

FastAPI wraps the legacy `AdvancedHybridCareerPredictor` (fuzzy
matching + feature engineering + a trained
`HistGradientBoostingRegressor`) and the 148-career dataset behind a
small HTTP surface (`/recommend`, `/skill-gap`, `/careers`,
`/extract-skills`, `/normalize-skills`, `/skills/predefined`,
`/health`). The Node backend is a thin proxy in front of it — it never
re-implements scoring logic in JavaScript, so `ml-service` remains the
single source of truth for anything ML-derived. See
[AI_ML.md](./AI_ML.md) for details.

## Frontend

Standard Vite SPA: `pages/` (one component per route), `components/`
(shared UI — cards, chips, loading/error/empty states),
`layouts/AppLayout.jsx` (sidebar nav shell), `context/AuthContext.jsx`
(JWT stored client-side, attached to every request via
`services/api.js`), `hooks/useAsync.js` (shared loading/error/data
state for data-fetching pages). `services/api.js` is the single place
that knows the backend base URL and attaches the auth header — no
component calls `fetch` directly.

## Cross-cutting concerns

- **Auth**: JWT (signed with `AUTH_SECRET`), bcrypt-hashed passwords
  (cost 12). Stateless — no server-side session store, so the backend
  scales horizontally without sticky sessions.
- **Config**: every service is configured entirely through environment
  variables (`config/env.js` on the backend, `.env.example` in each
  service dir) — no hard-coded hosts, ports, or file paths.
- **Storage**: `storageService.js` abstracts file storage behind a
  `LocalStorage` implementation today; swapping in an `S3Storage` class
  with the same interface (and `STORAGE_DRIVER=s3`) is the only change
  needed to move generated resume PDFs to S3 later — no caller changes.
- **Errors**: every thrown error becomes `{ success: false, error: {...} }`
  with an appropriate HTTP status via `middleware/errorHandler.js`,
  including automatic mapping of Postgres constraint violations
  (unique/foreign-key) to 409/400.
- **Health**: `GET /api/health` reports API + database + ML-service
  reachability in one call — usable directly as a load-balancer health
  check if this is ever deployed.

## What's explicitly out of scope here

No AWS resources, Terraform, CI/CD, or production hosting were built —
this document describes the local application architecture only. See
the README's "AWS readiness" section for what's already
config-ready for a future deployment task, and
[docs/SECURITY.md](./SECURITY.md) for current security practices.

For current project status, conventions to follow when extending this
codebase, and prioritized next steps, see
[HANDBOOK.md](../HANDBOOK.md).
