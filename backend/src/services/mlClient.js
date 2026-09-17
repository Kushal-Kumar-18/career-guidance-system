const axios = require('axios');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

// Single HTTP client for the Python ML microservice (section 14).
// Node never re-implements recommendation/scoring logic — it only
// forwards profile data here and shapes the response for the API.
const client = axios.create({
  baseURL: env.mlServiceUrl,
  timeout: env.mlServiceTimeoutMs,
});

async function call(method, path, body) {
  try {
    const res = await client.request({ method, url: path, data: body });
    return res.data;
  } catch (err) {
    if (err.response) {
      // ML service responded with an error status (e.g. 503 model unavailable)
      throw new ApiError(
        err.response.status === 503 ? 503 : 502,
        `ML service error: ${err.response.data?.detail || err.response.statusText}`
      );
    }
    logger.error('ML service unreachable', { path, message: err.message });
    throw new ApiError(503, 'ML service is unreachable. Please try again shortly.');
  }
}

module.exports = {
  health: () => call('get', '/health'),
  recommend: (payload) => call('post', '/recommend', payload),
  skillGap: (payload) => call('post', '/skill-gap', payload),
  listCareers: () => call('get', '/careers'),
  getCareer: (name) => call('get', `/careers/${encodeURIComponent(name)}`),
  extractSkills: (payload) => call('post', '/extract-skills', payload),
  normalizeSkills: (payload) => call('post', '/normalize-skills', payload),
  sendFeedback: (payload) => call('post', '/feedback', payload),
};
