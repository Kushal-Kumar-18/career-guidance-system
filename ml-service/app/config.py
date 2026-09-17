import os

# This now points at the *feedback calibration model* (see
# app/engine/feedback_model.py) - a small model trained only on real user
# feedback ratings, not a pretrained "career suitability" model. It won't
# exist until enough feedback has been recorded; the engine works fine
# without it (falls back to the transparent fit score).
MODEL_PATH = os.environ.get(
    "ML_MODEL_PATH",
    os.path.join(os.path.dirname(__file__), "data", "ml_models", "feedback_calibration_model.pkl"),
)
HOST = os.environ.get("ML_SERVICE_HOST", "0.0.0.0")
PORT = int(os.environ.get("ML_SERVICE_PORT", "8000"))

# --- Feedback storage -------------------------------------------------
# User feedback ratings are the only real training signal in this service
# (app/engine/feedback_model.py), so they must outlive the container.
#
#   FEEDBACK_STORE=postgres  -> ml_feedback table (recommended anywhere
#                               the service runs in Docker; requires
#                               FEEDBACK_DATABASE_URL or DATABASE_URL)
#   FEEDBACK_STORE=json      -> JSON file (default; keep it on a mounted
#                               volume or it is lost on container
#                               recreation)
#
# See app/storage/feedback_store.py.
FEEDBACK_STORE = os.environ.get("FEEDBACK_STORE", "json")
FEEDBACK_DATABASE_URL = os.environ.get("FEEDBACK_DATABASE_URL") or os.environ.get("DATABASE_URL", "")
