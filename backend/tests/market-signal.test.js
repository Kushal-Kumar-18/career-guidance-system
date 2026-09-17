// No-network regression test for marketSignalService (Pass 10): verifies
// the honest "unavailable" fallback when Adzuna isn't reachable/
// configured, that only the top MAX_CAREERS_PER_REQUEST predictions get a
// live lookup, that ranking order is never touched, and that repeated
// calls for the same (career, location) are served from the in-process
// cache rather than re-invoking jobService every time.
//
// Run with: npm test

const assert = require('node:assert/strict');
const proxyquire = require('proxyquire').noPreserveCache();

function loadService(snapshotImpl) {
  let callCount = 0;
  const service = proxyquire('../src/services/marketSignalService', {
    './jobService': {
      liveMarketSnapshot: async (args) => {
        callCount += 1;
        return snapshotImpl(args);
      },
    },
  });
  return { service, getCallCount: () => callCount };
}

function makePredictions(n) {
  return Array.from({ length: n }, (_, i) => ({ career: `Career ${i}`, confidence: 100 - i }));
}

async function run() {
  // --- Honest fallback when the snapshot lookup reports unavailable ---
  {
    const { service } = loadService(async () => ({
      source: 'unavailable',
      postings_sample_count: 0,
      salary_min: null,
      salary_max: null,
    }));
    const [result] = await service.attachLiveOutlook([{ career: 'Data Scientist', confidence: 80 }], 'Bengaluru');
    assert.equal(result.live_market.source, 'unavailable');
    assert.match(result.live_market.note, /unavailable/i);
    assert.ok(result.live_market.queried_at, 'expected a queried_at timestamp even on fallback');
  }

  // --- A successful live snapshot is passed through, labeled 'adzuna' ---
  {
    const { service } = loadService(async () => ({
      source: 'adzuna',
      postings_sample_count: 12,
      salary_min: 600000,
      salary_max: 1800000,
    }));
    const [result] = await service.attachLiveOutlook([{ career: 'Data Scientist', confidence: 80 }], 'Bengaluru');
    assert.equal(result.live_market.source, 'adzuna');
    assert.equal(result.live_market.postings_sample_count, 12);
    assert.match(result.live_market.note, /Adzuna/);
  }

  // --- Only the top MAX_CAREERS_PER_REQUEST get a live lookup; ranking
  //     order and the untouched fields (confidence) are never altered ---
  {
    const { service, getCallCount } = loadService(async () => ({
      source: 'adzuna',
      postings_sample_count: 1,
      salary_min: null,
      salary_max: null,
    }));
    const predictions = makePredictions(8);
    const result = await service.attachLiveOutlook(predictions, 'Mumbai');
    assert.equal(result.length, 8, 'prediction count/order must be preserved');
    assert.deepEqual(
      result.map((r) => r.career),
      predictions.map((r) => r.career),
      'ranking order must never be altered by the market-signal layer'
    );
    const withLive = result.filter((r) => r.live_market !== null);
    const withoutLive = result.filter((r) => r.live_market === null);
    assert.equal(withLive.length, service.MAX_CAREERS_PER_REQUEST);
    assert.equal(withoutLive.length, 8 - service.MAX_CAREERS_PER_REQUEST);
    assert.equal(getCallCount(), service.MAX_CAREERS_PER_REQUEST, 'must not query beyond the top-K cutoff');
  }

  // --- Repeated lookups for the same (career, location) are cached, not
  //     re-fetched on every call ---
  {
    const { service, getCallCount } = loadService(async () => ({
      source: 'adzuna',
      postings_sample_count: 5,
      salary_min: null,
      salary_max: null,
    }));
    await service.attachLiveOutlook([{ career: 'Web Developer', confidence: 90 }], 'Pune');
    await service.attachLiveOutlook([{ career: 'Web Developer', confidence: 90 }], 'Pune');
    assert.equal(getCallCount(), 1, 'second call for the same career/location must be served from cache');
  }

  // --- A thrown error from the snapshot lookup degrades to 'unavailable'
  //     rather than propagating and breaking the recommendation request ---
  {
    const { service } = loadService(async () => {
      throw new Error('network unreachable');
    });
    const [result] = await service.attachLiveOutlook([{ career: 'Nurse', confidence: 40 }], 'Chennai');
    assert.equal(result.live_market.source, 'unavailable');
  }

  console.log('market-signal.test.js: all assertions passed');
}

module.exports = run;

if (require.main === module) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
