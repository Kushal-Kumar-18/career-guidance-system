const jobService = require('./jobService');
const logger = require('../utils/logger');

// -----------------------------------------------------------------------
// Live market signal for recommendations.
//
// The ML service's `market_outlook` field (see
// ml-service/app/engine/market_context.py) is intentionally a STATIC,
// curated reference (job_growth/salary_range baked into the career
// dataset) — it deliberately never claims to be live, and it never
// touches the fit score, by design (see docs/AI_ML.md).
//
// This module adds a genuinely live counterpart, `live_market`, sourced
// from Adzuna at request time — but keeps the same separation: it is
// attached to already-ranked recommendations AFTER the ML service has
// produced them, purely as additional reference info shown alongside the
// fit score. It never re-ranks, never feeds back into fit_score, and is
// clearly labeled with its own source/timestamp so a person can tell
// "how well this career matches YOUR profile" (fit_score) apart from
// "what the job market looks like RIGHT NOW for this title" (live_market)
// apart from "the dataset's general reference note" (market_outlook).
// -----------------------------------------------------------------------

// Job-market conditions don't need per-request freshness, and Adzuna's
// free tier has real rate limits — so every (career, location) pair is
// cached in-process for this long before being re-queried live. This is
// a simple TTL cache, not a persistence layer; it resets on restart,
// which is fine since a stale cache miss just means one more live call.
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// Only the top few *already-ranked* careers get a live lookup per
// request — enough to be useful without hammering Adzuna's rate limit on
// every recommendation call, especially for larger top_k requests.
const MAX_CAREERS_PER_REQUEST = 5;

const cache = new Map(); // "career|location" -> { data, expiresAt }

function cacheKey(career, location) {
  return `${String(career).toLowerCase()}|${String(location || '').toLowerCase()}`;
}

async function liveOutlookFor(career, location) {
  const key = cacheKey(career, location);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  let data;
  try {
    data = await jobService.liveMarketSnapshot({ what: career, where: location });
  } catch (err) {
    // Never let a market-signal failure break a recommendation request —
    // fall back to an honest "unavailable" result instead of surfacing
    // an error or a stale/fabricated number.
    logger.warn('live market snapshot failed, marking unavailable', { career, message: err.message });
    data = { source: 'unavailable', postings_sample_count: 0, salary_min: null, salary_max: null };
  }

  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return data;
}

function describeSource(source) {
  if (source === 'adzuna') {
    return 'Live job-posting sample from Adzuna for this title/region, fetched at recommendation time.';
  }
  return 'Live market data unavailable for this request (Adzuna not configured, or the lookup failed) — only the curated reference data (market_outlook) applies here.';
}

// Attaches a `live_market` field to each prediction, scoped to the top
// MAX_CAREERS_PER_REQUEST results (predictions arrive already ranked by
// fit_score — this never changes their order). Predictions beyond that
// cutoff get `live_market: null` rather than a silently-skipped field, so
// the frontend can distinguish "not fetched for this one" from "fetched,
// unavailable".
async function attachLiveOutlook(predictions, location) {
  if (!Array.isArray(predictions) || predictions.length === 0) return predictions;

  const scoped = predictions.slice(0, MAX_CAREERS_PER_REQUEST);
  const rest = predictions.slice(MAX_CAREERS_PER_REQUEST);

  const withLive = await Promise.all(
    scoped.map(async (p) => {
      const live = await liveOutlookFor(p.career, location);
      return {
        ...p,
        live_market: {
          ...live,
          queried_at: new Date().toISOString(),
          note: describeSource(live.source),
        },
      };
    })
  );

  return [...withLive, ...rest.map((p) => ({ ...p, live_market: null }))];
}

module.exports = { attachLiveOutlook, MAX_CAREERS_PER_REQUEST };
