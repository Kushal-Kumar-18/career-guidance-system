"""
Tests for durable feedback storage (app/storage/feedback_store.py).

Feedback ratings are the only training data this service has and cannot
be regenerated, so the thing worth guarding is that a rating survives the
process that recorded it - and that the recommender reads its training
set back through the store rather than from a hardcoded file path.

These stay database-free: the Postgres driver's selection logic is tested
without connecting to anything.
"""
import json
import os

from app.engine.recommender import CareerRecommender
from app.storage.feedback_store import JsonFeedbackStore, build_feedback_store


def test_json_store_round_trip(tmp_path):
    store = JsonFeedbackStore(str(tmp_path / "nested" / "user_feedback.json"))
    assert store.all() == []

    total = store.append({'career': 'Data Scientist', 'rating': 4.0, 'user_profile': {'skills': 'Python'}})
    assert total == 1

    store.append({'career': 'Nurse', 'rating': 2.0, 'user_profile': {}})

    records = store.all()
    assert [r['career'] for r in records] == ['Data Scientist', 'Nurse']
    assert records[0]['rating'] == 4.0
    # Directory is created on demand rather than assumed to exist.
    assert os.path.exists(store.path)


def test_json_store_survives_a_new_process(tmp_path):
    """A fresh store object over the same path sees earlier ratings -
    this is the property that was broken when the file lived in an
    ephemeral container filesystem."""
    path = str(tmp_path / "user_feedback.json")
    JsonFeedbackStore(path).append({'career': 'Data Scientist', 'rating': 5.0, 'user_profile': {}})

    reopened = JsonFeedbackStore(path)
    assert len(reopened.all()) == 1
    assert reopened.all()[0]['rating'] == 5.0


def test_json_store_tolerates_a_corrupt_file(tmp_path):
    """A truncated/garbage file must not take the service down - new
    feedback should still be collectable."""
    path = tmp_path / "user_feedback.json"
    path.write_text("{ this is not valid json", encoding='utf-8')

    store = JsonFeedbackStore(str(path))
    assert store.all() == []
    assert store.append({'career': 'Nurse', 'rating': 3.0, 'user_profile': {}}) == 1
    assert len(store.all()) == 1


def test_default_driver_is_json_even_when_database_url_is_set(tmp_path, monkeypatch):
    """An ambient DATABASE_URL must not silently redirect where training
    data goes - opting into Postgres is explicit."""
    monkeypatch.setenv('DATABASE_URL', 'postgresql://someone@nowhere:5432/db')
    monkeypatch.delenv('FEEDBACK_STORE', raising=False)

    store = build_feedback_store(str(tmp_path / "f.json"))
    assert isinstance(store, JsonFeedbackStore)
    assert store.describe()['driver'] == 'json'


def test_postgres_without_a_dsn_falls_back_to_json(tmp_path, monkeypatch):
    monkeypatch.setenv('FEEDBACK_STORE', 'postgres')
    monkeypatch.delenv('FEEDBACK_DATABASE_URL', raising=False)
    monkeypatch.delenv('DATABASE_URL', raising=False)

    store = build_feedback_store(str(tmp_path / "f.json"))
    assert isinstance(store, JsonFeedbackStore)


def test_unreachable_postgres_degrades_instead_of_failing(tmp_path, monkeypatch):
    """Losing feedback durability is bad; losing recommendations entirely
    is worse. An unreachable database must degrade, loudly, to the file
    store rather than raise out of engine construction."""
    monkeypatch.setenv('FEEDBACK_STORE', 'postgres')
    # Port 1 on localhost: nothing listens there, so the connection fails fast.
    monkeypatch.setenv('FEEDBACK_DATABASE_URL', 'postgresql://u:p@127.0.0.1:1/nope?connect_timeout=1')

    store = build_feedback_store(str(tmp_path / "f.json"))
    assert isinstance(store, JsonFeedbackStore)


def test_recommender_records_feedback_through_the_store(tmp_model_dir):
    """End-to-end through the engine: a recorded rating is persisted and
    is what the retrain path reads back."""
    engine = CareerRecommender(
        feedback_model_path=os.path.join(tmp_model_dir, 'feedback_calibration_model.pkl'),
        verbose=False,
    )

    profile = {
        'education': 'B.Tech Computer Science',
        'skills': 'Python, SQL, Statistics',
        'interests': 'Machine Learning',
        'experience': 2,
        'certifications': '',
        'projects': 'Built a churn model',
    }
    engine.record_user_feedback(profile, 'Data Scientist', 5.0)

    stored = engine.feedback_store.all()
    assert len(stored) == 1
    assert stored[0]['career'] == 'Data Scientist'
    assert stored[0]['rating'] == 5.0
    # The profile snapshot is kept raw so features can be recomputed
    # against the current dataset on every retrain.
    assert stored[0]['user_profile']['skills'] == profile['skills']

    # A single rating is nowhere near the activation threshold, so the
    # model must still report itself as untrained rather than pretending.
    info = engine.get_model_info()
    assert info['feedback_model']['active'] is False
    assert info['feedback_storage']['driver'] == 'json'


def test_feedback_file_written_is_valid_json(tmp_model_dir):
    engine = CareerRecommender(
        feedback_model_path=os.path.join(tmp_model_dir, 'feedback_calibration_model.pkl'),
        verbose=False,
    )
    engine.record_user_feedback({'skills': 'Python'}, 'Data Scientist', 4.0)

    with open(engine.feedback_log_path, 'r', encoding='utf-8') as f:
        records = json.load(f)
    assert isinstance(records, list) and len(records) == 1
    # No stray temp file left behind by the atomic write.
    assert not os.path.exists(f"{engine.feedback_log_path}.tmp")
