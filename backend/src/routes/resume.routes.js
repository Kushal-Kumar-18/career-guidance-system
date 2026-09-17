const { Router } = require('express');
const controller = require('../controllers/resume.controller');
const { requireAuth } = require('../middleware/auth');
const { resumeUpload } = require('../middleware/upload');
const { limiters } = require('../middleware/rateLimit');

const router = Router();
// Every resume route requires a valid token. Ownership is then enforced
// per-route by scoping all reads/writes to req.user.id (never a
// client-supplied id) — see services/resumeService.js.
router.use(requireAuth);

router.get('/', controller.getMine);
router.put('/', controller.update);
router.get('/preview', controller.preview);
router.post('/generate', limiters.resumeGenerate, controller.generate);
// Authenticated, ownership-scoped download of the caller's own generated
// PDF. Replaces the removed public /files static mount.
router.get('/download', controller.download);
// Source B of the candidate-profile pipeline — see resume.controller.js.
router.post(
  '/upload',
  limiters.resumeUpload,
  resumeUpload.single('resume'),
  controller.uploadAndExtract
);

module.exports = router;
