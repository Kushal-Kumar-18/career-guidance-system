# AI / ML

## Why this was rewritten

The original implementation had a serious methodological problem: its
"ML model" (`perfect_model_v5.pkl`, a `HistGradientBoostingRegressor`)
was trained on labels computed by the same module's own rule-based
`_calc_fuzzy_score(...)` function, then blended back with that fuzzy
score inside a tight ±6-point corridor at prediction time. That produced
a model that reported a suspiciously perfect validation R² (0.9993 —
because it was learning to reproduce a deterministic formula, not
real-world career suitability) while adding no independent signal.
On top of that, several hand-tuned "bonus" adjustments (additive
verified-skill bumps, growth-rate multipliers baked into a fabricated
`success_probability` field) made rankings look mathematically polished
without being any more trustworthy, and education/certifications were
captured in the user profile but never actually used in scoring.

This has been replaced with an **explainable, evidence-based fit
scorer**, plus exactly one real ML component that only ever learns from
actual user feedback. See `ml-service/app/engine/` for the implementation
and `ml-service/app/predictors/advanced_ml_predictor.py`'s module
docstring for the full before/after rationale.

## Architecture (`ml-service/app/engine/`)

| Module | Responsibility |
|---|---|
| `text_match.py` | Normalization, synonym expansion, and domain-aware fuzzy matching only. No scoring. |
| `evidence.py` | Per-category evidence extraction: skills, verified skills, interests, education, certifications, experience, projects. Each returns matched/missing items + a 0..1 strength score for that category alone. |
| `fit_scorer.py` | The **one** transparent, documented, fixed-weight formula that turns evidence into a 0-100 **Fit Score**, with a full component breakdown. |
| `market_context.py` | Qualitative job-market reference info (from the curated dataset's `job_growth`/`salary_range` fields), kept explicitly separate from the fit score — never blended into a fabricated probability. |
| `feedback_model.py` | The **only** ML component: a small Ridge regression trained exclusively on real recorded user feedback ratings. Inactive until enough real data exists. |
| `recommender.py` | Orchestrates the above into ranked, explainable recommendations with evidence-grounded reasoning text. |

`advanced_ml_predictor.py` is now a thin compatibility shim exposing the
same class/method names the rest of the app already imports
(`AdvancedHybridCareerPredictor.predict_career_hybrid`,
`._compute_skill_overlap`, `.record_user_feedback`, `.get_model_info`,
`.ml.*` text-normalization helpers) — nothing outside the ML service had
to change.

## The Fit Score

A fixed, documented weighting (`fit_scorer.WEIGHTS`, sums to 100):

| Category | Points | What it measures |
|---|---|---|
| Skills (trust-weighted coverage) | 35 | Fraction of the career's typical skills the profile has; a verified skill (backed by a skill-test result) counts for **1.5x** an unverified/self-reported one, applied inside the coverage calculation itself — not as a bonus added afterward. |
| Skill match quality | 10 | How confident the matched skills are (exact/synonym match vs a looser fuzzy match). |
| Interests | 15 | Overlap between stated interests and the career's typical interest profile. |
| Experience | 15 | Years of experience on a simple, transparent 0→6-year saturation curve. |
| Education | 10 | Whether stated education matches a typical path into the career. Two-tier: an exact/listed-degree match earns full credit; a real degree not literally in the career's curated list (e.g. "M.Sc. Data Science") can still earn partial credit (0.6) if its level + field of study genuinely line up - see `TextMatcher.split_education` and Pass 9 in the changelog. |
| Certifications | 5 | Whether stated certifications match the career (matched against its education/skill vocabulary — the dataset has no dedicated certification field per career). |
| Projects | 10 | Whether described project text actually mentions skills relevant to the career (not just "has any project: yes/no"). |

**What the Fit Score is:** an estimate of how well a profile's
*documented evidence* lines up with what a career typically expects, with
every component individually visible in the API response
(`score_breakdown.components` / `.components_max`) so a person can see
exactly why Career A outranked Career B.

**What it is NOT:** a prediction of real-world job-market success,
interview performance, or hiring odds. The system has no outcome data to
model those from, so it doesn't claim to. This is why there is no
`success_probability` field anywhere in the response — replaced by
`market_outlook`, which is explicitly qualitative and sourced from
static curated reference data, never a personal probability.

Careers below `MIN_FIT_SCORE_TO_SHOW` (12 points) are dropped from
results entirely — not penalized, just not surfaced, so an unrelated
domain doesn't clutter a top-5 list.

## The feedback-calibration model — the only real ML

`feedback_model.py` trains a small Ridge regression that predicts the
1-5 satisfaction rating a user is likely to give a recommendation, using
the same 0..1 evidence fractions the fit scorer computes as features. It:

- trains **exclusively** on real ratings submitted via `POST /feedback`
  (see below) — never on the fit score itself, and never on any
  synthetically generated label;
- stays **inactive** (no bundled pretrained weights, no synthetic
  bootstrap data) until at least 25 ratings across at least 4 distinct
  careers have been recorded — `get_model_info()` reports this status
  honestly rather than silently substituting something that knows less
  than it claims;
- when active, can only nudge a career's final score by **±6 points**
  (`recommender.MAX_FEEDBACK_ADJUSTMENT`) — a handful of noisy ratings
  can never override the transparent fit score, only calibrate it
  slightly;
- reports its own validation MAE (mean absolute error against held-out
  ratings) rather than a headline R² computed on its own training
  signal, and its `note` field never uses the word "probability".

Every time feedback is recorded, features for **all** stored feedback
records are recomputed against the *current* fit scorer before refitting
— so the model never trains on stale features from a scorer version that
may since have changed.

## Feedback loop (end-to-end)

1. Frontend: after a recommendation is shown, the person can rate it 1-5
   (`RecommendationsPage.jsx`'s `FeedbackWidget`).
2. `POST /api/recommendations/feedback` (backend) → **verifies the rating
   refers to a recommendation this user actually received** (a lookup
   against their own `recommendation_history`; `422` otherwise) →
   re-resolves the user's current profile → `POST /feedback` (ML
   service), forwarding the *stored* career name rather than the
   client-supplied string.
3. ML service persists the rating through its feedback store
   (`app/storage/feedback_store.py`) and calls
   `retrain_feedback_model()`, which recomputes features for every stored
   rating and refits if the activation thresholds are now met.
4. Future `/recommend` calls automatically pick up the (possibly newly
   active) calibration model — no restart required.

### Why those two properties matter

**Provenance (step 2).** This endpoint is the only place a client can put
data into a model. Without the history check, anyone with a valid token
could post arbitrary `(career, rating)` pairs for careers they were never
shown — a cheap way to steer the one component that learns. The check is
scoped to the caller's own rows, so it also stops one user rating
another's recommendation.

**Durability (step 3).** These ratings are the only training data in the
system and cannot be regenerated from anything else. They used to be
appended to a JSON file inside the ML container's filesystem, so every
`docker compose up --build` silently discarded whatever had been
collected since the last image build — and the model would quietly drop
back to "inactive" with no explanation. Storage is now selected by
`FEEDBACK_STORE`:

| Value | Where ratings go | When to use |
|---|---|---|
| `postgres` | `ml_feedback` table in the shared database | Any real deployment. Both Compose files set this. Survives container recreation and is backed up with everything else. |
| `json` | JSON file in the model directory | Default; keeps local dev and the test suite database-free. Only durable if that directory is on a mounted volume — Compose mounts one. |

Postgres is opt-in rather than auto-detected from an ambient
`DATABASE_URL`, so an environment variable can't silently redirect where
training data goes. If Postgres is requested but unreachable, the service
degrades loudly to the file store rather than failing: losing
recommendations entirely would be worse than degraded durability.

Ratings are stored raw (rating + profile snapshot), never as precomputed
feature vectors, so improving the career dataset or the scorer
retroactively improves the model instead of leaving it fitted to stale
features. `GET /health` reports the active storage driver, so a
deployment can be checked for the "collecting feedback into an ephemeral
filesystem" failure mode without reading logs.

## Why a separate service instead of an in-process call

The Python ML code runs as its own FastAPI service so that:

1. The Node backend never needs a Python runtime.
2. The engine can be scaled, restarted, or redeployed independently of
   the API tier.
3. `GET /health` on the ML service reports `model_loaded` status and a
   full `model_info` block distinctly from the API's own health.

The Node backend is a thin proxy (`backend/src/services/mlClient.js`
using axios, `ML_SERVICE_URL` + `ML_SERVICE_TIMEOUT_MS` from env) — it
never reimplements matching/scoring logic in JavaScript.

## Request flow — generating a recommendation

1. Frontend: `POST /api/recommendations` (optional `top_k`).
2. Backend `recommendationService.generate()`: loads the user's
   `profiles` row and verified skills (from `skill_test_results`),
   calls `mlClient.recommend({...})`.
3. ML service `/recommend`: runs `predictor.predict_career_hybrid(...)`
   (now backed by the engine above) against the 148-career dataset,
   returns ranked careers with fit scores, matched/missing skills,
   market outlook, a full score breakdown, and evidence-grounded
   reasoning.
4. Backend persists the run to `recommendation_history` and returns it
   to the frontend in the standard envelope.

Skill-gap analysis (`GET /api/skills/gap?career=`) follows the same
pattern against `predictor._compute_skill_overlap(...)` via the ML
service's `/skill-gap` endpoint.

## Endpoints exposed by the ML service

`/recommend`, `/predict` (alias), `/skill-gap`, `/feedback`, `/careers`,
`/careers/{name}`, `/extract-skills`, `/normalize-skills`,
`/skills/predefined`, `/health`. See
[API_DOCUMENTATION.md](./API_DOCUMENTATION.md#ml-service-internal--not-exposed-directly-to-the-frontend)
for request/response shapes.

## Configuration

`ml-service/.env.example`:

```
ML_SERVICE_HOST=0.0.0.0
ML_SERVICE_PORT=8000
ML_MODEL_PATH=app/data/ml_models/feedback_calibration_model.pkl
```

`ML_MODEL_PATH` now points at the **feedback-calibration model** (see
above), not a pretrained "career suitability" model — there is no such
thing checked into the repo, deliberately. The engine works fine without
this file present; it's only ever written once real feedback triggers
training. If somehow the file is missing/corrupt, `predictor_singleton.py`
still starts up (the feedback layer just stays inactive) — the engine
only reports `"status": "degraded"` on `/health` if the whole predictor
fails to construct.

## Performance

Domain-compatibility checks, skill normalization, and synonym expansion
are cached per `TextMatcher` instance (`app/engine/text_match.py`) since
they're pure functions of their input strings computed repeatedly across
148 careers per request — this took a single `/recommend` call from
~3.4s to ~0.4s during development. The `TextMatcher` (and therefore its
caches) lives for the lifetime of the singleton predictor, so the cache
also warms up across requests, not just within one.

## Known limitations

- The fit-score weights (`fit_scorer.WEIGHTS`) are a documented
  career-counseling heuristic, not something fit to outcome data —
  there is no outcome dataset in this system to fit them to. They are
  applied identically to every profile and every career, which is the
  honest alternative to inventing precision the system doesn't have.
- The feedback-calibration model will realistically take a while to
  reach its activation threshold in a small deployment. Until then,
  `/recommend` runs on the fit score alone, and this is reported
  transparently via `get_model_info()['feedback_model']`.
- Gamification scenario scoring and ATS resume scoring are separate,
  simpler rule-based implementations in the Node backend
  (`gameService.js`, `atsService.js`) — they don't call the ML service;
  only career recommendation and skill-gap analysis go through this
  engine.

## Dataset provenance — what's empirically-sourced vs. curated vs. estimated (Pass 10)

| Data | Source | How current |
|---|---|---|
| Career skill/interest/education lists, salary ranges, `job_growth` labels | Manually curated by the project (`career_dataset.py`) | Static snapshot, not a live feed |
| `SKILL_SYNONYMS` / `INTEREST_SYNONYMS` | Manually curated from general occupational/domain knowledge | Static, extended over time |
| `live_market` (postings count, observed salary range) | **Live**, fetched from Adzuna at recommendation time (see below) | Real-time, cached 6h per (career, location) |
| A user's skills/interests/education/experience/certifications/projects | **User-provided**, taken as stated | As current as the user's own profile |
| Verified-skill status | **Empirically observed** by this system — an actual passed skill-test result | As current as the test result |
| Project-demonstrated skill status | **Empirically observed** — the skill's name literally appears in the user's own project text | As current as the profile |
| Fit Score / score breakdown | **Derived** — a fixed formula over the rows above | Recomputed every request |
| `market_outlook` note text | **Curated** — a canned sentence per `job_growth` label | Static |

This system does not currently integrate a live external occupational
taxonomy (O*NET / ESCO) for the skill/education vocabulary itself — this
deployment's network access doesn't reach either source, so the honest
choice was to extend the existing hand-curated `SKILL_SYNONYMS`/
`INTEREST_SYNONYMS` tables (Pass 10) rather than claim an integration
that isn't actually there. If a future environment has that access, the
documented path is an **offline, human-reviewed crosswalk**: map each of
the 148 career names to an O*NET/ESCO occupation code once, pull in that
occupation's skills/tasks/technology vocabulary, and keep it as static
curated data (reviewed before merging) rather than a live per-request
dependency — these taxonomies don't change in real time anyway, so
there's no accuracy cost to that approach, only a data-entry cost.

## Live market data (Adzuna) — separate from the Fit Score (Pass 10)

`backend/src/services/marketSignalService.js` attaches a `live_market`
field to each of the top `MAX_CAREERS_PER_REQUEST` (5) recommendations,
fetched from Adzuna (`backend/src/services/jobService.js`, already used
elsewhere for the jobs/trends pages) at recommendation time and cached
in-process for 6 hours per (career, location) pair to stay within
Adzuna's free-tier rate limits. It reports a small aggregate — a
posting-sample count and the salary range observed in that sample —
never full posting bodies, and never a number when Adzuna isn't
configured or the call fails (`source: 'unavailable'` instead, reported
honestly rather than substituted with a stale or fabricated figure).

This is deliberately **not** blended into `fit_score`, `confidence`, or
ranking order — see the module's docstring. It answers a different
question ("what does the market for this title look like right now?")
from the Fit Score's ("how well does your profile line up with this
role's typical requirements?"), and the two are kept visibly separate in
the API response and the UI, the same way `market_outlook` already was.

## Trust-weighted skill evidence — three tiers (Pass 10)

`evidence.skill_evidence` grades a matched skill into exactly one of
three trust tiers, applied inside the coverage calculation itself (never
as a bonus added afterward):

| Tier | Weight | Evidence |
|---|---|---|
| Self-reported | 1.0x | Listed in the profile, nothing more |
| Project-demonstrated | 1.25x | Not test-verified, but the skill's name is actually found in the user's own project description text |
| Test-verified | 1.5x | Backed by a passed skill test |

A skill counts once, at its single highest tier. This sits between the
previous two-tier version and gives credit for evidence a person actually
supplied (their project description) without letting it outweigh a real
verified test result.

## Pass 11 — Skill importance tiers, evidence taxonomy, missing-info handling, realistic evaluation suite

A follow-up review (master prompt: "build the most trustworthy career
recommendation engine") asked for four structural things this system
didn't yet have. All four are implemented as deterministic, documented
logic — no new ML, no synthetic labels.

### 1. Skill importance tiers (essential/important/supporting/optional)

Every career's skill list previously counted every skill equally — 10
minor/peripheral matches could outrank 4 defining ones. `app/data/
skill_importance.py` now derives four importance tiers per career from
the curated dataset itself (position in the list + how career-specific
the skill is across the whole dataset — see that module's docstring for
the exact, honestly-limited methodology). `evidence.skill_evidence` now
weights a match by BOTH its evidence-tier (below) AND its importance
tier (essential=4x, important=3x, supporting=2x, optional=1x), applied
inside the coverage calculation, never as a bonus. Skill gaps are now
also reported split by tier (`skill_gaps_by_tier`), so a person can tell
"you're missing something essential" from "you're missing something
optional."

**Honesty note:** this is a heuristic derived from the existing curated
lists, not an authoritative importance grading from a real occupational
taxonomy — this deployment still has no network access to O*NET/ESCO
(see Pass 10's provenance table). If that access exists in a future
environment, replacing this heuristic with real taxonomy-sourced
importance weights is the documented next step.

### 2. Evidence-tier taxonomy: CLAIMED / INFERRED / VERIFIED

Formalizes the trust tiers introduced in Pass 10 into the master
prompt's own vocabulary. Every matched skill is now labeled exactly one
of:
- **CLAIMED** — self-reported only (`claimed_skills_matched`)
- **INFERRED** — not test-verified, but named in the user's own project
  text (`inferred_skills_matched`, same data as Pass 10's
  `project_demonstrated_skills_matched`, kept for backward compatibility)
- **VERIFIED** — backed by a passed skill test (`verified_skills_matched`)

A new **Evidence Strength** dimension (`evidence_strength`,
`evidence_strength_label`) reports the average reliability of the
matched skills, completely separate from the Fit Score itself — two
careers can have the same fit_score with very different evidence
strength, and the response shows both.

### 3. Missing-information handling (not "blank = worst possible")

Previously, a category the user left entirely blank (no certifications,
no project text) scored a hard 0 out of its point allocation — which
structurally penalizes fresh graduates who haven't had a chance to
accumulate certifications/projects yet, even when everything else about
their profile lines up. `fit_scorer._redistribute_weights` now detects
when certifications/projects are genuinely blank (not just weak) and
redistributes those points proportionally across the categories that DO
have data, disclosed explicitly via `excluded_categories` in the
response and named in the reasoning text — never done silently.

Years-of-experience is deliberately **excluded** from this
redistribution: this data model can't distinguish "left blank" from
"explicitly entered 0," and 0 is also the legitimate, meaningful bottom
of a 0-6-year accumulation curve — redistributing it would produce the
perverse result of unentered/zero experience outscoring a real 1-2
years of experience. See `fit_scorer.py`'s `REDISTRIBUTABLE` comment for
the full reasoning, including why this was chosen over the alternative
of redistributing experience too (that was tried and reverted — see
Pass 11 in CHANGELOG.md — because it broke a legitimate monotonicity
expectation that more real experience should never score worse).

### 4. Realistic evaluation suite (master prompt section 16)

`ml-service/tests/test_realistic_evaluation.py` runs five hand-written
realistic profiles — full-stack, data, AI/ML, design, and mechanical, the
exact archetypes requested — and checks that each profile's top-ranked
career is one a career counselor would expect, WITHOUT hard-coding those
answers anywhere in the engine or dataset (the test only ever reads the
engine's output). This is a sanity check, not an accuracy metric: all
five currently rank their expected career #1 (Web Developer, Data
Scientist, AI/ML Engineer, UI/UX Designer, Mechanical Engineer,
respectively) — reported here plainly rather than as a "% accuracy"
number, per section 16/17's explicit instruction not to chase an
impressive aggregate figure. If a future dataset change causes one of
these to regress, that's a signal to look at the DATASET (skill
lists/synonyms) first, per section 17, not to hard-code the expected
career into the ranking logic.

### "Readiness" and "Market Relevance" — why they collapse to existing fields

The master prompt asks for five separable concepts: Fit, Evidence
Strength, Market Relevance, Readiness, and Skill Gap. Four of these are
distinct fields (`fit_score`/`fit_label`, `evidence_strength`/
`evidence_strength_label`, `market_outlook` for Market Relevance,
`skill_gaps`/`skill_gaps_by_tier` for Skill Gap). **Readiness is
deliberately NOT a fifth, separately-computed number** — this system has
no data source that would meaningfully distinguish "how well you match
today" (Fit) from "how ready you are today" beyond the same evidence
already used for Fit (e.g. a genuine readiness signal would need
something like recent learning velocity or a timeline, which isn't
collected).

An earlier version of this response exposed a `readiness_label` field
set to the exact same value as `fit_label`, documented at the time as
"deliberately answering both questions with the same number." That
still amounted to presenting one number under two names, which fails
the actual requirement — a kept "readiness" concept must represent
something *different* from fit, not the same number relabeled.
`readiness_label` has been removed outright rather than kept as a
duplicate; `fit_label` is the only qualitative band this system reports.
If a genuine Readiness signal is added later (e.g. from a learning
velocity or timeline feature), it belongs as its own field once there is
real data behind it, not as an alias.

Separately, `rank_score` (in the API response, next to `fit_score`) is
NOT the same concept and should not be confused with Readiness: it is
`fit_score` plus the small, capped feedback-calibration and
market-relevance adjustments — the number recommendations are actually
sorted by. It's exposed as its own field (rather than only as the
legacy `confidence` field name) so a consumer can tell "pure candidate/
career fit" apart from "the number used to rank," per the master
prompt's requirement that an opaque composite ranking number not be
presented as if it were the fit score itself.

### What was deliberately NOT done in this pass

- No external occupational taxonomy import (O*NET/ESCO) — still no
  network access from this deployment to those sources; the honest
  choice remains extending curated data rather than claiming an
  integration that isn't there (Pass 10).
- No new ML model — every change in this pass is deterministic feature
  engineering and scoring-formula structure, consistent with master
  prompt sections 6/7 ("don't force ML into the system... a transparent
  deterministic model is preferable to a sophisticated model that has no
  trustworthy labels").
- No per-career manual provenance records (Source/Source Version/
  Occupation ID/Skill ID per master prompt section 18) — the dataset
  remains a single hand-curated Python file without individual-record
  provenance metadata; adding that at the individual-skill level across
  148 careers was judged too large a manual-curation effort to complete
  trustworthily in this pass. The dataset-level provenance table (Pass
  10) and this changelog serve as the provenance record for now.

## Pass 12 — Expanded evaluation + validation coverage (no production changes)

A follow-up review repeated most of Pass 11's requirements almost
verbatim, confirming they're already implemented. It named two concrete
additions, both test-only:

1. `tests/test_realistic_evaluation.py` grew from 5 to 9 profiles,
   adding Cybersecurity, Cloud/DevOps, "fresh graduate with projects but
   no experience," and "strong skills but incomplete education/
   experience" — see CHANGELOG.md Pass 12 for current results.
2. `tests/test_engine_validation.py` (new) directly checks the specific
   things master prompt's "VALIDATION" section asked for that don't
   require outcome data: ambiguous-skill rejection (java≠javascript,
   c++≠c#), that market evidence is structurally incapable of leaking
   into the fit score (an actual import-statement check, not just
   "doesn't currently"), fair treatment of blank
   certifications/projects/education, and output consistency (identical
   input → identical output; one irrelevant added skill changes only the
   one career it's actually relevant to).

### Honest validation scope (this system, today)

What this system CAN validate, and does (see tests above): skill-match
precision on ambiguous terms, the fit/market structural separation,
missing-data fairness, and output consistency/determinism.

What this system CANNOT validate, and does not claim to: real-world
career-outcome accuracy (whether recommended careers actually lead to
good outcomes for users) — there is no outcome-labelled data available
to this project, and none is manufactured to fill that gap. Every score
and label in this system describes profile-to-requirement *alignment*,
never a validated prediction of success. This is stated here explicitly
per the master prompt's honesty requirement, rather than left implicit.

### Terminology cross-reference (master prompt's honesty taxonomy)

The two master prompts used slightly different six-way honesty
vocabularies (FACT/DERIVED EVIDENCE/USER-PROVIDED/ESTIMATION/MODEL
OUTPUT vs. FACT/SOURCE-DERIVED/USER-PROVIDED/INFERRED/ESTIMATED/MODEL-
GENERATED). Mapped onto this system's actual fields (see Pass 10's
provenance table for the full list):

| Master-prompt term | This system's fields |
|---|---|
| FACT / USER-PROVIDED | Everything under "profile" - skills, interests, education, experience, certifications, project text, as the user entered them |
| SOURCE-DERIVED | `market_outlook` (from the curated dataset), `live_market` (from Adzuna) |
| INFERRED | `inferred_skills_matched` (named in project text, not directly claimed), skill importance tiers (derived from list structure) |
| ESTIMATED / DERIVED EVIDENCE | `fit_score`, `evidence_strength`, all `score_breakdown` components - computed, not observed |
| MODEL-GENERATED | `feedback_adjustment` only (the sole ML-trained component; 0 whenever the feedback model isn't yet active) |

Nothing in this system is labeled or implied to be a validated
real-world outcome probability.

## Pass 13 — Small capped market signal + career-specific experience anchor

Implements Priorities 3 and 4 from an external review of Pass 12 (see
CHANGELOG.md "Pass 13" for full detail). Priority 5 of that review
("keep the current transparent architecture, don't force in
XGBoost/RandomForest/NN/LLM") was already true and remains unchanged —
no ML model was touched in this pass.

**Market relevance is now a real, but small and capped, input to
ranking** (`confidence`), while `fit_score` itself remains completely
market-free. See `market_context.py`'s module docstring for exactly how
the two are combined and why the cap (±3 points) was chosen. This
directly answers the "Personal Fit + Evidence Strength + small Market
Relevance adjustment, with clear limits" request — implemented as fit +
feedback + a capped market term, each tracked as a separate field in the
API response (`fit_score`, `feedback_adjustment`, `market_adjustment`,
and their sum `confidence`).

**Experience expectations are now career-specific** where the dataset's
own education field supports a reasonable inference (doctorate-level
careers get a longer anchor, diploma/bachelor's-level careers get a
shorter one) — see `fit_scorer._experience_anchor_years`. This remains
an indirect, documented proxy, not real occupational seniority data;
`experience_years_expected` is exposed in the API response so the basis
for the experience score is never hidden.

**Priority 1/2 (authoritative occupational taxonomy) remain blocked** by
this deployment's lack of network access to O*NET/ESCO — re-verified
before this pass (still `host_not_allowed`). This is the same
constraint documented in Pass 10, restated here because it's the
correct, honest answer to give again rather than silently drop from the
documentation as passes accumulate. If occupational taxonomy data
becomes available (via file upload or network access in a different
environment), it should replace: (a) the Pass 11 skill-importance
heuristic, (b) this pass's education-derived experience anchor, and (c)
ideally the underlying skill/education vocabulary itself — all three
are documented, bounded substitutes for that data, not claims that the
data was actually used.
