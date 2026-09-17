-- Persistent storage for ML feedback ratings.
--
-- These ratings are the ONLY real training signal the recommendation
-- engine has (see ml-service/app/engine/feedback_model.py). They
-- previously accumulated in a JSON file inside the ML container's own
-- filesystem, so recreating that container discarded every rating
-- collected since the image was built — and unlike every other table
-- here, that data cannot be regenerated from anything else.
--
-- The ML service writes here when FEEDBACK_STORE=postgres (see
-- ml-service/app/storage/feedback_store.py). It also issues an
-- idempotent CREATE TABLE IF NOT EXISTS at startup as a safety net, so
-- applying this migration is not strictly required for the service to
-- run — but applying it keeps the schema authoritative in one place.
--
-- Additive: no existing table is touched.
--
-- Note there is intentionally no user_id / foreign key. The backend has
-- already verified, before forwarding anything here, that the rating
-- refers to a recommendation that user actually received
-- (recommendationService.submitFeedback). What the model trains on is
-- the profile-shape → rating relationship, so the ML service stores a
-- profile snapshot rather than an identity, and keeping user identity
-- out of the training store limits how much personal data ends up in it.

CREATE TABLE IF NOT EXISTS ml_feedback (
    id            SERIAL PRIMARY KEY,
    recorded_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    career        VARCHAR(255) NOT NULL,
    rating        REAL NOT NULL CHECK (rating >= 1 AND rating <= 5),
    user_profile  JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_ml_feedback_career ON ml_feedback(career);
CREATE INDEX IF NOT EXISTS idx_ml_feedback_recorded_at ON ml_feedback(recorded_at);
