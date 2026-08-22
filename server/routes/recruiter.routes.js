import { Router } from 'express';
import { param } from 'express-validator';
import * as recruiterController from '../controllers/recruiter.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { updateRecruiterValidator } from '../validators/recruiter.validator.js';

const router = Router();

router.use(authenticate);

router.get('/me', authorize('recruiter'), recruiterController.getMe);
router.patch(
  '/me',
  authorize('recruiter'),
  updateRecruiterValidator,
  validate,
  recruiterController.updateMe
);

router.patch(
  '/:id/verify',
  authorize('superAdmin'),
  [param('id').isMongoId().withMessage('Invalid recruiter id')],
  validate,
  recruiterController.verify
);

export default router;
