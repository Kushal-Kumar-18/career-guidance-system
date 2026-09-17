const { Router } = require('express');
const controller = require('../controllers/careers.controller');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = Router();

// Public browsing (section: Career Information / Career exploration)
router.get('/', optionalAuth, controller.list);
router.get('/compare', controller.compare);
router.get('/saved', requireAuth, controller.listSaved);
router.get('/:name', controller.detail);
router.get('/:name/roadmap', controller.roadmap);
router.get('/:name/myths-reality', controller.mythsReality);
router.get('/:name/investment', controller.investment);
router.get('/:name/weekly-plan', controller.weeklyPlan);
router.post('/:name/save', requireAuth, controller.saveCareer);
router.delete('/:name/save', requireAuth, controller.unsaveCareer);

module.exports = router;
