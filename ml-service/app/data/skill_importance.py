"""
Skill importance tiers — essential / important / supporting / optional.

WHAT THIS IS: a deterministic, fully documented heuristic that splits each
career's already-curated skill list into four importance tiers, so the
scoring engine can weight a match on a career-defining skill more than a
match on a peripheral one (master prompt principle 3/12: "do not assume
every listed skill has equal importance").

WHAT THIS IS NOT: an authoritative importance grading. This deployment
has no network access to an external occupational taxonomy (O*NET/ESCO)
that publishes real skill-importance weights per occupation (see
docs/AI_ML.md "Dataset provenance"), so importance here is DERIVED from
two signals already present in the curated dataset itself, not sourced
from outcome data or expert review:

  1. POSITION in the career's skill list. The dataset's curators
     consistently list a career's defining languages/tools first and
     broader/peripheral terms later (e.g. Software Developer:
     'python, java, javascript, c++, programming, coding, git,
     algorithms, ...' - the specific languages precede the generic
     terms). This is a real pattern in how the list was authored, but it
     is a stylistic convention, not a verified importance ranking.

  2. SPECIFICITY across the whole dataset (inverse career-frequency): a
     skill that appears in only a few careers' lists is more
     differentiating/essential to those specific careers than a skill
     that appears in dozens of careers' lists (e.g. 'communication' or
     'problem solving' show up broadly and are rarely what separates one
     career from another; 'kubernetes' or 'solidworks' are much more
     career-specific). This is a standard TF-IDF-style idea applied to
     skill-to-career membership, not a trained model and not tied to any
     performance metric — it is feature engineering over static data,
     which is different from training on labels the system invented.

These two signals are combined into a single per-skill score, and each
career's own skill list is split into quartiles of that score to assign
tiers RELATIVE TO THAT CAREER (so every career has some mix of tiers,
rather than a global cutoff that could leave a short list with zero
"essential" skills). Combination weights (0.6 position / 0.4 specificity)
were chosen for face validity, spot-checked against a few careers (see
`ml-service/tests/test_skill_importance.py`), and are stated here plainly
as a documented choice — not implied to be empirically optimal.

If a future version of this project has network access to O*NET/ESCO,
those sources' actual importance/relevance ratings should replace this
heuristic outright (see docs/AI_ML.md for the documented crosswalk path).
"""
from __future__ import annotations

from typing import Dict, List

TIER_ESSENTIAL = 'essential'
TIER_IMPORTANT = 'important'
TIER_SUPPORTING = 'supporting'
TIER_OPTIONAL = 'optional'

# Tier weights used by the scoring engine — essential skills count for
# more than optional ones. Documented choice, not derived from data:
# roughly "an essential skill is worth 4x an optional one," which is
# steep enough to matter but not so steep that a single essential skill
# swamps everything else for a career with many essential skills.
TIER_WEIGHT = {
    TIER_ESSENTIAL: 4.0,
    TIER_IMPORTANT: 3.0,
    TIER_SUPPORTING: 2.0,
    TIER_OPTIONAL: 1.0,
}


def _position_score(index: int, list_length: int) -> float:
    """1.0 for the first skill in the list, approaching 0.0 for the last."""
    if list_length <= 1:
        return 1.0
    return 1.0 - (index / (list_length - 1))


def build_skill_tiers(career_database: Dict[str, Dict]) -> Dict[str, Dict[str, str]]:
    """Returns {career_name: {skill: tier}} for every career in the
    database. Computed once at import time from CAREER_DATABASE itself —
    there is no separate data file to keep in sync, and this recomputes
    automatically whenever the underlying skill lists change.
    """
    total_careers = len(career_database)

    # Career-frequency of each skill across the whole dataset (for the
    # specificity signal). Uses exact string match on the already-curated
    # skill text, not fuzzy matching — deliberately: this is a
    # dataset-level statistic, not a per-user matching decision.
    skill_career_count: Dict[str, int] = {}
    for info in career_database.values():
        for skill in set(s.lower().strip() for s in (info.get('skills') or []) if s):
            skill_career_count[skill] = skill_career_count.get(skill, 0) + 1

    result: Dict[str, Dict[str, str]] = {}
    for career_name, info in career_database.items():
        skills = [s.lower().strip() for s in (info.get('skills') or []) if s]
        n = len(skills)
        if n == 0:
            result[career_name] = {}
            continue

        scored = []
        for i, skill in enumerate(skills):
            pos_score = _position_score(i, n)
            freq = skill_career_count.get(skill, 1)
            specificity_score = 1.0 - min((freq - 1) / max(total_careers - 1, 1), 1.0)
            combined = 0.6 * pos_score + 0.4 * specificity_score
            scored.append((skill, combined))

        # Quartile cutoffs relative to THIS career's own skill list, so
        # every career (long or short list) ends up with a spread across
        # tiers rather than being judged against a global threshold.
        ranked = sorted(scored, key=lambda x: -x[1])
        tiers: Dict[str, str] = {}
        for rank, (skill, _score) in enumerate(ranked):
            fraction = rank / n
            if fraction < 0.25:
                tiers[skill] = TIER_ESSENTIAL
            elif fraction < 0.5:
                tiers[skill] = TIER_IMPORTANT
            elif fraction < 0.75:
                tiers[skill] = TIER_SUPPORTING
            else:
                tiers[skill] = TIER_OPTIONAL
        result[career_name] = tiers

    return result


def tier_for(skill_tiers_for_career: Dict[str, str], skill: str) -> str:
    return skill_tiers_for_career.get((skill or '').lower().strip(), TIER_SUPPORTING)
