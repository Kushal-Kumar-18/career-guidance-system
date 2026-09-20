const crypto = require('node:crypto');
const mlClient = require('./mlClient');
const resumeService = require('./resumeService');
const candidateProfileService = require('./candidateProfileService');
const { computeCandidateFingerprint } = require('./candidateFingerprint');
const marketSignalService = require('./marketSignalService');
const profileRepository = require('../repositories/profileRepository');
const skillTestRepository = require('../repositories/skillTestRepository');
const recommendationRepository = require('../repositories/recommendationRepository');
const activityRepository = require('../repositories/activityRepository');
const ApiError = require('../utils/ApiError');

// -----------------------------------------------------------------------
// The ONE common prediction pipeline (master prompt sections 1-4):
//
//   Manual Profile ───────────────┐
//   Uploaded Resume → Extraction ─┤──→ Canonical Candidate Profile
//   Created Resume → Structured ──┘         → mlClient.recommend()
//
// Every source funnels through `resolveCandidateProfile()` below to
// produce the exact same canonical shape (candidateProfileService), then
// through the exact same `mlClient.recommend()` call. The ML service
// itself never knows or needs to know which source a candidate came
// from — there is only ever one call site.
// -----------------------------------------------------------------------

async function resolveCandidateProfile(userId, { source, candidate } = {}) {
  switch (source) {
    case undefined:
    case null:
    case '':
    case 'profile': {
      const profile = await profileRepository.findByUserId(userId);
      if (!profile) {
        throw new ApiError(422, 'Complete your profile before requesting recommendations.');
      }
      return { source: 'profile', canonical: candidateProfileService.fromProfile(profile) };
    }

    case 'resume_builder': {
      // Source C: reuse the structured data the Resume Builder already
      // assembles (resumeService.buildResumeData) rather than
      // generating a PDF and re-parsing it (explicitly disallowed by
      // section 7).
      const resumeData = await resumeService.buildResumeData(userId);
      return { source: 'resume_builder', canonical: candidateProfileService.fromResumeBuilderData(resumeData) };
    }

    case 'resume_upload': {
      // Source B: the client has already called POST /resume/upload,
      // shown the extraction to the user for review/edits (section 6),
      // and now submits the reviewed result here. This is a candidate
      // built ONLY from that reviewed resume — it must never be
      // silently combined with the user's separately-saved profile (see
      // the 'merge' case below for the one path that intentionally
      // does that). Nothing about the upload is trusted un-reviewed and
      // nothing was persisted at upload time.
      if (!candidate) throw new ApiError(422, 'candidate is required for source "resume_upload".');
      return { source: 'resume_upload', canonical: candidateProfileService.fromReviewedExtraction(candidate) };
    }

    case 'merge': {
      // Section 8: existing profile + resume information, merged with
      // the user in control of the result (the reviewed `candidate`
      // IS the merge — the frontend performs the field-by-field
      // selection UI and sends the resolved values here; the server
      // still deduplicates/normalizes it as a final safety net via
      // candidateProfileService.merge). This must only ever be reached
      // when the user explicitly chose to merge with their existing
      // profile — a plain "analyze this resume" action must use
      // 'resume_upload' above instead, or it silently pulls in
      // whatever is sitting in the user's saved profile (including
      // skills from an entirely unrelated, previously-analyzed resume).
      if (!candidate) throw new ApiError(422, 'candidate is required for source "merge".');
      const profile = await profileRepository.findByUserId(userId);
      const base = profile ? candidateProfileService.fromProfile(profile) : {};
      return { source: 'merge', canonical: candidateProfileService.merge(base, candidate) };
    }

    default:
      throw new ApiError(422, `Unknown source: ${source}`);
  }
}

async function generate(userId, { topK = 5, source, candidate } = {}) {
  const { source: resolvedSource, canonical } = await resolveCandidateProfile(userId, { source, candidate });

  // Verified skills are fetched fresh for THIS candidate context only.
  // Per section D (verified skill isolation), the exact evidence sent to
  // the ML service for this run is captured below into
  // `candidateSnapshot.verified_skills_used` rather than only used
  // transiently — isolation itself is enforced by the ML engine
  // (app/engine/evidence.py `skill_evidence`): a verified-skill entry
  // can only ever upgrade a skill that is ALREADY present in this
  // candidate's own declared `skills` list to VERIFIED evidence — it can
  // never inject a skill the candidate didn't list (see the regression
  // test in backend/tests/verified-skill-isolation.test.js for the exact
  // "profile has verified Python, new resume lists AutoCAD/SketchUp"
  // scenario from the master prompt).
  const verifiedSkills = await skillTestRepository.verifiedSkillsForUser(userId);

  // Deterministic identity for "this exact candidate evidence" (section
  // C) — independent of source, list-vs-CSV shape, casing, or list
  // ordering. Used below for analysis-run identity and dedupe, so two
  // DIFFERENT candidates that happen to produce identical top results
  // are never collapsed into one run (section E), while two requests for
  // the genuinely same candidate still are.
  const candidateFingerprint = computeCandidateFingerprint(canonical, verifiedSkills);

  const mlResponse = await mlClient.recommend({
    // canonical is already the exact shape the ML service's
    // UserProfile model expects (education/skills/interests/
    // experience/certifications/projects) — see candidateProfileService.
    user_profile: {
      education: canonical.education,
      skills: canonical.skills,
      interests: canonical.interests,
      experience: canonical.experience_years,
      certifications: canonical.certifications,
      projects: canonical.projects,
    },
    verified_skills: verifiedSkills,
    top_k: topK,
  });

  const predictions = mlResponse.data;
  // Which build of the engine/dataset actually produced these
  // predictions (section B/I) — surfaced by the ML service in `meta`
  // (see ml-service/app/main.py's /recommend), with a per-prediction
  // fallback for older ML service responses that only set the per-item
  // field.
  const engineVersion = mlResponse.meta?.engine_version ?? predictions?.[0]?.engine_version ?? null;
  const datasetVersion = mlResponse.meta?.dataset_version ?? predictions?.[0]?.dataset_version ?? null;

  // The COMPLETE candidate snapshot (section F): every piece of evidence
  // that actually influenced scoring for this run — the canonical
  // candidate fields, which source produced them, the fingerprint used
  // for identity/dedup, and (section D) exactly which verified skills
  // were made available to the scorer. This is what a later feedback
  // call or audit reconstructs, not just the bare canonical fields.
  const candidateSnapshot = {
    ...canonical,
    source: resolvedSource,
    candidate_fingerprint: candidateFingerprint,
    verified_skills_used: verifiedSkills,
  };

  // Every call to generate() is exactly ONE logical analysis run. It
  // gets its own identity here, shared by every recommendation row it
  // writes, and is written together with a frozen snapshot of the exact
  // candidate evidence (`candidateSnapshot`) that produced it, plus the
  // candidate fingerprint and engine/dataset version so the run is fully
  // reproducible/auditable (section B). `generateBatch` performs the
  // fingerprint-aware identical-recent-batch check and the insert
  // atomically (a per-user DB advisory lock, not a plain read-then-write),
  // which is what actually prevents two near-simultaneous requests — a
  // double-submit, a repeated navigation effect — from each seeing "no
  // duplicate yet" and both writing a run, WITHOUT collapsing two
  // genuinely different candidates that happen to produce identical
  // results (section E). See recommendationRepository.generateBatch for
  // the full explanation.
  const analysisRunId = crypto.randomUUID();
  const { rows, reused } = await recommendationRepository.generateBatch({
    userId,
    source: resolvedSource,
    predictions,
    analysisRunId,
    candidateSnapshot,
    candidateFingerprint,
    engineVersion,
    datasetVersion,
    topK,
  });

  if (!reused) {
    await activityRepository.log(userId, 'recommendations_generated', {
      count: predictions.length,
      source: resolvedSource,
      analysis_run_id: analysisRunId,
    });
  }

  // Attach each row's stable identity (id + analysis_run_id) back onto
  // the prediction returned to the client, so a later feedback call can
  // reference the EXACT recommendation the user is looking at instead of
  // a career name (which can legitimately repeat across analyses — see
  // submitFeedback below). `rows` is already ordered to match
  // `predictions` (generateBatch/findRecentIdenticalBatch both restore
  // that order), so a straight zip by index is safe.
  const withIdentity = predictions.map((p, i) => ({
    ...p,
    id: rows[i]?.id ?? null,
    analysis_run_id: rows[i]?.analysis_run_id ?? null,
  }));

  // Live market signal (Adzuna, cached, top few results only — see
  // marketSignalService.js) is attached AFTER ranking/persistence so it
  // never influences fit_score or what gets stored in
  // recommendation_history; it's purely additional reference info in the
  // response. A failed/unconfigured lookup degrades to `live_market:
  // {source: 'unavailable', ...}` per career rather than breaking the
  // request.
  const profileForLocation = await profileRepository.findByUserId(userId).catch(() => null);
  const withLiveMarket = await marketSignalService.attachLiveOutlook(
    withIdentity,
    profileForLocation?.preferred_location || ''
  );

  return withLiveMarket;
}

async function history(userId) {
  return recommendationRepository.listByUser(userId);
}

// Records a real rating the user gave a recommendation they actually
// received, and forwards it to the ML service's feedback-calibration
// model (see ml-service/app/engine/feedback_model.py). This is the ONLY
// mechanism that ever adjusts recommendations based on outcome-like data —
// it's driven entirely by what users actually say about recommendations,
// never by the recommendation engine grading itself.
async function submitFeedback(userId, { recommendationId, career, rating }) {
  // Provenance check (must come first): feedback is the ONLY signal the
  // calibration model trains on, so it has to be traceable to the EXACT
  // recommendation this user actually received — not just "some row for
  // a career with this name". Looking this up by primary key, scoped to
  // the authenticated user's own recommendation_history rows, both
  // guarantees we rate the right analysis (a career name can legitimately
  // repeat across more than one analysis run for the same user) and
  // doubles as the ownership check.
  const recommendation = await recommendationRepository.findByIdForUser(userId, recommendationId);
  if (!recommendation) {
    throw new ApiError(
      422,
      'You can only rate a recommendation that was actually shown to you. ' +
        'Generate recommendations first, then rate one of the results.'
    );
  }

  // recommendationId is authoritative for WHICH row this rates — the
  // stored career_name (not the client's string) is what's actually
  // sent to the ML service just below. But if the caller also supplied a
  // career name and it doesn't match the row the id actually resolves
  // to, that is a signal something upstream is wrong (stale client
  // state, a UI element wired to the wrong id, a copy/paste bug in a
  // manual API call) — reject rather than silently rating the "wrong"
  // career under the id the client thought it was rating.
  if (career && String(career).trim().toLowerCase() !== String(recommendation.career_name).trim().toLowerCase()) {
    throw new ApiError(
      422,
      `recommendationId ${recommendationId} does not match career "${career}". ` +
        `It refers to "${recommendation.career_name}".`
    );
  }

  // Use the EXACT candidate evidence that produced this recommendation —
  // captured as `candidate_snapshot` at generation time — rather than
  // whatever the user's profile currently contains. These can genuinely
  // differ: the recommendation may have come from a resume_upload/
  // resume_builder/merge source that was never saved to the profile at
  // all, or the profile may simply have changed since. Feeding the wrong
  // candidate evidence into the calibration model would teach it the
  // wrong correlation between evidence and outcome. Rows written before
  // this snapshot existed (legacy data, candidate_snapshot IS NULL) fall
  // back to the current profile as the best available approximation.
  const canonical = recommendation.candidate_snapshot || (await legacyFallbackCanonical(userId));
  if (!canonical) {
    throw new ApiError(422, 'Complete your profile before submitting feedback.');
  }

  // The engine/dataset version ACTIVE WHEN THIS RECOMMENDATION WAS
  // PRODUCED (section A) — not whatever the ML service considers
  // "current" at the moment feedback happens to be submitted, which may
  // be a later build entirely (a dataset edit, an engine change) if any
  // time has passed. NULL for legacy rows/runs that predate this being
  // tracked (db/migrations/0005_analysis_runs.sql) — feedback is still
  // accepted, just without that piece of provenance.
  const analysisRun = await recommendationRepository.getAnalysisRun(recommendation.analysis_run_id);

  const mlResponse = await mlClient.sendFeedback({
    user_profile: {
      education: canonical.education,
      skills: canonical.skills,
      interests: canonical.interests,
      experience: canonical.experience_years,
      certifications: canonical.certifications,
      projects: canonical.projects,
    },
    // The verified skills ACTIVE WHEN THIS RECOMMENDATION WAS SCORED —
    // from the frozen snapshot, not a fresh lookup — so a verified skill
    // added or revoked since generation can't quietly change what
    // feedback retraining believes justified this recommendation's
    // score. Without this, retrain_feedback_model() has no verified-skill
    // record to recompute from at all and has to assume none were
    // verified, silently discarding real evidence strength for every
    // rated recommendation that had any (see recommender.py).
    verified_skills: canonical.verified_skills_used || {},
    // Use the stored career name rather than the client's string, so
    // what's recorded matches exactly what was recommended.
    career: recommendation.career_name,
    rating,
    recommendation_id: recommendation.id,
    analysis_run_id: recommendation.analysis_run_id || null,
    engine_version: analysisRun?.engine_version || null,
    dataset_version: analysisRun?.dataset_version || null,
  });

  // Backend-side mirror of "this recommendation has been rated" (section
  // A duplicate-feedback semantics: latest submission for the same
  // recommendationId wins, matching the ml_feedback unique index — see
  // db/migrations/0006_feedback_provenance.sql). Written after the ML
  // call succeeds so a failed/retried feedback submission never marks a
  // recommendation as rated when nothing was actually recorded.
  await recommendationRepository.recordFeedback(recommendation.id, rating);

  await activityRepository.log(userId, 'recommendation_feedback', {
    career: recommendation.career_name,
    rating,
    recommendation_id: recommendation.id,
    analysis_run_id: recommendation.analysis_run_id,
  });
  return mlResponse.data;
}

// Best-effort candidate reconstruction for recommendation_history rows
// written before candidate_snapshot existed (analysis_run_id/
// candidate_snapshot IS NULL — see db/migrations/0004_analysis_run_isolation
// .sql). There is no recorded evidence for exactly what produced those
// rows, so the current profile is the closest available approximation,
// not a claim that it's the same evidence.
async function legacyFallbackCanonical(userId) {
  const profile = await profileRepository.findByUserId(userId);
  return profile ? candidateProfileService.fromProfile(profile) : null;
}

module.exports = { generate, history, submitFeedback };
