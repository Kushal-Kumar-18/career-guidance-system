const { Router } = require('express');
const controller = require('../controllers/game.controller');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.get('/generate', controller.generate);
router.post('/play', requireAuth, controller.play);
router.get('/history', requireAuth, controller.history);

module.exports = router;
