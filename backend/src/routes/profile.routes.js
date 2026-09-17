const { Router } = require('express');
const controller = require('../controllers/profile.controller');
const { requireAuth } = require('../middleware/auth');

const router = Router();
router.use(requireAuth);

router.get('/', controller.getMyProfile);
router.put('/', controller.updateMyProfile);
// Persists a reviewed resume extraction into the caller's own profile.
// Additive: the existing GET/PUT contracts are unchanged.
router.post('/apply-resume', controller.applyResumeToProfile);

module.exports = router;
