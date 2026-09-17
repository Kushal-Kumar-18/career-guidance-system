const { Router } = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const profileRoutes = require('./profile.routes');
const careersRoutes = require('./careers.routes');
const recommendationsRoutes = require('./recommendations.routes');
const skillsRoutes = require('./skills.routes');
const skillTestsRoutes = require('./skillTests.routes');
const roadmapsRoutes = require('./roadmaps.routes');
const resumeRoutes = require('./resume.routes');
const atsRoutes = require('./ats.routes');
const jobsRoutes = require('./jobs.routes');
const trendsRoutes = require('./trends.routes');
const gameRoutes = require('./game.routes');
const analyticsRoutes = require('./analytics.routes');

const router = Router();

// Full REST surface from architecture doc section 8 — every domain is
// backed by a real controller/service/repository (no placeholders).
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/careers', careersRoutes);
router.use('/recommendations', recommendationsRoutes);
router.use('/skills', skillsRoutes);
router.use('/skill-tests', skillTestsRoutes);
router.use('/roadmaps', roadmapsRoutes);
router.use('/resume', resumeRoutes);
router.use('/ats', atsRoutes);
router.use('/jobs', jobsRoutes);
router.use('/trends', trendsRoutes);
router.use('/game', gameRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;
