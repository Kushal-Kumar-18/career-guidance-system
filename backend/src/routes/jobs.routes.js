const { Router } = require('express');
const controller = require('../controllers/jobs.controller');
const { limiters } = require('../middleware/rateLimit');

const router = Router();

// /search can reach the third-party Adzuna API, which has its own
// upstream quota — rate limited so one client can't burn it for everyone.
router.get('/search', limiters.jobs, controller.search);
router.get('/', limiters.jobs, controller.listCached);

module.exports = router;
