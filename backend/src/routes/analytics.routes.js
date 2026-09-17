const { Router } = require('express');
const controller = require('../controllers/analytics.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = Router();
router.use(requireAuth);

router.get('/dashboard', controller.dashboard);
router.get('/admin/overview', requireAdmin, controller.adminOverview);
router.get('/admin/users', requireAdmin, controller.adminListUsers);
router.delete('/admin/users/:id', requireAdmin, controller.adminDeleteUser);

module.exports = router;
