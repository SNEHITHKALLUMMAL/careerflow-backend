import { Router } from 'express';
import { param, query } from 'express-validator';
import * as jobController from '../controllers/job.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import {
  createJobValidator,
  updateJobValidator,
  changeStatusValidator,
} from '../validators/job.validator.js';

const router = Router();
const idParam = [param('id').isMongoId().withMessage('Invalid job id')];

router.use(authenticate);

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validate,
  jobController.list
);

router.post('/', authorize('recruiter'), createJobValidator, validate, jobController.create);

router.get('/me/bookmarked', authorize('student'), jobController.listBookmarked);

router.get('/:id', idParam, validate, jobController.getOne);
router.patch(
  '/:id',
  authorize('recruiter'),
  idParam,
  updateJobValidator,
  validate,
  jobController.update
);
router.patch(
  '/:id/status',
  authorize('recruiter'),
  idParam,
  changeStatusValidator,
  validate,
  jobController.changeStatus
);

router.post('/:id/apply', authorize('student'), idParam, validate, jobController.apply);
router.post('/:id/bookmark', authorize('student'), idParam, validate, jobController.bookmark);
router.delete('/:id/bookmark', authorize('student'), idParam, validate, jobController.unbookmark);

router.get(
  '/:id/applicants',
  authorize('recruiter'),
  idParam,
  validate,
  jobController.listApplicants
);

export default router;
