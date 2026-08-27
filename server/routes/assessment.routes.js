import { Router } from 'express';
import { param, query } from 'express-validator';
import * as assessmentController from '../controllers/assessment.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { ASSESSMENT_CREATOR_ROLES } from '../models/Assessment.model.js';
import {
  createAssessmentValidator,
  updateAssessmentValidator,
  submitAttemptValidator,
  gradeAttemptValidator,
} from '../validators/assessment.validator.js';

const router = Router();
const idParam = [param('id').isMongoId().withMessage('Invalid assessment id')];

router.use(authenticate);

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validate,
  assessmentController.list
);

router.post(
  '/',
  authorize(...ASSESSMENT_CREATOR_ROLES),
  createAssessmentValidator,
  validate,
  assessmentController.create
);

router.get('/me/attempts', authorize('student'), assessmentController.myAttempts);

router.get('/:id', idParam, validate, assessmentController.getOne);

router.patch(
  '/:id',
  authorize(...ASSESSMENT_CREATOR_ROLES),
  idParam,
  updateAssessmentValidator,
  validate,
  assessmentController.update
);

router.patch(
  '/:id/publish',
  authorize(...ASSESSMENT_CREATOR_ROLES),
  idParam,
  validate,
  assessmentController.publish
);

router.post(
  '/:id/attempt/start',
  authorize('student'),
  idParam,
  validate,
  assessmentController.startAttempt
);

router.post(
  '/:id/attempt/submit',
  authorize('student'),
  idParam,
  submitAttemptValidator,
  validate,
  assessmentController.submitAttempt
);

router.patch(
  '/:id/attempts/:attemptId/grade',
  authorize(...ASSESSMENT_CREATOR_ROLES),
  [...idParam, param('attemptId').isMongoId()],
  gradeAttemptValidator,
  validate,
  assessmentController.gradeAttempt
);

router.get(
  '/:id/attempts',
  authorize(...ASSESSMENT_CREATOR_ROLES),
  idParam,
  [query('pendingOnly').optional().isBoolean()],
  validate,
  assessmentController.listAttempts
);

router.get('/:id/leaderboard', idParam, validate, assessmentController.leaderboard);

router.get(
  '/:id/result/:studentId',
  [...idParam, param('studentId').isMongoId()],
  validate,
  assessmentController.result
);

export default router;
