const { Router } = require('express');
const controller = require('../controllers/ats.controller');
const { requireAuth } = require('../middleware/auth');

const router = Router();
router.use(requireAuth);

router.post('/analyze', controller.analyze);

module.exports = router;
