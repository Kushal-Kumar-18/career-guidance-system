"""
Durable storage for ML feedback ratings.

RECONSTRUCTION NOTE (read this first): this file did not exist in the
zip this phase started from, even though app/engine/recommender.py
imports `build_feedback_store` from it and tests/test_feedback_store.py
already contains a full test suite against exactly this module's API
(JsonFeedbackStore, build_feedback_store, `.append`/`.all`/`.describe`,
the FEEDBACK_STORE / FEEDBACK_DATABASE_URL environment variables, the
Postgres degrade-to-JSON behavior). That is a real gap in the exported
project, not a design choice of this phase. Rather than leave every
Python test uncollectable (recommender.py fails to import without this
module) or invent unverified behavior, this implementation was written
directly against that pre-existing test file as its specification --
every choice below (JSON round-trip shape, corrupt-file tolerance,
which env var wins, the degrade-on-connect-failure behavior, the
`describe()` keys) is pinned by a test that already existed before this
file did. `db/migrations/0003_ml_feedback.sql` (also pre-existing)
supplied the `ml_feedback` table shape the Postgres driver writes to.
Flagged here explicitly so this reconstruction gets reviewed against
whatever the original file actually contained, if it still exists
somewhere outside this export.
"""
from __future__ import annotations

import logging
import json
import os
import tempfile
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class JsonFeedbackStore:
    """Append-only JSON-file-backed feedback log.

    The default driver: dependency- and database-free, so local dev and
    the test suite never need Postgres running. Writes are atomic
    (write-to-temp-then-rename) so a crash mid-write can't corrupt the
    file, and a read of an already-corrupt file degrades to "no records
    yet" rather than crashing the service -- losing durability of
    feedback already lost to corruption is unfortunate; refusing to
    accept new feedback because of it would be worse.
    """

    def __init__(self, path: str, degraded_from: Optional[str] = None):
        self.path = path
        # Set only by build_feedback_store when this instance is a
        # fallback from a Postgres request that failed (see below) — the
        # normal, un-configured-for-Postgres case leaves this None. Kept
        # as plain instance state (not a log line alone) so it's visible
        # through describe() -> get_model_info() -> GET /health for as
        # long as the process runs, not just at the moment it happened.
        self.degraded_from = degraded_from

    def _read_all(self) -> List[Dict[str, Any]]:
        if not os.path.exists(self.path):
            return []
        try:
            with open(self.path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return data if isinstance(data, list) else []
        except (json.JSONDecodeError, OSError, UnicodeDecodeError):
            return []

    def _write_all(self, records: List[Dict[str, Any]]) -> None:
        directory = os.path.dirname(self.path) or '.'
        os.makedirs(directory, exist_ok=True)
        fd, tmp_path = tempfile.mkstemp(dir=directory, prefix='.user_feedback-', suffix='.tmp')
        try:
            with os.fdopen(fd, 'w', encoding='utf-8') as f:
                json.dump(records, f)
            os.replace(tmp_path, self.path)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    def append(self, entry: Dict[str, Any]) -> int:
        records = self._read_all()
        # Duplicate-feedback semantics (master prompt Phase 2 section A):
        # at most one record per recommendation_id, latest rating wins.
        # Only applies when the caller actually supplied a
        # recommendation_id - entries without one (legacy callers, or
        # any future caller that genuinely has no id) are never treated
        # as duplicates of each other, matching the partial unique index
        # on the Postgres side (WHERE recommendation_id IS NOT NULL).
        rec_id = entry.get('recommendation_id')
        if rec_id is not None:
            records = [r for r in records if r.get('recommendation_id') != rec_id]
        records.append(entry)
        self._write_all(records)
        return len(records)

    def all(self) -> List[Dict[str, Any]]:
        return self._read_all()

    def describe(self) -> Dict[str, Any]:
        info: Dict[str, Any] = {'driver': 'json', 'location': self.path}
        # `driver` stays exactly 'json' in every case (pinned by
        # tests/test_feedback_store.py) — this is additive, so a
        # Postgres-was-requested-but-unreachable degradation is visible
        # to anyone checking GET /health instead of looking identical to
        # "Postgres was never configured".
        if self.degraded_from:
            info['degraded_from'] = self.degraded_from
            info['warning'] = (
                f'FEEDBACK_STORE={self.degraded_from} was requested but unusable at startup; '
                'feedback is being written to a local JSON file instead. If this process/container '
                'is recreated, that feedback is lost. See startup logs for the connection error.'
            )
        return info


class PostgresFeedbackStore:
    """Writes/reads ml_feedback rows (see db/migrations/0003_ml_feedback.sql).

    Intentionally minimal: a short-lived connection per call rather than
    a pooled connection, since feedback is written/read rarely (a user
    rating, or a retrain sweep) compared to the request-serving path,
    and this avoids holding a long-lived DB connection open inside the
    ML service just for this.
    """

    def __init__(self, dsn: str):
        self._dsn = dsn

    def _connect(self):
        import psycopg2  # imported lazily so JSON-only environments never need it installed

        return psycopg2.connect(self._dsn)

    def append(self, entry: Dict[str, Any]) -> int:
        with self._connect() as conn:
            with conn.cursor() as cur:
                # ON CONFLICT target matches the partial unique index in
                # db/migrations/0006_feedback_provenance.sql
                # (uq_ml_feedback_recommendation_id, WHERE
                # recommendation_id IS NOT NULL). When recommendation_id
                # is NULL, Postgres never considers two NULLs a conflict,
                # so this naturally falls through to a plain insert for
                # entries with no known recommendation_id - the same
                # "don't collapse unknowns together" rule the JSON store
                # follows.
                cur.execute(
                    """
                    INSERT INTO ml_feedback
                        (career, rating, user_profile, recommendation_id, analysis_run_id, career_id, engine_version, dataset_version)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (recommendation_id) WHERE recommendation_id IS NOT NULL
                    DO UPDATE SET
                        recorded_at = now(),
                        rating = EXCLUDED.rating,
                        user_profile = EXCLUDED.user_profile,
                        career = EXCLUDED.career,
                        analysis_run_id = EXCLUDED.analysis_run_id,
                        career_id = EXCLUDED.career_id,
                        engine_version = EXCLUDED.engine_version,
                        dataset_version = EXCLUDED.dataset_version
                    """,
                    (
                        entry.get('career'),
                        entry.get('rating'),
                        json.dumps(entry.get('user_profile', {})),
                        entry.get('recommendation_id'),
                        entry.get('analysis_run_id'),
                        entry.get('career_id'),
                        entry.get('engine_version'),
                        entry.get('dataset_version'),
                    ),
                )
                cur.execute("SELECT COUNT(*) FROM ml_feedback")
                (total,) = cur.fetchone()
            conn.commit()
        return int(total)

    def all(self) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT recorded_at, career, rating, user_profile, recommendation_id, analysis_run_id, "
                    "career_id, engine_version, dataset_version FROM ml_feedback ORDER BY recorded_at ASC"
                )
                rows = cur.fetchall()
        return [
            {
                'timestamp': recorded_at.isoformat() if hasattr(recorded_at, 'isoformat') else recorded_at,
                'career': career,
                'rating': float(rating),
                'user_profile': user_profile if isinstance(user_profile, dict) else json.loads(user_profile or '{}'),
                'recommendation_id': recommendation_id,
                'analysis_run_id': str(analysis_run_id) if analysis_run_id is not None else None,
                'career_id': career_id,
                'engine_version': engine_version,
                'dataset_version': dataset_version,
            }
            for recorded_at, career, rating, user_profile, recommendation_id, analysis_run_id, career_id, engine_version, dataset_version in rows
        ]

    def describe(self) -> Dict[str, Any]:
        # Never include the DSN verbatim (it may carry credentials) -
        # a bare "postgres" location is enough for the startup log line
        # in recommender.py to say something meaningful.
        return {'driver': 'postgres', 'location': 'ml_feedback table'}


def build_feedback_store(json_path: str, driver: Optional[str] = None) -> Any:
    """Selects the feedback storage backend.

    Defaults to JSON. Opting into Postgres requires setting
    FEEDBACK_STORE=postgres explicitly -- an ambient DATABASE_URL (set
    for the main application DB, or by a hosting platform) must never
    silently redirect where feedback goes; that would be a surprising
    and hard-to-notice change of where the system's only training data
    lives. When postgres IS requested but no usable DSN is configured,
    or the DSN doesn't actually connect, this degrades to the JSON
    store rather than raising: losing recommendations entirely (engine
    construction failing) is worse than losing a bit of feedback
    durability for one run.
    """
    selected = (driver or os.environ.get('FEEDBACK_STORE') or 'json').strip().lower()

    if selected != 'postgres':
        return JsonFeedbackStore(json_path)

    dsn = os.environ.get('FEEDBACK_DATABASE_URL') or os.environ.get('DATABASE_URL')
    if not dsn:
        logger.error(
            "FEEDBACK_STORE=postgres was set but neither FEEDBACK_DATABASE_URL nor DATABASE_URL "
            "is configured. Falling back to local JSON feedback storage — ratings written from "
            "here will be LOST if this process/container is recreated. Set FEEDBACK_DATABASE_URL "
            "(or DATABASE_URL) to fix this, or unset FEEDBACK_STORE if JSON is intentional."
        )
        return JsonFeedbackStore(json_path, degraded_from='postgres (no DSN configured)')

    try:
        store = PostgresFeedbackStore(dsn)
        # Fail fast at construction time, not on the first real write -
        # a connect-and-close probe here is what lets an unreachable
        # database degrade to JSON immediately instead of surfacing as
        # a 500 the first time someone submits feedback.
        probe = store._connect()
        probe.close()
        return store
    except Exception as exc:
        logger.error(
            "FEEDBACK_STORE=postgres was set but the database at FEEDBACK_DATABASE_URL/DATABASE_URL "
            "could not be reached at startup (%s). Falling back to local JSON feedback storage — "
            "ratings written from here will be LOST if this process/container is recreated. "
            "This is intentional degrade-not-crash behavior (see this function's docstring), but it "
            "needs fixing before this instance is treated as production-ready.",
            exc,
        )
        return JsonFeedbackStore(json_path, degraded_from=f'postgres (connection failed: {exc})')
