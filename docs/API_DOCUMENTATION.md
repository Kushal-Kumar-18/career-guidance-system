# API Documentation

Base URL (local dev): `http://localhost:4000/api`

## Conventions

- All responses use the envelope `{ "success": true, "data": ... }` or
  `{ "success": false, "error": { "message": "...", "details"?: {...} } }`.
- Endpoints marked **Auth** require `Authorization: Bearer <token>`
  (returned from `/auth/login` and `/auth/register`).
- Endpoints marked **Admin** additionally require the authenticated
  user's `role` to be `admin`.
- Endpoints marked **Optional auth** work unauthenticated but return
  personalized data (e.g. saved status) when a valid token is sent.

## Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | — | API/database/ML-service liveness check |

## Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create an account (`username`, `email`, `password`) |
| POST | `/auth/login` | — | Log in (`identifier` = email or username, `password`) |
| GET | `/auth/me` | Auth | Current user |
| POST | `/auth/logout` | Auth | Stateless client-side token discard |

## Profile

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/profile` | Auth | Get the current user's profile |
| PUT | `/profile` | Auth | Update education, skills, interests, experience, certifications, projects, location, salary expectation |

## Careers

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/careers?q=&limit=&offset=` | Optional auth | Search/browse the 148-career dataset |
| GET | `/careers/compare?names=A,B` | — | Compare 2+ careers side by side |
| GET | `/careers/saved` | Auth | List the current user's saved careers |
| GET | `/careers/:name` | — | Career detail |
| GET | `/careers/:name/roadmap` | — | Generic learning roadmap for a career |
| GET | `/careers/:name/myths-reality` | — | Common myths vs. reality for a career |
| GET | `/careers/:name/investment` | — | Time/cost investment breakdown |
| GET | `/careers/:name/weekly-plan?hours=` | — | Weekly study plan at a given hours/week budget |
| POST | `/careers/:name/save` | Auth | Save a career (`notes` optional) |
| DELETE | `/careers/:name/save` | Auth | Remove a saved career |

## Recommendations

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/recommendations` | Auth | Generate explainable fit-score recommendations for the current user (`top_k` optional, default 5) |
| GET | `/recommendations/history` | Auth | Past recommendation runs |
| POST | `/recommendations/feedback` | Auth | Rate a recommendation you actually received (`{ recommendation_id, rating }`, `rating` 1-5, optional `career` for a client-side sanity check). **Resolved by primary key, scoped to your own recommendation history** — not by career name, since the same career can legitimately appear in more than one of your analysis runs and a name-based lookup could silently attach a rating to the wrong one. Returns `422` if `recommendation_id` doesn't belong to you, doesn't exist, or (if `career` was also supplied) doesn't match the career that id actually refers to. Re-submitting for the same `recommendation_id` replaces the previous rating (latest wins) rather than erroring. Rate limited (60/hour). See [AI_ML.md](./AI_ML.md). |

Each recommendation includes `confidence` (the 0-100 Fit Score, kept
under this field name for backward compatibility — it is an alignment
estimate, not a probability), `fit_score`/`fit_label` (a qualitative
band — Strong/Good/Moderate/Emerging/Limited — alongside the number),
`rank_score` (the number actually used to order recommendations —
`fit_score` plus the small feedback-calibration and market-relevance
adjustments; see AI_ML.md for why this is kept distinct from `fit_score`
rather than calling the adjusted number "the fit"),
`evidence_strength`/`evidence_strength_label` (how reliable the matched
skill evidence is on average — CLAIMED < INFERRED < VERIFIED — kept
separate from the Fit Score itself), `excluded_categories` (categories
the user left blank, whose scoring weight was redistributed rather than
scored as zero — see AI_ML.md "missing-information handling"),
`fit_score`/`feedback_adjustment` broken out separately, `score_breakdown`
(points earned per category out of each category's effective max),
`market_outlook` (qualitative, static, curated job-market reference
info — this IS the Market Relevance dimension, separate from the score),
`market_adjustment` (a small, capped ±3-point ranking nudge derived from
the same static label — included in `confidence` but NOT in `fit_score`;
see AI_ML.md "Pass 13"), `live_market` (a genuinely live Adzuna snapshot fetched at
recommendation time, top few results only, `null` beyond that, never
influencing the score or ranking), `reasoning` (evidence-grounded
explanation text), `skill_gaps`/`skill_gaps_by_tier` (missing skills,
also split essential/important/supporting/optional), `claimed_skills_matched`/
`inferred_skills_matched`/`verified_skills_matched` (the CLAIMED/INFERRED/
VERIFIED evidence-tier taxonomy), `experience_years_expected` (a per-
career experience-saturation anchor derived from the career's own
education data — see AI_ML.md "Pass 13"), and the usual `salary_range`/
`job_growth`/`courses` fields. See [AI_ML.md](./AI_ML.md) for what each
field means and does not mean.

`live_market` shape: `{ source: 'adzuna' | 'unavailable', postings_sample_count,
salary_min, salary_max, queried_at, note }`. `source: 'unavailable'` means
Adzuna credentials aren't configured or the live lookup failed for this
request — never a fabricated number. See
`backend/src/services/marketSignalService.js`.

### Candidate-profile sources (`POST /recommendations` body)

There is exactly one prediction pipeline; `source` only selects which
candidate-profile input is normalized into it before the existing ML
model runs (see `backend/src/services/candidateProfileService.js` and
`recommendationService.js`).

| Field | Type | Required | Notes |
|---|---|---|---|
| `top_k` | number | no | defaults to 5 |
| `source` | `"profile"` \| `"resume_builder"` \| `"resume_upload"` \| `"merge"` | no | defaults to `"profile"` (unchanged prior behavior) |
| `candidate` | object | only for `resume_upload` / `merge` | `{ education, skills, interests, experience_years, certifications, projects }` — `skills`/`interests`/`certifications` accept either a comma-separated string or an array of strings |

- `source: "profile"` (default) — uses the stored `profiles` row, exactly as before.
- `source: "resume_builder"` — uses the Resume Builder's own structured data (`resumeService.buildResumeData`) directly; no PDF is generated or re-parsed.
- `source: "resume_upload"` — uses the `candidate` object, which should be the user-reviewed result of `POST /resume/upload` (see below). Nothing from the upload step is trusted or used without this explicit, reviewed submission.
- `source: "merge"` — merges the stored profile with `candidate` (candidate values win when present; skills/interests/certifications are unioned and case-insensitively de-duplicated).

Each recommendation response item may include `reasoning` (a short,
model-provided explanation) and `user_skills_matched`, both passed
through unchanged from the ML service. Recommendation history rows
also record which `source` produced them.

## Skills

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/skills/predefined` | — | Full skill vocabulary across all careers |
| POST | `/skills/extract` | Auth | Extract known skills from free text (`text`) |
| POST | `/skills/normalize` | — | Normalize a list of skill names (`skills[]`) |
| GET | `/skills/gap?career=` | Auth | Skill gap between the user's profile and a target career |

## Skill verification

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/skill-tests` | Auth | Generate a quiz (`skill_name`, `difficulty`, `total_questions`) |
| POST | `/skill-tests/:id/submit` | Auth | Submit answers, get a score + proficiency level |
| GET | `/skill-tests/results` | Auth | Past results, feeds "verified skills" into recommendations |

## Roadmaps

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/roadmaps/:career` | — | Generic roadmap for a career |
| GET | `/roadmaps/:career/personalized` | Auth | Roadmap adjusted for the user's current skills |

## Resume

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/resume` | Auth | Get the current user's resume data |
| PUT | `/resume` | Auth | Update resume fields (`phone`, `summary`, `institution`, `graduation_year`, `experience[]`) |
| GET | `/resume/preview` | Auth | Full assembled resume data (no PDF) |
| POST | `/resume/generate` | Auth | Generate and store a PDF. Returns `{ download_url, preview }`, where `download_url` is `/api/resume/download` — an authenticated API route, **not** a public file path. Rate limited (30/hour). |
| GET | `/resume/download` | Auth | Streams the caller's **own** generated PDF (`application/pdf`, `Content-Disposition: attachment`). The storage key is derived from the authenticated user id alone, so there is no parameter that could point at another user's file. `404` if no PDF has been generated yet. Because it needs the `Authorization` header, clients must fetch it as a blob rather than linking to it directly. |
| POST | `/resume/upload` | Auth | Rate limited (20/hour). Upload a PDF/DOCX resume (`multipart/form-data`, field `resume`, PDF or DOCX, ≤5&nbsp;MB by default — configurable via `RESUME_UPLOAD_MAX_MB`) and get back a best-effort extraction to review. Nothing is persisted by this call; returns `{ source_file, warnings, extracted }`. The reviewed result is then sent to `POST /recommendations` as `candidate` with `source: "resume_upload"` (or `"merge"`). |

## ATS

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/ats/analyze` | Auth | Score the user's resume against a target career (`target_career`) |

## Jobs

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/jobs/search` | — | Live search (Adzuna, falls back to labeled estimates without an API key) |
| GET | `/jobs` | — | Cached job postings |

## Trends

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/trends/skill-demand` | — | Skill demand counts/percentages |
| GET | `/trends/emerging-skills` | — | Top in-demand skills for a career. Returns `{ emerging_skills: [...], postings_analyzed, synthetic_postings_excluded, real_data_only, note }` |
| GET | `/trends/market-insights` | — | Aggregated market stats per career category |

> **All three endpoints compute over real observed job postings only.** Postings with `source: "estimated"` —
> representative rows synthesized from the curated career dataset when the Adzuna API is unconfigured or
> unreachable — are excluded from every trend calculation. Counting them would be circular: the "market" would
> just echo back the skill list already on file, dressed up as an observed percentage.
>
> Every response therefore carries provenance fields: `postings_analyzed` (how many **real** postings the
> numbers came from), `synthetic_postings_excluded`, and a `note`. When `postings_analyzed` is `0` the
> percentages are all `0` — an honest "no data yet", not a low-demand signal — and nothing is persisted to
> `skill_demand`/`market_insights`, so an empty sample can never be read back later as if it were a measurement.
> Clients should check `postings_analyzed` before rendering a chart.

## Gamification

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/game/generate?career=` | — | Generate a scenario-based simulation for a career |
| POST | `/game/play` | Auth | Submit choices for a generated scenario, get scored |
| GET | `/game/history` | Auth | Past game results |

## Analytics

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/analytics/dashboard` | Auth | Personal activity/progress dashboard |
| GET | `/analytics/admin/overview` | Admin | Platform-wide stats |
| GET | `/analytics/admin/users` | Admin | List all users |
| DELETE | `/analytics/admin/users/:id` | Admin | Remove a user |

## Static files

**There are none, by design.** The `/files/*` static route that used to serve generated resume PDFs has been
removed: it published every stored resume at the trivially-guessable, unauthenticated path
`/files/resumes/user-<id>.pdf`. Resumes are now served only by `GET /resume/download` (see below), under both
the `local` and `s3` storage drivers. See [SECURITY.md](./SECURITY.md#generated-resume-files--access-control).

## ML service (internal — not exposed directly to the frontend)

The backend is the only caller of the ML service (`ML_SERVICE_URL`,
default `http://localhost:8000`). Documented here for completeness:

| Method | Path |
|---|---|
| GET | `/health` |
| POST | `/recommend` (alias: `/predict`) |
| POST | `/skill-gap` |
| POST | `/feedback` |
| GET | `/careers`, `/careers/{career_name}` |
| POST | `/extract-skills` |
| POST | `/normalize-skills` |
| GET | `/skills/predefined` |

`POST /feedback` records a real 1-5 rating a user gave a recommendation
they actually received (`{ user_profile, career, rating }`) and is the
only input to the feedback-calibration model — see
[AI_ML.md](./AI_ML.md#the-feedback-calibration-model--the-only-real-ml).
Exposed to the frontend via `POST /api/recommendations/feedback`.
