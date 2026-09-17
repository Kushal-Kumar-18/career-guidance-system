const { Router } = require('express');
const controller = require('../controllers/trends.controller');
const { limiters } = require('../middleware/rateLimit');

const router = Router();

// Each of these aggregates over cached postings, so they're more
// expensive than a plain lookup.
router.get('/skill-demand', limiters.trends, controller.skillDemand);
router.get('/emerging-skills', limiters.trends, controller.emergingSkills);
router.get('/market-insights', limiters.trends, controller.market);

module.exports = router;
