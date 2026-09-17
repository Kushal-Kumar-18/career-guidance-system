import os
import shutil
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.predictors.advanced_ml_predictor import AdvancedHybridCareerPredictor  # noqa: E402
from app.data.career_dataset import CAREER_DATABASE  # noqa: E402


@pytest.fixture()
def tmp_model_dir(tmp_path):
    d = tmp_path / "ml_models"
    d.mkdir()
    yield str(d)
    shutil.rmtree(str(d), ignore_errors=True)


@pytest.fixture()
def predictor(tmp_model_dir):
    """A fresh predictor per test, with its own isolated feedback-model
    storage directory so tests never share or pollute feedback state."""
    return AdvancedHybridCareerPredictor(
        model_path=os.path.join(tmp_model_dir, "feedback_calibration_model.pkl"),
        verbose=False,
    )


@pytest.fixture()
def career_db():
    return CAREER_DATABASE
