import { Router } from 'express';
import { param } from 'express-validator';
import * as applicationController from '../controllers/application.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import {
  updateStatusValidator,
  scheduleInterviewValidator,
  issueOfferLetterValidator,
} from '../validators/application.validator.js';

const router = Router();
const idParam = [param('id').isMongoId().withMessage('Invalid application id')];

router.use(authenticate);

router.get('/me', authorize('student'), applicationController.listMine);
router.patch(
  '/:id/withdraw',
  authorize('student'),
  idParam,
  validate,
  applicationController.withdraw
);

router.patch(
  '/:id/status',
  authorize('recruiter'),
  idParam,
  updateStatusValidator,
  validate,
  applicationController.updateStatus
);

router.post(
  '/:id/schedule-interview',
  authorize('recruiter'),
  idParam,
  scheduleInterviewValidator,
  validate,
  applicationController.scheduleInterview
);

router.post(
  '/:id/offer-letter',
  authorize('recruiter'),
  idParam,
  issueOfferLetterValidator,
  validate,
  applicationController.issueOfferLetter
);

export default router;
