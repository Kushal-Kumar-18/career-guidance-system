"""
Explainable Fit Score.

This is the ONE place that turns per-category evidence into a single
0-100 number. The weights below are a fixed, documented career-counseling
heuristic (skills matter most, then interest/experience, then education/
certifications/projects as supporting signals) - not something search-fit
to make any particular profile or career look good. The same formula runs
for every user and every career, and the full component breakdown is
returned alongside the total so a person can see exactly why one career
outranked another, component by component, rather than trusting a single
opaque number.

What this score IS: an estimate of how well a profile's *documented
evidence* lines up with what a career typically expects.
What this score is NOT: a prediction of real-world job-market success,
interview performance, or hiring odds - those depend on far more than
profile data and this system has no outcome data to model them from. See
`market_context.py` for the (separate, clearly-labeled) job-market
information, and `feedback_model.py` for the only component that is ever
learned from real outcomes (actual user feedback), not asserted.

MISSING-INFORMATION HANDLING (master prompt principle 13): a category the
user simply never filled in (no certifications, no project text) is NOT
scored as a hard 0/max — a blank field is "evidence unavailable," not
"negative evidence," and treating them the same would structurally
penalize fresh graduates who haven't had the chance to accumulate
certifications/projects yet, even when their skills/interests/education
line up well. Instead, that category's points are marked N/A and its
weight is redistributed proportionally across the categories that DO
have data — see `_redistribute_weights` below. This is disclosed
explicitly in the response (`excluded_categories`), never done silently.
Years-of-experience is deliberately handled differently — see
`REDISTRIBUTABLE`'s comment for why.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List

from app.engine import evidence as ev
from app.data import skill_importance as tiers
from app.engine.text_match import TextMatcher

# Points available per category. Sums to 100. These are the BASE
# weights; compute_fit redistributes points away from categories the
# user left entirely blank (see module docstring) — components_max in
# the result reflects the EFFECTIVE (post-redistribution) weights, so a
# displayed "x / y" is always honest about what was actually possible for
# that specific request.
WEIGHTS = {
    'skills': 35.0,          # trust-tier x importance-tier weighted skill coverage
    'skill_quality': 10.0,   # how confident the matched skills are (exact vs loose fuzzy match)
    'interests': 15.0,       # stated interests vs the career's typical interest profile
    'experience': 15.0,      # years of experience, generic saturation curve
    'education': 10.0,       # does stated education match a typical path into this career
    'certifications': 5.0,   # do stated certifications match this career
    'projects': 10.0,        # do described projects actually relate to this career's skills
}
assert abs(sum(WEIGHTS.values()) - 100.0) < 1e-9

# Categories eligible for weight redistribution when the user simply
# provided nothing for them. Only certifications/projects are included:
# an empty string/list there is unambiguous ("nothing entered"). years-of-
# experience is deliberately EXCLUDED even though the master prompt's own
# example is "no experience entered" - this data model has no way to
# distinguish "left blank" from "explicitly entered 0" for a numeric
# field, and 0 is also the natural, meaningful bottom of a 0-6-year
# accumulation curve (someone with 0 years genuinely has less experience
# evidence than someone with 2, which is legitimate signal, not a
# mistreated blank) - redistributing it would produce the perverse result
# of unentered/zero experience outscoring a real-but-modest 1-2 years, which
# is worse for trustworthiness than the issue it would fix. Skills/
# interests/education are excluded per the module docstring above.
REDISTRIBUTABLE = ('certifications', 'projects')


def _redistribute_weights(provided: Dict[str, bool]) -> Dict[str, float]:
    """Returns effective weights: any REDISTRIBUTABLE category with
    provided[category] is False gets weight 0, and its base weight is
    spread across every OTHER category proportional to that category's
    own base weight (so the redistribution doesn't arbitrarily favor
    'skills' alone — every remaining category, including any
    redistributable ones that WERE provided, grows a little)."""
    unavailable = [c for c in REDISTRIBUTABLE if not provided.get(c, True)]
    if not unavailable:
        return dict(WEIGHTS)

    reclaimed = sum(WEIGHTS[c] for c in unavailable)
    recipients = [c for c in WEIGHTS if c not in unavailable]
    recipient_total = sum(WEIGHTS[c] for c in recipients)

    effective = {c: 0.0 for c in unavailable}
    for c in recipients:
        share = (WEIGHTS[c] / recipient_total) if recipient_total else 0.0
        effective[c] = WEIGHTS[c] + reclaimed * share
    return effective


FEATURE_ORDER = ['skills', 'skill_quality', 'interests', 'experience', 'education', 'certifications', 'projects']


def _experience_anchor_years(career_education: List[str], matcher: TextMatcher) -> float:
    """Derives a per-career experience-saturation anchor from the
    career's own stated education levels (Pass 13) - the dataset has no
    dedicated seniority/experience field, so this is a documented proxy
    built from data already in the dataset, reusing `TextMatcher.
    split_education` (Pass 9): careers whose most advanced typical
    education is a doctorate tend to expect a longer track record before
    someone reads as "fully experienced" for them (research roles,
    specialized science/medicine); careers reachable via a diploma/
    bootcamp/bachelor's alone tend to be reachable with less. This is NOT
    sourced from real occupational-outcome data - it's an inference from
    the education field, deliberately conservative (a modest 4/6/9-year
    spread, not an aggressive one) given how indirect a signal this is.
    Falls back to the original generic anchor (6.0) when no education
    level can be detected at all."""
    max_level = 0
    for edu in career_education or []:
        level, _ = matcher.split_education(edu)
        if level is not None:
            max_level = max(max_level, level)
    if max_level >= 4:      # doctorate present
        return 9.0
    if max_level == 3:      # master's is the highest listed
        return 6.0
    if max_level >= 1:      # diploma/bachelor's only
        return 4.0
    return 6.0               # no detectable level - fall back to the original generic anchor

# Qualitative bands for the fit score and for evidence strength, used
# alongside (never instead of) the numeric value — master prompt
# principle 10: prefer "Strong / Good / Moderate / Emerging / Limited"
# framing over implying false precision, without hiding the underlying
# number for people who want it.
_BANDS = [
    (75.0, 'Strong'),
    (55.0, 'Good'),
    (35.0, 'Moderate'),
    (15.0, 'Emerging'),
    (0.0, 'Limited'),
]


def qualitative_band(score_0_to_100: float) -> str:
    for threshold, label in _BANDS:
        if score_0_to_100 >= threshold:
            return label
    return 'Limited'


@dataclass
class FitResult:
    fit_score: float
    fit_label: str = ''
    components: Dict[str, float] = field(default_factory=dict)          # points earned per category
    components_max: Dict[str, float] = field(default_factory=dict)      # points available per category (post-redistribution)
    raw_fractions: Dict[str, float] = field(default_factory=dict)       # 0..1 strength per category, weight-independent
    excluded_categories: List[str] = field(default_factory=list)        # categories with no user-provided data, weight redistributed
    evidence_strength: float = 0.0        # 0..1, average reliability of matched SKILL evidence (see evidence.py)
    evidence_strength_label: str = ''
    skill_evidence: ev.SkillEvidence = None
    interest_evidence: ev.MatchEvidence = None
    education_evidence: ev.MatchEvidence = None
    certification_evidence: ev.MatchEvidence = None
    project_evidence: ev.ProjectEvidence = None
    experience_score: float = 0.0
    experience_anchor_years: float = 6.0  # per-career experience-saturation anchor actually used (Pass 13)

    def feature_vector(self) -> List[float]:
        """Fixed-order 0..1 feature vector for the (optional) feedback
        calibration model - decoupled from WEIGHTS so a future re-weighting
        of the fit score doesn't silently change what the feedback model
        was trained on."""
        return [self.raw_fractions.get(k, 0.0) for k in FEATURE_ORDER]


def compute_fit(
    matcher: TextMatcher,
    user_skills: List[str],
    verified_skills: Dict[str, object],
    user_interests: List[str],
    user_education: str,
    user_certifications: List[str],
    experience_years: float,
    projects_text: str,
    career_info: Dict,
    career_name: str = '',
    skill_tiers_by_career: Dict[str, Dict[str, str]] = None,
) -> FitResult:
    career_skills = career_info.get('skills', []) or []
    career_interests = career_info.get('interests', []) or []
    career_education = career_info.get('education', []) or []
    skill_tiers_for_career = (skill_tiers_by_career or {}).get(career_name, {})

    skill_ev = ev.skill_evidence(matcher, user_skills, verified_skills, career_skills, projects_text, skill_tiers_for_career)
    interest_ev = ev.interest_evidence(matcher, user_interests, career_interests)
    education_ev = ev.education_evidence(matcher, user_education, career_education, career_skills, career_interests)
    certification_ev = ev.certification_evidence(matcher, user_certifications, career_education, career_skills)
    experience_anchor = _experience_anchor_years(career_education, matcher)
    experience_score = ev.experience_evidence(experience_years, anchor_years=experience_anchor)
    project_ev = ev.project_evidence(matcher, projects_text, career_skills)

    # Missing-information handling: a category counts as "provided" the
    # moment the user put ANYTHING in it — this only distinguishes
    # "blank" from "filled in," it never judges whether what they filled
    # in was a good match (a filled-in-but-irrelevant project still
    # counts as provided, and is scored normally, possibly low — that's
    # legitimate evidence, not missing evidence).
    provided = {
        'certifications': bool(user_certifications),
        'projects': bool((projects_text or '').strip()),
    }
    effective_weights = _redistribute_weights(provided)
    excluded_categories = [c for c in REDISTRIBUTABLE if not provided[c]]

    components = {
        'skills': skill_ev.trust_weighted_coverage * effective_weights['skills'],
        'skill_quality': skill_ev.quality * effective_weights['skill_quality'],
        'interests': interest_ev.score * effective_weights['interests'],
        'experience': experience_score * effective_weights['experience'],
        'education': education_ev.score * effective_weights['education'],
        'certifications': certification_ev.score * effective_weights['certifications'],
        'projects': project_ev.score * effective_weights['projects'],
    }

    fit_score = sum(components.values())
    fit_score = max(0.0, min(fit_score, 100.0))

    raw_fractions = {
        'skills': skill_ev.trust_weighted_coverage,
        'skill_quality': skill_ev.quality,
        'interests': interest_ev.score,
        'experience': experience_score,
        'education': education_ev.score,
        'certifications': certification_ev.score,
        'projects': project_ev.score,
    }

    return FitResult(
        fit_score=round(fit_score, 1),
        fit_label=qualitative_band(fit_score),
        components={k: round(v, 1) for k, v in components.items()},
        components_max={k: round(v, 1) for k, v in effective_weights.items()},
        raw_fractions=raw_fractions,
        excluded_categories=excluded_categories,
        evidence_strength=round(skill_ev.evidence_strength, 3),
        evidence_strength_label=qualitative_band(skill_ev.evidence_strength * 100.0),
        skill_evidence=skill_ev,
        interest_evidence=interest_ev,
        education_evidence=education_ev,
        certification_evidence=certification_ev,
        project_evidence=project_ev,
        experience_score=experience_score,
        experience_anchor_years=experience_anchor,
    )
