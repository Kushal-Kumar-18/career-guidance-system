"""
Realistic-scenario tests for the recommendation engine.

These are deliberately NOT just unit tests of individual functions - the
point of this suite is to check that, for profiles a real user could
plausibly have, the *rankings and scores make sense*: a strong match
should score much higher than a weak one, unrelated domains shouldn't
leak into top results, evidence-affecting fields (verified skills,
education, certifications, project content) should move the score in the
right direction, and nothing in the output should smuggle back in the
exact problems this engine was built to avoid (labels derived from the
score itself, fabricated probabilities, runaway bonuses).
"""
import re

from app.engine import fit_scorer


def get(results, career):
    return next((r for r in results if r['career'] == career), None)


class TestScoreBounds:
    def test_scores_always_within_0_100(self, predictor, career_db):
        profiles = [
            {'skills': 'Python, SQL', 'education': 'B.Tech', 'interests': 'Data', 'experience': 2,
             'certifications': '', 'projects': ''},
            {'skills': '', 'education': '', 'interests': '', 'experience': 0, 'certifications': '', 'projects': ''},
            {'skills': ', '.join(career_db['Nurse']['skills']), 'education': career_db['Nurse']['education'][0],
             'interests': ', '.join(career_db['Nurse']['interests']), 'experience': 10,
             'certifications': 'RN License', 'projects': 'Patient care rotations.'},
        ]
        for profile in profiles:
            results = predictor.predict_career_hybrid(profile, {}, top_k=148)
            for r in results:
                assert 0.0 <= r['confidence'] <= 100.0
                assert 0.0 <= r['fit_score'] <= 100.0

    def test_perfect_evidence_scores_at_or_near_100(self, predictor, career_db):
        """A profile engineered to match a career's full skill list,
        interests, and education, with everything verified, should land at
        (or essentially at) the top of the scale - otherwise the scoring
        formula is leaving points on the table for no reason."""
        career = 'Software Developer'
        info = career_db[career]
        profile = {
            'education': info['education'][0],
            'skills': ', '.join(info['skills']),
            'interests': ', '.join(info['interests']),
            'experience': 8,
            'certifications': 'Certified Software Developer',
            'projects': 'Built systems using ' + ' '.join(info['skills']) + '.',
        }
        verified = {s: True for s in info['skills']}
        results = predictor.predict_career_hybrid(profile, verified, top_k=5)
        top = results[0]
        assert top['career'] == career
        assert top['confidence'] >= 95.0

    def test_empty_profile_scores_very_low(self, predictor):
        profile = {'skills': '', 'education': '', 'interests': '', 'experience': 0, 'certifications': '', 'projects': ''}
        results = predictor.predict_career_hybrid(profile, {}, top_k=148)
        # An empty profile has no evidence at all - nothing should score
        # more than a small amount above zero, and it should not produce
        # a long list of confident-looking matches.
        assert all(r['confidence'] <= 15.0 for r in results)


class TestDomainSanity:
    def test_healthcare_profile_does_not_surface_unrelated_tech_careers(self, predictor, career_db):
        info = career_db['Medical Doctor']
        profile = {
            'education': info['education'][0],
            'skills': ', '.join(info['skills']),
            'interests': ', '.join(info['interests']),
            'experience': 6,
            'certifications': 'MD',
            'projects': '',
        }
        results = predictor.predict_career_hybrid(profile, {}, top_k=5)
        top_careers = [r['career'] for r in results]
        assert 'Medical Doctor' in top_careers
        unrelated = {'Software Developer', 'DevOps Engineer', 'Data Scientist', 'Blockchain Developer'}
        assert not (unrelated & set(top_careers))

    def test_pure_creative_profile_does_not_surface_finance_careers(self, predictor, career_db):
        info = career_db['Graphic Designer']
        profile = {
            'education': info['education'][0],
            'skills': ', '.join(info['skills']),
            'interests': ', '.join(info['interests']),
            'experience': 3,
            'certifications': '',
            'projects': 'Designed brand identities and marketing collateral using Photoshop and Illustrator.',
        }
        results = predictor.predict_career_hybrid(profile, {}, top_k=5)
        top_careers = [r['career'] for r in results]
        assert 'Graphic Designer' in top_careers
        unrelated = {'Chartered Accountant', 'Investment Banker', 'Auditor', 'Actuary'}
        assert not (unrelated & set(top_careers))


class TestEvidenceEffects:
    def test_verified_skills_never_lower_the_score(self, predictor):
        profile = {
            'education': 'B.Tech Computer Science',
            'skills': 'Python, SQL, Excel, Statistics',
            'interests': 'Data, Analytics',
            'experience': 2,
            'certifications': '',
            'projects': 'Analyzed data using Python.',
        }
        unverified = get(predictor.predict_career_hybrid(profile, {}, top_k=148), 'Data Scientist')
        verified = get(
            predictor.predict_career_hybrid(profile, {'python': True, 'sql': True}, top_k=148), 'Data Scientist'
        )
        assert verified['fit_score'] >= unverified['fit_score']

    def test_matching_education_increases_score_over_no_education(self, predictor, career_db):
        info = career_db['Chartered Accountant']
        base_profile = {
            'skills': ', '.join(info['skills'][:4]),
            'interests': ', '.join(info['interests'][:2]),
            'experience': 2,
            'certifications': '',
            'projects': '',
        }
        with_edu = {**base_profile, 'education': info['education'][0]}
        without_edu = {**base_profile, 'education': ''}

        r_with = get(predictor.predict_career_hybrid(with_edu, {}, top_k=148), 'Chartered Accountant')
        r_without = get(predictor.predict_career_hybrid(without_edu, {}, top_k=148), 'Chartered Accountant')
        assert r_with['fit_score'] > r_without['fit_score']

    def test_relevant_project_content_increases_score_over_blank_project(self, predictor, career_db):
        info = career_db['Web Developer']
        base_profile = {
            'education': info['education'][0],
            'skills': ', '.join(info['skills'][:3]),
            'interests': '',
            'experience': 1,
            'certifications': '',
        }
        with_project = {**base_profile, 'projects': f"Built a website using {', '.join(info['skills'][:3])}."}
        without_project = {**base_profile, 'projects': ''}

        r_with = get(predictor.predict_career_hybrid(with_project, {}, top_k=148), 'Web Developer')
        r_without = get(predictor.predict_career_hybrid(without_project, {}, top_k=148), 'Web Developer')
        assert r_with['fit_score'] > r_without['fit_score']

    def test_experience_increases_score_monotonically(self, predictor, career_db):
        info = career_db['Business Analyst']
        scores = []
        for years in [0, 2, 5, 8]:
            profile = {
                'education': info['education'][0],
                'skills': ', '.join(info['skills'][:3]),
                'interests': '',
                'experience': years,
                'certifications': '',
                'projects': '',
            }
            r = get(predictor.predict_career_hybrid(profile, {}, top_k=148), 'Business Analyst')
            scores.append(r['fit_score'])
        assert scores == sorted(scores)


class TestSkillMatchingCorrectness:
    """Regression tests for a real bug found during development: naive
    substring matching caused unrelated skills to be treated as equal
    (e.g. 'javascript' matching 'java', or 'c++' matching 'c#')."""

    def test_javascript_does_not_match_java(self, predictor):
        matcher = predictor.ml
        idx, conf = matcher.best_skill_match('javascript', ['java'])
        assert idx == -1

    def test_java_does_not_match_javascript(self, predictor):
        matcher = predictor.ml
        idx, conf = matcher.best_skill_match('java', ['javascript'])
        assert idx == -1

    def test_cpp_does_not_match_csharp(self, predictor):
        matcher = predictor.ml
        idx, conf = matcher.best_skill_match('c++', ['c#'])
        assert idx == -1

    def test_known_synonyms_still_match(self, predictor):
        matcher = predictor.ml
        for user_skill, career_skill in [('JS', 'javascript'), ('ML', 'machine learning'), ('python3', 'python')]:
            idx, conf = matcher.best_skill_match(user_skill, [career_skill])
            assert idx == 0, f"expected {user_skill!r} to match {career_skill!r}"
            assert conf == 1.0

    def test_identical_skill_list_yields_full_coverage(self, predictor, career_db):
        """A profile that lists a career's skills verbatim should match
        every one of them - if the synonym/normalization logic causes
        literal identical text to be missed, coverage silently degrades."""
        skills = career_db['Software Developer']['skills']
        matched, gaps, _v, _b = predictor._compute_skill_overlap(
            'Software Developer', {'skills': ', '.join(skills)}, {}
        )
        assert set(matched) == set(skills)
        assert gaps == []


class TestExplainability:
    def test_reasoning_cites_actual_matched_and_missing_skills(self, predictor, career_db):
        info = career_db['Data Scientist']
        profile = {
            'education': info['education'][0],
            'skills': ', '.join(info['skills'][:3]),
            'interests': '',
            'experience': 2,
            'certifications': '',
            'projects': '',
        }
        r = get(predictor.predict_career_hybrid(profile, {}, top_k=148), 'Data Scientist')
        assert r is not None
        for skill in info['skills'][:3]:
            assert skill in r['reasoning'] or skill in r['user_skills_matched']
        assert 'hiring outcomes' in r['reasoning']  # honesty caveat always present

    def test_score_breakdown_components_sum_to_declared_max(self):
        assert abs(sum(fit_scorer.WEIGHTS.values()) - 100.0) < 1e-9

    def test_every_result_has_component_breakdown(self, predictor):
        profile = {'skills': 'Python, SQL', 'education': 'B.Tech', 'interests': 'Data',
                    'experience': 2, 'certifications': '', 'projects': ''}
        results = predictor.predict_career_hybrid(profile, {}, top_k=10)
        for r in results:
            comps = r['score_breakdown']['components']
            maxes = r['score_breakdown']['components_max']
            assert set(comps.keys()) == set(fit_scorer.WEIGHTS.keys())
            for k in comps:
                assert 0.0 <= comps[k] <= maxes[k] + 1e-6


class TestNoFabricatedClaims:
    """Guards against the exact problems this engine was rewritten to
    avoid regressing back into."""

    def test_no_success_probability_field(self, predictor):
        profile = {'skills': 'Python', 'education': 'B.Tech', 'interests': '', 'experience': 1,
                    'certifications': '', 'projects': ''}
        results = predictor.predict_career_hybrid(profile, {}, top_k=5)
        for r in results:
            assert 'success_probability' not in r

    def test_model_info_does_not_claim_fake_precision(self, predictor):
        info = predictor.get_model_info()
        blob = str(info).lower()
        assert 'probability of success' not in blob
        assert 'r2=0.99' not in blob.replace(' ', '')
        assert 'hybrid_enabled' in info and info['hybrid_enabled'] is False

    def test_feedback_model_inactive_without_real_feedback(self, predictor):
        info = predictor.get_model_info()
        assert info['feedback_model']['active'] is False
        assert info['feedback_model']['sample_count'] == 0
