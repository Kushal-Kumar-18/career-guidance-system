const { Router } = require('express');
const controller = require('../controllers/skills.controller');
const { requireAuth } = require('../middleware/auth');
const { limiters } = require('../middleware/rateLimit');

const router = Router();

router.get('/predefined', controller.predefined);
// Extraction/normalization do real text processing per call, so they're
// bucketed separately from cheap reads.
router.post('/extract', requireAuth, limiters.skillExtraction, controller.extract);
router.post('/normalize', limiters.skillExtraction, controller.normalize);
router.get('/gap', requireAuth, controller.gap);

module.exports = router;
