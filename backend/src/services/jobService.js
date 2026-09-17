const axios = require('axios');
const env = require('../config/env');
const jobRepository = require('../repositories/jobRepository');
const careerService = require('./careerService');
const logger = require('../utils/logger');

const ADZUNA_BASE = 'https://api.adzuna.com/v1/api/jobs';

function hasAdzunaCredentials() {
  return Boolean(env.adzunaAppId && env.adzunaAppKey);
}

// Section 17: timeout + validation + error handling + retries + graceful
// fallback. If Adzuna isn't configured/reachable, we fall back to
// representative postings derived from the real preserved career dataset
// (via the ML service) rather than fabricating unrelated data, and we say
// so explicitly in the response's `source` field.
async function fetchFromAdzuna({ what, where, page = 1, resultsPerPage = 20 }, attempt = 1) {
  const url = `${ADZUNA_BASE}/${env.adzunaCountry}/search/${page}`;
  try {
    const res = await axios.get(url, {
      timeout: 8000,
      params: {
        app_id: env.adzunaAppId,
        app_key: env.adzunaAppKey,
        what,
        where,
        results_per_page: resultsPerPage,
      },
    });
    return (res.data.results || []).map((r) => ({
      title: r.title,
      company: r.company?.display_name || 'Unknown',
      location: r.location?.display_name || where || '',
      description: (r.description || '').slice(0, 2000),
      salary_min: r.salary_min || null,
      salary_max: r.salary_max || null,
      contract_type: r.contract_type || null,
      source: 'adzuna',
      url: r.redirect_url,
      career_category: what,
    }));
  } catch (err) {
    if (attempt < 2) {
      logger.warn('Adzuna request failed, retrying once', { message: err.message });
      return fetchFromAdzuna({ what, where, page, resultsPerPage }, attempt + 1);
    }
    logger.warn('Adzuna unavailable, falling back to derived postings', { message: err.message });
    return null; // signal fallback to caller
  }
}

async function fallbackPostings(careerName) {
  const career = await careerService.getCareerDetail(careerName).catch(() => null);
  if (!career) return [];
  // Representative (not real) postings synthesized from the real career
  // dataset, clearly labeled source='estimated' in the response.
  return [1, 2, 3].map((i) => ({
    title: `${careerName} (Level ${i})`,
    company: 'Representative listing',
    location: 'Multiple locations',
    description: `Typical responsibilities involve ${(career.skills || []).slice(0, 5).join(', ')}.`,
    salary_min: null,
    salary_max: null,
    contract_type: 'full_time',
    source: 'estimated',
    url: null,
    career_category: careerName,
  }));
}

async function searchJobs({ what, where, page, resultsPerPage }) {
  let postings = null;
  let source = 'estimated';

  if (hasAdzunaCredentials()) {
    postings = await fetchFromAdzuna({ what, where, page, resultsPerPage });
    if (postings) source = 'adzuna';
  }

  if (!postings) {
    postings = await fallbackPostings(what);
  }

  if (postings.length) {
    await jobRepository.upsertPostings(postings);
  }

  return { source, jobs: postings };
}

async function cachedSearch({ category, location, limit, offset }) {
  return jobRepository.search({ category, location, limit, offset });
}

// Lightweight, read-only live-market snapshot for a single career title —
// used by marketSignalService to attach a live reference alongside
// recommendations. Unlike searchJobs(), this never writes to
// job_postings (it's a small aggregate for display, not a job-board
// listing) and never returns full posting bodies — just a count and a
// salary range observed in the live sample, so it stays cheap to compute
// and cheap to show. Falls back to an honest "unavailable" result (never
// a fabricated number) when Adzuna isn't configured or the call fails.
async function liveMarketSnapshot({ what, where }) {
  if (!hasAdzunaCredentials()) {
    return { source: 'unavailable', postings_sample_count: 0, salary_min: null, salary_max: null };
  }
  const postings = await fetchFromAdzuna({ what, where, page: 1, resultsPerPage: 20 });
  if (!postings) {
    return { source: 'unavailable', postings_sample_count: 0, salary_min: null, salary_max: null };
  }
  const salaries = postings
    .flatMap((p) => [p.salary_min, p.salary_max])
    .filter((v) => typeof v === 'number' && v > 0);
  return {
    source: 'adzuna',
    postings_sample_count: postings.length,
    salary_min: salaries.length ? Math.min(...salaries) : null,
    salary_max: salaries.length ? Math.max(...salaries) : null,
  };
}

module.exports = { searchJobs, cachedSearch, hasAdzunaCredentials, liveMarketSnapshot };
