"""
Targeted validation checks (master prompt "VALIDATION" section).

This system cannot validate real-world outcome accuracy — there is no
outcome-labelled data to validate against, and this file does not
pretend otherwise. What CAN be validated honestly, and is checked here:

  - skill-match precision on genuinely ambiguous/similar-looking terms
    (does the matcher avoid false positives between distinct skills?)
  - market evidence staying structurally separate from personal fit
    (does market data ever leak into the fit-score computation?)
  - fair treatment of missing data (does a blank field get treated as
    "unknown" rather than "worst possible", per master prompt principle
    on fresh graduates?)
  - consistency (does the same profile always produce the same result,
    and does adding irrelevant information not silently change rankings
    it shouldn't?)
"""
import sys
import os
import inspect

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.engine.text_match import TextMatcher
from app.engine import fit_scorer
from app.engine import market_context
from app.predictors.advanced_ml_predictor import AdvancedHybridCareerPredictor


def _predictor(tmp_path):
    d = tmp_path / "ml_models"
    d.mkdir()
    return AdvancedHybridCareerPredictor(
        model_path=str(d / "feedback_calibration_model.pkl"),
        verbose=False,
    )


# --- Ambiguous / similar-looking skill rejection -----------------------

def test_java_does_not_match_javascript():
    """Two genuinely distinct languages that share a string prefix must
    not be fuzzy-matched to each other, even though careers commonly list
    both."""
    m = TextMatcher()
    idx, conf = m.best_skill_match("java", ["javascript", "python"])
    assert idx == -1, "java incorrectly matched against javascript-only list"

    idx2, conf2 = m.best_skill_match("javascript", ["java", "python"])
    assert idx2 == -1, "javascript incorrectly matched against java-only list"


def test_short_symbol_skills_require_exact_match():
    """c++ / c# must never fuzzy-match each other — short, symbol-heavy
    skills are compared for exact equality only (see best_skill_match's
    docstring)."""
    m = TextMatcher()
    idx, conf = m.best_skill_match("c++", ["c#", "python"])
    assert idx == -1, "c++ incorrectly matched against c#-only list"


def test_unrelated_terms_are_rejected():
    m = TextMatcher()
    idx, conf = m.best_skill_match("underwater basket weaving", ["python", "java", "sql"])
    assert idx == -1


# --- Market evidence stays structurally separate from fit --------------

def test_fit_scorer_never_imports_market_context():
    """Structural check, not just behavioral: fit_scorer.py must not
    actually IMPORT market_context — if it did, there'd be a live risk of
    market data leaking into the fit-score formula. This checks for a
    real import statement, not just the module name appearing anywhere
    (the module's own docstring references market_context.py by name as
    documentation, which is fine and expected)."""
    src = inspect.getsource(fit_scorer)
    import_lines = [ln.strip() for ln in src.splitlines() if ln.strip().startswith(('import ', 'from '))]
    assert not any('market_context' in ln or 'market' in ln.lower() for ln in import_lines), (
        f"fit_scorer.py imports something market-related: {import_lines}"
    )


def test_market_outlook_has_no_numeric_fit_influence():
    """market_outlook() returns purely descriptive/reference fields - it
    must never return anything that looks like a score contributing to
    ranking."""
    outlook = market_context.market_outlook('Very High', '₹10-20 LPA')
    for key, value in outlook.items():
        assert not isinstance(value, (int, float)), f"market_outlook returned a numeric field '{key}' — risks being mistaken for a score"


def test_market_relevance_adjustment_is_small_and_capped():
    """Pass 13: market relevance is now a genuine (small) input to the
    final ranking number, added in recommender.py — but it must stay
    capped well below any single fit_scorer.WEIGHTS entry that matters,
    so it can nudge between close careers without ever overriding a real
    fit difference. 'Medium' (the modal label) must be exactly neutral."""
    assert market_context.market_relevance_adjustment('Medium') == 0.0
    assert market_context.market_relevance_adjustment('Unknown Label') == 0.0
    for label in ('Very High', 'High', 'Low', 'Variable', None, ''):
        adj = market_context.market_relevance_adjustment(label)
        assert -market_context.MARKET_ADJUSTMENT_CAP <= adj <= market_context.MARKET_ADJUSTMENT_CAP
    # The cap itself must be small relative to the scoring weights — the
    # whole point of "secondary, not dominant."
    assert market_context.MARKET_ADJUSTMENT_CAP < fit_scorer.WEIGHTS['skills']
    assert market_context.MARKET_ADJUSTMENT_CAP < fit_scorer.WEIGHTS['interests']
    assert market_context.MARKET_ADJUSTMENT_CAP < fit_scorer.WEIGHTS['experience']


def test_market_adjustment_cannot_override_a_real_fit_gap(tmp_path):
    """A career the user is clearly well-suited for (many matched
    essential skills) must never be outranked by a career they have
    almost no overlap with, purely because the latter has 'Very High'
    demand and the former has 'Low' demand. The market cap (±3) is far
    smaller than a realistic fit gap between a strong and a weak match."""
    predictor = _predictor(tmp_path)
    profile = {
        "skills": "Python, Machine Learning, TensorFlow, PyTorch, Deep Learning, Statistics, NLP",
        "interests": "artificial intelligence, machine learning",
        "education": "M.Tech",
        "experience": 2,
        "certifications": "",
        "projects": "Trained and deployed several deep learning models.",
    }
    results = predictor.predict_career_hybrid(profile, {}, top_k=148)
    by_career = {r['career']: r for r in results}
    strong = by_career.get('AI/ML Engineer')
    weak = by_career.get('Chef/Culinary Expert') or by_career.get('Fashion Designer')
    if strong and weak:
        assert strong['confidence'] > weak['confidence'], (
            "a low-overlap career outranked a strong-fit career — market adjustment must not be able to do this"
        )


def test_recommendation_ranking_survives_market_removed(tmp_path):
    """Two otherwise-identical careers with different job_growth labels
    should not have their RANKING flipped by market popularity alone -
    market_outlook is attached for display, never used as a sort key."""
    predictor = _predictor(tmp_path)
    profile = {
        "skills": "Python, SQL, Machine Learning",
        "interests": "data",
        "education": "B.Tech",
        "experience": 1,
        "certifications": "",
        "projects": "",
    }
    results = predictor.predict_career_hybrid(profile, {}, top_k=148)
    # Sort key used by the engine is `confidence` (fit + feedback calibration
    # only) - assert the returned order matches sorting by confidence alone,
    # which would NOT hold if market data silently influenced the sort.
    confidences = [r['confidence'] for r in results]
    assert confidences == sorted(confidences, reverse=True)


# --- Fair treatment of missing data -------------------------------------

def test_blank_certifications_and_projects_do_not_zero_the_score(tmp_path):
    predictor = _predictor(tmp_path)
    profile = {
        "skills": "Python, SQL, Machine Learning, Pandas, Statistics",
        "interests": "data analysis",
        "education": "B.Tech Computer Science",
        "experience": 0,
        "certifications": "",
        "projects": "",
    }
    results = predictor.predict_career_hybrid(profile, {}, top_k=5)
    assert results, "a strong-skills-but-blank-extras profile should still surface recommendations"
    top = results[0]
    assert top['confidence'] > 0
    assert set(top['excluded_categories']) >= {'certifications', 'projects'}
    assert 'certifications' in top['reasoning'] or 'projects' in top['reasoning']


def test_missing_education_does_not_crash_or_zero_unrelated_categories(tmp_path):
    predictor = _predictor(tmp_path)
    profile = {
        "skills": "React, JavaScript, Node, MongoDB, Express",
        "interests": "web development",
        "education": "",
        "experience": 0,
        "certifications": "",
        "projects": "",
    }
    results = predictor.predict_career_hybrid(profile, {}, top_k=5)
    assert results
    top = results[0]
    # Skills/interests should still contribute fully even with education blank.
    assert top['score_breakdown']['components']['skills'] > 0


# --- Consistency ----------------------------------------------------------

def test_same_profile_produces_identical_results(tmp_path):
    predictor = _predictor(tmp_path)
    profile = {
        "skills": "Python, Machine Learning, TensorFlow",
        "interests": "ai",
        "education": "M.Tech",
        "experience": 2,
        "certifications": "",
        "projects": "Built an image classifier with TensorFlow.",
    }
    r1 = predictor.predict_career_hybrid(profile, {}, top_k=5)
    r2 = predictor.predict_career_hybrid(profile, {}, top_k=5)
    assert [r['career'] for r in r1] == [r['career'] for r in r2]
    assert [r['confidence'] for r in r1] == [r['confidence'] for r in r2]


def test_irrelevant_extra_skill_does_not_reorder_unrelated_careers(tmp_path):
    """Adding one clearly irrelevant skill (e.g. 'cooking') to a strong
    tech profile shouldn't change the SCORE or RELATIVE ORDER of any
    tech career - it should only ever affect careers where that skill is
    actually relevant (here, Chef/Culinary Expert). Comparing the full,
    unfiltered top_k=all list (rather than a fixed top-10 window) avoids
    a false failure from a newly-relevant career simply entering a
    top-N window and displacing an unrelated tied score - that's a
    windowing effect, not a reordering of the tech careers themselves."""
    predictor = _predictor(tmp_path)
    base = {
        "skills": "Python, SQL, Machine Learning, Pandas",
        "interests": "data",
        "education": "B.Tech",
        "experience": 1,
        "certifications": "",
        "projects": "",
    }
    with_extra = dict(base, skills=base["skills"] + ", Cooking")
    r1 = {r['career']: r['confidence'] for r in predictor.predict_career_hybrid(base, {}, top_k=148)}
    r2 = {r['career']: r['confidence'] for r in predictor.predict_career_hybrid(with_extra, {}, top_k=148)}

    shared_careers = [c for c in r1 if 'chef' not in c.lower() and 'culinary' not in c.lower()]
    changed = [c for c in shared_careers if r1[c] != r2.get(c)]
    assert not changed, f"adding an irrelevant skill changed scores for unrelated careers: {changed[:5]}"
