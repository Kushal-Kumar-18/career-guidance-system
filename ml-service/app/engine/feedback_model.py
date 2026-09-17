"""
Feedback calibration model.

This is the ONLY machine-learning component in the recommendation engine,
and it is trained exclusively on real, human-generated signal: ratings
users give to recommendations they actually received
(`record_user_feedback`). It is never trained on the fuzzy/rule-based fit
score, or on any synthetically generated labels - doing so would just teach
a model to reproduce the rule-based score's own biases and call that
"independent learning" (the exact problem this rewrite was asked to fix).

Because real feedback is scarce, especially early on, this model:
  - starts inactive (no bundled pretrained weights, no synthetic bootstrap
    data - an untrained model is reported as untrained, not silently
    replaced with something that pretends to know more than it does),
  - only activates once at least MIN_SAMPLES real ratings, spanning at
    least MIN_CAREERS distinct careers, have been collected,
  - is deliberately simple (linear regression) and lightly capped in how
    much it can move the final ranking (see recommender.py), so a handful
    of noisy ratings can't dominate the transparent fit score,
  - reports its own validation error honestly instead of a headline
    R²-on-its-own-training-signal number, and never describes its output
    as a "probability of success" - it predicts a 1-5 user-satisfaction
    rating, nothing more.
"""
from __future__ import annotations

import json
import os
import pickle
from dataclasses import dataclass
from typing import Dict, List, Optional

import numpy as np

MIN_SAMPLES = 25
MIN_CAREERS = 4


@dataclass
class FeedbackModelInfo:
    active: bool
    sample_count: int
    careers_covered: int
    min_samples_required: int
    val_mae: Optional[float] = None
    note: str = ""


class FeedbackCalibrationModel:
    """Ridge regression over the same 0..1 evidence fractions the fit
    scorer computes, predicting the 1-5 rating a user gave that
    recommendation. Small, linear, and easy to inspect (feature -> weight)
    rather than an opaque ensemble - appropriate given how little data this
    will ever realistically have."""

    def __init__(self, storage_path: str, feature_order: List[str]):
        self.storage_path = storage_path
        self.feature_order = feature_order
        self.model = None
        self.scaler_mean = None
        self.scaler_scale = None
        self.info = FeedbackModelInfo(
            active=False, sample_count=0, careers_covered=0, min_samples_required=MIN_SAMPLES,
            note="No trained feedback model yet - falling back entirely to the transparent fit score.",
        )
        self._load()

    @property
    def is_active(self) -> bool:
        return self.model is not None

    def _load(self) -> None:
        if os.path.exists(self.storage_path):
            try:
                with open(self.storage_path, 'rb') as f:
                    state = pickle.load(f)
                self.model = state['model']
                self.scaler_mean = state['scaler_mean']
                self.scaler_scale = state['scaler_scale']
                self.info = FeedbackModelInfo(**state['info'])
            except Exception:
                self.model = None

    def _save(self) -> None:
        os.makedirs(os.path.dirname(self.storage_path) or '.', exist_ok=True)
        with open(self.storage_path, 'wb') as f:
            pickle.dump({
                'model': self.model,
                'scaler_mean': self.scaler_mean,
                'scaler_scale': self.scaler_scale,
                'info': self.info.__dict__,
            }, f)

    def fit(self, feature_rows: List[List[float]], ratings: List[float], careers: List[str]) -> FeedbackModelInfo:
        n = len(feature_rows)
        distinct_careers = len(set(careers))

        if n < MIN_SAMPLES or distinct_careers < MIN_CAREERS:
            self.model = None
            self.info = FeedbackModelInfo(
                active=False, sample_count=n, careers_covered=distinct_careers,
                min_samples_required=MIN_SAMPLES,
                note=(
                    f"Only {n} feedback rating(s) across {distinct_careers} career(s) recorded so far "
                    f"(need >= {MIN_SAMPLES} ratings across >= {MIN_CAREERS} careers). "
                    "Recommendations are based entirely on the transparent fit score until then."
                ),
            )
            self._save()
            return self.info

        from sklearn.linear_model import Ridge
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import mean_absolute_error

        X = np.array(feature_rows, dtype=float)
        y = np.array(ratings, dtype=float)

        mean = X.mean(axis=0)
        scale = X.std(axis=0)
        scale[scale == 0] = 1.0
        X_scaled = (X - mean) / scale

        test_size = 0.25 if n >= 16 else max(1, n // 5) / n
        X_train, X_val, y_train, y_val = train_test_split(X_scaled, y, test_size=test_size, random_state=42)

        model = Ridge(alpha=2.0, random_state=42)
        model.fit(X_train, y_train)
        val_mae = float(mean_absolute_error(y_val, model.predict(X_val))) if len(X_val) else None

        self.model = model
        self.scaler_mean = mean
        self.scaler_scale = scale
        self.info = FeedbackModelInfo(
            active=True, sample_count=n, careers_covered=distinct_careers,
            min_samples_required=MIN_SAMPLES, val_mae=round(val_mae, 2) if val_mae is not None else None,
            note=(
                f"Trained on {n} real user feedback ratings across {distinct_careers} careers. "
                "Predicts a 1-5 satisfaction rating from profile-fit evidence; used only as a small, "
                "capped adjustment on top of the transparent fit score, never as a standalone ranking."
            ),
        )
        self._save()
        return self.info

    def predict_rating(self, feature_vector: List[float]) -> Optional[float]:
        if not self.is_active:
            return None
        x = (np.array(feature_vector, dtype=float) - self.scaler_mean) / self.scaler_scale
        pred = float(self.model.predict(x.reshape(1, -1))[0])
        return max(1.0, min(pred, 5.0))
