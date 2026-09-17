const analyticsService = require('../services/analyticsService');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/apiResponse');

const dashboard = asyncHandler(async (req, res) => {
  const data = await analyticsService.dashboard(req.user.id);
  ok(res, data);
});

const adminOverview = asyncHandler(async (req, res) => {
  const data = await analyticsService.adminOverview();
  ok(res, data);
});

const adminListUsers = asyncHandler(async (req, res) => {
  const data = await analyticsService.listUsers();
  ok(res, data);
});

const adminDeleteUser = asyncHandler(async (req, res) => {
  const data = await analyticsService.deleteUser(req.user.id, req.params.id);
  ok(res, data);
});

module.exports = { dashboard, adminOverview, adminListUsers, adminDeleteUser };
