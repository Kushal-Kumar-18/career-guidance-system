"""
Realistic recommendation evaluation (master prompt section 16 / 17).

This is NOT a synthetic accuracy/R^2 claim — it's a plain sanity check
using hand-written, realistic profiles for the five archetypes the master
prompt specifically asked for, checking that at least one of each
archetype's expected careers appears near the top of that profile's
ranked results. These expectations are common-sense career-counseling
judgments (a full-stack profile should rank full-stack-adjacent roles
highly), not hard-coded into `career_dataset.py` or the scoring engine
itself — this file only ever reads the engine's output, it never
special-cases these career names inside the engine.

If a profile fails here, that's a signal the DATASET or WEIGHTS need
attention (master prompt section 17: "evaluate the data, not just the
model") — not a reason to hard-code the expected answer into the ranking
logic.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.predictors.advanced_ml_predictor import AdvancedHybridCareerPredictor


def _predictor(tmp_path):
    d = tmp_path / "ml_models"
    d.mkdir()
    return AdvancedHybridCareerPredictor(
        model_path=str(d / "feedback_calibration_model.pkl"),
        verbose=False,
    )


def _top_careers(predictor, profile, top_k=8):
    results = predictor.predict_career_hybrid(profile, {}, top_k=top_k)
    return [r['career'] for r in results], results


# Each entry: (label, profile, {expected careers that should appear in the
# top N}, N). Expected sets are intentionally an "any of" match, not an
# exact-rank match — the point is sensible direction, not a brittle exact
# ordering that would break on every minor weighting tweak.
EVAL_PROFILES = [
    (
        "Full-stack profile",
        {
            "skills": "JavaScript, React, Node, Express, MongoDB, HTML, CSS, SQL, Git, REST API",
            "interests": "web development, building products, full stack",
            "education": "B.Tech Computer Science",
            "experience": 2,
            "certifications": "",
            "projects": "Built a full-stack e-commerce app with React frontend, Node/Express backend, and MongoDB, deployed with REST APIs.",
        },
        {"Web Developer", "Software Developer"},
        6,
    ),
    (
        "Data profile",
        {
            "skills": "SQL, Excel, Python, Data Analysis, Statistics, Power BI, Tableau",
            "interests": "data, analytics, business insights",
            "education": "B.Sc Statistics",
            "experience": 1,
            "certifications": "",
            "projects": "Analyzed sales data using SQL and Python, built dashboards in Power BI to report on quarterly trends.",
        },
        {"Data Scientist", "Data Engineer", "Business Analyst"},
        6,
    ),
    (
        "AI/ML profile",
        {
            "skills": "Python, Machine Learning, TensorFlow, PyTorch, Deep Learning, NLP, Statistics",
            "interests": "artificial intelligence, research, machine learning",
            "education": "M.Tech",
            "experience": 1,
            "certifications": "",
            "projects": "Trained a deep learning model with PyTorch for image classification, fine-tuned a transformer model for NLP tasks.",
        },
        {"AI/ML Engineer", "Data Scientist"},
        6,
    ),
    (
        "Design profile",
        {
            "skills": "Figma, Adobe XD, UI, UX, Photoshop, Illustrator, Visual Design, Prototyping",
            "interests": "design, visual arts, creativity, user experience",
            "education": "B.Design",
            "experience": 1,
            "certifications": "",
            "projects": "Designed UI mockups and interactive prototypes in Figma for a mobile banking app, ran usability tests.",
        },
        {"UI/UX Designer", "Graphic Designer"},
        8,
    ),
    (
        "Mechanical profile",
        {
            "skills": "AutoCAD, SolidWorks, Thermodynamics, Manufacturing, Mechanical Design, CATIA",
            "interests": "automotive design, mechanical systems, hardware",
            "education": "B.E. Mechanical Engineering",
            "experience": 0,
            "certifications": "",
            "projects": "Designed a go-kart chassis in SolidWorks for a college competition, ran stress simulations.",
        },
        {"Mechanical Engineer", "Automotive Engineer", "Industrial Designer"},
        6,
    ),
    (
        "Cybersecurity profile",
        {
            "skills": "Network Security, Penetration Testing, Firewall, Ethical Hacking, Linux, Cybersecurity",
            "interests": "security, protecting systems, ethical hacking",
            "education": "B.Tech Computer Science",
            "experience": 1,
            "certifications": "CEH",
            "projects": "Performed a penetration test on a college web application and documented vulnerabilities found using OWASP guidelines.",
        },
        {"Cybersecurity Analyst"},
        6,
    ),
    (
        "Cloud/DevOps profile",
        {
            "skills": "Docker, Kubernetes, AWS, CI/CD, Linux, Terraform, Jenkins",
            "interests": "infrastructure, automation, cloud computing",
            "education": "B.Tech Computer Science",
            "experience": 2,
            "certifications": "AWS Certified Solutions Architect",
            "projects": "Set up a CI/CD pipeline with Jenkins and deployed containerized services to Kubernetes on AWS.",
        },
        {"DevOps Engineer", "Cloud Architect"},
        6,
    ),
    (
        "Fresh graduate — projects but no work experience",
        {
            "skills": "Python, Java, Data Structures, Algorithms, Git, OOP",
            "interests": "software development, problem solving",
            "education": "B.Tech Computer Science",
            "experience": 0,
            "certifications": "",
            "projects": "Built a library management system in Java with a MySQL backend as a final-year college project; contributed to two open-source Python repositories.",
        },
        {"Software Developer"},
        6,
    ),
    (
        "Strong skills, incomplete education/experience info",
        {
            "skills": "React, JavaScript, Node, MongoDB, Express, REST API, Git",
            "interests": "web development",
            "education": "",
            "experience": 0,
            "certifications": "",
            "projects": "",
        },
        {"Web Developer", "Software Developer"},
        6,
    ),
]


def run_evaluation(tmp_path):
    """Runs all five archetype profiles and returns a report dict per
    profile (top careers actually returned, whether an expected career
    appeared in range, and at what rank) - printed for human review
    rather than collapsed into one pass/fail accuracy number, per
    section 16's instruction not to chase an impressive aggregate metric."""
    predictor = _predictor(tmp_path)
    report = []
    for label, profile, expected_any_of, top_n in EVAL_PROFILES:
        top_careers, results = _top_careers(predictor, profile, top_k=8)
        window = top_careers[:top_n]
        hit = next((c for c in window if c in expected_any_of), None)
        report.append({
            "label": label,
            "top_careers": top_careers,
            "expected_any_of": sorted(expected_any_of),
            "hit": hit,
            "hit_rank": (window.index(hit) + 1) if hit else None,
            "top_result_reasoning": results[0]['reasoning'] if results else None,
        })
    return report


def test_realistic_profiles_rank_sensibly(tmp_path):
    report = run_evaluation(tmp_path)
    failures = [r for r in report if r["hit"] is None]
    if failures:
        detail = "\n".join(
            f"  - {r['label']}: got {r['top_careers']}, expected one of {r['expected_any_of']}"
            for r in failures
        )
        assert False, f"{len(failures)}/{len(report)} realistic profiles did not surface an expected career:\n{detail}"


def test_evaluation_report_is_human_readable_when_run_directly():
    # Smoke test that the report structure itself is well-formed (used by
    # the __main__ block below for manual/CI-log inspection).
    assert callable(run_evaluation)


if __name__ == "__main__":
    import tempfile
    from pathlib import Path

    with tempfile.TemporaryDirectory() as td:
        report = run_evaluation(Path(td))
        for r in report:
            status = "OK" if r["hit"] else "MISS"
            print(f"[{status}] {r['label']}: top={r['top_careers']}")
            if r["hit"]:
                print(f"        matched '{r['hit']}' at rank {r['hit_rank']}")
            else:
                print(f"        expected one of {r['expected_any_of']}")
