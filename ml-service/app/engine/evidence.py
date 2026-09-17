"""
Evidence extraction.

Each function here looks at ONE category of profile evidence (skills,
verified skills, interests, education, certifications, experience, projects)
and reports what it found in plain terms - matched items, gaps, and a 0..1
strength score for that category alone. Nothing in this file computes a
final ranking number; `fit_scorer.py` is the only place that combines these
into a score, so the combination logic (and its weights) stays in one
auditable spot.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List

from app.engine.text_match import TextMatcher
from app.data import skill_importance as tiers


def split_csv(value: str) -> List[str]:
    if not value:
        return []
    return [v.strip() for v in str(value).split(',') if v.strip()]


@dataclass
class SkillEvidence:
    matched: List[str] = field(default_factory=list)          # career skills the user has (any evidence)
    gaps: List[str] = field(default_factory=list)              # career skills the user is missing
    gaps_by_tier: Dict[str, List[str]] = field(default_factory=dict)  # gaps split essential/important/supporting/optional
    verified_matched: List[str] = field(default_factory=list)  # subset of matched that are test-verified (evidence tier: VERIFIED)
    verified_breakdown: Dict[str, str] = field(default_factory=dict)
    project_demonstrated_matched: List[str] = field(default_factory=list)  # subset mentioned in project text (evidence tier: INFERRED)
    claimed_matched: List[str] = field(default_factory=list)   # subset that are self-reported only (evidence tier: CLAIMED)
    coverage: float = 0.0            # fraction of required skills matched (0..1), unweighted
    trust_weighted_coverage: float = 0.0  # trust tier x importance tier weighted coverage (see fit_scorer WEIGHTS doc)
    quality: float = 0.0             # average match confidence of the matched skills (0..1)
    evidence_strength: float = 0.0   # 0..1 — how reliable the matched evidence is on average (VERIFIED=1.0, INFERRED=0.67, CLAIMED=0.33), independent of tier importance


def skill_evidence(
    matcher: TextMatcher,
    user_skills: List[str],
    verified_skills: Dict[str, object],
    career_skills: List[str],
    projects_text: str = "",
    skill_tiers_for_career: Dict[str, str] = None,
) -> SkillEvidence:
    if not career_skills:
        return SkillEvidence()

    verified_lookup = {k.lower(): v for k, v in (verified_skills or {}).items()} if isinstance(verified_skills, dict) else {}
    projects_norm = matcher._normalize_text(projects_text or "")
    skill_tiers_for_career = skill_tiers_for_career or {}

    career_list = list(career_skills)
    matched_idx: Dict[int, float] = {}
    matched_source_skill: Dict[int, str] = {}

    for us in user_skills:
        if not us:
            continue
        idx, conf = matcher.best_skill_match(us, career_list)
        if idx >= 0 and conf > matched_idx.get(idx, -1.0):
            matched_idx[idx] = conf
            matched_source_skill[idx] = us

    matched = [career_list[i] for i in matched_idx]
    gaps = [c for i, c in enumerate(career_list) if i not in matched_idx]
    qualities = list(matched_idx.values())

    gaps_by_tier: Dict[str, List[str]] = {t: [] for t in (tiers.TIER_ESSENTIAL, tiers.TIER_IMPORTANT, tiers.TIER_SUPPORTING, tiers.TIER_OPTIONAL)}
    for g in gaps:
        gaps_by_tier[tiers.tier_for(skill_tiers_for_career, g)].append(g)

    # Evidence-tier taxonomy (master-prompt terms): every matched skill is
    # classified into exactly ONE of three reliability tiers, in
    # increasing order of strength:
    #   CLAIMED   - the user listed it, nothing more.
    #   INFERRED  - not test-verified, but the user's own project text
    #               actually names it (inferred from their own evidence,
    #               not directly asserted as a skill).
    #   VERIFIED  - backed by an actual passed skill-test result.
    verified_matched = []
    verified_breakdown = {}
    project_demonstrated_matched = []
    claimed_matched = []
    for idx, cskill in enumerate(career_list):
        if idx not in matched_idx:
            continue
        source_skill = matched_source_skill[idx]
        v_key = source_skill.lower()
        if v_key in verified_lookup:
            verified_matched.append(cskill)
            verified_breakdown[cskill] = verified_lookup[v_key]
        elif projects_norm and matcher.text_mentions_skill(projects_norm, cskill):
            project_demonstrated_matched.append(cskill)
        else:
            claimed_matched.append(cskill)

    total_required = len(career_list)
    coverage = len(matched) / total_required if total_required else 0.0

    # Trust weighting (evidence-tier strength) x importance weighting
    # (skill-tier — see app/data/skill_importance.py), both applied
    # INSIDE the coverage calculation itself, never as a bonus bolted on
    # afterward, so neither axis can push the score above what full
    # coverage on essential/verified skills would already allow.
    #
    # Trust weights: CLAIMED=1.0, INFERRED=1.25, VERIFIED=1.5.
    # Importance weights: optional=1.0, supporting=2.0, important=3.0,
    # essential=4.0 (see skill_importance.TIER_WEIGHT).
    # A skill only ever counts once, at its single highest trust tier.
    TRUST_WEIGHT = {'claimed': 1.0, 'inferred': 1.25, 'verified': 1.5}
    trust_of = {}
    for s in verified_matched:
        trust_of[s] = TRUST_WEIGHT['verified']
    for s in project_demonstrated_matched:
        trust_of[s] = TRUST_WEIGHT['inferred']
    for s in claimed_matched:
        trust_of[s] = TRUST_WEIGHT['claimed']

    def importance_weight(skill: str) -> float:
        return tiers.TIER_WEIGHT[tiers.tier_for(skill_tiers_for_career, skill)]

    weighted_sum = sum(trust_of[s] * importance_weight(s) for s in matched)
    max_possible = sum(TRUST_WEIGHT['verified'] * importance_weight(c) for c in career_list)
    trust_weighted_coverage = min(weighted_sum / max_possible, 1.0) if max_possible else 0.0

    # Evidence Strength is a SEPARATE dimension from trust_weighted_coverage
    # on purpose (master prompt principle 9: don't collapse "how much
    # lines up" and "how reliable is the evidence that it lines up" into
    # one number). It's the average trust tier of the matched skills,
    # normalized to 0..1, independent of how important those skills are.
    if matched:
        max_trust = TRUST_WEIGHT['verified']
        evidence_strength = (sum(trust_of[s] for s in matched) / len(matched)) / max_trust
    else:
        evidence_strength = 0.0

    quality = sum(qualities) / len(qualities) if qualities else 0.0

    return SkillEvidence(
        matched=matched,
        gaps=gaps,
        gaps_by_tier=gaps_by_tier,
        verified_matched=verified_matched,
        verified_breakdown=verified_breakdown,
        project_demonstrated_matched=project_demonstrated_matched,
        claimed_matched=claimed_matched,
        coverage=coverage,
        trust_weighted_coverage=trust_weighted_coverage,
        quality=quality,
        evidence_strength=evidence_strength,
    )


@dataclass
class MatchEvidence:
    matched: List[str] = field(default_factory=list)
    score: float = 0.0


def interest_evidence(matcher: TextMatcher, user_interests: List[str], career_interests: List[str]) -> MatchEvidence:
    if not career_interests:
        return MatchEvidence()
    matched = matcher.match_free_text_list(user_interests, career_interests)
    score = len(matched) / len(career_interests)
    return MatchEvidence(matched=matched, score=min(score, 1.0))


EDUCATION_FIELD_MATCH_SCORE = 0.6  # partial credit - see tier 2 below


def education_evidence(
    matcher: TextMatcher,
    user_education: str,
    career_education: List[str],
    career_skills: List[str] = None,
    career_interests: List[str] = None,
) -> MatchEvidence:
    if not career_education or not user_education:
        return MatchEvidence()
    user_items = split_csv(user_education) or [user_education]

    # Tier 1: the user's education literally matches (exactly, or via loose
    # fuzzy/substring matching) one of the career's curated education
    # entries. This is the strongest signal - an anticipated, listed
    # credential - so it earns full credit. Education is typically an
    # "either/or" credential, not a checklist, so any single match is
    # treated as fully satisfying this category rather than being diluted
    # by how many *other* degrees the career would also accept.
    matched = matcher.match_free_text_list(user_items, career_education)
    if matched:
        return MatchEvidence(matched=matched, score=1.0)

    # Tier 2: no literal match, but the degree may still be a genuine,
    # relevant credential that the curated list just didn't happen to spell
    # out (career education lists are a handful of examples, not an
    # exhaustive taxonomy of every real degree name). Split the user's
    # degree into (level, field of study) and check whether the field
    # overlaps with the career's skill/interest vocabulary or with the
    # field text embedded in its own education entries (e.g. 'MBA
    # Analytics' contributes the field term 'analytics'). This is
    # deliberately WEAKER evidence than a listed match, so it earns partial
    # credit only - never the full 1.0 a literal match gets.
    field_pool = list(career_skills or []) + list(career_interests or [])
    career_levels: List[int] = []
    for ce in career_education:
        ce_level, ce_field = matcher.split_education(ce)
        if ce_level is not None:
            career_levels.append(ce_level)
        if ce_field:
            field_pool.append(ce_field)

    if field_pool:
        for ui in user_items:
            u_level, u_field = matcher.split_education(ui)
            if not u_field or len(u_field) < 3:
                continue
            field_hits = matcher.match_free_text_list([u_field], field_pool)
            if not field_hits:
                continue
            # Only block on a level mismatch that's unambiguous (user's
            # degree level is below every level the career's list
            # mentions) - never used to add credit, only to avoid
            # rewarding e.g. a Diploma against a career that only lists
            # Master's-level entries. If either side has no recognizable
            # level (e.g. 'Any Graduate', 'Bootcamp'), it's never blocked.
            if u_level is not None and career_levels and u_level < min(career_levels):
                continue
            return MatchEvidence(
                matched=[f"{ui} (related field of study, not an exact listed match)"],
                score=EDUCATION_FIELD_MATCH_SCORE,
            )

    return MatchEvidence()


def certification_evidence(
    matcher: TextMatcher, user_certifications: List[str], career_education: List[str], career_skills: List[str]
) -> MatchEvidence:
    """Certifications are matched against the career's education list (many
    entries there are actually certifications, e.g. 'PMP Certification',
    'CFA') and its skill vocabulary, since a dedicated certification field
    doesn't exist per-career in the dataset."""
    if not user_certifications:
        return MatchEvidence()
    pool = list(career_education) + list(career_skills)
    matched = matcher.match_free_text_list(user_certifications, pool)
    score = min(len(matched) / max(len(user_certifications), 1), 1.0) if matched else 0.0
    return MatchEvidence(matched=matched, score=score)


def experience_evidence(experience_years: float, anchor_years: float = 6.0) -> float:
    """A simple, transparent, monotonic curve: 0 years -> 0, anchor_years+
    -> 1.0. `anchor_years` defaults to 6 (the original generic anchor,
    used whenever a per-career anchor can't be derived) but callers can
    pass a per-career value — see `fit_scorer._experience_anchor_years`
    (Pass 13) for how that's derived from the career's own education
    data. This stays a heuristic either way, stated plainly as one in the
    reasoning output - not a claim about how much experience any specific
    employer actually requires."""
    try:
        years = float(experience_years or 0)
    except (TypeError, ValueError):
        years = 0.0
    anchor = anchor_years if anchor_years and anchor_years > 0 else 6.0
    return max(0.0, min(years / anchor, 1.0))


@dataclass
class ProjectEvidence:
    relevant_terms: List[str] = field(default_factory=list)
    score: float = 0.0
    has_any_project: bool = False


def project_evidence(matcher: TextMatcher, projects_text: str, career_skills: List[str]) -> ProjectEvidence:
    """Rather than a blind 'has any project? yes/no' flag, this looks at
    *what the project text actually mentions* and checks it against the
    career's skill vocabulary - so a portfolio of web-development projects
    counts as project evidence for Web Developer, but not for Nurse."""
    text = (projects_text or "").strip()
    has_any = bool(text)
    if not text or not career_skills:
        return ProjectEvidence(has_any_project=has_any)

    text_norm = matcher._normalize_text(text)
    found = []
    for skill in career_skills:
        if matcher.text_mentions_skill(text_norm, skill):
            found.append(skill)

    if found:
        score = min(len(found) / max(len(career_skills) * 0.3, 1), 1.0)
    else:
        # Some project evidence exists but nothing textually ties it to
        # this specific career - still worth a small, capped credit for
        # "has built something", far below a demonstrated content match.
        score = 0.15 if has_any else 0.0

    return ProjectEvidence(relevant_terms=found, score=score, has_any_project=has_any)
