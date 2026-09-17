const { Router } = require('express');
const controller = require('../controllers/recommendations.controller');
const { requireAuth } = require('../middleware/auth');
const { limiters } = require('../middleware/rateLimit');

const router = Router();
router.use(requireAuth);

// Each call fans out to the ML service and (for the top results) to the
// live job API, so it's the most expensive authenticated endpoint here.
router.post('/', limiters.recommendations, controller.generate);
router.get('/history', controller.history);
// Feedback triggers a retrain in the ML service; it's also validated
// against the user's own recommendation history in
// services/recommendationService.submitFeedback.
router.post('/feedback', limiters.feedback, controller.feedback);

module.exports = router;
