"""
Loads the AdvancedHybridCareerPredictor once per process, so every request
reuses the same in-memory engine instead of re-initializing it (and
reloading any persisted feedback-calibration model) per request.

Note: the old sys.path hack that used to live here (to make a bare
`from career_dataset import ...` resolve) is gone - the engine now uses
proper absolute imports (`app.data.career_dataset`, `app.engine.*`), so
there's nothing to patch onto sys.path.
"""
import traceback

from app.config import MODEL_PATH
from app.predictors.advanced_ml_predictor import AdvancedHybridCareerPredictor

_predictor = None
_load_error = None


def get_predictor():
    global _predictor, _load_error
    if _predictor is None and _load_error is None:
        try:
            _predictor = AdvancedHybridCareerPredictor(model_path=MODEL_PATH)
        except Exception as exc:  # noqa: BLE001 - surfaced via /health
            _load_error = f"{exc}"
            traceback.print_exc()
    return _predictor


def get_load_error():
    return _load_error
