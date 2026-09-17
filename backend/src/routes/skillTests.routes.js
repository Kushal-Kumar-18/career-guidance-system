const { Router } = require('express');
const controller = require('../controllers/skillTests.controller');
const { requireAuth } = require('../middleware/auth');
const { limiters } = require('../middleware/rateLimit');

const router = Router();
router.use(requireAuth);

// Generation/submission are bucketed per authenticated user — a verified
// skill affects recommendations, so repeated rapid attempts shouldn't be
// free.
router.post('/', limiters.skillTests, controller.generate);
router.post('/:id/submit', limiters.skillTests, controller.submit);
router.get('/results', controller.results);
// Skills available to test, sourced from the caller's profile row.
router.get('/skills', controller.profileSkills);

module.exports = router;
