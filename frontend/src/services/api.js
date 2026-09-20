const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

let authToken = null;
export function setAuthToken(token) {
  authToken = token;
  if (token) localStorage.setItem('cg_token', token);
  else localStorage.removeItem('cg_token');
}
export function loadStoredToken() {
  authToken = localStorage.getItem('cg_token');
  return authToken;
}

class ApiRequestError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body, auth = true, isForm = false } = {}) {
  const headers = {};
  if (!isForm) headers['Content-Type'] = 'application/json';
  if (auth && authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  let json = null;
  try {
    json = await res.json();
  } catch (e) {
    // no body
  }

  if (!res.ok) {
    const message = json?.error?.message || `Request failed (${res.status})`;
    throw new ApiRequestError(message, res.status, json?.error?.details);
  }
  return json?.data;
}

// Fetches a binary response (currently only the resume PDF) with the
// Authorization header attached, and returns an object URL the browser
// can open or download.
//
// This exists because the resume PDF is no longer a public static file:
// it's served by the authenticated GET /api/resume/download route, and a
// plain `<a href>` would send no Bearer token and get a 401. So we fetch
// it as a blob and hand the caller a short-lived blob: URL instead.
// Callers should URL.revokeObjectURL() it when they're done.
async function requestBlob(path) {
  const headers = {};
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}/api${path}`, { headers });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const json = await res.json();
      message = json?.error?.message || message;
    } catch (e) {
      // non-JSON error body
    }
    throw new ApiRequestError(message, res.status);
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export const api = {
  // auth
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),

  // profile
  getProfile: () => request('/profile'),
  updateProfile: (payload) => request('/profile', { method: 'PUT', body: payload }),
  // Persists a resume extraction the user has already reviewed into
  // their profile. mode: 'merge' (default, keeps existing values) or
  // 'overwrite'. Returns { profile, mode }.
  applyResumeToProfile: (extracted, mode = 'merge') =>
    request('/profile/apply-resume', { method: 'POST', body: { extracted, mode } }),

  // careers
  listCareers: (q) => request(`/careers${q ? `?q=${encodeURIComponent(q)}` : ''}`, { auth: false }),
  getCareer: (name) => request(`/careers/${encodeURIComponent(name)}`, { auth: false }),
  compareCareers: (names) => request(`/careers/compare?names=${names.map(encodeURIComponent).join(',')}`, { auth: false }),
  careerMyths: (name) => request(`/careers/${encodeURIComponent(name)}/myths-reality`, { auth: false }),
  careerInvestment: (name) => request(`/careers/${encodeURIComponent(name)}/investment`, { auth: false }),
  careerWeeklyPlan: (name, hours) => request(`/careers/${encodeURIComponent(name)}/weekly-plan${hours ? `?hours=${hours}` : ''}`, { auth: false }),
  saveCareer: (name) => request(`/careers/${encodeURIComponent(name)}/save`, { method: 'POST' }),
  unsaveCareer: (name) => request(`/careers/${encodeURIComponent(name)}/save`, { method: 'DELETE' }),
  listSavedCareers: () => request('/careers/saved'),

  // recommendations
  // opts: { source: 'profile'|'resume_upload'|'resume_builder'|'merge', candidate: {...} }
  // Defaults to the existing behavior (source omitted -> 'profile') so
  // every prior call site keeps working unchanged.
  generateRecommendations: (topK = 5, opts = {}) =>
    request('/recommendations', { method: 'POST', body: { top_k: topK, source: opts.source, candidate: opts.candidate } }),
  recommendationHistory: () => request('/recommendations/history'),
  // Feedback targets the EXACT recommendation row the user is rating
  // (its `id`, returned on every item from generateRecommendations) —
  // not a career name. A career can legitimately appear in more than one
  // analysis for the same user, and a name-based lookup could silently
  // attach the rating to the wrong one (see backend recommendationService
  // .submitFeedback).
  submitRecommendationFeedback: (recommendationId, rating) =>
    request('/recommendations/feedback', { method: 'POST', body: { recommendation_id: recommendationId, rating } }),

  // skills
  predefinedSkills: () => request('/skills/predefined', { auth: false }),
  extractSkills: (text) => request('/skills/extract', { method: 'POST', body: { text } }),
  skillGap: (career) => request(`/skills/gap?career=${encodeURIComponent(career)}`),

  // skill tests
  generateSkillTest: (skillName, difficulty, totalQuestions) =>
    request('/skill-tests', { method: 'POST', body: { skill_name: skillName, difficulty, total_questions: totalQuestions } }),
  submitSkillTest: (testId, answers) => request(`/skill-tests/${testId}/submit`, { method: 'POST', body: { answers } }),
  skillTestResults: () => request('/skill-tests/results'),
  // The skills on the user's own profile (typed in, or resume-extracted
  // and applied), each annotated with its latest verification result.
  skillTestSkills: () => request('/skill-tests/skills'),

  // roadmaps
  roadmapFor: (career) => request(`/roadmaps/${encodeURIComponent(career)}`, { auth: false }),
  personalizedRoadmap: (career) => request(`/roadmaps/${encodeURIComponent(career)}/personalized`),

  // resume
  getResume: () => request('/resume'),
  updateResume: (payload) => request('/resume', { method: 'PUT', body: payload }),
  previewResume: () => request('/resume/preview'),
  generateResumePdf: () => request('/resume/generate', { method: 'POST' }),
  // Authenticated download of the caller's own generated PDF; resolves to
  // a blob: URL (see requestBlob above).
  downloadResumePdf: () => requestBlob('/resume/download'),
  // Uploads a PDF/DOCX resume for parsing; returns { source_file, warnings, extracted }
  // for the user to review before it's used for career analysis — nothing
  // is saved server-side by this call.
  uploadResume: (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    return request('/resume/upload', { method: 'POST', body: formData, isForm: true });
  },

  // ats
  analyzeAts: (targetCareer) => request('/ats/analyze', { method: 'POST', body: { target_career: targetCareer } }),

  // jobs & trends
  searchJobs: (what, where) => request(`/jobs/search?what=${encodeURIComponent(what)}${where ? `&where=${encodeURIComponent(where)}` : ''}`, { auth: false }),
  skillDemand: (career) => request(`/trends/skill-demand?career=${encodeURIComponent(career)}`, { auth: false }),
  emergingSkills: (career) => request(`/trends/emerging-skills?career=${encodeURIComponent(career)}`, { auth: false }),
  marketInsights: (career) => request(`/trends/market-insights?career=${encodeURIComponent(career)}`, { auth: false }),

  // game
  generateGame: (career) => request(`/game/generate?career=${encodeURIComponent(career)}`, { auth: false }),
  playGame: (payload) => request('/game/play', { method: 'POST', body: payload }),
  gameHistory: () => request('/game/history'),

  // analytics
  dashboard: () => request('/analytics/dashboard'),

  // admin
  adminOverview: () => request('/analytics/admin/overview'),
  adminListUsers: () => request('/analytics/admin/users'),
  adminDeleteUser: (id) => request(`/analytics/admin/users/${id}`, { method: 'DELETE' }),
};

export { ApiRequestError };
