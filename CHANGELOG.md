# Changelog

Chronological record of what changed in this project, pass by pass.
Newest first. Written so a future contributor (human or AI tool) can
see what's already been done without needing prior conversation
history — see [HANDBOOK.md](./HANDBOOK.md) for full orientation.

## Pass 15 — Pre-setup hardening: resume access control, secret validation, data integrity

Requested: fix a specific list of issues found in review **before** local
setup begins, without redesigning anything. Explicitly out of scope and
not touched: the architecture, the ML system, the database structure
broadly, the React/Vite/Express/FastAPI stack, and the AWS Terraform.

### 1. Generated resumes were publicly accessible (critical)

`app.js` mounted `express.static()` at `/files`, publishing every stored
resume at `/files/resumes/user-<id>.pdf` — enumerable, unauthenticated,
no ownership check.

- Removed the static mount, the matching `/files/` proxy in
  `frontend/nginx.conf`, the `/files` Vite dev proxy, and
  `LocalStorage.resolveUrl()` (which produced those paths).
- Added `GET /api/resume/download` behind `requireAuth`, streaming the
  PDF with `Content-Disposition: attachment` and
  `Cache-Control: private, no-store`.
- Ownership is structural, not a check that can be forgotten:
  `resumeService.storageKeyForUser()` derives the key from `req.user.id`
  alone, so no request parameter can point at another user's file. It
  rejects any non-positive-integer id, so nothing can escape the
  `resumes/` prefix.
- Frontend fetches the PDF as a blob with the Bearer header
  (`api.downloadResumePdf()`) — a plain `<a href>` would have 401'd — and
  revokes the object URL on unmount.
- `storageService` gained `exists()` on both drivers. S3 objects stay
  private under the same authenticated route; `S3Storage.resolveUrl()` is
  retained only as a hook for a future direct-to-S3 download.

### 2. Production `AUTH_SECRET` had a fallback (critical)

`config/env.js` now separates "has a dev default" from "may run with it".
Under `NODE_ENV=production`, `AUTH_SECRET` and `DATABASE_URL` have no
fallback and the process refuses to start. `AUTH_SECRET` is additionally
rejected if it matches a known placeholder (case-insensitive, including
the value in `.env.example`) or is under 32 characters. Dev behaviour is
unchanged.

Fixed an edge case the new tests caught: a present-but-blank variable
(`AUTH_SECRET=`) previously passed through as an empty string rather than
falling back.

### 3. Synthetic job data entered market-trend calculations (high)

Fallback postings (`source: 'estimated'`) are synthesized from our own
curated career dataset when Adzuna is unconfigured. Counting them as
demand was circular — the "market" echoed back the skill list already on
file as an observed percentage.

- `jobRepository` gained `SYNTHETIC_SOURCES` plus `excludeSynthetic` on
  `search()`/`countPostings()` (NULL-safe, so legacy rows aren't dropped).
- `trendService` queries real postings only, and every response carries
  `postings_analyzed`, `synthetic_postings_excluded`, `real_data_only`
  and a `note`.
- With no real postings, percentages are `0` (honest "no data", not low
  demand) **and nothing is persisted** — an empty sample could otherwise
  be read back later as though it were a measurement.
- Admin analytics reports real vs synthetic counts separately; `JobsPage`
  shows a "trends unavailable" card instead of a chart of zeros.

### 4. ML feedback was not persistently stored (high)

Ratings are the only training data in the system and cannot be
regenerated, yet they lived in a JSON file inside the ML container —
discarded on every rebuild.

- New `ml-service/app/storage/feedback_store.py`: `JsonFeedbackStore`
  (atomic temp-file write + replace, tolerates a corrupt file) and
  `PostgresFeedbackStore` (`ml_feedback` table), selected by
  `FEEDBACK_STORE`.
- Postgres is **opt-in**, not auto-detected from an ambient
  `DATABASE_URL` — an env var shouldn't silently redirect training data,
  and the test suite stays database-free. An unreachable database
  degrades loudly to the file store rather than taking recommendations
  down.
- `db/migrations/0003_ml_feedback.sql` + `schema.sql`. No `user_id` by
  design: the backend verifies ownership before forwarding, and the model
  only needs the profile shape.
- Both Compose files set `FEEDBACK_STORE=postgres` and mount an
  `ml_models` volume for the trained `.pkl`.
- `GET /health` now reports the active storage driver.

### 5. Feedback didn't verify the user received the recommendation (high)

`submitFeedback()` now looks the `(user, career)` pair up in that user's
own `recommendation_history` first and `422`s if absent — closing a cheap
poisoning path into the one component that learns, and doubling as an
ownership check. The stored career name is forwarded to the ML service
rather than the client's string, and the `recommendation_id` is logged.

### 6. No rate limiting (medium-high — included, though it could have waited)

`middleware/rateLimit.js`, deliberately dependency-free: no rate-limit
package exists in the committed lockfile and adding one would have
desynced it right before setup. Named buckets in one place — auth
(10/15min), resume upload, resume generate, skill extraction,
recommendations, feedback, skill tests, jobs, trends, plus a global
backstop. Authenticated requests key per user so a shared NAT doesn't
pool budgets; `TRUST_PROXY_HOPS` makes `req.ip` correct behind nginx.

**Stated limitation:** counters are per-process, so they reset on restart
and aren't shared across instances. Correct for the current
single-container deployment; move to Redis or the load balancer if the
backend is ever scaled horizontally.

### Not done in this pass

- **HTTPS/TLS (#7)** — belongs to the AWS deployment phase, not local
  setup. Nothing here blocks it.
- **Stale ECS-era deployment docs (#8)** — partially addressed where it
  overlapped with these fixes (`/files` references in
  `AWS_ARCHITECTURE.md`, `README.md`, and an ECS mention in
  `backend/.env.example`), but a full doc sweep is better done after
  deployment validation so the guide matches reality.

### Verification

- `backend/tests/security-hardening.test.js` added — 5 blocks, one per
  fix, each written to fail if the fix is reverted (asserts no route
  under `/files`, no `resolveUrl` on the storage driver, placeholder
  secrets rejected, `excludeSynthetic` on every trend query, feedback for
  an un-recommended career refused and never forwarded to ML, 429 past
  the limit). All 4 backend test files pass.
- `ml-service/tests/test_feedback_store.py` added — 8 tests covering
  round-trip persistence, surviving a new process, corrupt-file
  tolerance, driver selection, and degradation on an unreachable
  database. Full ML suite: 65 passed.
- `npm run build` (frontend) succeeds.
- Not run: anything requiring a live Postgres or a real AWS deployment.

## Pass 14 — Full live audit: every endpoint tested over real HTTP, one bug found and fixed

Requested: verify this is genuinely the best defensible approach, test
every feature for real, and check hosting-readiness. This pass did NOT
change the recommendation architecture or scoring — it's an audit, plus
one small bug fix it turned up.

**What was actually tested (not just unit tests — real running
processes):**
- Booted the FastAPI ML service with `uvicorn` and hit every endpoint
  over real HTTP: `/health`, `/recommend`, `/predict`, `/skill-gap`,
  `/feedback`, `/careers`, `/careers/{name}`, `/extract-skills`,
  `/normalize-skills`, `/skills/predefined`. Also tested edge cases:
  unknown career name (clean 404), empty profile (200, empty list, no
  crash), out-of-range feedback rating (422 via Pydantic validation),
  negative `top_k` (200, empty list, no crash).
- Booted the Express backend with the real `.env.example` config
  (Postgres not installable in this sandbox — apt mirror 404s on
  `security.ubuntu.com`, unrelated to this project). Confirmed it
  degrades honestly rather than crashing: `/api/health` correctly
  reports `503` with the actual connection errors
  (`ECONNREFUSED`/`fetch failed`) instead of pretending to be healthy;
  an unauthenticated request to a protected route correctly `401`s;
  malformed registration input correctly `422`s with per-field messages.
- **Real cross-service integration test**: called the backend's actual
  `mlClient.js` against the live ML service over HTTP (bypassing the
  Express auth/DB layer, since that needs Postgres) and confirmed the
  full request/response shape works, including all the Pass 9-13 fields
  (`market_adjustment`, `fit_label`, etc.) arriving correctly.
- `npm run build` (Vite) — clean, no errors.
- `npm run lint` (oxlint) — 0 errors, 9 pre-existing style warnings, none
  introduced by any pass in this project.
- `node --check` on every backend `.js` file — no syntax errors.
- All 57 ML-service tests + all 3 backend test files pass.

**One real bug found and fixed:** `/normalize-skills`'s `normalized`
field returned the raw, mostly-unresolved input (e.g. `'py'` stayed
`'py'`) instead of the canonical form (`'python'`) that the `synonyms`
list returned alongside it already resolved to correctly — because it
called a narrow, ~9-entry hardcoded abbreviation table
(`_normalize_skill_for_matching`) instead of the full ~120-entry
`SKILL_SYNONYMS` table that `_expand_skill` already correctly consults.
**Scoring/ranking was never affected** — `best_skill_match` (the thing
that actually decides matches during recommendation) always used the
full table directly; this only affected this one endpoint's own
self-consistency. Fixed in `app/main.py` to use `_expand_skill`'s
canonical result; regression test added
(`test_normalize_skills_returns_canonical_form`).

**Answering "is this the best model for the project":** yes, with the
same caveat stated throughout Passes 9-13: the transparent, evidence-
weighted, deterministic scoring architecture is the right choice given
what data is actually available and verifiable (no outcome-labelled
data exists to train a real predictive model on, and this deployment
still has no access to O*NET/ESCO to ground skill importance in
authoritative data — see Pass 13's honest status note). Nothing in this
audit found a reason to prefer a different modeling approach.

**Hosting readiness — concrete checklist**, not just "yes/no":
- ✅ Both services boot cleanly, handle bad input without crashing, and
  talk to each other correctly.
- ✅ Frontend builds cleanly.
- ⚠️ **Not verified in this sandbox**: Postgres connectivity, the actual
  schema migration (`db/schema.sql`), and `docker-compose.yml` (already
  flagged in that file's own header comment as "not build-tested in
  this sandbox" from an earlier pass — still true, no Docker daemon
  available here either). Before hosting: run the schema against a real
  Postgres instance and confirm the app boots against it — this project
  has never had that combination actually executed end-to-end by an AI
  session, only by whoever runs it for real.
- ⚠️ Required env vars before first deploy: `DATABASE_URL`,
  `AUTH_SECRET` (generate a real random value — the example is a
  placeholder), `ML_SERVICE_URL`, `CORS_ALLOWED_ORIGINS` (required in
  production, per its own comment in `.env.example`). `ADZUNA_APP_ID`/
  `ADZUNA_APP_KEY` are optional — the app degrades honestly to
  `source: 'unavailable'` for live market data without them (Pass 10),
  it doesn't fail.
- ⚠️ The frontend bundle is 687 KB (199 KB gzipped) in one chunk — Vite
  warns about this; not an error, but worth code-splitting before
  production if load time matters. Pre-existing, not touched by any
  pass here.

**Verified:** 57/57 ML-service tests, 3/3 backend test files, clean
frontend build, clean lint, and the live HTTP audit above — all in this
pass, on top of everything already verified in Passes 9-13.

## Pass 13 — Priorities 3 & 4 from external review: capped market signal, career-specific experience anchor

Implements two of the five priorities from a follow-up review (Priority 1
"occupation knowledge"/Priority 2 "authoritative skill importance" remain
blocked by the same lack of network access to O*NET/ESCO noted since
Pass 10 — see the note added at the end of this entry). Priorities 3 and
4 required no external data and are implemented here; Priority 5 ("keep
the current architecture, don't force in XGBoost/RandomForest/NN/LLM")
was already true and remains true — no ML model was added or changed.

**Priority 3 — market relevance as a small, capped secondary signal.**
Previously `market_outlook`/`live_market` were purely informational and
never touched ranking (verified by Pass 12's structural test). The
review specifically asked for `Personal Fit + Evidence Strength + small
Market Relevance adjustment, with clear limits`. New
`market_context.market_relevance_adjustment()` maps the career's static
`job_growth` label to a capped ±3-point adjustment (Very High: +3, High:
+1.5, Medium: 0 [neutral], Low: -1.5, Variable: 0 [treated as neutral,
not penalized — genuine uncertainty isn't the same as low demand]).
Added in `recommender.py` AFTER `fit.fit_score` is fully computed —
`fit_score` itself stays 100% market-free (Pass 12's structural test
confirming `fit_scorer.py` never imports `market_context` still passes
unmodified), only the final `confidence` (the actual ranking number)
includes it. The cap (3 points) is smaller than every `WEIGHTS` entry
except certifications (5), so it can nudge between two otherwise-close
careers but can never override a real fit gap — verified directly by a
new test comparing a strong AI/ML-skills profile's score for "AI/ML
Engineer" against "Chef/Culinary Expert" (a career with zero skill
overlap but potentially different demand label) and confirming the
strong-fit career always wins regardless of market swing.

  - Uses the STATIC `job_growth` label, not the live Adzuna feed
    (`live_market`) — documented explicitly in `market_context.py` why:
    live per-request Adzuna data is only fetched for the top 5
    *already-ranked* results (Pass 10, to respect rate limits), which
    structurally means it can't be computed for all 148 careers before
    ranking without a full live query per request or a background
    refresh job (neither exists yet). Noted as the natural next step if
    a background refresh is ever added.

**Priority 4 — career-specific experience expectations.** Previously
every career used the same generic 0-6-year experience-saturation curve.
The dataset has no dedicated seniority field, so a real per-occupation
expectation (e.g. from O*NET's Job Zones) isn't available here — instead,
new `fit_scorer._experience_anchor_years()` derives a per-career anchor
from data already in the dataset: the career's own `education` list, run
through `TextMatcher.split_education` (Pass 9) to find its highest
detected degree level. Doctorate-level careers get a 9-year anchor,
master's-level get 6 (the original default), diploma/bachelor's-only get
4, and careers with no detectable level fall back to 6. Confirmed to
vary sensibly: Data Scientist (lists PhD) → 9.0, Software Developer
(tops out at M.Tech) → 6.0, Nurse/Teacher (diploma/bachelor's-level
entries) → 4.0. Exposed as `experience_years_expected` in the API
response and named in the reasoning text when it differs from the
generic default.

  - Explicitly documented as an indirect proxy, not real occupational
    seniority data — stated plainly in the function's own docstring
    rather than presented as authoritative.

**Priority 1 & 2 status (unchanged from Pass 10):** still blocked. This
sandbox has no network access to O*NET, ESCO, or any other external
occupational taxonomy (`host_not_allowed` on every attempt — verified
again before starting this pass). The skill-importance heuristic (Pass
11: position + cross-dataset specificity) remains the best available
substitute without that access. If real taxonomy data can be supplied
(e.g. uploaded as a file) or network access is enabled in a future
environment, that data should directly replace both the skill-importance
heuristic and inform a more accurate experience-anchor table — the
crosswalk approach is still documented in Pass 10's section above.

**Verified:** 54/54 ML-service tests pass (52 from Pass 12 + 2 new market-
cap tests); the 9-profile realistic evaluation suite still passes with
the same or better results; re-ran the earlier synthetic profile checks
— ranking order unchanged, `market_adjustment` and
`experience_years_expected` populate correctly.

**Not changed:** `fit_scorer.WEIGHTS`, the skill-importance tiering
heuristic (Pass 11), the evidence-tier taxonomy, the education-matching
tier (Pass 9), no new ML model of any kind (Priority 5 — architecture
unchanged by design).

## Pass 12 — Expanded evaluation coverage + targeted validation tests

A second master-prompt review ("build the best possible career
recommendation engine") repeated most of Pass 11's requirements almost
verbatim — confirming they're already addressed — but named two things
not yet covered:

**1. Four more evaluation archetypes (master prompt: "REALISTIC
EVALUATION").** `tests/test_realistic_evaluation.py` now covers 9
profiles instead of 5: added Cybersecurity, Cloud/DevOps, "fresh
graduate with projects but no work experience," and "strong skills but
incomplete education/experience info" — the exact four the prompt named
that Pass 11 didn't yet have. All 9 currently rank an expected career
within the top 2 (8 of 9 at rank 1; Cybersecurity profile ranks Ethical
Hacker #1 and Cybersecurity Analyst #2, both reasonable).

**2. Targeted validation tests (master prompt "VALIDATION" section).**
New `tests/test_engine_validation.py` (10 tests) checks specifically
what CAN be honestly validated without outcome data:
- **Ambiguous-skill rejection:** `java` vs `javascript`, `c++` vs `c#`,
  and a nonsense phrase are all confirmed to NOT fuzzy-match each other.
- **Market/fit separation, structurally:** `fit_scorer.py` is confirmed
  to contain no import of `market_context` (not just "doesn't currently
  use it" — literally cannot import it), `market_outlook()` is confirmed
  to return no numeric fields, and ranking order is confirmed to match a
  pure sort-by-`confidence` (i.e. market data never acts as a tiebreaker
  or sort key).
- **Fair treatment of missing data:** a strong-skills/blank-extras
  profile still surfaces recommendations with `excluded_categories`
  populated and named in the reasoning; blank education doesn't zero out
  unrelated categories.
- **Consistency:** identical input produces byte-identical output across
  repeated calls; adding one irrelevant skill (`Cooking`) to a tech
  profile changes ONLY the one career where it's actually relevant
  (Chef/Culinary Expert) and leaves every other career's score exactly
  unchanged — confirmed by comparing full unfiltered results, not a
  fixed top-N window (an earlier version of this test compared only the
  top-10 window and produced a false failure when Chef legitimately
  entered that window and displaced an unrelated tied score — fixed to
  compare per-career scores directly instead).

**Verified:** 52/52 ML-service tests pass (42 from Pass 11 + 10 new); no
production code changed in this pass — Pass 12 is evaluation/validation
coverage only, confirming Pass 11's engine holds up against a broader,
more specific set of checks.

**Not changed:** no engine, scoring, or dataset code — see Pass 11 for
the last production change.

## Pass 11 — Skill importance tiers, evidence taxonomy, missing-info handling, realistic evaluation

Implements the four structural gaps identified against the "most
trustworthy career recommendation engine" master prompt. No new ML, no
synthetic labels — all deterministic, documented logic. Full detail in
`docs/AI_ML.md` ("Pass 11" section); summary:

**1. Skill importance tiers.** New `ml-service/app/data/skill_importance.py`
derives essential/important/supporting/optional tiers per career from
the existing curated skill lists (position + cross-dataset specificity —
documented as a heuristic, not an authoritative grading, since this
deployment has no O*NET/ESCO access). `evidence.skill_evidence` now
weights matches by importance tier (4x/3x/2x/1x) in addition to the
existing evidence-trust tier, so essential-skill matches meaningfully
outweigh peripheral ones. Skill gaps are now reported split by tier
(`skill_gaps_by_tier`). New tests: `tests/test_skill_importance.py` (6
tests).

**2. Evidence-tier taxonomy (CLAIMED/INFERRED/VERIFIED).** Formalizes
Pass 10's trust tiers into these explicit terms in the API response
(`claimed_skills_matched`, `inferred_skills_matched`,
`verified_skills_matched`) and reasoning text. New separate **Evidence
Strength** dimension (`evidence_strength`, `evidence_strength_label`) —
average reliability of matched skills, reported alongside but never
blended into the Fit Score.

**3. Missing-information handling.** `fit_scorer._redistribute_weights`
detects when certifications/projects are genuinely blank (vs. weak) and
redistributes their point-weight proportionally across categories that
DO have data, rather than scoring a hard 0 — disclosed via
`excluded_categories` and named in the reasoning text. Years-of-experience
is deliberately excluded from this (tried, then reverted — see the fix
below); the 0-6-year curve's 0-anchor is legitimate signal, not a
mistreated blank, and this data model can't distinguish "blank" from
"explicitly 0" for a numeric field.

  - *Fix during implementation:* initially included 'experience' in the
    redistributable set, which broke
    `test_experience_increases_score_monotonically` — 0 (unentered) years
    scored higher than a real 2 years because 0-years' weight got
    reallocated. Removed experience from redistribution rather than
    weaken the test, since the perverse ranking was the actual bug, not
    the test.

**4. Realistic evaluation suite (master prompt section 16).** New
`tests/test_realistic_evaluation.py`: five hand-written profiles (full-
stack, data, AI/ML, design, mechanical — the exact archetypes requested),
checked against the live engine output with no hard-coded answers in
the engine/dataset. All five currently rank their expected career #1:
Web Developer, Data Scientist, AI/ML Engineer, UI/UX Designer, and
Mechanical Engineer respectively. Reported as a pass/fail per profile,
not a synthetic aggregate accuracy number (section 17).

**Frontend:** `RecommendationsPage.jsx` now shows the fit label,
evidence-strength label, and lists essential skill gaps first.

**"Readiness":** exposed as an explicit alias of `fit_label`
(`readiness_label`), documented in `docs/AI_ML.md` as intentionally NOT
a separately-computed metric — there's no data source that would
meaningfully distinguish it from Fit without fabricating one.

**Verified:** all 34 pre-existing ML-service tests + 8 new tests (42
total) pass; all 3 backend test files pass unmodified; re-ran the 4
synthetic profile checks from prior reviews — ranking order unchanged,
scores shifted upward for profiles with blank certifications/projects
(expected, per the missing-info fix), new fields populate correctly.

**Not changed:** `fit_scorer.WEIGHTS` base values, the live-market
signal layer (Pass 10), the education field-matching tier (Pass 9), the
feedback-calibration model, and every category not named above.

## Pass 10 — Live market signal, graded skill trust, expanded vocabulary

Three changes, scoped and tested independently, addressing gaps found
during a full-pipeline review:

**1. Live market data now reaches recommendations (it didn't before).**
Adzuna was already integrated for the standalone jobs/trends pages
(`jobService.js`) but never touched career recommendations —
`market_outlook` was 100% static curated data. New
`backend/src/services/marketSignalService.js` fetches a live Adzuna
snapshot (posting-sample count, observed salary range) for the top 5
ranked recommendations at request time, cached 6h per (career,
location) to respect rate limits, and attaches it as a new `live_market`
field — kept strictly separate from `fit_score`/ranking, same philosophy
as the existing `market_outlook`. Falls back to an honest
`source: 'unavailable'` (never a fabricated number) when Adzuna isn't
configured or the call fails; never breaks the recommendation request.
New `jobService.liveMarketSnapshot()` (read-only, doesn't persist to
`job_postings`). Surfaced in `RecommendationsPage.jsx` and documented in
`API_DOCUMENTATION.md`/`AI_ML.md`. New test:
`backend/tests/market-signal.test.js` (fallback behavior, top-K scoping,
ranking-order preservation, caching, error handling).

**2. Skill trust weighting: three tiers instead of two.**
`ml-service/app/engine/evidence.py`'s `skill_evidence` previously only
distinguished self-reported (1.0x) vs test-verified (1.5x). Added a
middle tier — project-demonstrated (1.25x): not test-verified, but the
skill's name is actually found in the user's own project description
text (reusing the existing `text_mentions_skill` check `project_evidence`
already relies on). Applied inside the coverage calculation, never as a
bolt-on bonus. New `project_demonstrated_skills_matched` field in the
API response and its own line in the reasoning text. Verified with a
direct test: identical skills score 0.157 (self-reported only) < 0.196
(project-demonstrated) < 0.235 (test-verified) trust-weighted coverage.

**3. Expanded `SKILL_SYNONYMS`.** The original table had ~40 entries,
almost entirely tech-focused, missing common tools/frameworks even
within tech and leaving finance/healthcare/legal/business/creative/
engineering domains with near-zero synonym coverage. Added ~80 more
entries across all of those domains. This is manually curated from
domain knowledge, not imported from a live external taxonomy — this
deployment has no network access to O*NET/ESCO, so `docs/AI_ML.md` now
has an explicit provenance table and documents the offline-crosswalk
path for a future environment that does have that access, rather than
claiming an integration that isn't actually there.

**Verified:** all 34 ML-service tests and all 3 backend test files
(including the new one) pass unmodified/extended; re-ran the 4 synthetic
profile checks from the prior review — ranking order unchanged, new
fields populate correctly, no regressions to the two prior reviews'
findings (verified-skill weighting, education field-of-study matching).

**Not changed:** `fit_scorer.WEIGHTS`, the ranking formula itself, the
feedback-calibration model, and every other evidence category.

## Pass 9 — Education scoring: degree-level + field-of-study partial match

**Problem found during review:** `evidence.education_evidence` only ever
matched a user's stated education against the literal strings in a
career's small curated `education` list (e.g. Data Scientist's
`['B.Tech', 'M.Tech', 'B.Sc Statistics', 'MCA', 'B.Sc Mathematics', 'MBA
Analytics', 'PhD']`). A real, clearly-relevant degree phrased differently
- e.g. `"M.Sc. Data Science"` - matched nothing and scored 0/10, because
those lists are a handful of representative examples per career, not an
exhaustive degree taxonomy.

**Fix (`ml-service/app/engine/text_match.py`, `evidence.py`,
`fit_scorer.py`):**
- Added `TextMatcher.split_education(text)`, which splits a free-text
  degree string into `(level_rank, field_of_study)` using a fixed alias
  table (diploma=1, bachelor's=2, master's=3, doctorate=4; `"Any
  Graduate"`/`"Self-taught"`/`"Bootcamp"`-style text is level-neutral, not
  guessed at).
- `education_evidence` is now two-tier:
  - **Tier 1 (unchanged, full credit, score 1.0):** literal/fuzzy match
    against the career's curated education list - the strongest signal,
    an anticipated listed credential.
  - **Tier 2 (new, partial credit, score 0.6):** if no literal match,
    split the user's degree into level + field and check whether the
    field overlaps with the career's own skills/interests vocabulary or
    the field text embedded in its own education entries (e.g. `"MBA
    Analytics"` contributes the field term `"analytics"`). Blocked only on
    an unambiguous level mismatch (user's level below every level the
    career's list mentions) - never used to add credit, only to avoid
    rewarding e.g. a Diploma against a Master's-only list.
- Deliberately conservative: verified against unrelated-field cases
  (`"MBA Marketing"`, `"Diploma in Fashion Design"` vs Data Scientist) to
  confirm they still score 0 - the fix adds recall for genuine variants
  without opening up false positives.

**Verified:** existing 34-test suite still passes unmodified; re-ran the
4 synthetic realistic profiles from the original engine review - rankings
unchanged in order, education component now contributes correctly
wherever a real (non-listed) degree variant applies.

**Not changed:** `fit_scorer.WEIGHTS` (education is still worth 10/100),
the exact-match tier's behavior/score, and every other evidence category.

## Pass 8 — Unified candidate-profile pipeline (manual / uploaded resume / Resume Builder)

Career recommendations previously only ever read the stored `profiles`
row. This pass adds two more ways to feed the *same* existing ML
pipeline — an uploaded PDF/DOCX resume, and the in-app Resume Builder's
own structured data — without forking the prediction logic, retraining
the model, or generating-then-reparsing a PDF.

**New backend files**
- `backend/src/services/candidateProfileService.js` — the single
  canonical candidate shape (`education, skills, interests,
  experience_years, certifications, projects`) and the converters into
  it from each source (`fromProfile`, `fromResumeBuilderData`,
  `fromReviewedExtraction`, `merge`). Skills/interests/certifications
  are de-duplicated case-insensitively on every conversion.
- `backend/src/services/resumeExtractionService.js` — parses an
  uploaded PDF (`pdf-parse` v2) or DOCX (`mammoth`) into a best-effort
  structured extraction (email/phone/summary/education/skills/
  certifications/interests/projects/experience entries), using common
  resume-heading aliases to split sections. Skill detection reuses the
  existing ML-service `/extract-skills` endpoint via `skillService` —
  no second skill-matching implementation. Nothing is persisted;
  malformed/empty/unreadable files raise a clean `ApiError(422, ...)`.
- `backend/src/middleware/upload.js` — `multer` config for
  `POST /resume/upload`: in-memory storage (nothing written to disk),
  extension + MIME allow-list, size cap (`RESUME_UPLOAD_MAX_MB`,
  default 5&nbsp;MB).
- `backend/src/validators/candidateValidators.js` — validates `source`
  and the reviewed `candidate` body for the `resume_upload`/`merge`
  sources.
- `backend/tests/candidate-pipeline.test.js`,
  `backend/tests/resume-extraction.test.js`, `backend/tests/run-all.js`
  — no-DB regression tests (mocks the repository/mlClient boundary with
  `proxyquire`, a new devDependency) wired to `npm test`. Includes the
  master-prompt's "consistency test": the same skills entered manually
  vs. via a reviewed resume-upload converge to an identical canonical
  skills string before hitting the ML call.

**Modified**
- `backend/src/services/recommendationService.js` — rewritten around
  `resolveCandidateProfile(userId, { source, candidate })`, which
  branches on `source` (`profile` default / `resume_builder` /
  `resume_upload` / `merge`) but always ends at the same
  `mlClient.recommend()` call. `source` is now also stored on each
  `recommendation_history` row.
- `backend/src/services/resumeService.js` — `buildResumeData()` now
  also returns `experience_years` (from the profile) alongside the
  existing `experience` job-history array, so the Resume Builder path
  has a years-of-experience figure to send to the ML service. Additive;
  no existing caller reads a field by that name, so nothing else
  changes behavior.
- `backend/src/controllers/recommendations.controller.js`,
  `backend/src/controllers/resume.controller.js`,
  `backend/src/routes/resume.routes.js` — wired the new
  `POST /resume/upload` endpoint and the extended
  `POST /recommendations` body (`source`, `candidate`).
- `backend/src/repositories/recommendationRepository.js` —
  `insertMany` now takes and stores a `source` (defaults to
  `'profile'`, so existing call patterns are unaffected).
- `backend/src/middleware/errorHandler.js` — translates `MulterError`
  (oversized/unexpected file) into the same clean JSON error shape as
  every other endpoint, instead of a raw 500.
- `frontend/src/services/api.js` — added `uploadResume(file)`
  (multipart); `generateRecommendations(topK, opts)` now accepts
  `{ source, candidate }`, defaulting to prior behavior when omitted.
- `frontend/src/pages/ResumePage.jsx` — added "Analyze career from this
  resume" (Resume Builder source) and an upload → review → "Use this
  for career analysis" flow for uploaded resumes, including a "merge
  with my existing profile" option. Never auto-submits an extraction —
  the user reviews/edits every field first.
- `frontend/src/pages/RecommendationsPage.jsx` — shows which source
  produced the current results and each history row, and surfaces the
  ML service's existing (previously unused on the frontend) `reasoning`
  field per recommendation.

**Database**
- `db/migrations/0002_add_recommendation_source.sql` — additive,
  backward-compatible: `recommendation_history.source VARCHAR(30) NOT
  NULL DEFAULT 'profile'`. `db/schema.sql` updated to match.

**Fixed along the way**
- `pdf-parse` 1.x failed (`bad XRef entry`) on a syntactically valid
  PDF (confirmed valid via `qpdf --check` and `pdftotext`) — a known
  limitation of that unmaintained major version's bundled PDF parser.
  Upgraded to the actively-maintained `pdf-parse` 2.x, migrated to its
  `PDFParse` class API, and stripped its `-- N of M --` page-marker
  text from extracted content.
- `multer` 1.x flagged known CVEs on install; used 2.x instead (no code
  impact — same API used here).

**Config**
- `backend/.env.example` — added `RESUME_UPLOAD_MAX_MB`.

**Not changed**
- The ML service, the trained model, `advanced_ml_predictor.py`'s
  scoring/matching logic, and every existing profile-only
  recommendation flow are untouched — `source` omitted (or `"profile"`)
  reproduces the exact prior request/response shape.

## Pass 7 — Pre-deployment review fixes: persistent backend storage

A pre-deployment code/config review flagged six items. Five required no
code change (already correct, or intentionally deferred); one was a
real gap, fixed:

1. **Fixed** — `docker-compose.prod.yml`'s `backend` service had no
   volume for `/app/storage`, so every redeploy (`docker compose up -d
   --build`) would silently wipe all previously generated resume PDFs
   (`STORAGE_DRIVER=local` writes there — see
   `backend/src/services/storageService.js`'s `LocalStorage`, and
   `backend/.env.example`'s `LOCAL_STORAGE_PATH=./storage`, which
   resolves to `/app/storage` given the Dockerfile's `WORKDIR /app`).
   Added a named `backend_storage` volume mounted at `/app/storage`,
   declared under the top-level `volumes:` alongside `pgdata`.
2. **No change** — keep `STORAGE_DRIVER=local` for the initial
   deployment; `S3Storage` remains available (`STORAGE_DRIVER=s3`) but
   is intentionally not adopted yet.
3. **No change** — `AUTH_SECRET`/`POSTGRES_PASSWORD` must be set to
   real generated values in the real (never-committed) `backend/.env`
   and root `.env` before deploying; this was already documented in
   `docs/AWS_SETUP_GUIDE.md` step 10 and both `.env.example` files.
4. **No change, confirmed already correct** — `docker-compose.prod.yml`
   only publishes `nginx`'s port 80 (`postgres`/`ml-service`/`backend`
   use `expose`, not `ports`), and
   `infrastructure/terraform/security.tf`'s security group has no
   ingress rule for 4000/8000/5432.
5. **Deferred, on purpose** — no TLS/HTTPS changes yet; will be
   configured after initial deployment and domain setup, not modified
   blindly beforehand.
6. **Deferred, on purpose** — EC2 instance size (`t3.micro`) unchanged;
   evaluate real resource usage after the initial deployment before
   resizing.

## Pass 6 — Remove SNS

`infrastructure/terraform/cloudwatch.tf` created an `aws_sns_topic` as
a notification target for the CPU alarm, with no subscription attached
— SNS wasn't a genuine requirement (the master prompt explicitly
excludes it) and the topic added a resource with no real use beyond
being a nominal `alarm_actions` target. Removed the `aws_sns_topic`
resource and the `alarm_actions`/`ok_actions` referencing it; the
`aws_cloudwatch_metric_alarm.high_cpu` alarm itself is unchanged and
still fully visible in the CloudWatch console (Alarms → In alarm/OK),
it just has no notification action attached. Updated
`docs/AWS_ARCHITECTURE.md`, `docs/AWS_SETUP_GUIDE.md`, and
`docs/AWS_COST_AND_TEARDOWN.md` to match. Re-verified with
`terraform-config-inspect`: zero diagnostics, no dangling references,
17 resources (was 18).

## Pass 5 — AWS deployment (low-cost, single-EC2 architecture)

An earlier draft of this pass built a fuller ECS Fargate + ALB + RDS +
ECR architecture; that was discarded (see the notes in
[docs/AWS_ARCHITECTURE.md](./docs/AWS_ARCHITECTURE.md#why-this-shape-not-ecsfargaterdsalb))
in favor of a much smaller one, per an explicit low-cost/learning
priority: one EC2 instance running Docker Compose behind Nginx,
provisioned by Terraform.

**Application changes** (deployment-config only, no rewrite):
- `backend/src/services/storageService.js`: added a real `S3Storage`
  class (optional, `STORAGE_DRIVER=s3`) alongside the existing
  `LocalStorage`, using `@aws-sdk/client-s3` +
  `@aws-sdk/s3-request-presigner` (lazy-required so local dev never
  needs them installed). Both drivers share one async
  `save/read/resolveUrl` interface. This also fixed a latent bug:
  `resolveUrl()` had been synchronous, which is incompatible with S3's
  presigned-URL generation (an async AWS SDK call) — it's now `async`
  on both drivers, and the one call site (`resumeService.js`) now
  `await`s it.
- `backend/src/app.js`: CORS is now configurable via
  `CORS_ALLOWED_ORIGINS` (comma-separated) instead of a bare `cors()`
  allowing any origin — empty in local dev, locked down in production.
- `backend/.env.example`, `backend/src/config/env.js`,
  `backend/package.json`: added `AWS_REGION`, `S3_BUCKET_NAME`,
  `S3_PRESIGNED_URL_TTL_SECONDS`, `CORS_ALLOWED_ORIGINS`, and the two
  new AWS SDK dependencies.
- Verified (not just syntax-checked): installed the new dependencies in
  a scratch copy of `backend/`, confirmed `storageService.js` loads
  correctly and both drivers' methods are callable with real AWS SDK
  classes present, and confirmed `app.js` still loads with the new CORS
  logic. Full `backend/src` `node --check` sweep re-run afterward.

**New deployment artifacts:**
- `frontend/Dockerfile.prod` + `frontend/nginx.conf` — production image
  serving the React build via Nginx and reverse-proxying `/api` +
  `/files` to the backend container. (Caught and fixed a real bug while
  writing this: `frontend/src/services/api.js` builds requests as
  `${API_BASE}/api${path}`, so `VITE_API_BASE_URL` must be left empty
  for relative same-origin requests — setting it to `/api` would have
  produced a double `/api/api/...` prefix.)
- `docker-compose.prod.yml` + root `.env.example` — the EC2 stack
  (`postgres`, `ml-service`, `backend`, `nginx`); only `nginx` publishes
  a host port, matching the "don't expose 4000/8000/5432 publicly"
  requirement, with a Postgres healthcheck gating backend startup.
- `infrastructure/terraform/`: `provider.tf`, `versions.tf`,
  `variables.tf`, `network.tf` (VPC + one public subnet, no NAT/private
  subnets), `security.tf` (SSH restricted to one IP; 80/443 public;
  no rule for 4000/8000/5432), `iam.tf` (EC2 role scoped to exactly
  CloudWatch Logs write + optional S3 put/get/delete on one bucket —
  no static credentials anywhere), `s3.tf` (optional, `enable_s3`
  toggle, all public access blocked, AES-256 encryption), `cloudwatch.tf`
  (one log group + one optional CPU alarm), `ec2.tf` +
  `user_data.sh.tftpl` (Ubuntu 22.04, bootstraps Docker + Compose
  plugin + CloudWatch agent only — deliberately does not clone/deploy
  the app itself, so redeploying app code never requires touching
  Terraform), `outputs.tf`, `terraform.tfvars.example`.
- `backend/Dockerfile` comment updated — it's now used for both local
  Docker testing and the EC2 production deployment (no separate prod
  Dockerfile needed for the backend; it already installed
  production-only deps and used env vars).

**New documentation:** `docs/AWS_ARCHITECTURE.md`,
`docs/AWS_SETUP_GUIDE.md`, `docs/AWS_TROUBLESHOOTING.md`,
`docs/AWS_COST_AND_TEARDOWN.md`, `docs/INTERVIEW_HANDBOOK.md`. Updated
`README.md` (replaced the old "AWS readiness" aspirational section with
an actual deployment summary) and `HANDBOOK.md` (current status,
repo layout, conventions, next steps).

**Verification boundary — read before assuming this is live:** no AWS
account, Terraform CLI, or Docker daemon was available in this
environment. What WAS done: `terraform-config-inspect` parsed every
`.tf` file with zero diagnostics and all resource/variable references
resolving; `user_data.sh.tftpl` was rendered with sample values and
syntax-checked with `bash -n`; both `docker-compose*.yml` files were
validated as syntactically correct YAML. What was NOT done: any real
`terraform plan`/`apply`, any container actually building or running,
any live HTTP request through Nginx. Treat the first real
`terraform apply` (per `docs/AWS_SETUP_GUIDE.md`) as this
infrastructure's actual first test.

## Pass 4 — Pre-Git fixes (Docker, comments)

Source-level review before moving to Git flagged a Docker networking
bug and some stale cleanup items. Fixed:

- **Frontend → backend URL in Docker** (🔴 functional bug): the
  frontend's production build (served via `serve` in the frontend
  container) had no way to reach the backend — Vite's dev-server proxy
  doesn't exist in a production build, and `VITE_API_BASE_URL` must be
  baked in at *build* time. Fixed by adding a `VITE_API_BASE_URL` build
  `ARG`/`ENV` to `frontend/Dockerfile` and wiring it as a build arg in
  `docker-compose.yml` (`http://localhost:4000`, since browser JS runs
  on the host, not in the Docker network).
- **Per-service `.dockerignore`**: added `frontend/.dockerignore`,
  `backend/.dockerignore`, `ml-service/.dockerignore` (in addition to
  the existing repo-root `.dockerignore`), since `docker-compose.yml`
  builds each service from its own subdirectory context.
- **PostgreSQL healthcheck**: added `pg_isready` healthcheck to the
  `postgres` service and changed `backend`'s dependency to `condition:
  service_healthy`, removing a startup race condition.
- **Stale comments removed**: "once auth lands in Phase 2"
  (`backend/.env.example` — auth was already implemented), "Phase 1
  shipped these as 501 placeholders" (`backend/src/routes/index.js` —
  no placeholders remain), `"(Phase 1 skeleton)"` in
  `backend/package.json`'s description.
- Left alone per explicit recommendation: ML dependency pins, JWT/
  `localStorage` auth strategy, permissive CORS — all fine for local
  dev, revisit before AWS/production only.

## Pass 3 — Documentation, migrations, validators

Filled gaps identified against a target-architecture checklist:

- Added `docs/ARCHITECTURE.md`, `docs/API_DOCUMENTATION.md`,
  `docs/DATABASE.md`, `docs/AI_ML.md`, `docs/LOCAL_SETUP.md` — written
  from the actual code (routes, schema, ML endpoints), not templated
  boilerplate.
- Added `/.dockerignore` at the repo root.
- Added `db/migrations/0001_baseline.sql` + `db/migrations/README.md`
  — previously only a single `db/schema.sql` existed with no migration
  history tracking.
- **Expanded backend validators**: `profile`, `resume`, `skill-tests`,
  and `game/play` endpoints previously accepted request bodies with
  little to no field-level validation (unlike `/auth`, which already
  had `authValidators.js`). Added `profileValidators.js`,
  `resumeValidators.js`, `skillTestValidators.js`, `gameValidators.js`
  following the same pattern (throw structured `ApiError(422, {field:
  message})`), and wired each into its controller.
- Updated `README.md` (structure + new docs table) and
  `docs/SECURITY.md` (validation section) to reflect the above.
- Verified: every new/edited backend file passes `node --check`; full
  `backend/src` tree syntax-swept afterward with no failures.
- Explicitly left untouched (already correct, no bug found): core
  ML/data modules, existing controllers/services, Dockerfiles.

## Pass 2 — Feature implementation (Phases 2–5)

Not documented turn-by-turn here since it predates this changelog, but
summarized in `README.md`'s "What was converted / preserved / improved"
sections and `PHASE1_NOTES.md`'s tail. In short: every domain in the
architecture doc's API list got a real `controller → service →
repository` implementation (auth, profile, careers,
recommendations, skills, skill-tests, roadmaps, resume, ATS, jobs,
trends, game, analytics/admin), replacing the `501` placeholders from
Phase 1. The React frontend, PostgreSQL schema, and Docker artifacts
were built out to match. See `README.md`'s "Testing status" table for
what was manually verified against a live stack in this pass.

## Pass 1 — Phase 1 foundations

The original handoff: PostgreSQL schema + SQLite migration script, an
Express backend skeleton (health check + `501` placeholders for every
planned route), and a FastAPI ML microservice wrapping the
pre-existing trained model and `career_dataset.py` unmodified. Full
details, including a real bug found and fixed in the predictor's
dataset import path, in [PHASE1_NOTES.md](./PHASE1_NOTES.md).

---

## How to add an entry

When you finish a pass of work, add a new section at the **top** of
this file (below the title), following the format above: a short pass
name, then bullet points of what changed and why, with enough
specificity that someone skimming won't re-propose something already
done. Keep entries factual and scoped to what actually changed in that
pass — this file is a trail, not a marketing summary.
