const { Router } = require('express');
const controller = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');
const { limiters } = require('../middleware/rateLimit');

const router = Router();

// Credential endpoints get the tightest bucket in the app — this is the
// realistic brute-force / credential-stuffing surface. Keyed by client
// IP for anonymous requests (see middleware/rateLimit.js).
router.post('/register', limiters.auth, controller.register);
router.post('/login', limiters.auth, controller.login);
router.post('/logout', requireAuth, controller.logout);
router.get('/me', requireAuth, controller.me);

module.exports = router;
