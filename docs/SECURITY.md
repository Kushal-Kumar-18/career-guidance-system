# Security notes

## Authentication

- Passwords are hashed with bcrypt (`bcryptjs`) before storage — never stored or logged in plaintext.
- Login/register issue a JWT (`jsonwebtoken`) signed with `AUTH_SECRET` from the environment, 7-day expiry.
- Every protected route uses `requireAuth` middleware (`backend/src/middleware/auth.js`), which verifies the
  `Authorization: Bearer <token>` header and attaches `req.user = { id, username, role }`.
- Admin-only routes additionally use `requireAdmin`, which checks `req.user.role === 'admin'` and 403s otherwise.
  This is enforced entirely server-side; the frontend's `AdminRoute` component is a convenience redirect only,
  not a security boundary.

## Token storage — known tradeoff

The frontend (`frontend/src/services/api.js`) persists the JWT in `localStorage` so a page refresh doesn't log
the user out. **This is a deliberate tradeoff, not an oversight**, but it does mean the token is readable by any
script that can execute in the page (XSS exposure), rather than being limited to in-memory state.

If this needs to be tightened before a real deployment, the two standard options are:

1. **httpOnly refresh cookie + short-lived in-memory access token** — most robust, but requires a `/auth/refresh`
   endpoint and cookie-based CSRF protection (SameSite + CSRF token), which was out of scope for this pass.
2. **Keep localStorage, shorten `expiresIn`** — lower effort, keeps the current architecture, but doesn't remove
   the XSS exposure, just its window.

Whichever direction is chosen, keep this file and the comment above `signToken()` in `auth.js` in sync with
whatever the frontend actually does — a previous version of this codebase had a comment claiming in-memory
storage while the code used localStorage, which is the kind of contradiction this doc exists to prevent.

## CORS

`backend/src/app.js` enables CORS via the `cors` package. In production, restrict `origin` to the deployed
frontend's actual domain rather than leaving it open — this was left permissive for local development.

## Secrets

- `AUTH_SECRET`, `DATABASE_URL`, and any external API keys (e.g. Adzuna for job search) are read from environment
  variables via `backend/src/config/env.js` / `dotenv`. None are hardcoded in source.
- `.env` is git-ignored; only `.env.example`-style documentation should be committed.

### Production startup validation

`config/env.js` distinguishes "has a convenient development default" from "may run with that default". When
`NODE_ENV=production`, `AUTH_SECRET` and `DATABASE_URL` have **no fallback at all** — the process throws during
module load and the container fails to start. `AUTH_SECRET` is additionally rejected if it:

- matches a known placeholder (`change-me-in-every-environment`, `dev-only-change-me`, `changeme`, `secret`, …;
  compared case-insensitively), or
- is shorter than 32 characters.

This is deliberately a hard failure rather than a warning. A JWT signing key that is guessable — or, worse, one
that is published in this repository's `.env.example` — lets anyone mint a token for any user, including one
with `role: 'admin'`, which defeats every other control on this page. A log line would have been easy to miss;
a container that won't start is not.

Generate a real value with:

```bash
openssl rand -base64 48
```

Development behaviour is unchanged: `npm run dev` still works with no configuration. Note that a variable which
is *present but blank* (`AUTH_SECRET=` in a `.env` file) counts as unset in both modes, so dev falls back rather
than signing tokens with an empty string.

## Validation

- `backend/src/validators/` holds one file per domain with dedicated request-shape validation, each throwing a
  structured `ApiError(422, { field: message })` before a controller reaches its service:
  `authValidators.js` (register/login), `profileValidators.js` (profile update — field types/lengths, experience
  range), `resumeValidators.js` (resume update — phone format, summary length, graduation year, experience array
  shape), `skillTestValidators.js` (test generation/submission — difficulty enum, question-count bounds, answer
  index shape), `gameValidators.js` (gameplay submission — scenario/choice structure), `candidateValidators.js`
  (candidate-profile submitted alongside `POST /recommendations` for the `resume_upload`/`merge` sources — field
  types/lengths, `source` enum).
- Domain services (`careerService`, `skillService`, `atsService`, etc.) throw `ApiError(422, ...)` for missing
  or malformed required fields (e.g. `target_career`, `career` query params) that don't yet have a dedicated
  validator file, rather than trusting client input.
- Frontend-side validation exists for UX but is not relied on for security — every mutating endpoint re-validates
  server-side.

## Generated resume files — access control

Generated resume PDFs are personal data and are served **only** through an authenticated, ownership-scoped
endpoint:

- `GET /api/resume/download` sits behind `requireAuth` and streams the caller's own PDF with
  `Content-Disposition: attachment` and `Cache-Control: private, no-store`.
- Ownership is *structural*, not a check that can be forgotten. `resumeService.storageKeyForUser()` derives the
  storage key (`resumes/user-<id>.pdf`) from `req.user.id` alone — there is no id or path parameter in the
  request for a caller to tamper with, so there is no code path in which user A can name user B's file. The
  helper also rejects any non-positive-integer id, so nothing can be interpolated into the key that escapes the
  `resumes/` prefix.
- A missing object returns a generic `404` ("generate your resume PDF first") rather than surfacing storage
  internals.

**There is no static file route, and one must not be reintroduced.** A previous version mounted
`express.static()` at `/files`, which published every stored resume at `/files/resumes/user-<id>.pdf` — a
trivially enumerable URL with no authentication and no ownership check. That mount has been removed from
`backend/src/app.js`, the matching `/files/` proxy has been removed from `frontend/nginx.conf`, and
`LocalStorage.resolveUrl()` (which produced those paths) has been deleted from the storage abstraction.
`backend/tests/security-hardening.test.js` asserts that no route is mounted under `/files` and that the storage
driver exposes no `resolveUrl`, so a regression fails the test suite.

Because the endpoint requires an `Authorization` header, the frontend fetches the PDF as a blob
(`api.downloadResumePdf()`) and hands the user a local `blob:` URL — a plain `<a href>` would send no token and
receive a 401. The object URL is revoked when the page unmounts.

Under `STORAGE_DRIVER=s3` the objects are private with no public-read bucket policy, and the download route
streams them through the authenticated backend, so access control is identical under both drivers.
`S3Storage.resolveUrl()` (short-lived presigned GET) is retained as the hook for a future direct-to-S3
optimisation; adopting it would also require a bucket CORS rule, and a presigned URL must only ever be minted
*after* the caller's ownership has been verified.

## Rate limiting

`backend/src/middleware/rateLimit.js` applies fixed-window limits, with all buckets defined in one place:

| Bucket | Limit | Applies to |
|---|---|---|
| `auth` | 10 / 15 min | `POST /auth/login`, `POST /auth/register` |
| `resume_upload` | 20 / hour | `POST /resume/upload` |
| `resume_generate` | 30 / hour | `POST /resume/generate` |
| `skill_extraction` | 60 / hour | `POST /skills/extract`, `POST /skills/normalize` |
| `recommendations` | 40 / hour | `POST /recommendations` |
| `feedback` | 60 / hour | `POST /recommendations/feedback` |
| `skill_tests` | 60 / hour | test generation + submission |
| `jobs` / `trends` | 60 / 15 min | job search and trend aggregation |
| `global` | 600 / 15 min | blanket backstop across `/api` |

Authenticated requests are keyed per user so one user behind a shared NAT can't exhaust everyone else's budget;
anonymous ones key on `req.ip`, which requires `app.set('trust proxy', …)` to be correct behind nginx — hence
`TRUST_PROXY_HOPS` (1 for the EC2 deployment). Tunable via `RATE_LIMIT_ENABLED` and `RATE_LIMIT_MULTIPLIER`.

The implementation is intentionally dependency-free: no rate-limit package exists in the committed
`package-lock.json`, and adding one would have desynced the lockfile. **Known limitation, stated rather than
hidden:** counters live in a single process's memory, so they reset on restart and are not shared across
instances. That is correct for the current single-container deployment; if the backend is ever scaled
horizontally, move the counter to Redis or put the limit on the load balancer/WAF — the middleware's interface
would not change.

## Uploaded resume files

- `POST /api/resume/upload` (`backend/src/middleware/upload.js`) validates both file extension and MIME type
  against an explicit allow-list (`.pdf`/`application/pdf`, `.docx`/the DOCX MIME type) before any parsing
  happens, and caps file size at `RESUME_UPLOAD_MAX_MB` (default 5&nbsp;MB).
- The file is handled with `multer`'s in-memory storage — it is never written to disk, so there is no
  path-traversal or stale-temp-file surface from this endpoint. It is also never persisted to the database or
  the storage abstraction; the extraction result is returned to the caller for review and only reaches storage
  if/when the user explicitly saves it as their profile via the normal profile-update flow.
- `resumeExtractionService.js` wraps `pdf-parse`/`mammoth` parse failures (corrupt, empty, or unreadable files)
  in a generic, user-safe `ApiError(422, ...)` — the underlying library exception (and any content from the
  file) is never sent to the client.
- Activity logging for this endpoint (`activityRepository.log(..., 'resume_uploaded', ...)`) records only
  metadata (MIME type, byte size) — never the extracted resume text or any personal information from it.

## Admin surface

- `GET /api/analytics/admin/overview` — aggregate counts only (users, recommendations, tests, games, cached job
  postings, top recommended careers). No per-user PII.
- `GET /api/analytics/admin/users` — lists `id, username, email, role, created_at, last_login`. Never returns
  `password_hash`.
- `DELETE /api/analytics/admin/users/:id` — deletes a user. Blocks self-deletion (`400`) and 404s on unknown ids.

All three require `role: 'admin'` on the JWT.

## Feedback integrity (ML training data)

User feedback ratings are the only signal the feedback-calibration model ever trains on
(`ml-service/app/engine/feedback_model.py`), which makes the feedback endpoint the one place where a client can
put data *into* a model. Two controls apply:

- **Provenance.** `recommendationService.submitFeedback()` first looks the `(user, career)` pair up in that
  user's own `recommendation_history` rows and rejects with `422` if there is no match. Without this, anyone
  holding a valid token could post arbitrary `(career, rating)` pairs for careers they were never shown and
  steer the model — a cheap poisoning path. Because the lookup is scoped to the caller's own rows, it doubles as
  an ownership check: one user cannot rate another's recommendation. The *stored* career name is then forwarded
  to the ML service, not the client's string.
- **Durability.** Ratings are stored in Postgres (`ml_feedback`) when `FEEDBACK_STORE=postgres`, which is what
  both Compose files set. They previously accumulated in a JSON file inside the ML container, so any redeploy
  discarded every rating collected since the last image build — and unlike every other table, this data cannot
  be regenerated from anything else. See `ml-service/app/storage/feedback_store.py`.

Note that `ml_feedback` deliberately holds no `user_id`: the backend has already verified ownership before
forwarding, and the model only needs the profile *shape*, so keeping identity out of the training store limits
how much personal data ends up in it.
