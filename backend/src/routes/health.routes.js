const { Router } = require('express');
const { getHealth } = require('../controllers/health.controller');

const router = Router();

// GET /api/health — liveness + dependency check (DB, ML service)
router.get('/', getHealth);

module.exports = router;
