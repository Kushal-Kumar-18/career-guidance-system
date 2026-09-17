const mlClient = require('./mlClient');
const resumeService = require('./resumeService');
const candidateProfileService = require('./candidateProfileService');
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
      // and now submits the reviewed result here. Nothing about the
      // upload is trusted un-reviewed and nothing was persisted at
      // upload time.
      if (!candidate) throw new ApiError(422, 'candidate is required for source "resume_upload".');
      return { source: 'resume_upload', canonical: candidateProfileService.fromReviewedExtraction(candidate) };
    }

    case 'merge': {
      // Section 8: existing profile + resume information, merged with
      // the user in control of the result (the reviewed `candidate`
      // IS the merge — the frontend performs the field-by-field
      // selection UI and sends the resolved values here; the server
      // still deduplicates/normalizes it as a final safety net via
      // candidateProfileService.merge).
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
  const verifiedSkills = await skillTestRepository.verifiedSkillsForUser(userId);

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

  // Item 33 fix: don't write a fresh set of history rows if this is an
  // exact repeat of what was just generated moments ago for this source
  // (see recommendationRepository.findRecentIdenticalBatch for the exact
  // rule) — reuse those rows instead of duplicating them.
  const existingBatch = await recommendationRepository.findRecentIdenticalBatch(userId, resolvedSource, predictions);
  if (!existingBatch) {
    await recommendationRepository.insertMany(userId, predictions, resolvedSource);
    await activityRepository.log(userId, 'recommendations_generated', { count: predictions.length, source: resolvedSource });
  }

  // Live market signal (Adzuna, cached, top few results only — see
  // marketSignalService.js) is attached AFTER ranking/persistence so it
  // never influences fit_score or what gets stored in
  // recommendation_history; it's purely additional reference info in the
  // response. A failed/unconfigured lookup degrades to `live_market:
  // {source: 'unavailable', ...}` per career rather than breaking the
  // request.
  const profileForLocation = await profileRepository.findByUserId(userId).catch(() => null);
  const withLiveMarket = await marketSignalService.attachLiveOutlook(
    predictions,
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
async function submitFeedback(userId, { career, rating }) {
  // Provenance check (must come first): feedback is the ONLY signal the
  // calibration model trains on, so it has to be traceable to a
  // recommendation this user actually received. Without this, anyone
  // with a token could post arbitrary (career, rating) pairs for
  // careers they were never shown and steer the model — a cheap
  // poisoning path into the one component that learns. The lookup is
  // scoped to the authenticated user's own recommendation_history rows,
  // so it doubles as the ownership check.
  const recommendation = await recommendationRepository.findLatestForUserAndCareer(userId, career);
  if (!recommendation) {
    throw new ApiError(
      422,
      'You can only rate a career that was actually recommended to you. ' +
        'Generate recommendations first, then rate one of the results.'
    );
  }

  const profile = await profileRepository.findByUserId(userId);
  if (!profile) {
    throw new ApiError(422, 'Complete your profile before submitting feedback.');
  }
  const canonical = candidateProfileService.fromProfile(profile);
  const verifiedSkills = await skillTestRepository.verifiedSkillsForUser(userId);

  const mlResponse = await mlClient.sendFeedback({
    user_profile: {
      education: canonical.education,
      skills: canonical.skills,
      interests: canonical.interests,
      experience: canonical.experience_years,
      certifications: canonical.certifications,
      projects: canonical.projects,
    },
    // Use the stored career name rather than the client's string, so
    // what's recorded matches exactly what was recommended.
    career: recommendation.career_name,
    rating,
  });

  await activityRepository.log(userId, 'recommendation_feedback', {
    career: recommendation.career_name,
    rating,
    recommendation_id: recommendation.id,
  });
  return mlResponse.data;
}

module.exports = { generate, history, submitFeedback };
