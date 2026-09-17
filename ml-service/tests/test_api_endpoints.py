"""
Endpoint-level tests using FastAPI's TestClient - checks the HTTP surface
the Node backend actually depends on (main.py), not just the underlying
engine directly.
"""
import os

os.environ.setdefault("ML_MODEL_PATH", "/tmp/ml_service_test_models/feedback_calibration_model.pkl")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["model_loaded"] is True
    assert "engine_version" in body["model_info"]


def test_recommend_endpoint_returns_explainable_fields():
    payload = {
        "user_profile": {
            "education": "B.Tech Computer Science",
            "skills": "Python, SQL, Git",
            "interests": "Data, Technology",
            "experience": 2,
            "certifications": "",
            "projects": "Built a data pipeline with Python.",
        },
        "verified_skills": {"python": True},
        "top_k": 3,
    }
    res = client.post("/recommend", json=payload)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert len(body["data"]) <= 3
    for rec in body["data"]:
        assert "confidence" in rec
        assert "reasoning" in rec
        assert "market_outlook" in rec
        assert "success_probability" not in rec
        assert "score_breakdown" in rec


def test_predict_is_alias_of_recommend():
    payload = {
        "user_profile": {"education": "", "skills": "Python", "interests": "", "experience": 0,
                          "certifications": "", "projects": ""},
        "verified_skills": {},
        "top_k": 2,
    }
    r1 = client.post("/recommend", json=payload).json()
    r2 = client.post("/predict", json=payload).json()
    assert [r["career"] for r in r1["data"]] == [r["career"] for r in r2["data"]]


def test_skill_gap_endpoint():
    payload = {
        "career_name": "Software Developer",
        "user_profile": {"education": "", "skills": "Python, Git", "interests": "", "experience": 0,
                          "certifications": "", "projects": ""},
        "verified_skills": {},
    }
    res = client.post("/skill-gap", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]
    assert "python" in [s.lower() for s in data["matched_skills"]]
    assert data["career"] == "Software Developer"


def test_extract_skills_does_not_confuse_java_and_javascript():
    res = client.post("/extract-skills", json={"text": "I have experience with JavaScript and React."})
    assert res.status_code == 200
    extracted = [s.lower() for s in res.json()["data"]["extracted_skills"]]
    assert "javascript" in extracted
    assert "java" not in extracted


def test_feedback_endpoint_records_and_reports_status():
    payload = {
        "user_profile": {"education": "B.Tech", "skills": "Python", "interests": "", "experience": 1,
                          "certifications": "", "projects": ""},
        "career": "Software Developer",
        "rating": 4,
    }
    res = client.post("/feedback", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]
    assert "feedback_model" in data
    assert data["feedback_model"]["sample_count"] >= 1


def test_feedback_endpoint_rejects_out_of_range_rating():
    payload = {
        "user_profile": {"education": "", "skills": "", "interests": "", "experience": 0,
                          "certifications": "", "projects": ""},
        "career": "Software Developer",
        "rating": 9,
    }
    res = client.post("/feedback", json=payload)
    assert res.status_code == 422


def test_careers_catalog_endpoint():
    res = client.get("/careers?limit=5")
    assert res.status_code == 200
    body = res.json()
    assert body["meta"]["total"] >= 100
    assert len(body["data"]) == 5


def test_unknown_career_returns_clean_404():
    res = client.get("/careers/Definitely Not A Real Career")
    assert res.status_code == 404


def test_normalize_skills_returns_canonical_form():
    """Regression test for a bug found during a full-endpoint HTTP audit
    (Pass 14): `normalized` used to return the raw/mostly-unresolved form
    (e.g. 'py' stayed 'py') even when the full SKILL_SYNONYMS table could
    resolve it to a real canonical form ('python') - inconsistent with
    the `synonyms` list returned alongside it, which always led with the
    canonical form. Scoring itself was never affected (best_skill_match
    always consults the full synonym table directly), but this endpoint's
    own output was self-inconsistent."""
    res = client.post("/normalize-skills", json={"skills": ["py", "reactjs", "k8s"]})
    assert res.status_code == 200
    data = {row["input"]: row for row in res.json()["data"]}
    assert data["py"]["normalized"] == "python"
    assert data["reactjs"]["normalized"] == "react"
    assert data["k8s"]["normalized"] == "kubernetes"
    # normalized must always be the synonym list's own first entry -
    # the two fields should never disagree about what "canonical" means.
    for row in data.values():
        if row["synonyms"]:
            assert row["normalized"] == row["synonyms"][0]


def test_empty_profile_does_not_crash_and_returns_no_forced_matches():
    res = client.post("/recommend", json={"user_profile": {}, "verified_skills": {}, "top_k": 3})
    assert res.status_code == 200
    assert res.json()["data"] == []
