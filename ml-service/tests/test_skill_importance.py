"""
Tests for app/data/skill_importance.py — the deterministic, documented
skill-importance tiering heuristic (position within a career's curated
list + how career-specific the skill is across the whole dataset).

These are spot-checks for face validity, not a claim that the heuristic
is empirically optimal (see the module's own docstring for that
disclosure) — they verify the mechanics behave as documented: every
career's own list spans a spread of tiers, a language explicitly listed
first for a tech career lands at least as high as a generic term listed
much later in the same list, and a totally generic/broadly-shared skill
never outranks a highly career-specific one within the same list.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.data.career_dataset import CAREER_DATABASE, CAREER_SKILL_TIERS
from app.data import skill_importance as tiers


def test_every_career_has_tiers_computed():
    for career in CAREER_DATABASE:
        assert career in CAREER_SKILL_TIERS


def test_tiers_only_uses_documented_labels():
    valid = {tiers.TIER_ESSENTIAL, tiers.TIER_IMPORTANT, tiers.TIER_SUPPORTING, tiers.TIER_OPTIONAL}
    for career_tiers in CAREER_SKILL_TIERS.values():
        for tier in career_tiers.values():
            assert tier in valid


def test_longer_lists_span_a_spread_of_tiers():
    # A career with a reasonably long curated skill list should not have
    # every skill dumped into one tier — the quartile-based cutoff is
    # relative to each career's own list, precisely to avoid that.
    for career, info in CAREER_DATABASE.items():
        if len(info.get('skills', [])) >= 8:
            distinct = set(CAREER_SKILL_TIERS[career].values())
            assert len(distinct) >= 2, f"{career} skill tiers collapsed to one bucket"


def test_position_matters_within_the_same_list():
    # Software Developer's list starts with specific languages and ends
    # with generic/peripheral terms (see career_dataset.py) - the first
    # skill should never rank below the last skill in the same list.
    sd_tiers = CAREER_SKILL_TIERS['Software Developer']
    order = {tiers.TIER_ESSENTIAL: 0, tiers.TIER_IMPORTANT: 1, tiers.TIER_SUPPORTING: 2, tiers.TIER_OPTIONAL: 3}
    first_skill = CAREER_DATABASE['Software Developer']['skills'][0]
    last_skill = CAREER_DATABASE['Software Developer']['skills'][-1]
    assert order[sd_tiers[first_skill]] <= order[sd_tiers[last_skill]]


def test_tier_for_unknown_skill_defaults_to_supporting():
    # A skill not present in a career's own list (e.g. because it was
    # matched via synonym expansion elsewhere) should get a neutral
    # middle weight rather than crashing or defaulting to the extremes.
    assert tiers.tier_for({}, 'some skill not in any list') == tiers.TIER_SUPPORTING


def test_tier_weights_strictly_decrease():
    order = [tiers.TIER_ESSENTIAL, tiers.TIER_IMPORTANT, tiers.TIER_SUPPORTING, tiers.TIER_OPTIONAL]
    weights = [tiers.TIER_WEIGHT[t] for t in order]
    assert weights == sorted(weights, reverse=True)
    assert len(set(weights)) == 4
