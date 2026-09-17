const jobService = require('../services/jobService');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/apiResponse');
const ApiError = require('../utils/ApiError');

const search = asyncHandler(async (req, res) => {
  const { what, where, page, results_per_page } = req.query;
  if (!what) throw new ApiError(422, 'Query param "what" (career/keyword) is required.');
  const result = await jobService.searchJobs({
    what,
    where,
    page: page ? parseInt(page, 10) : 1,
    resultsPerPage: results_per_page ? parseInt(results_per_page, 10) : 20,
  });
  ok(res, result);
});

const listCached = asyncHandler(async (req, res) => {
  const { category, location, limit, offset } = req.query;
  const data = await jobService.cachedSearch({
    category,
    location,
    limit: limit ? parseInt(limit, 10) : 20,
    offset: offset ? parseInt(offset, 10) : 0,
  });
  ok(res, data);
});

module.exports = { search, listCached };
