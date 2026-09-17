const axios = require('axios');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const client = axios.create({ baseURL: env.mlServiceUrl, timeout: env.mlServiceTimeoutMs });

async function callMl(method, path, data) {
  try {
    const res = await client.request({ method, url: path, data });
    return res.data;
  } catch (err) {
    if (err.response) {
      throw new ApiError(502, `ML service error: ${err.response.data?.detail || err.response.statusText}`);
    }
    throw new ApiError(503, 'ML service is unreachable.');
  }
}

async function predefinedSkills() {
  const res = await callMl('get', '/skills/predefined');
  return res.data;
}

async function extractSkills(text) {
  const res = await callMl('post', '/extract-skills', { text });
  return res.data.extracted_skills;
}

async function normalizeSkills(skills) {
  const res = await callMl('post', '/normalize-skills', { skills });
  return res.data;
}

async function skillGap(careerName, profile, verifiedSkills) {
  const res = await callMl('post', '/skill-gap', {
    career_name: careerName,
    user_profile: profile,
    verified_skills: verifiedSkills,
  });
  return res.data;
}

module.exports = { predefinedSkills, extractSkills, normalizeSkills, skillGap };
