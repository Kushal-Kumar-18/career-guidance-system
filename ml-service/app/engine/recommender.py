"""
CareerRecommender - top-level orchestrator for the recommendation engine.

Design summary (see individual modules for detail):
  - text_match.py    -> normalization / domain-aware fuzzy matching only.
  - evidence.py       -> per-category evidence extraction (skills, verified
                         skills, interests, education, certifications,
                         experience, projects) - no scoring.
  - fit_scorer.py     -> the ONE transparent, documented formula that turns
                         evidence into a 0-100 "Fit Score", with a full
                         component breakdown.
  - market_context.py -> separate, clearly-labeled job-market reference
                         info (never blended into a fake probability).
  - feedback_model.py -> the only real ML in the system: a small model
                         trained exclusively on actual user feedback
                         ratings, inactive until enough real data exists.

This module combines those into ranked recommendations, builds
evidence-grounded (not generic template) reasoning text, and exposes the
same method names the rest of the app already calls
(`predict_career_hybrid`, `_compute_skill_overlap`, `record_user_feedback`,
`get_model_info`) so integration elsewhere doesn't need to change.
"""
from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.data.career_dataset import CAREER_DATABASE, CAREER_SKILL_TIERS, DATASET_VERSION
from app.data import career_metadata
from app.engine import evidence as ev
from app.engine import fit_scorer
from app.engine import market_context
from app.engine.feedback_model import FeedbackCalibrationModel
from app.engine.text_match import TextMatcher
from app.storage.feedback_store import build_feedback_store
import math

ENGINE_VERSION = "explainable-fit-v1"

# Below this fit score a career is dropped from results entirely - it isn't
# a "penalty", just a floor so obviously-unrelated careers don't clutter a
# top-K list (e.g. a pure-tech profile getting handed "Sommelier").
MIN_FIT_SCORE_TO_SHOW = 12.0

# The feedback model (when active) can nudge the final score by at most
# this many points in either direction. It is a *calibration*, not a
# replacement for the transparent fit score - a handful of ratings should
# never be able to flip a ranking on its own.
MAX_FEEDBACK_ADJUSTMENT = 6.0

# Soft diversity cap (see _diversify below): at most this fraction of a
# top_k result set may come from any single domain (app/data/
# career_metadata.py's data-derived domain, not a hard-coded category
# list) before later same-domain candidates are deferred behind
# other-domain ones of comparable score. Deliberately a *soft*, backfilled
# cap, never a hard "one per domain" rule: if there genuinely aren't
# enough qualifying careers outside a domain, that domain can still fill
# the whole list - this only reorders among already-qualifying careers,
# it never drops one.
DIVERSITY_DOMAIN_CAP_RATIO = 0.6


def _profile_completeness(skills, interests, education, experience_years, certifications, projects) -> float:
    """A transparency signal, not a scoring factor: how much evidence did
    the user actually give us? Used only to attach an honest caveat when a
    profile is thin, never to change the ranking formula itself."""
    checks = [
        len(skills) >= 3,
        len(interests) >= 1,
        bool(education),
        float(experience_years or 0) > 0,
        len(certifications) >= 1,
        bool((projects or '').strip()),
    ]
    return round(100.0 * sum(checks) / len(checks), 1)


class CareerRecommender:
    def __init__(self, feedback_model_path: str, verbose: bool = True, feedback_store=None):
        self.verbose = verbose
        self.career_db: Dict[str, Any] = CAREER_DATABASE
        self.career_list = list(self.career_db.keys())
        self.matcher = TextMatcher()

        feedback_dir = os.path.dirname(feedback_model_path) or 'ml_models'
        os.makedirs(feedback_dir, exist_ok=True)
        self.feedback_log_path = os.path.join(feedback_dir, 'user_feedback.json')

        # Where collected ratings actually live. Defaults to the JSON
        # file above (keeps local dev and the test suite dependency- and
        # database-free), but can be pointed at Postgres with
        # FEEDBACK_STORE=postgres so ratings survive container
        # recreation - they're the only training data in the system and
        # cannot be regenerated once lost. See app/storage/feedback_store.py.
        self.feedback_store = feedback_store or build_feedback_store(self.feedback_log_path)

        self.feedback_model = FeedbackCalibrationModel(
            storage_path=os.path.join(feedback_dir, 'feedback_calibration_model.pkl'),
            feature_order=fit_scorer.FEATURE_ORDER,
        )

        if self.verbose:
            status = "ACTIVE" if self.feedback_model.is_active else "inactive (using fit score only)"
            store = self.feedback_store.describe()
            print(
                f"[engine] {ENGINE_VERSION} ready | feedback calibration: {status} "
                f"| feedback storage: {store.get('driver')} ({store.get('location')})"
            )

    # -- profile parsing ----------------------------------------------
    @staticmethod
    def _parse_profile(user_profile: Dict[str, Any], verified_skills: Dict[str, Any]):
        skills = ev.split_csv(user_profile.get('skills', ''))
        interests = ev.split_csv(user_profile.get('interests', ''))
        certifications = ev.split_csv(user_profile.get('certifications', ''))
        education = (user_profile.get('education') or '').strip()
        projects_text = user_profile.get('projects', '') or ''
        try:
            experience_years = float(user_profile.get('experience', 0) or 0)
        except (TypeError, ValueError):
            experience_years = 0.0
        verified = verified_skills if isinstance(verified_skills, dict) else {}
        return skills, interests, certifications, education, projects_text, experience_years, verified

    # -- public API (names kept for compatibility with main.py) --------
    def predict_career_hybrid(self, user_profile: Dict[str, Any], verified_skills: Dict[str, Any], top_k: int = 5) -> List[Dict[str, Any]]:
        return self.recommend(user_profile, verified_skills, top_k=top_k)

    def recommend(self, user_profile: Dict[str, Any], verified_skills: Dict[str, Any], top_k: int = 5) -> List[Dict[str, Any]]:
        skills, interests, certifications, education, projects_text, experience_years, verified = \
            self._parse_profile(user_profile, verified_skills)

        completeness = _profile_completeness(skills, interests, education, experience_years, certifications, projects_text)

        results = []
        for career_name in self.career_list:
            career_info = self.career_db[career_name]
            fit = fit_scorer.compute_fit(
                self.matcher, skills, verified, interests, education, certifications,
                experience_years, projects_text, career_info,
                career_name=career_name, skill_tiers_by_career=CAREER_SKILL_TIERS,
            )

            feedback_adjustment = 0.0
            predicted_rating = None
            if self.feedback_model.is_active:
                predicted_rating = self.feedback_model.predict_rating(fit.feature_vector())
                if predicted_rating is not None:
                    # Map 1..5 rating to a -MAX..+MAX point adjustment (3 = neutral).
                    feedback_adjustment = (predicted_rating - 3.0) / 2.0 * MAX_FEEDBACK_ADJUSTMENT

            # Market relevance as a small, capped secondary signal (Pass
            # 13) - added AFTER fit_score is fully computed, never inside
            # fit_scorer.py itself (see market_context.py's module
            # docstring and MARKET_ADJUSTMENT_CAP for the exact limits).
            # This can nudge between two careers that are otherwise close
            # in fit; it cannot override a real fit difference — the cap
            # (±3 points) is smaller than every single WEIGHTS entry
            # except certifications, so no realistic skill/evidence gap
            # can be closed by market demand alone.
            market_adjustment = market_context.market_relevance_adjustment(career_info.get('job_growth'))

            final_score = max(0.0, min(fit.fit_score + feedback_adjustment + market_adjustment, 100.0))
            if final_score < MIN_FIT_SCORE_TO_SHOW:
                continue

            # Data-driven relevance gate (master prompt point 2): a career
            # with ZERO matched skills of any evidence tier can still
            # clear MIN_FIT_SCORE_TO_SHOW purely from generic
            # interests/education overlap (interests=15 + education=10
            # already exceeds the 12.0 floor on their own) - that's
            # exactly the "generic transferable skills let an unrelated
            # career dominate" failure mode. This does NOT penalize a
            # career for missing one or more skills (skill_evidence.gaps
            # is untouched, and a career with 1 matched skill out of 10
            # passes fine) - it only excludes the specific case of
            # literally no skill overlap at all. Uses each career's own
            # skill list (already in the dataset), not a hard-coded
            # domain/career rule.
            if not fit.skill_evidence.matched:
                continue

            outlook = market_context.market_outlook(career_info.get('job_growth'), career_info.get('salary_range'))

            reasoning = self._build_reasoning(career_name, fit, experience_years, completeness)

            results.append({
                'career': career_name,
                # Stable identity independent of the display name (see
                # app/data/career_metadata.py) — use this, not `career`,
                # for anything persisted long-term (saved careers,
                # analysis snapshots) that should survive a rename.
                'career_id': career_metadata.get_career_id(career_name),
                'domain': career_metadata.get_domain(career_name),
                # Which build of the curated dataset produced this result
                # (a content hash of career_dataset.py — see that file's
                # DATASET_VERSION) — lets a stored recommendation be
                # traced back to exactly the data that produced it, even
                # after the dataset is later edited.
                'dataset_version': DATASET_VERSION,
                'engine_version': ENGINE_VERSION,
                # Kept as `confidence` for backward compatibility with the
                # existing backend/frontend, but this is the Fit Score
                # (+ small feedback calibration if active) - an alignment
                # estimate, not a probability of anything.
                'confidence': round(final_score, 1),
                # Same number as `confidence` above, under a name that
                # says what it actually is (master prompt Phase 2
                # section D: recommendations must expose fit_score AND
                # rank_score as distinct concepts). `confidence` is kept
                # only for backward compatibility with existing
                # frontend/backend field access - new code should read
                # `rank_score`, not `confidence`.
                'rank_score': round(final_score, 1),
                'fit_score': fit.fit_score,
                # Qualitative band alongside the number (master prompt
                # principle 10) - "Strong/Good/Moderate/Emerging/Limited"
                # rather than implying false precision.
                #
                # NOTE: an earlier version of this response also included
                # a `readiness_label` field set to this exact same value.
                # The master prompt requires that if a "readiness" concept
                # is kept, it must represent something DIFFERENT from fit
                # - and this system has no independent signal (e.g. a
                # learning-velocity metric) to compute a genuinely
                # different readiness number from. Rather than fabricate
                # one just to have a second field, `readiness_label` was
                # removed outright (grep-checked: nothing in
                # backend/frontend reads it). `fit_label` is the only
                # qualitative band this system reports.
                'fit_label': fit.fit_label,
                'feedback_adjustment': round(feedback_adjustment, 1),
                'feedback_calibration_active': self.feedback_model.is_active,
                # Small, capped secondary ranking signal (max ±3 points) —
                # see market_context.MARKET_ADJUSTMENT_CAP. Included in
                # `confidence` (the final ranking number) but NOT in
                # `fit_score`, so the two numbers stay distinguishable:
                # fit_score is pure profile-to-requirement alignment,
                # confidence is fit_score + feedback_adjustment +
                # market_adjustment.
                'market_adjustment': market_adjustment,
                'score_breakdown': {
                    'components': fit.components,
                    'components_max': fit.components_max,
                },
                # Evidence Strength: a SEPARATE dimension from the Fit
                # Score itself - how reliable is the matched skill
                # evidence on average (verified > project-demonstrated >
                # self-reported), independent of how much of the career's
                # skill list is covered. Two careers can have the same
                # fit_score with very different evidence_strength.
                'evidence_strength': fit.evidence_strength,
                'evidence_strength_label': fit.evidence_strength_label,
                # Missing-information handling (master prompt principle
                # 13): categories the user left entirely blank (not
                # "answered with a weak value" - actually blank) had their
                # points redistributed rather than scored as a hard 0, and
                # that redistribution is disclosed here rather than done
                # silently.
                'excluded_categories': fit.excluded_categories,
                'experience_years_expected': fit.experience_anchor_years,
                'salary_range': career_info.get('salary_range', 'Not available'),
                'job_growth': career_info.get('job_growth', 'Medium'),
                # Market Relevance dimension - kept separate from fit_score,
                # never blended into it. `market_outlook.label` (Very
                # High/High/Medium/Low) IS the Market Relevance value;
                # see market_context.py.
                'market_outlook': outlook,
                'courses': career_info.get('courses', []) or [],
                'required_skills': career_info.get('skills', []) or [],
                'skill_gaps': fit.skill_evidence.gaps,
                # Skill Gap dimension, split by importance tier so a
                # person can tell "must learn this" from "nice to have" -
                # see app/data/skill_importance.py.
                'skill_gaps_by_tier': fit.skill_evidence.gaps_by_tier,
                'user_skills_matched': fit.skill_evidence.matched,
                # Evidence-tier taxonomy (master prompt terms): every
                # matched skill is CLAIMED, INFERRED, or VERIFIED - never
                # treated as equally strong.
                'claimed_skills_matched': fit.skill_evidence.claimed_matched,
                'inferred_skills_matched': fit.skill_evidence.project_demonstrated_matched,
                'verified_skills_matched': fit.skill_evidence.verified_matched,
                'verified_skills_breakdown': fit.skill_evidence.verified_breakdown,
                # Kept for backward compatibility with the existing
                # frontend/backend field name.
                'project_demonstrated_skills_matched': fit.skill_evidence.project_demonstrated_matched,
                'matched_interests': fit.interest_evidence.matched,
                'matched_education': fit.education_evidence.matched,
                'matched_certifications': fit.certification_evidence.matched,
                'profile_completeness': completeness,
                'reasoning': reasoning,
            })

        # Deterministic ranking (point 8): ties broken by career name so
        # ordering never depends on dict/insertion order or float noise
        # for two careers that land on the exact same final score.
        results.sort(key=lambda r: (r['confidence'], r['career']), reverse=True)

        diversified = self._diversify(results, top_k)

        # Quality guard (point 9) - cheap, structural checks on what's
        # about to leave the engine, not a re-score. Fails loudly rather
        # than silently shipping a malformed result, since this is
        # exactly the kind of defect (a bad career_metadata entry, a
        # duplicate slipping in) that should never reach an API response.
        seen = set()
        for r in diversified:
            assert r['career'] not in seen, f"duplicate career in results: {r['career']!r}"
            seen.add(r['career'])
            assert r['career_id'], f"missing career_id for {r['career']!r}"
            assert r['domain'], f"missing domain for {r['career']!r}"
            assert 0.0 <= r['confidence'] <= 100.0, f"confidence out of range for {r['career']!r}: {r['confidence']}"
            assert 0.0 <= r['fit_score'] <= 100.0, f"fit_score out of range for {r['career']!r}: {r['fit_score']}"
            assert r['reasoning'], f"missing reasoning for {r['career']!r}"

        return diversified

    def _diversify(self, ranked_results: List[Dict[str, Any]], top_k: int) -> List[Dict[str, Any]]:
        """Soft domain-diversity re-ranking (point 7): reorders an
        already-fully-scored, already-sorted list so that near-duplicate
        career variants from one domain (app/data/career_metadata.py's
        data-derived grouping - never a hard-coded category list) don't
        occupy the entire result set purely because that domain happens
        to be well-represented in the 309-career dataset.

        This is a REORDERING pass only - it never drops a qualifying
        career and never invents one. Once a domain hits its soft cap,
        further same-domain candidates are deferred behind (not removed
        from) the remaining queue, so they still appear if there aren't
        enough other-domain candidates to fill top_k - a thin dataset in
        one domain, or a candidate who is a genuine specialist, is never
        forced into artificial variety.
        """
        if top_k <= 1 or len(ranked_results) <= top_k:
            return ranked_results[:top_k]

        domain_cap = max(1, math.ceil(top_k * DIVERSITY_DOMAIN_CAP_RATIO))
        picked: List[Dict[str, Any]] = []
        deferred: List[Dict[str, Any]] = []
        domain_counts: Dict[Optional[str], int] = {}

        for r in ranked_results:
            domain = r.get('domain')
            if domain_counts.get(domain, 0) < domain_cap:
                picked.append(r)
                domain_counts[domain] = domain_counts.get(domain, 0) + 1
            else:
                deferred.append(r)
            if len(picked) >= top_k:
                break

        if len(picked) < top_k:
            picked.extend(deferred[: top_k - len(picked)])

        # Both `picked` and `deferred` were built by walking
        # `ranked_results` in its already-sorted order, so re-sorting by
        # the same key keeps ranking deterministic and score-ordered
        # (the diversity pass reorders WHICH careers are included, never
        # the relative order of the ones that are).
        picked.sort(key=lambda r: (r['confidence'], r['career']), reverse=True)
        return picked

    def _compute_skill_overlap(self, career_name: str, user_profile: Dict[str, Any], verified_skills: Dict[str, Any]):
        skills, _interests, _certs, _edu, _proj, _exp, verified = self._parse_profile(user_profile, verified_skills)
        career_info = self.career_db.get(career_name, {})
        career_skills = career_info.get('skills', []) or []
        skill_tiers_for_career = CAREER_SKILL_TIERS.get(career_name, {})
        se = ev.skill_evidence(self.matcher, skills, verified, career_skills, skill_tiers_for_career=skill_tiers_for_career)
        return sorted(se.matched), se.gaps, sorted(se.verified_matched), se.verified_breakdown

    def _build_reasoning(self, career_name: str, fit: fit_scorer.FitResult, experience_years: float, completeness: float) -> str:
        """Builds reasoning that cites the actual evidence found for this
        specific career (matched skill names, gap names, matched education)
        rather than generic score-band filler text - so a user can see
        *what* drove the score, not just a vague tier description."""
        parts = []
        se = fit.skill_evidence

        if se.matched:
            shown = ', '.join(se.matched[:5])
            more = f" and {len(se.matched) - 5} more" if len(se.matched) > 5 else ""
            parts.append(f"You already have {len(se.matched)} of the {len(se.matched) + len(se.gaps)} skills typically used in this role ({shown}{more}).")
        else:
            parts.append("Your listed skills don't yet overlap with what this role typically requires.")

        if se.verified_matched:
            parts.append(f"{len(se.verified_matched)} of those ({', '.join(se.verified_matched[:3])}) are backed by a verified skill test (VERIFIED evidence), which counts as stronger evidence than a self-reported skill.")

        if se.project_demonstrated_matched:
            parts.append(f"{len(se.project_demonstrated_matched)} more ({', '.join(se.project_demonstrated_matched[:3])}) show up directly in your project descriptions (INFERRED evidence), which counts as stronger evidence than simply listing them.")

        essential_gaps = se.gaps_by_tier.get('essential', [])
        if essential_gaps:
            parts.append(f"The biggest gaps are in essential skills for this role: {', '.join(essential_gaps[:4])}.")
        other_gaps = [g for tier in ('important', 'supporting', 'optional') for g in se.gaps_by_tier.get(tier, [])]
        if other_gaps and not essential_gaps:
            parts.append(f"Skills worth building next: {', '.join(other_gaps[:4])}.")

        if fit.interest_evidence.matched:
            parts.append(f"Your stated interests overlap with this career ({', '.join(fit.interest_evidence.matched[:3])}).")

        if fit.education_evidence.matched:
            parts.append(f"Your education ({fit.education_evidence.matched[0]}) is a common path into this role.")

        if fit.certification_evidence.matched:
            parts.append(f"Certification(s) matched: {', '.join(fit.certification_evidence.matched[:3])}.")

        if experience_years >= 3:
            parts.append(f"{int(experience_years)} years of experience adds meaningful weight here.")
        elif experience_years > 0:
            parts.append(f"{experience_years:g} year(s) of experience is a modest but real signal; more hands-on time will strengthen this further.")
        if fit.experience_anchor_years != 6.0:
            parts.append(f"(This role's experience expectation is scaled to roughly {fit.experience_anchor_years:g} years based on its typical education level, rather than a one-size-fits-all curve.)")

        if fit.project_evidence.relevant_terms:
            parts.append(f"Your project history touches on {', '.join(fit.project_evidence.relevant_terms[:3])}, which is directly relevant.")

        if fit.excluded_categories:
            readable = {'certifications': 'certifications', 'projects': 'projects'}
            missing = ', '.join(readable[c] for c in fit.excluded_categories)
            parts.append(f"You haven't entered {missing} yet, so this estimate is based on your skills, interests, and education alone rather than treating the missing fields as a weakness.")

        if completeness < 50:
            parts.append("Your profile is still fairly light on details - adding more skills, projects, or experience will make this estimate more reliable.")

        parts.append(f"Evidence strength for the matched skills here is {fit.evidence_strength_label.lower()} on average (how reliable the matches are, separate from how many skills matched).")
        parts.append("This score reflects how closely your profile lines up with this role's typical requirements today; it is not a prediction of hiring outcomes or future success.")

        return " ".join(parts)    # -- feedback -------------------------------------------------------
    def record_user_feedback(
        self,
        user_profile: Dict[str, Any],
        career: str,
        rating: float,
        recommendation_id: Optional[int] = None,
        analysis_run_id: Optional[str] = None,
        engine_version: Optional[str] = None,
        dataset_version: Optional[str] = None,
        verified_skills: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        entry = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'career': career,
            'rating': float(rating),
            'user_profile': {
                'skills': user_profile.get('skills', ''),
                'interests': user_profile.get('interests', ''),
                'education': user_profile.get('education', ''),
                'experience': user_profile.get('experience', 0),
                'certifications': user_profile.get('certifications', ''),
                'projects': user_profile.get('projects', ''),
                # The verified skills active when the RATED recommendation
                # was generated (caller sends the frozen snapshot's
                # verified_skills_used, not a fresh lookup — see
                # backend/src/services/recommendationService.js
                # submitFeedback). Nested inside user_profile rather than
                # top-level on `entry` specifically so it round-trips
                # through BOTH feedback stores identically:
                # PostgresFeedbackStore.append() only persists this
                # sub-dict (via its `user_profile` JSONB column) and drops
                # any other top-level entry key, while JsonFeedbackStore
                # persists the whole entry either way. Needed so
                # retrain_feedback_model() below can recompute the same
                # feature vector that actually produced this
                # recommendation's score, instead of assuming nothing was
                # verified. {} for legacy records / callers that predate
                # this — retrain still works, it just can't credit any
                # verified evidence for those specific records, same as
                # before this field existed.
                'verified_skills': verified_skills or {},
            },
            # Provenance (master prompt Phase 2 section A): what exact
            # recommendation/run this rating refers to, and what engine/
            # dataset build produced it. career_id is derived here, not
            # accepted from the caller, so it can never disagree with
            # what this service itself considers the canonical id for
            # `career`. All of these are None for callers that don't
            # supply them (e.g. any legacy caller) - retrain_feedback_model
            # below still works fine on records with no provenance, it's
            # only used for later auditability, not for scoring.
            'recommendation_id': recommendation_id,
            'analysis_run_id': analysis_run_id,
            'career_id': career_metadata.get_career_id(career),
            'engine_version': engine_version,
            'dataset_version': dataset_version,
        }

        # Durably persisted before anything else happens - if the
        # retrain below fails, the rating is still on disk/in the
        # database and will be picked up by the next retrain.
        total = self.feedback_store.append(entry)

        if self.verbose:
            print(f"[engine] feedback recorded for '{career}': rating={rating} (total records: {total})")

        return self.retrain_feedback_model()

    def retrain_feedback_model(self) -> Dict[str, Any]:
        """Recomputes fit-score feature vectors for every stored feedback
        record against the *current* career dataset/scorer (rather than
        caching stale features at record-time), then refits the
        calibration model if enough real signal now exists."""
        records = self.feedback_store.all()
        if not records:
            return self.get_model_info()

        feature_rows, ratings, careers = [], [], []
        for rec in records:
            career = rec.get('career')
            if career not in self.career_db:
                continue
            profile = rec.get('user_profile', {})
            # Reuse the verified-skill evidence captured AT RECORD TIME
            # (nested in user_profile — see record_user_feedback above and
            # its comment on why it lives there, not top-level on `rec`)
            # rather than {} — using {} here silently taught the
            # calibration model that no skill was ever verified for any
            # rated recommendation, even when VERIFIED evidence (the
            # strongest tier — see evidence.py) is exactly what the
            # original score was built from. {} remains the correct
            # fallback only for records written before this field existed.
            skills, interests, certs, edu, proj, exp, verified = self._parse_profile(
                profile, profile.get('verified_skills', {})
            )
            fit = fit_scorer.compute_fit(
                self.matcher, skills, verified, interests, edu, certs, exp, proj, self.career_db[career],
                career_name=career, skill_tiers_by_career=CAREER_SKILL_TIERS,
            )
            feature_rows.append(fit.feature_vector())
            ratings.append(rec.get('rating', 3.0))
            careers.append(career)

        self.feedback_model.fit(feature_rows, ratings, careers)
        return self.get_model_info()

    # -- introspection ---------------------------------------------------
    def get_model_info(self) -> Dict[str, Any]:
        return {
            'engine_version': ENGINE_VERSION,
            'dataset_version': DATASET_VERSION,
            'scoring_method': 'transparent rule-based fit score (evidence-weighted, skill-importance-tiered); no ML label is derived from this score',
            'weights': fit_scorer.WEIGHTS,
            'careers': len(self.career_list),
            'feedback_model': self.feedback_model.info.__dict__,
            # Where the ratings that train the feedback model are kept.
            # Surfaced through /health so a deployment can be checked for
            # the "collecting feedback into an ephemeral container
            # filesystem" failure mode without reading the logs.
            'feedback_storage': self.feedback_store.describe(),
            'notes': [
                'The fit score estimates profile-to-career alignment from documented evidence '
                '(skills, verified skills, interests, education, certifications, experience, projects).',
                'It is not a prediction of real-world job-market success or hiring probability.',
                'Each matched skill is graded into exactly one evidence-reliability tier - CLAIMED '
                '(self-reported), INFERRED (named in the user\'s own project text), or VERIFIED '
                '(backed by a passed skill test) - and one importance tier - essential/important/'
                'supporting/optional, derived from the curated dataset itself (see '
                'app/data/skill_importance.py). Neither axis is applied as a bolt-on bonus.',
                'Evidence Strength (average reliability of matched skills) and Market Relevance '
                '(market_outlook) are reported as separate dimensions alongside the Fit Score, never '
                'blended into one number.',
                'Categories the user left entirely blank (experience/certifications/projects) have '
                'their weight redistributed rather than scored as a hard zero - see excluded_categories '
                'in each recommendation and fit_scorer.py\'s module docstring.',
                'The only trained ML component is the feedback calibration model, and it only trains '
                'on real user feedback ratings - never on the fit score itself.',
            ],
        }
