"""
Regression tests for master prompt sections D (verified skill isolation),
I (runtime dataset), and H (career metadata).

Run with: pytest tests/test_candidate_isolation_and_dataset.py -q
(or as part of the full `pytest tests/` suite).
"""
from app.data.career_dataset import CAREER_DATABASE, DATASET_VERSION, DATASET_CAREER_COUNT
from app.data import career_dataset as career_dataset_module
from app.data import career_metadata


def get(results, career):
    return next((r for r in results if r['career'] == career), None)


class TestVerifiedSkillIsolation:
    """The exact regression scenario from the master prompt:

        Profile:     verified Python
        New resume:  AutoCAD + SketchUp
        Result:      Python must NOT become verified evidence.

    The account-level verified-skills dict (as the backend forwards it,
    unfiltered by candidate context - see
    backend/src/services/recommendationService.js) is passed straight
    through here on purpose: isolation must hold at the ENGINE level
    (app/engine/evidence.py `skill_evidence`), not because the caller
    happened to pre-filter it. A verified-skill entry can only ever
    upgrade a skill that is ALREADY present in THIS candidate's own
    declared skill list to VERIFIED evidence - it can never inject a
    skill the candidate didn't list.
    """

    def test_unrelated_verified_skill_is_not_applied_to_a_different_resume(self, predictor):
        account_level_verified_skills = {'python': {'verified': True, 'score': 95}}

        autocad_resume = {
            'education': 'Diploma in Mechanical Engineering',
            'skills': 'AutoCAD, SketchUp',
            'interests': 'Design',
            'experience': 1,
            'certifications': '',
            'projects': 'Drafted a 3D building model',
        }

        results = predictor.predict_career_hybrid(autocad_resume, account_level_verified_skills, top_k=148)

        for r in results:
            assert 'python' not in {s.lower() for s in r['verified_skills_matched']}, (
                f"'{r['career']}' incorrectly carried a verified Python credential into a resume "
                "that never listed Python at all"
            )

    def test_verified_skill_IS_applied_when_the_candidate_actually_lists_it(self, predictor):
        """Sanity check for the isolation test above: verified evidence
        must still work normally when the skill genuinely is part of
        this candidate's own declared list - isolation should not
        silently disable verification altogether."""
        verified = {'python': {'verified': True, 'score': 95}}
        profile_with_python = {
            'education': 'B.Tech Computer Science',
            'skills': 'Python, SQL, Django',
            'interests': 'Backend systems',
            'experience': 2,
            'certifications': '',
            'projects': 'Built an internal tool',
        }

        results = predictor.predict_career_hybrid(profile_with_python, verified, top_k=148)
        matched_somewhere = any('python' in {s.lower() for s in r['verified_skills_matched']} for r in results)
        assert matched_somewhere, 'a verified skill that IS on the candidate\'s own resume should count as VERIFIED evidence somewhere'


class TestRuntimeDatasetIntegrity:
    """Section I: verify the actual runtime dataset rather than assume it."""

    def test_dataset_career_count_matches_constant(self):
        assert len(CAREER_DATABASE) == DATASET_CAREER_COUNT

    def test_no_duplicate_career_names(self):
        names = list(CAREER_DATABASE.keys())
        assert len(names) == len(set(names)), 'duplicate career name found in CAREER_DATABASE'

    def test_dataset_version_is_a_real_content_hash(self):
        # Must actually change if the dataset changes - not a
        # hand-maintained string someone can forget to bump.
        assert DATASET_VERSION.startswith('career-dataset-v1-')
        assert len(DATASET_VERSION.split('-')[-1]) == 12

    def test_full_stack_developer_gap_has_been_closed(self):
        """This test used to pin 'Full Stack Developer is absent' as a
        known gap flagged in this project's history, with an explicit
        instruction to update it once that changed rather than leave it
        silently failing. It has now changed (the dataset grew from 148
        to 309 careers, including Full Stack Developer) - this replaces
        the old pinning assertion with the mirror-image one, so a FUTURE
        regression (the entry disappearing again, e.g. from a bad merge)
        is what this test would now catch."""
        names_lower = {n.lower() for n in CAREER_DATABASE}
        has_full_stack = any('full stack' in n or 'full-stack' in n for n in names_lower)
        assert has_full_stack is True, 'Full Stack Developer is missing from the dataset again - was it accidentally dropped?'


class TestCareerMetadata:
    """Section H: every career must have a stable, non-fabricated id and domain."""

    def test_every_career_has_a_stable_id_and_domain(self):
        for name in CAREER_DATABASE:
            assert career_metadata.get_career_id(name), f'{name!r} is missing a career_id'
            assert career_metadata.get_domain(name), f'{name!r} is missing a domain'

    def test_career_ids_are_unique(self):
        ids = [career_metadata.get_career_id(name) for name in CAREER_DATABASE]
        assert len(ids) == len(set(ids)), 'career_id collision detected'

    def test_career_id_is_deterministic_and_url_safe(self):
        cid = career_metadata.get_career_id('Software Developer')
        assert cid == 'software-developer'
        assert cid == cid.lower()
        assert ' ' not in cid

    def test_domain_matches_section_header_even_with_an_em_dash(self):
        """Regression test for a real bug: the metadata generator's
        section-header regex didn't include the em-dash (—) character
        used in headers like 'TECHNOLOGY & IT — ADDITIONAL
        SPECIALIZATIONS (15 careers)'. Those headers silently failed to
        match, so every career under them (Full Stack Developer,
        Frontend Developer, Backend Developer, and ~46 others across 4
        more sections) inherited the WRONG domain from whatever section
        happened to come before. Pins the fix for the specific case that
        surfaced it."""
        assert career_metadata.get_domain('Full Stack Developer') == 'Technology & IT — Additional Specializations'
        assert career_metadata.get_domain('Frontend Developer') == 'Technology & IT — Additional Specializations'
        assert career_metadata.get_domain('Backend Developer') == 'Technology & IT — Additional Specializations'

    def test_every_domain_group_size_matches_its_own_section_header_count(self):
        """General-purpose version of the test above: re-reads the
        dataset's own '(N careers)' section header counts and checks
        that exactly N careers actually ended up assigned to that
        domain. This would have caught the em-dash bug (and would catch
        any future section-header parsing bug) without needing a
        career-specific assertion - if a header's declared count and the
        actual assigned count ever disagree, something in the generator
        or the dataset's own header text is wrong."""
        import re
        from pathlib import Path

        dataset_path = Path(career_dataset_module.__file__)
        content = dataset_path.read_text(encoding='utf-8')
        header_re = re.compile(r"#\s*=+\s*([A-Z0-9 &()/,\-\u2013\u2014]+?)\s*\((\d+)\s*careers?\)\s*=+", re.I)

        from collections import Counter

        actual_counts = Counter(career_metadata.CAREER_DOMAIN.values())

        for match in header_re.finditer(content):
            raw_domain, declared_count = match.group(1).strip(), int(match.group(2))
            # Match the same title-casing the generator applies, without
            # re-importing the generator script (which lives outside the
            # installable package) - domains are compared case-
            # insensitively with whitespace collapsed instead.
            found = [
                actual
                for actual in actual_counts
                if actual.strip().lower().replace('—', '-').replace('  ', ' ')
                == raw_domain.strip().lower().replace('—', '-').replace('  ', ' ')
            ]
            assert found, f"Section header {raw_domain!r} not found among assigned domains at all"
            assert actual_counts[found[0]] == declared_count, (
                f"Section {raw_domain!r} declares {declared_count} careers but "
                f"{actual_counts[found[0]]} careers are actually assigned to that domain"
            )
