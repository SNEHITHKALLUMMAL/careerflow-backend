import { Router } from 'express';
import { param, query } from 'express-validator';
import * as internshipController from '../controllers/internship.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import {
  createInternshipValidator,
  updateInternshipValidator,
  changeStatusValidator,
} from '../validators/internship.validator.js';

const router = Router();
const idParam = [param('id').isMongoId().withMessage('Invalid internship id')];

router.use(authenticate);

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validate,
  internshipController.list
);

router.post(
  '/',
  authorize('recruiter'),
  createInternshipValidator,
  validate,
  internshipController.create
);

router.get('/me/bookmarked', authorize('student'), internshipController.listBookmarked);

router.get('/:id', idParam, validate, internshipController.getOne);
router.patch(
  '/:id',
  authorize('recruiter'),
  idParam,
  updateInternshipValidator,
  validate,
  internshipController.update
);
router.patch(
  '/:id/status',
  authorize('recruiter'),
  idParam,
  changeStatusValidator,
  validate,
  internshipController.changeStatus
);

router.post('/:id/apply', authorize('student'), idParam, validate, internshipController.apply);
router.post(
  '/:id/bookmark',
  authorize('student'),
  idParam,
  validate,
  internshipController.bookmark
);
router.delete(
  '/:id/bookmark',
  authorize('student'),
  idParam,
  validate,
  internshipController.unbookmark
);

router.get(
  '/:id/applicants',
  authorize('recruiter'),
  idParam,
  validate,
  internshipController.listApplicants
);

export default router;
