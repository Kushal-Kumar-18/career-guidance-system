const healthService = require('../services/health.service');

async function getHealth(req, res, next) {
  try {
    const status = await healthService.getSystemHealth();
    const allOk = status.database === 'ok'; // ML service being down shouldn't fail liveness
    res.status(allOk ? 200 : 503).json({ success: allOk, data: status });
  } catch (err) {
    next(err);
  }
}

module.exports = { getHealth };
