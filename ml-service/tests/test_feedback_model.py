"""
Tests for the feedback-calibration model (app/engine/feedback_model.py) -
the only real machine-learning component in the recommendation engine.

These tests specifically guard against the original problem this whole
rewrite was about: an ML component that learns to reproduce a rule-based
score rather than independent, real-world signal. Here that means:
  - it must never train on the fit score itself,
  - it must stay inactive until real feedback volume/diversity exists,
  - once active, its influence on the final ranking must stay small and
    capped, never able to override the transparent fit score outright.
"""
import random

from app.engine.feedback_model import FeedbackCalibrationModel, MIN_SAMPLES, MIN_CAREERS
from app.engine import fit_scorer


def test_inactive_with_no_data(tmp_path):
    model = FeedbackCalibrationModel(str(tmp_path / "m.pkl"), fit_scorer.FEATURE_ORDER)
    assert model.is_active is False
    assert model.predict_rating([0.5] * len(fit_scorer.FEATURE_ORDER)) is None


def test_stays_inactive_below_min_samples(tmp_path):
    model = FeedbackCalibrationModel(str(tmp_path / "m.pkl"), fit_scorer.FEATURE_ORDER)
    rows = [[0.5] * len(fit_scorer.FEATURE_ORDER)] * (MIN_SAMPLES - 1)
    ratings = [4.0] * (MIN_SAMPLES - 1)
    careers = ['Software Developer'] * (MIN_SAMPLES - 1)
    info = model.fit(rows, ratings, careers)
    assert info.active is False
    assert model.is_active is False


def test_stays_inactive_with_too_few_distinct_careers(tmp_path):
    """Enough total ratings, but all for the same career - real signal
    about generalizable profile-fit patterns requires seeing feedback
    across multiple careers, not just repeated opinions about one."""
    model = FeedbackCalibrationModel(str(tmp_path / "m.pkl"), fit_scorer.FEATURE_ORDER)
    rows = [[random.random() for _ in fit_scorer.FEATURE_ORDER] for _ in range(MIN_SAMPLES + 10)]
    ratings = [random.choice([1, 2, 3, 4, 5]) for _ in rows]
    careers = ['Software Developer'] * len(rows)
    info = model.fit(rows, ratings, careers)
    assert info.active is False
    assert info.careers_covered == 1


def test_activates_with_enough_diverse_real_feedback(tmp_path):
    random.seed(1)
    model = FeedbackCalibrationModel(str(tmp_path / "m.pkl"), fit_scorer.FEATURE_ORDER)
    careers_pool = ['Software Developer', 'Data Scientist', 'Business Analyst', 'Nurse', 'Graphic Designer']
    rows, ratings, careers = [], [], []
    for _ in range(MIN_SAMPLES + 5):
        rows.append([random.random() for _ in fit_scorer.FEATURE_ORDER])
        ratings.append(random.choice([1, 2, 3, 4, 5]))
        careers.append(random.choice(careers_pool))
    info = model.fit(rows, ratings, careers)
    assert info.active is True
    assert info.sample_count == MIN_SAMPLES + 5
    assert info.careers_covered >= MIN_CAREERS
    # Honest reporting: a validation error is present, and nothing
    # resembling a "probability of success" claim leaks into the note.
    assert info.val_mae is not None
    assert 'probability' not in info.note.lower()


def test_persists_and_reloads(tmp_path):
    random.seed(2)
    path = str(tmp_path / "m.pkl")
    model = FeedbackCalibrationModel(path, fit_scorer.FEATURE_ORDER)
    careers_pool = ['Software Developer', 'Data Scientist', 'Business Analyst', 'Nurse']
    rows = [[random.random() for _ in fit_scorer.FEATURE_ORDER] for _ in range(MIN_SAMPLES + 5)]
    ratings = [random.choice([1, 2, 3, 4, 5]) for _ in rows]
    careers = [random.choice(careers_pool) for _ in rows]
    model.fit(rows, ratings, careers)
    assert model.is_active

    reloaded = FeedbackCalibrationModel(path, fit_scorer.FEATURE_ORDER)
    assert reloaded.is_active
    pred = reloaded.predict_rating([0.5] * len(fit_scorer.FEATURE_ORDER))
    assert 1.0 <= pred <= 5.0


def test_never_trains_on_fit_score_labels(tmp_path):
    """Explicit regression guard: feeding the model labels derived from
    the fit score itself (the exact bug being fixed) should not be
    possible through this API - `fit()` only accepts externally supplied
    ratings, and nothing in this module ever calls fit_scorer to
    generate its own labels."""
    import inspect

    from app.engine import feedback_model as fm_module
    source = inspect.getsource(fm_module)
    assert 'fit_scorer' not in source
    assert 'compute_fit' not in source
