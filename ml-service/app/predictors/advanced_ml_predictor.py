"""
AdvancedHybridCareerPredictor - compatibility entry point.

## Why this file looks so small

The recommendation/ML logic previously lived entirely in this file as a
~1200-line module (`DatasetAlignedMLPredictor` + `AdvancedHybridCareerPredictor`)
with a specific, serious methodological problem: the "ML model" was trained
on labels computed by `_calc_fuzzy_score(...)` - i.e. its own rule-based
scoring function - then blended back with that same fuzzy score inside a
tight ±6-point corridor at prediction time. That produced a model that
could report a suspiciously perfect validation R² (0.9993, because it was
learning to reproduce a deterministic formula, not real-world career
suitability) while adding no independent signal, plus several hand-tuned
"bonus" adjustments (additive verified-skill bumps, growth-rate
multipliers baked into a fabricated "success probability") that made
rankings look mathematically polished without being any more trustworthy.

This has been replaced by `app/engine/` (see `app/engine/recommender.py`
for the full design rationale):
  - one transparent, documented, evidence-weighted Fit Score (no circular
    ML training, no arbitrary post-hoc bonuses, no fake alignment
    corridor),
  - a market-outlook field that stays qualitative and clearly separate
    from the fit score instead of being folded into an invented
    "probability of success",
  - the *only* real ML component (`feedback_model.py`) trains solely on
    actual recorded user feedback, and stays inactive - by design - until
    enough real ratings exist.

This module now just re-exports `CareerRecommender` under the class names
`main.py` / `predictor_singleton.py` already import, so nothing calling
into the ML service needs to change.
"""
from app.engine.recommender import CareerRecommender


class AdvancedHybridCareerPredictor:
    """Thin adapter preserving the old public surface:
    - predict_career_hybrid(user_profile, verified_skills, top_k)
    - _compute_skill_overlap(career_name, user_profile, verified_skills)
    - record_user_feedback(user_profile, career, rating)
    - get_model_info() / get_ml_model_info()
    - .ml.{_normalize_text, _normalize_skill_for_matching, _expand_skill}
      (used directly by main.py's /extract-skills and /normalize-skills)
    - .career_db (used indirectly via /careers style lookups elsewhere)
    """

    def __init__(self, model_path: str = 'ml_models/feedback_calibration_model.pkl',
                 force_retrain: bool = False, verbose: bool = True):
        self.verbose = verbose
        self._engine = CareerRecommender(feedback_model_path=model_path, verbose=verbose)
        # `main.py` reaches into `predictor.ml.*` for text-normalization
        # helpers, and some code paths refer to `predictor.career_db`.
        self.ml = self._engine.matcher
        self.career_db = self._engine.career_db

        if force_retrain:
            self._engine.retrain_feedback_model()

    def predict_career_hybrid(self, user_profile, verified_skills, top_k=5):
        return self._engine.predict_career_hybrid(user_profile, verified_skills, top_k=top_k)

    def _compute_skill_overlap(self, career_name, user_profile, verified_skills):
        return self._engine._compute_skill_overlap(career_name, user_profile, verified_skills)

    def record_user_feedback(self, user_profile, career, rating):
        return self._engine.record_user_feedback(user_profile, career, rating)

    def get_ml_model_info(self):
        info = self._engine.get_model_info()
        info['hybrid_enabled'] = False  # no fuzzy/ML "hybrid" blend anymore - see module docstring
        return info

    def get_model_info(self):
        return self.get_ml_model_info()


__all__ = ['AdvancedHybridCareerPredictor']
