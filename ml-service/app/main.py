"""
Python ML microservice (section 14 of the architecture doc).

Wraps the recommendation engine (see app/engine/ for the scoring design,
and app/predictors/advanced_ml_predictor.py for why the old circular
fuzzy/ML blend was replaced) behind a small FastAPI surface so the
Node/Express backend can call it over HTTP instead of importing it in-process.

Run locally:
    uvicorn app.main:app --reload --port 8000
"""
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from app.services.predictor_singleton import get_predictor, get_load_error
from app.data.career_dataset import CAREER_DATABASE

app = FastAPI(title="Career Guidance ML Service", version="0.1.0")


class UserProfile(BaseModel):
    # Mirrors the fields the legacy Flask app read out of the `profiles`
    # table / registration form — see database.py `save_profile`.
    education: Optional[str] = ""
    skills: Optional[str] = ""          # comma-separated, matches legacy format
    interests: Optional[str] = ""
    experience: Optional[float] = 0
    certifications: Optional[str] = ""
    projects: Optional[str] = ""

    class Config:
        extra = "allow"  # tolerate extra profile fields without breaking


class PredictRequest(BaseModel):
    user_profile: UserProfile
    verified_skills: Dict[str, Any] = Field(default_factory=dict)
    top_k: int = 5


class SkillGapRequest(BaseModel):
    career_name: str
    user_profile: UserProfile
    verified_skills: Dict[str, Any] = Field(default_factory=dict)


class FeedbackRequest(BaseModel):
    user_profile: UserProfile
    career: str
    rating: float = Field(ge=1, le=5)


@app.get("/health")
def health():
    predictor = get_predictor()
    if predictor is None:
        return {
            "status": "degraded",
            "model_loaded": False,
            "error": get_load_error(),
        }
    return {
        "status": "ok",
        "model_loaded": True,
        "model_info": predictor.get_model_info(),
    }


@app.post("/recommend")
def recommend(req: PredictRequest):
    """Full hybrid recommendation list — this is what the legacy
    /recommendations Flask route effectively did via predict_career_hybrid."""
    predictor = get_predictor()
    if predictor is None:
        raise HTTPException(status_code=503, detail=f"Model unavailable: {get_load_error()}")

    predictions = predictor.predict_career_hybrid(
        user_profile=req.user_profile.model_dump(),
        verified_skills=req.verified_skills,
        top_k=req.top_k,
    )
    return {"success": True, "data": predictions}


@app.post("/predict")
def predict(req: PredictRequest):
    """Alias of /recommend, matching the endpoint name requested in the
    architecture doc (section 14). Same underlying hybrid predictor."""
    return recommend(req)


@app.post("/skill-gap")
def skill_gap(req: SkillGapRequest):
    predictor = get_predictor()
    if predictor is None:
        raise HTTPException(status_code=503, detail=f"Model unavailable: {get_load_error()}")

    matched, gaps, verified_matched, verified_breakdown = predictor._compute_skill_overlap(
        career_name=req.career_name,
        user_profile=req.user_profile.model_dump(),
        verified_skills=req.verified_skills,
    )
    return {
        "success": True,
        "data": {
            "career": req.career_name,
            "matched_skills": matched,
            "missing_skills": gaps,
            "verified_skills_matched": verified_matched,
            "verified_skills_breakdown": verified_breakdown,
        },
    }


@app.post("/feedback")
def feedback(req: FeedbackRequest):
    """Records a real 1-5 rating a user gave a recommendation they actually
    received. This is the only data the feedback-calibration model (see
    app/engine/feedback_model.py) ever trains on - it stays inactive until
    enough genuine ratings, across enough distinct careers, accumulate."""
    predictor = get_predictor()
    if predictor is None:
        raise HTTPException(status_code=503, detail=f"Model unavailable: {get_load_error()}")

    info = predictor.record_user_feedback(
        user_profile=req.user_profile.model_dump(),
        career=req.career,
        rating=req.rating,
    )
    return {"success": True, "data": info}


# ---------------------------------------------------------------------
# Career catalog (section "Career Information" of the architecture doc).
# Node's /api/careers proxies these so the 148-career dataset stays
# owned by one service instead of being duplicated in JS.
# ---------------------------------------------------------------------

@app.get("/careers")
def list_careers(q: Optional[str] = None, limit: int = 500, offset: int = 0):
    names = list(CAREER_DATABASE.keys())
    if q:
        q_lower = q.lower()
        names = [n for n in names if q_lower in n.lower()]
    total = len(names)
    page = names[offset: offset + limit]
    data = [
        {
            "name": name,
            "skills": CAREER_DATABASE[name].get("skills", []),
            "salary_range": CAREER_DATABASE[name].get("salary_range"),
            "job_growth": CAREER_DATABASE[name].get("job_growth"),
            "education": CAREER_DATABASE[name].get("education", []),
        }
        for name in page
    ]
    return {"success": True, "data": data, "meta": {"total": total, "limit": limit, "offset": offset}}


@app.get("/careers/{career_name}")
def get_career(career_name: str):
    info = CAREER_DATABASE.get(career_name)
    if info is None:
        # Case-insensitive fallback lookup
        match = next((k for k in CAREER_DATABASE if k.lower() == career_name.lower()), None)
        if match:
            career_name, info = match, CAREER_DATABASE[match]
    if info is None:
        raise HTTPException(status_code=404, detail=f"Unknown career: {career_name}")
    return {"success": True, "data": {"name": career_name, **info}}


class SkillTextRequest(BaseModel):
    text: str


@app.post("/extract-skills")
def extract_skills(req: SkillTextRequest):
    """Matches free text (e.g. a project description) against the known
    skill vocabulary built from every career's skill list, using the same
    normalization the recommender uses — so 'skill extraction' surfaces
    skills the recommender will actually recognize later."""
    predictor = get_predictor()
    if predictor is None:
        raise HTTPException(status_code=503, detail=f"Model unavailable: {get_load_error()}")

    vocab = sorted({s for info in CAREER_DATABASE.values() for s in info.get("skills", [])})
    text_norm = predictor.ml._normalize_text(req.text)
    found = [skill for skill in vocab if predictor.ml.text_mentions_skill(text_norm, skill)]
    return {"success": True, "data": {"extracted_skills": sorted(set(found))}}


class NormalizeSkillsRequest(BaseModel):
    skills: List[str]


@app.post("/normalize-skills")
def normalize_skills(req: NormalizeSkillsRequest):
    """Returns the normalized/canonical form + synonym group for each
    input skill, using the predictor's own normalization/synonym-expansion
    so results match exactly what recommendation and skill-gap scoring
    will use.

    `normalized` is the CANONICAL form (the first entry of the synonym
    group `_expand_skill` resolves to, e.g. 'py' -> 'python'), not merely
    the lowercased/whitespace-trimmed input - `_expand_skill` already
    consults the full `SKILL_SYNONYMS` table (~120 entries) to find that
    canonical form; `_normalize_skill_for_matching` alone only handles a
    small hardcoded set of abbreviations (js/ml/ai/fe/be/...) and isn't
    meant to be the source of truth for this field on its own. (Found and
    fixed during a full-endpoint audit: this field used to return that
    narrow, mostly-unresolved value even when a proper canonical form was
    available - scoring itself was never affected, since best_skill_match
    always consults the full synonym table directly, but this endpoint's
    own output was inconsistent with the synonyms list it returns
    alongside it.)"""
    predictor = get_predictor()
    if predictor is None:
        raise HTTPException(status_code=503, detail=f"Model unavailable: {get_load_error()}")

    out = []
    for raw in req.skills:
        variants = predictor.ml._expand_skill(raw)
        normalized = variants[0] if variants else predictor.ml._normalize_skill_for_matching(raw)
        out.append({"input": raw, "normalized": normalized, "synonyms": variants})
    return {"success": True, "data": out}


@app.get("/skills/predefined")
def predefined_skills():
    """Full deduplicated skill vocabulary across all 148 careers — used by
    the skill-verification UI to offer a picklist (section 'Skill
    Verification' -> predefined skills)."""
    vocab = sorted({s for info in CAREER_DATABASE.values() for s in info.get("skills", [])})
    return {"success": True, "data": vocab}
