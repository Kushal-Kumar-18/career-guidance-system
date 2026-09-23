// Reusable skill/topic -> free learning resource mappings for the career
// roadmap feature (see services/roadmapService.js).
//
// WHY THIS FILE EXISTS: the roadmap has to scale across 300+ careers
// without hardcoding a roadmap per career. Instead of mapping
// "career -> resources", this file maps "skill/topic keyword ->
// resources", and roadmapService resolves each career's own curated
// skill list (career_dataset.py, unmodified) against it at request time.
// A career inherits resources purely because its skills match these
// keyword groups — nothing here is keyed by career name.
//
// VERIFICATION POLICY (tightened after review):
//   - Every "learn"/"docs"/"certifications" entry below is a STATIC,
//     hand-verified page on a genuinely free platform — never a search
//     results page. A search results page cannot be verified in advance
//     (you don't know what it will return), so it is never presented as
//     a "resource" or a "certification" here. Where earlier drafts of
//     this file used a query-string search as if it were a curated
//     resource (e.g. an MIT OCW `?q=` search, a YouTube results page, a
//     Coursera/edX search), those have been removed rather than kept as
//     a "fallback" — a career with no genuine curated match simply gets
//     an empty section (see buildLearningResources), shown in the UI as
//     a clear empty state, instead of a guessed/unverified link.
//   - The ONE place this file still builds a dynamic URL from the
//     career name is job/internship search (LinkedIn/Indeed/Naukri).
//     That is a different kind of thing: individual job postings can
//     never be "pre-verified" (they change daily), so a live search on
//     a real job board is the correct, honest destination — not a stand
//     -in for an unverifiable learning resource. The task itself asks
//     for "dynamically career-relevant search destinations" here.
//   - "Certification" is reserved strictly for providers that hand out
//     an actual free certificate/credential on completion. A resource
//     that's merely free to learn from, but charges for the exam or
//     credential (e.g. Microsoft Learn), is listed only under general
//     learning resources — never under free_certifications.
//
// No paid API, scraper, LLM, or invented URL is used anywhere in this
// file.

'use strict';

const enc = (s) => encodeURIComponent(String(s || '').trim());

// Word-boundary substring match, NOT naive .includes() in either
// direction. Naive substring matching breaks badly for short keywords —
// e.g. the single letter 'r' (for the R language) matches inside
// "communication"/"breathing", and 'ai' (for "AI") matches inside
// "maintenance"/"training". Wrapping the keyword in boundary characters
// ensures a keyword only matches whole words/phrases, not letter runs
// inside an unrelated word.
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const _boundaryCache = new Map();
function containsKeyword(text, keyword) {
  const key = keyword.trim().toLowerCase();
  if (!key) return false;
  let re = _boundaryCache.get(key);
  if (!re) {
    re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(key)}([^a-z0-9]|$)`, 'i');
    _boundaryCache.set(key, re);
  }
  return re.test(text);
}

// ---------------------------------------------------------------------
// Dynamic search-destination builders. Restricted to job/internship
// search and open-source issue/repo discovery — both are things that
// are *supposed* to be a live search (postings and open issues change
// daily and can't be "verified" in advance), never a stand-in for a
// learning resource or certification.
// ---------------------------------------------------------------------
const search = {
  github: (q) => ({
    title: 'GitHub — open-source repositories',
    url: `https://github.com/search?q=${enc(q)}&type=repositories`,
  }),
  githubGoodFirstIssue: (q) => ({
    title: 'GitHub — "good first issue" tasks',
    url: `https://github.com/search?q=${enc(`label:"good first issue" ${q}`)}&type=issues`,
  }),
  linkedInJobs: (q) => ({
    title: 'LinkedIn Jobs',
    url: `https://www.linkedin.com/jobs/search/?keywords=${enc(q)}`,
  }),
  indeedJobs: (q) => ({
    title: 'Indeed',
    url: `https://www.indeed.com/jobs?q=${enc(q)}`,
  }),
  naukriJobs: (q) => ({
    title: 'Naukri',
    url: `https://www.naukri.com/jobs?keyword=${enc(q)}`,
  }),
};

// ---------------------------------------------------------------------
// Tier A — curated, hand-verified STATIC resources for the most common
// recurring skill/topic keywords across the dataset. No entry here is a
// search results page. This is the ONLY tier: a topic with no match
// here simply contributes nothing (see buildLearningResources) rather
// than falling back to an unverified search link.
// ---------------------------------------------------------------------
const TOPIC_GROUPS = [
  {
    keywords: ['python'],
    learn: [{ title: 'freeCodeCamp — Scientific Computing with Python', url: 'https://www.freecodecamp.org/learn' }],
    docs: [{ title: 'Python official tutorial', url: 'https://docs.python.org/3/tutorial/' }],
  },
  {
    keywords: ['javascript', 'js', 'node', 'typescript'],
    learn: [{ title: 'freeCodeCamp — JavaScript Algorithms and Data Structures', url: 'https://www.freecodecamp.org/learn' }],
    docs: [{ title: 'MDN — JavaScript', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' }],
  },
  {
    keywords: ['html', 'css', 'responsive design', 'web design', 'frontend'],
    learn: [{ title: 'freeCodeCamp — Responsive Web Design', url: 'https://www.freecodecamp.org/learn' }],
    docs: [
      { title: 'MDN — HTML', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML' },
      { title: 'MDN — CSS', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS' },
    ],
  },
  {
    keywords: ['react', 'react native'],
    learn: [{ title: 'React — official learning guide', url: 'https://react.dev/learn' }],
  },
  {
    keywords: ['java'],
    docs: [{ title: 'Oracle Java Tutorials', url: 'https://docs.oracle.com/javase/tutorial/' }],
  },
  {
    // cppreference.com covers BOTH C and C++ and is the resource
    // professionals actually use (replaces an earlier cplusplus.com
    // link, which now redirects much of its content to a "legacy."
    // subdomain — dropped as questionable/outdated rather than guessed
    // at).
    keywords: ['c++'],
    docs: [{ title: 'cppreference.com — C++ reference', url: 'https://en.cppreference.com/w/cpp' }],
  },
  {
    keywords: ['r programming', 'statistics'],
    learn: [{ title: 'Khan Academy — Statistics & Probability', url: 'https://www.khanacademy.org/math/statistics-probability' }],
    docs: [{ title: 'The R Project — documentation', url: 'https://www.r-project.org/other-docs.html' }],
  },
  {
    // Bare single-letter language names ('r', 'c') are exact-token
    // matched only (see matchTopic's `exact` handling) — never
    // substring-matched — so "r" never fires on "communication" and "c"
    // never fires on "coding". Kept as two separate groups so each
    // points at its own correct docs (a career whose skill list
    // contains "c" via "objective c" has nothing to do with the R
    // language).
    keywords: ['r'],
    exact: true,
    docs: [{ title: 'The R Project — documentation', url: 'https://www.r-project.org/other-docs.html' }],
  },
  {
    keywords: ['c'],
    exact: true,
    docs: [{ title: 'cppreference.com — C reference', url: 'https://en.cppreference.com/w/c' }],
  },
  {
    keywords: ['sql', 'database', 'postgres', 'mysql'],
    learn: [{ title: 'freeCodeCamp — Relational Database', url: 'https://www.freecodecamp.org/learn' }],
    docs: [{ title: 'W3Schools — SQL', url: 'https://www.w3schools.com/sql/' }],
  },
  {
    keywords: ['machine learning', 'ml', 'deep learning', 'neural network', 'ai', 'artificial intelligence', 'nlp', 'computer vision', 'tensorflow', 'pytorch'],
    learn: [
      { title: 'Kaggle Learn — free micro-courses (with completion certificates)', url: 'https://www.kaggle.com/learn' },
      { title: 'freeCodeCamp — Machine Learning with Python', url: 'https://www.freecodecamp.org/learn' },
    ],
  },
  {
    keywords: ['data analysis', 'data analytics', 'pandas', 'numpy', 'data science', 'data visualization', 'tableau', 'power bi'],
    learn: [{ title: 'Kaggle Learn — Data Analysis micro-courses', url: 'https://www.kaggle.com/learn' }],
  },
  {
    keywords: ['excel', 'spreadsheet'],
    docs: [{ title: 'Microsoft Excel support & training', url: 'https://support.microsoft.com/excel' }],
  },
  {
    keywords: ['aws', 'azure', 'gcp', 'cloud'],
    learn: [{ title: 'Microsoft Learn — free training (certification exam is a separate paid fee)', url: 'https://learn.microsoft.com/training/' }],
    docs: [{ title: 'AWS documentation', url: 'https://docs.aws.amazon.com/' }],
  },
  {
    keywords: ['docker', 'kubernetes', 'devops', 'ci cd', 'containerization'],
    docs: [
      { title: 'Docker — Get started', url: 'https://docs.docker.com/get-started/' },
      { title: 'Kubernetes — tutorials', url: 'https://kubernetes.io/docs/tutorials/' },
    ],
  },
  {
    keywords: ['linux', 'system administration', 'shell scripting', 'bash'],
    learn: [{ title: 'Linux Journey — free, open-source interactive Linux basics', url: 'https://linuxjourney.com/' }],
  },
  {
    keywords: ['git', 'github', 'version control'],
    docs: [{ title: 'Git — official documentation', url: 'https://git-scm.com/doc' }],
  },
  {
    // IBM SkillsBuild dropped: its free access is restricted by learner
    // status (student/educator/certain adult programs) in some regions,
    // so it doesn't cleanly clear the "genuinely free and open to
    // everyone" bar. OWASP is a long-established, fully open nonprofit
    // resource with no eligibility gate.
    keywords: ['security', 'cybersecurity', 'ethical hacking', 'penetration testing', 'networking', 'firewall'],
    docs: [{ title: 'OWASP — free application security resources', url: 'https://owasp.org/' }],
  },
  {
    keywords: ['ui', 'ux', 'user experience', 'figma', 'design'],
    learn: [{ title: 'freeCodeCamp — Front End Development Libraries (design-adjacent)', url: 'https://www.freecodecamp.org/learn' }],
  },
  {
    keywords: ['marketing', 'seo', 'content', 'social media', 'digital marketing', 'advertising'],
    learn: [
      { title: 'HubSpot Academy — free marketing courses & certifications', url: 'https://academy.hubspot.com/courses' },
      { title: 'Google Digital Garage — Fundamentals of Digital Marketing (free, accredited certificate)', url: 'https://learndigital.withgoogle.com/digitalgarage/' },
    ],
  },
  {
    keywords: ['sales', 'crm', 'business development', 'negotiation'],
    learn: [{ title: 'HubSpot Academy — free sales courses & certifications', url: 'https://academy.hubspot.com/courses' }],
  },
  {
    // Replaced an MIT OCW *search* URL (?q=management) with OCW's real,
    // static course-browse page — a search results page can't be
    // pre-verified, a browse listing can.
    keywords: ['management', 'leadership', 'strategy', 'operations', 'project management', 'product management'],
    learn: [{ title: 'MIT OpenCourseWare — browse free courses', url: 'https://ocw.mit.edu/courses/' }],
  },
  {
    keywords: ['accounting', 'finance', 'financial analysis', 'investment', 'taxation', 'audit'],
    learn: [{ title: 'Khan Academy — Economics & Finance', url: 'https://www.khanacademy.org/economics-finance-domain' }],
  },
  {
    // The earlier draft guessed subject-specific OpenLearn subpaths
    // (e.g. "/openlearn/law", "/openlearn/health-sports-psychology")
    // that could not be confirmed. Replaced everywhere with OpenLearn's
    // one confirmed, real free-courses browse page.
    keywords: ['human resources', 'recruiting', 'talent', 'hr'],
    learn: [{ title: 'OpenLearn (Open University) — browse free courses', url: 'https://www.open.edu/openlearn/free-courses' }],
  },
  {
    keywords: ['teaching', 'curriculum', 'pedagogy', 'education'],
    learn: [{ title: 'OpenLearn (Open University) — browse free courses', url: 'https://www.open.edu/openlearn/free-courses' }],
  },
  {
    keywords: ['patient', 'nursing', 'clinical', 'medical', 'anatomy', 'pharmacology', 'healthcare'],
    learn: [{ title: 'Khan Academy — Health & Medicine', url: 'https://www.khanacademy.org/science/health-and-medicine' }],
  },
  {
    keywords: ['legal', 'law', 'compliance', 'contracts', 'regulation'],
    learn: [{ title: 'OpenLearn (Open University) — browse free courses', url: 'https://www.open.edu/openlearn/free-courses' }],
  },
  {
    keywords: ['psychology', 'counseling', 'social work', 'therapy'],
    learn: [{ title: 'OpenLearn (Open University) — browse free courses', url: 'https://www.open.edu/openlearn/free-courses' }],
  },
  {
    // Replaced an MIT OCW *search* URL (?d=Physics) with the same real
    // course-browse page used above.
    keywords: ['research', 'lab', 'biology', 'chemistry', 'physics', 'science'],
    learn: [{ title: 'MIT OpenCourseWare — browse free courses', url: 'https://ocw.mit.edu/courses/' }],
  },
  {
    keywords: ['android', 'ios', 'kotlin', 'swift', 'flutter', 'mobile'],
    learn: [{ title: 'Android Developers — free training courses', url: 'https://developer.android.com/courses' }],
  },
];

function matchTopic(skillLower) {
  return TOPIC_GROUPS.find((g) =>
    g.keywords.some((k) => {
      const kw = k.trim().toLowerCase();
      if (g.exact) {
        // Whole-skill-token match only (e.g. skill text is exactly "r"
        // or "c") — never a substring match, since single-letter
        // keywords are too collision-prone even with word boundaries.
        return skillLower.split(/[^a-z0-9+#]+/i).includes(kw);
      }
      return containsKeyword(skillLower, kw);
    })
  );
}

// Free/open certification providers — every entry here genuinely hands
// out a free certificate/credential on completion (verified during
// research; see ROADMAP_UPGRADE_NOTES.md for the audit). A provider that
// is only free to *learn* from but charges for the credential (e.g.
// Microsoft Learn's paid exams) is deliberately NOT here — it appears
// only under general learning resources (TOPIC_GROUPS above), so it can
// never be mistaken for a free certification.
const CERT_GROUPS = [
  {
    keywords: ['python', 'javascript', 'html', 'css', 'sql', 'programming', 'coding', 'web', 'data analysis', 'machine learning', 'quality assurance'],
    certifications: [
      { title: 'freeCodeCamp certifications (Responsive Web Design, JavaScript, Python, Data Analysis, Machine Learning, and more — free)', url: 'https://www.freecodecamp.org/learn' },
    ],
  },
  {
    keywords: ['data analysis', 'data science', 'machine learning', 'data'],
    certifications: [
      { title: 'Kaggle Learn — free completion certificates for data/ML micro-courses', url: 'https://www.kaggle.com/learn' },
    ],
  },
  {
    // Re-verified (multiple independent 2026 sources): Google Digital
    // Garage's "Fundamentals of Digital Marketing" is free to take, and
    // the certificate is free to download after passing the final
    // assessment — accredited by IAB Europe and The Open University.
    // No paid tier gates the certificate itself, so this stays listed.
    keywords: ['marketing', 'seo', 'content', 'social media', 'digital marketing', 'advertising'],
    certifications: [
      { title: 'Google Digital Garage — Fundamentals of Digital Marketing (free course, free certificate, IAB Europe & Open University accredited)', url: 'https://learndigital.withgoogle.com/digitalgarage/' },
      { title: 'HubSpot Academy certifications (free)', url: 'https://academy.hubspot.com/courses' },
    ],
  },
  {
    keywords: ['sales', 'crm', 'inbound'],
    certifications: [{ title: 'HubSpot Academy certifications (free)', url: 'https://academy.hubspot.com/courses' }],
  },
  // NOTE: a "cloud/security/devops -> Microsoft Learn" certification
  // entry was removed here. Microsoft Learn's training is free but its
  // certification EXAM has a separate paid fee, so it does not belong
  // in a free-certifications list — it remains available as a learning
  // resource (see the 'aws/azure/gcp/cloud' TOPIC_GROUP above).
];

function findCertifications(skillsLower) {
  const seen = new Set();
  const out = [];
  for (const group of CERT_GROUPS) {
    const hit = group.keywords.some((k) => skillsLower.some((s) => containsKeyword(s, k)));
    if (!hit) continue;
    for (const cert of group.certifications) {
      if (seen.has(cert.url)) continue;
      seen.add(cert.url);
      out.push(cert);
    }
  }
  return out;
}

// Keywords that genuinely indicate the person writes/maintains code —
// the bar for suggesting GitHub-based open-source contribution and
// coding-practice sites (HackerRank/LeetCode). Deliberately narrower
// than "tech-adjacent": e.g. bare "sql", "cloud", or "linux" alone do
// NOT qualify, because plenty of BI/ops/support-adjacent roles use
// those tools without ever authoring/contributing code. Checked against
// the real 309-career dataset: roles like Data Privacy Officer,
// Sustainability Manager, UX Researcher, and Drone Pilot correctly do
// NOT match (no programming/coding/git signal in their skill lists),
// while Ethical Hacker, Robotics Engineer, GIS Specialist, and similar
// genuinely code-touching roles correctly do.
const CODE_CONTRIBUTION_KEYWORDS = [
  'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'kotlin', 'swift', 'php', 'ruby', 'golang', 'rust',
  'programming', 'coding', 'software development', 'software engineering', 'git', 'github', 'version control',
  'open source', 'app development', 'web development', 'algorithms', 'data structures', 'firmware',
];

function isCodeContributionRelevant(career) {
  const skillsLower = (career.skills || []).map((s) => s.toLowerCase());
  return CODE_CONTRIBUTION_KEYWORDS.some((k) => skillsLower.some((s) => containsKeyword(s, k)));
}

/**
 * Resolve a de-duplicated set of learning resources for a list of
 * skills/topics, capped so the roadmap stays compact. Only Tier-A
 * curated static matches are used — a topic with no match contributes
 * nothing, rather than falling back to a search link presented as if it
 * were a verified resource.
 */
function buildLearningResources(topics, { max = 8 } = {}) {
  const learn = [];
  const docs = [];
  const seenLearn = new Set();
  const seenDocs = new Set();

  for (const topic of topics) {
    const t = String(topic || '').toLowerCase().trim();
    if (!t) continue;
    const group = matchTopic(t);
    if (!group) continue;
    for (const r of group.learn || []) {
      if (!seenLearn.has(r.url) && learn.length < max) {
        seenLearn.add(r.url);
        learn.push(r);
      }
    }
    for (const r of group.docs || []) {
      if (!seenDocs.has(r.url) && docs.length < max) {
        seenDocs.add(r.url);
        docs.push(r);
      }
    }
  }

  return { learn: learn.slice(0, max), docs: docs.slice(0, max) };
}

function buildPracticeResources(career) {
  const skillsLower = (career.skills || []).map((s) => s.toLowerCase());
  if (!isCodeContributionRelevant(career)) return [];
  const out = [
    { title: 'HackerRank — practice problems', url: 'https://www.hackerrank.com/domains' },
    { title: 'LeetCode — practice problems', url: 'https://leetcode.com/problemset/' },
  ];
  if (skillsLower.some((s) => containsKeyword(s, 'data') || containsKeyword(s, 'machine learning'))) {
    out.push({ title: 'Kaggle — competitions & datasets', url: 'https://www.kaggle.com/competitions' });
  }
  return out;
}

function buildOpenSourceResources(career) {
  if (!isCodeContributionRelevant(career)) return [];
  return [search.github(career.name), search.githubGoodFirstIssue(career.name)];
}

function buildJobSearch(careerName) {
  return [search.linkedInJobs(careerName), search.indeedJobs(careerName), search.naukriJobs(careerName)];
}

function buildInternshipSearch(careerName) {
  const q = `${careerName} intern`;
  return [search.linkedInJobs(q), search.indeedJobs(q), search.naukriJobs(q)];
}

module.exports = {
  buildLearningResources,
  buildPracticeResources,
  buildOpenSourceResources,
  buildJobSearch,
  buildInternshipSearch,
  findCertifications,
  isCodeContributionRelevant,
  containsKeyword,
};
