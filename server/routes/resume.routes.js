import { Router } from 'express';
import { param } from 'express-validator';
import * as resumeController from '../controllers/resume.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { buildResumeValidator, rebuildResumeValidator } from '../validators/resume.validator.js';

const router = Router();
const idParamValidator = [param('id').isMongoId().withMessage('Invalid resume id')];

router.use(authenticate, authorize('student'));

router.get('/history', resumeController.history);
router.post('/build', buildResumeValidator, validate, resumeController.build);
router.get('/:id', idParamValidator, validate, resumeController.getOne);
router.get('/:id/ats-score', idParamValidator, validate, resumeController.atsScore);
router.get('/:id/download', idParamValidator, validate, resumeController.download);
router.post(
  '/:id/rebuild',
  idParamValidator,
  rebuildResumeValidator,
  validate,
  resumeController.rebuild
);

export default router;
