const { Router } = require('express');
const controller = require('../controllers/roadmaps.controller');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.get('/:career', controller.forCareer);
router.get('/:career/personalized', requireAuth, controller.personalized);

module.exports = router;
