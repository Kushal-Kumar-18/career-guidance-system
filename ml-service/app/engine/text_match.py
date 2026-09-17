"""
Text/skill matching utilities.

This module contains ONLY string-similarity infrastructure: normalization,
synonym expansion, and domain-aware fuzzy matching between free-text skills
/interests and a career's canonical skill/interest vocabulary.

It intentionally does not compute any "career fit" score, weight, or
probability. It answers exactly one narrow question well: "does this piece
of user-entered text refer to the same thing as this piece of career-database
text?" Everything about how matches translate into a recommendation score
lives in `fit_scorer.py`, so that scoring logic stays auditable in one place.
"""
from __future__ import annotations

import re
from typing import Dict, Iterable, List, Sequence, Tuple

from fuzzywuzzy import fuzz

from app.data.career_dataset import SKILL_SYNONYMS


def _alnum(s: str) -> str:
    return re.sub(r'[^a-z0-9]', '', s.lower())


def _word_boundary_contains(shorter: str, longer: str) -> bool:
    """True if `shorter` appears in `longer` as a whole word/phrase, not
    merely as a substring - this is what stops 'java' from matching inside
    'javascript', or 'sql' from matching inside 'mysql' just because the
    letters happen to line up."""
    if not shorter or not longer:
        return False
    return re.search(r'(?<![a-z0-9])' + re.escape(shorter) + r'(?![a-z0-9])', longer) is not None


def _career_domains() -> Dict[str, str]:
    """career name -> broad domain, used only to stop unrelated fuzzy
    matches (e.g. a career-database skill called 'design' in a creative
    career should not be matched against a user's 'design patterns'
    software skill just because the substring 'design' overlaps)."""
    return {
        'Software Developer': 'tech', 'Data Scientist': 'tech', 'Web Developer': 'tech',
        'Mobile App Developer': 'tech', 'DevOps Engineer': 'tech', 'Cybersecurity Analyst': 'tech',
        'Cloud Architect': 'tech', 'AI/ML Engineer': 'tech', 'Blockchain Developer': 'tech',
        'Game Developer': 'tech', 'UI/UX Designer': 'tech', 'Database Administrator': 'tech',
        'Network Engineer': 'tech', 'System Administrator': 'tech', 'Data Engineer': 'tech',
        'Quality Assurance Engineer': 'tech', 'IT Support Specialist': 'tech',
        'Solutions Architect': 'tech', 'IoT Engineer': 'tech', 'Technical Writer': 'tech',
        'Content Writer': 'creative', 'Graphic Designer': 'creative', 'Video Editor': 'creative',
        'Interior Designer': 'creative', 'Fashion Designer': 'creative', 'Animator': 'creative',
        'Illustrator': 'creative', 'Industrial Designer': 'creative', 'Packaging Designer': 'creative',
        'Landscape Architect': 'creative', 'Jewelry Designer': 'creative', 'Exhibition Designer': 'creative',
        'Motion Graphics Designer': 'creative', 'Social Media Manager': 'creative',
        'Photographer': 'creative', 'Film Director': 'creative', 'Actor': 'creative',
        'Sound Engineer': 'creative', 'Radio Jockey': 'creative', 'Cinematographer': 'creative',
        'Screenwriter': 'creative', 'VFX Artist': 'creative', 'Voiceover Artist': 'creative',
        'Business Analyst': 'business', 'Product Manager': 'business', 'Project Manager': 'business',
        'Management Consultant': 'business', 'Human Resources Manager': 'business',
        'Operations Manager': 'business', 'Supply Chain Manager': 'business',
        'Business Development Manager': 'business', 'Risk Manager': 'business',
        'Change Management Consultant': 'business', 'Strategy Consultant': 'business',
        'Entrepreneur': 'business', 'Customer Success Manager': 'business',
        'Administrative Manager': 'business', 'Compliance Officer': 'business',
        'Financial Analyst': 'finance', 'Chartered Accountant': 'finance',
        'Investment Banker': 'finance', 'Portfolio Manager': 'finance', 'Tax Consultant': 'finance',
        'Credit Analyst': 'finance', 'Financial Planner': 'finance',
        'Equity Research Analyst': 'finance', 'Treasury Analyst': 'finance',
        'Auditor': 'finance', 'Cost Accountant': 'finance', 'Actuary': 'finance',
        'Digital Marketing Specialist': 'marketing', 'Sales Manager': 'marketing',
        'Brand Manager': 'marketing', 'Market Research Analyst': 'marketing',
        'Public Relations Manager': 'marketing', 'SEO Specialist': 'marketing',
        'Email Marketing Specialist': 'marketing', 'Advertising Manager': 'marketing',
        'Medical Doctor': 'healthcare', 'Nurse': 'healthcare', 'Pharmacist': 'healthcare',
        'Physiotherapist': 'healthcare', 'Dentist': 'healthcare', 'Medical Lab Technician': 'healthcare',
        'Radiologist': 'healthcare', 'Clinical Psychologist': 'healthcare',
        'Dietitian/Nutritionist': 'healthcare', 'Occupational Therapist': 'healthcare',
        'Medical Representative': 'healthcare', 'Hospital Administrator': 'healthcare',
        'Veterinarian': 'healthcare', 'Speech Therapist': 'healthcare',
        'Biomedical Engineer': 'healthcare',
        'Teacher': 'education', 'Corporate Trainer': 'education',
        'Principal/School Administrator': 'education', 'Education Counselor': 'education',
        'E-Learning Developer': 'education', 'Librarian': 'education',
        'Special Education Teacher': 'education', 'Curriculum Designer': 'education',
        'Academic Researcher': 'education', 'Tutor/Private Teacher': 'education',
        'Mechanical Engineer': 'engineering', 'Civil Engineer': 'engineering',
        'Electrical Engineer': 'engineering', 'Electronics Engineer': 'engineering',
        'Chemical Engineer': 'engineering', 'Automotive Engineer': 'engineering',
        'Aerospace Engineer': 'engineering', 'Petroleum Engineer': 'engineering',
        'Mining Engineer': 'engineering', 'Environmental Engineer': 'engineering',
        'Journalist': 'media',
        'Lawyer': 'legal', 'Corporate Lawyer': 'legal', 'Legal Advisor': 'legal',
        'Patent Attorney': 'legal', 'Legal Researcher': 'legal', 'Judge': 'legal',
        'Notary Public': 'legal', 'Paralegal': 'legal',
        'Hotel Manager': 'hospitality', 'Chef/Culinary Expert': 'hospitality',
        'Travel Agent': 'hospitality', 'Tour Guide': 'hospitality',
        'Event Manager': 'hospitality', 'Flight Attendant': 'hospitality',
        'Sommelier': 'hospitality', 'Cruise Ship Staff': 'hospitality',
        'Agricultural Scientist': 'agriculture', 'Horticulturist': 'agriculture',
        'Forestry Officer': 'agriculture', 'Environmental Consultant': 'agriculture',
        'Wildlife Biologist': 'agriculture', 'Organic Farmer': 'agriculture',
        'Sports Coach': 'sports', 'Fitness Trainer': 'sports', 'Yoga Instructor': 'sports',
        'Sports Nutritionist': 'sports', 'Physiotherapist for Sports': 'sports',
        'Sports Commentator': 'sports',
        'Data Privacy Officer': 'tech', 'Sustainability Manager': 'business',
        'Drone Pilot': 'tech', 'Ethical Hacker': 'tech', 'Robotics Engineer': 'tech',
        'UX Researcher': 'tech',
    }


def _skill_domains() -> Dict[str, set]:
    return {
        'tech': {
            'python', 'java', 'javascript', 'js', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'go', 'rust',
            'react', 'angular', 'vue', 'node', 'nodejs', 'html', 'css', 'typescript', 'frontend', 'backend',
            'full stack', 'fullstack', 'web development', 'responsive design',
            'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'pandas', 'numpy', 'scipy', 'tensorflow',
            'pytorch', 'machine learning', 'ml', 'deep learning', 'ai', 'artificial intelligence',
            'data science', 'data engineering', 'big data', 'hadoop', 'spark',
            'docker', 'kubernetes', 'k8s', 'aws', 'azure', 'gcp', 'cloud', 'devops', 'ci/cd',
            'jenkins', 'terraform', 'ansible',
            'git', 'github', 'gitlab', 'api', 'rest', 'graphql', 'microservices', 'agile tech',
            'algorithms', 'data structures', 'oop', 'object oriented', 'debugging',
            'cybersecurity', 'network security', 'penetration testing', 'firewall', 'encryption',
            'database', 'db', 'orm', 'query optimization',
            'blockchain', 'iot', 'embedded systems', 'robotics', 'game development', 'unity', 'unreal',
        },
        'creative': {
            'writing', 'content writing', 'content', 'copywriting', 'creative writing', 'editing',
            'grammar', 'storytelling', 'blogging', 'articles', 'journalism',
            'photoshop', 'illustrator', 'indesign', 'graphic design', 'design', 'visual design',
            'branding', 'logo design', 'typography', 'color theory',
            'video editing', 'premiere', 'final cut', 'after effects', 'animation', '2d animation', '3d animation',
            'photography', 'photo editing', 'lightroom', 'portrait', 'landscape photography',
            'illustration', 'digital art', 'sketching', 'drawing', 'painting',
            'ui design', 'ux design', 'user interface', 'user experience', 'wireframing', 'prototyping',
            'fashion design', 'interior design', 'product design',
        },
        'business': {
            'business analysis', 'business strategy', 'strategy', 'management', 'leadership',
            'project management', 'agile', 'scrum', 'kanban', 'waterfall',
            'consulting', 'operations', 'supply chain', 'logistics', 'inventory management',
            'crm', 'salesforce', 'customer relationship', 'stakeholder management',
            'business development', 'partnerships', 'negotiation', 'contract management',
            'risk management', 'compliance', 'change management', 'process improvement',
            'hr', 'human resources', 'recruitment', 'talent management', 'employee relations',
            'excel', 'powerpoint', 'business intelligence', 'reporting', 'dashboards',
        },
        'finance': {
            'finance', 'accounting', 'bookkeeping', 'financial accounting', 'management accounting',
            'financial modeling', 'valuation', 'dcf', 'investment', 'portfolio management',
            'taxation', 'tax planning', 'gst', 'income tax', 'auditing', 'internal audit',
            'banking', 'investment banking', 'equity research', 'credit analysis',
            'financial planning', 'wealth management', 'insurance', 'treasury',
            'financial analysis', 'budgeting', 'forecasting', 'cost accounting',
            'quickbooks', 'tally', 'sap', 'oracle financials',
        },
        'marketing': {
            'marketing', 'digital marketing', 'marketing strategy', 'brand management', 'branding',
            'seo', 'search engine optimization', 'sem', 'search engine marketing',
            'social media marketing', 'social media', 'facebook ads', 'instagram marketing', 'linkedin marketing',
            'email marketing', 'marketing automation', 'mailchimp', 'hubspot',
            'advertising', 'campaigns', 'ad campaigns', 'google ads', 'ppc', 'paid advertising',
            'content marketing', 'influencer marketing', 'affiliate marketing',
            'market research', 'consumer behavior', 'analytics', 'google analytics',
            'public relations', 'pr', 'media relations', 'crisis management',
        },
        'healthcare': {
            'medicine', 'medical', 'clinical', 'diagnosis', 'treatment', 'patient care',
            'nursing', 'healthcare', 'hospital', 'emergency care', 'critical care',
            'pharmacy', 'pharmacology', 'drug therapy', 'medication management',
            'physiotherapy', 'physical therapy', 'rehabilitation', 'sports medicine',
            'dentistry', 'dental', 'oral health', 'orthodontics',
            'psychology', 'counseling', 'mental health', 'therapy', 'cognitive behavioral',
            'nutrition', 'dietetics', 'dietary planning', 'nutritional counseling',
            'radiology', 'imaging', 'ultrasound', 'mri', 'ct scan',
            'surgery', 'surgical', 'anesthesia', 'pediatrics', 'cardiology',
        },
        'education': {
            'teaching', 'education', 'pedagogy', 'classroom management', 'lesson planning',
            'training', 'corporate training', 'instructor', 'facilitator',
            'curriculum', 'curriculum design', 'instructional design', 'course development',
            'e-learning', 'online teaching', 'lms', 'moodle', 'canvas',
            'assessment', 'evaluation', 'grading', 'student engagement',
            'special education', 'inclusive education', 'differentiated instruction',
            'educational technology', 'edtech', 'educational psychology',
        },
        'engineering': {
            'mechanical engineering', 'mechanical', 'thermodynamics', 'fluid mechanics',
            'civil engineering', 'civil', 'structural engineering', 'construction',
            'electrical engineering', 'electrical', 'electronics', 'circuits', 'embedded',
            'chemical engineering', 'chemical', 'process engineering', 'petrochemical',
            'cad', 'autocad', 'solidworks', 'catia', 'creo', '3d modeling',
            'manufacturing', 'production', 'quality control', 'six sigma', 'lean manufacturing',
            'aerospace', 'automotive', 'petroleum', 'mining', 'environmental engineering',
        },
        'agriculture': {
            'agriculture', 'farming', 'crop management', 'soil science', 'agronomy',
            'horticulture', 'plant science', 'crop production', 'irrigation',
            'forestry', 'forest management', 'agroforestry', 'sustainable farming',
            'organic farming', 'permaculture', 'agricultural economics',
            'animal husbandry', 'livestock', 'veterinary', 'pest management',
            'agricultural research', 'biotechnology in agriculture',
        },
        'sports': {
            'sports', 'fitness', 'coaching', 'athletic training', 'sports psychology',
            'exercise science', 'kinesiology', 'strength training', 'conditioning',
            'yoga', 'pilates', 'aerobics', 'personal training',
            'sports nutrition', 'sports medicine', 'injury prevention',
            'sports management', 'sports commentary', 'sports journalism',
        },
        'hospitality': {
            'hospitality', 'hotel management', 'guest services', 'front office',
            'culinary', 'cooking', 'chef', 'food preparation', 'menu planning',
            'tourism', 'travel', 'tour planning', 'destination management',
            'event management', 'event planning', 'catering', 'banquet',
            'housekeeping', 'facility management', 'customer service hospitality',
        },
        'legal': {
            'law', 'legal', 'legal research', 'legal writing', 'litigation',
            'contract law', 'corporate law', 'intellectual property', 'patent law',
            'criminal law', 'civil law', 'labor law', 'compliance legal',
            'legal drafting', 'negotiation legal', 'case management',
            'courtroom', 'arbitration', 'mediation',
        },
        'media': {
            'journalism', 'reporting', 'news writing', 'investigative journalism',
            'broadcast journalism', 'media production', 'radio', 'television',
            'podcasting', 'media relations', 'press releases', 'news anchor',
        },
    }


# Degree-level aliases used only by `TextMatcher.split_education` to pull a
# "level" (diploma/bachelor/master/doctorate) out of a free-text education
# string so it can be checked separately from the *field* of study (e.g.
# "M.Sc. Data Science" -> level=master, field="data science"). Ordered
# longest-alias-first so multi-word aliases are tried before short ones that
# might otherwise match a substring of them.
_DEGREE_LEVEL_ALIASES: List[Tuple[str, int]] = sorted([
    ('diploma', 1), ('polytechnic', 1),
    ('bachelor of technology', 2), ('bachelor of engineering', 2),
    ('bachelor of science', 2), ('bachelor of arts', 2), ('bachelor of commerce', 2),
    ('bachelor of business administration', 2), ('bachelor of design', 2),
    ('bachelors', 2), ('bachelor', 2), ('undergraduate', 2),
    ('btech', 2), ('be', 2), ('bsc', 2), ('bca', 2), ('ba', 2), ('bcom', 2),
    ('bba', 2), ('bdesign', 2), ('bpharm', 2), ('bds', 2), ('llb', 2), ('ug', 2),
    ('master of technology', 3), ('master of engineering', 3),
    ('master of science', 3), ('master of arts', 3), ('master of commerce', 3),
    ('master of business administration', 3),
    ('masters', 3), ('master', 3), ('postgraduate', 3),
    ('mtech', 3), ('me', 3), ('msc', 3), ('mca', 3), ('ma', 3), ('mcom', 3),
    ('mba', 3), ('mpharm', 3), ('mds', 3), ('llm', 3), ('pg', 3),
    ('doctorate', 4), ('phd', 4), ('dm', 4), ('mphil', 4),
], key=lambda x: -len(x[0]))


class TextMatcher:
    """Normalization + domain-aware fuzzy matching, shared by every part of
    the recommendation engine so 'is skill X the same as skill Y' is answered
    consistently everywhere it matters (scoring, skill-gap, /extract-skills,
    /normalize-skills)."""

    # Below this fuzzy ratio, two strings are treated as unrelated. This is a
    # fixed, documented threshold used consistently for every profile and
    # every career - it is not tuned per request.
    SKILL_MATCH_THRESHOLD = 78
    INTEREST_MATCH_THRESHOLD = 75

    def __init__(self) -> None:
        self.career_domains = _career_domains()
        self.skill_domains = _skill_domains()
        self.skill_synonyms = SKILL_SYNONYMS
        self._skill_domain_cache: Dict[str, List[str]] = {}
        self._compat_cache: Dict[Tuple[str, str], bool] = {}
        self._normalize_cache: Dict[str, str] = {}
        self._expand_cache: Dict[str, List[str]] = {}

    # -- normalization -----------------------------------------------------
    def _normalize_text(self, s: str) -> str:
        if not s:
            return ""
        return s.lower().strip().replace("&", "and")

    def _normalize_skill_for_matching(self, skill: str) -> str:
        cached = self._normalize_cache.get(skill)
        if cached is not None:
            return cached
        base = self._normalize_text(skill)
        replacements = {
            'js': 'javascript', 'ml': 'machine learning', 'ai': 'artificial intelligence',
            'fe': 'frontend', 'be': 'backend', 'fullstack': 'full stack',
            'nodejs': 'node', 'reactjs': 'react', 'k8s': 'kubernetes',
        }
        result = replacements.get(base, base)
        self._normalize_cache[skill] = result
        return result

    def _expand_skill(self, skill: str) -> List[str]:
        """Returns every known synonym/spelling-variant of a skill so a user
        typing 'JS' matches a career requiring 'javascript'."""
        if not skill:
            return []
        cached = self._expand_cache.get(skill)
        if cached is not None:
            return cached
        s = self._normalize_skill_for_matching(skill)
        result = [s]
        for main, syns in self.skill_synonyms.items():
            main_n = self._normalize_skill_for_matching(main)
            syns_n = [self._normalize_skill_for_matching(x) for x in syns]
            if s == main_n or s in syns_n:
                result = [main_n] + syns_n
                break
        self._expand_cache[skill] = result
        return result

    # -- domain gating -------------------------------------------------
    def _get_skill_domains(self, skill: str) -> List[str]:
        skill_lower = skill.lower().strip()
        cached = self._skill_domain_cache.get(skill_lower)
        if cached is not None:
            return cached
        matches = []
        for domain, skill_set in self.skill_domains.items():
            for domain_skill in skill_set:
                if skill_lower == domain_skill or (len(skill_lower) > 3 and skill_lower in domain_skill):
                    matches.append(domain)
                    break
        result = matches or ['general']
        self._skill_domain_cache[skill_lower] = result
        return result

    def is_domain_compatible(self, user_skill: str, career_skill: str) -> bool:
        """Prevents nonsense matches like a user's 'design patterns' (tech)
        being fuzzy-matched against a Graphic Designer's 'design' (creative)
        purely on substring overlap."""
        key = (user_skill.lower().strip(), career_skill.lower().strip())
        cached = self._compat_cache.get(key)
        if cached is not None:
            return cached
        user_domains = self._get_skill_domains(user_skill)
        career_domains = self._get_skill_domains(career_skill)
        if 'general' in user_domains or 'general' in career_domains:
            result = True
        else:
            result = any(d in career_domains for d in user_domains)
        self._compat_cache[key] = result
        return result

    # -- matching --------------------------------------------------------
    def best_skill_match(self, user_skill: str, career_skills: Sequence[str]) -> Tuple[int, float]:
        """Returns (index into career_skills, confidence 0..1) for the best
        match of a single user skill against a career's skill list, or
        (-1, 0.0) if nothing clears the threshold.

        Matching priority:
          1. An exact match against the user's own normalized skill text
             (before any synonym expansion) - this guarantees that if the
             user typed the literal skill name and it's literally present
             in the career's list, that's what gets credited, rather than
             a different member of the same synonym cluster (e.g. typing
             'coding' should match a career skill literally called
             'coding' if present, not silently redirect to 'programming'
             just because they're synonyms of each other).
          2. An exact match after synonym-expansion (e.g. 'JS' expands to
             include 'javascript', matching a career skill literally
             called 'javascript') - confidence 1.0.
          3. A fuzzy token-set ratio above SKILL_MATCH_THRESHOLD between
             the user's OWN literal text and the candidate skill - never
             between an *expanded synonym phrase* and the candidate,
             because token_set_ratio scores 100 whenever one string's
             tokens are a subset of the other's, so a multi-word synonym
             like 'java script' (an alias of 'javascript') would
             otherwise falsely register as a perfect match for the
             unrelated skill 'java'. Fuzzy matching here exists only to
             tolerate typos of the literal term (e.g. 'Djnago' vs
             'django'), not to extend synonym matching. Also requires
             both strings to have at least 4 alphanumeric characters -
             short/symbol-heavy skills like 'c++', 'c#', 'r', 'go' are
             compared for exact equality only, since ratios on very short
             strings are unreliable (e.g. 'c++' vs 'c#' scores a
             deceptively high ratio despite being unrelated languages).
        """
        own_norm = self._normalize_skill_for_matching(user_skill)
        variants = self._expand_skill(user_skill) or [own_norm]
        variant_set = set(variants)
        best_idx, best_conf = -1, 0.0

        # Precompute domain compatibility once per candidate (cached
        # lookups make this cheap) instead of recomputing it inside each
        # of the three passes below.
        compat = [self.is_domain_compatible(user_skill, cskill) for cskill in career_skills]
        c_norms = [self._normalize_skill_for_matching(cskill) for cskill in career_skills]

        # Pass 1: literal self-match, ignoring synonym expansion entirely.
        for idx, c_norm in enumerate(c_norms):
            if compat[idx] and c_norm == own_norm:
                return idx, 1.0

        # Pass 2: synonym-expanded exact match.
        for idx, c_norm in enumerate(c_norms):
            if compat[idx] and c_norm in variant_set:
                return idx, 1.0

        # Pass 3: guarded fuzzy ratio, using ONLY the user's own literal
        # text (never the synonym-expanded variants - see docstring).
        own_alnum = _alnum(own_norm)
        if len(own_alnum) < 4:
            return best_idx, best_conf
        for idx, c_norm in enumerate(c_norms):
            if not compat[idx]:
                continue
            c_alnum = _alnum(c_norm)
            if len(c_alnum) < 4:
                continue  # too short/symbolic for a safe fuzzy comparison

            ratio = fuzz.token_set_ratio(own_norm, c_norm)
            if ratio >= self.SKILL_MATCH_THRESHOLD:
                conf = (ratio - self.SKILL_MATCH_THRESHOLD) / (100.0 - self.SKILL_MATCH_THRESHOLD)
                if conf > best_conf:
                    best_idx, best_conf = idx, conf
        return best_idx, best_conf

    def match_skills(
        self, user_skills: Iterable[str], career_skills: Sequence[str]
    ) -> Tuple[List[str], List[str], List[float]]:
        """Matches a list of user skills against a career's skill list.

        Returns (matched_career_skills, unmatched_career_skills, match_confidences)
        where match_confidences aligns 1:1 with matched_career_skills.
        """
        career_list = list(career_skills)
        matched_idx: Dict[int, float] = {}
        for us in user_skills:
            if not us:
                continue
            idx, conf = self.best_skill_match(us, career_list)
            if idx >= 0 and conf > matched_idx.get(idx, 0.0):
                matched_idx[idx] = conf
        matched = [career_list[i] for i in matched_idx]
        confidences = [matched_idx[i] for i in matched_idx]
        unmatched = [c for i, c in enumerate(career_list) if i not in matched_idx]
        return matched, unmatched, confidences

    def text_mentions_skill(self, text_norm: str, skill: str) -> bool:
        """Word-boundary check for whether free text (e.g. a project
        description) mentions a given skill - used instead of a raw
        substring check so 'java' doesn't register as mentioned inside a
        paragraph that only ever says 'javascript'."""
        skill_norm = self._normalize_skill_for_matching(skill)
        if not skill_norm or len(_alnum(skill_norm)) < 3:
            return False
        return _word_boundary_contains(skill_norm, text_norm)

    def split_education(self, text: str) -> Tuple[int, str]:
        """Splits a free-text education string into (degree_level_rank,
        field_of_study_text). degree_level_rank is 1=diploma, 2=bachelor's,
        3=master's, 4=doctorate, or None if no recognized level token is
        found (e.g. 'Any Graduate', 'Self-taught', 'Bootcamp', 'Research' -
        these are treated as level-neutral rather than guessed at).

        This exists ONLY so `evidence.education_evidence` can give partial
        credit to a real degree that isn't literally in a career's curated
        education list (e.g. 'M.Sc. Data Science' against a list of
        ['B.Tech', 'M.Tech', 'B.Sc Statistics', ...]) by checking level +
        field separately, instead of scoring 0 just because the exact
        string wasn't anticipated. It never invents a level/field split for
        text that doesn't contain one.
        """
        if not text:
            return None, ""
        norm = self._normalize_text(text)
        # Collapse punctuation used inside degree abbreviations ('b.tech',
        # 'm.sc.') so alias lookup sees one token, while turning hyphens
        # and slashes into spaces so multi-word phrasing still splits
        # cleanly ('self-taught' -> 'self taught').
        cleaned = re.sub(r'[.,]', '', norm)
        cleaned = re.sub(r'[-/]', ' ', cleaned)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()

        for alias, rank in _DEGREE_LEVEL_ALIASES:
            pattern = r'(?<![a-z0-9])' + re.escape(alias) + r'(?![a-z0-9])'
            match = re.search(pattern, cleaned)
            if match:
                remainder = (cleaned[:match.start()] + ' ' + cleaned[match.end():]).strip()
                # Drop leading/trailing filler prepositions left behind by
                # phrasing like 'M.Sc. in Data Science' or 'B.Tech - CSE'.
                remainder = re.sub(r'^(in|of)\s+', '', remainder).strip()
                return rank, remainder

        return None, cleaned

    def match_free_text_list(self, user_items: Iterable[str], career_items: Sequence[str]) -> List[str]:
        """Looser matcher for interests/education/certifications, where
        domain-gating doesn't apply (e.g. 'B.Tech' vs 'B.Tech Computer
        Science' shouldn't be domain-checked the way skills are). Still
        uses word-boundary containment rather than raw substring checks,
        to avoid the same class of false positive as skill matching (e.g.
        'art' should not match inside 'quart').
        """
        matched = []
        for ci in career_items:
            ci_norm = self._normalize_text(ci)
            for ui in user_items:
                if not ui:
                    continue
                ui_norm = self._normalize_text(ui)
                if ui_norm == ci_norm:
                    matched.append(ci)
                    break
                if (len(ui_norm) > 3 and _word_boundary_contains(ui_norm, ci_norm)) or \
                   (len(ci_norm) > 3 and _word_boundary_contains(ci_norm, ui_norm)):
                    matched.append(ci)
                    break
                if fuzz.token_set_ratio(ui_norm, ci_norm) >= self.INTEREST_MATCH_THRESHOLD:
                    matched.append(ci)
                    break
        return matched
