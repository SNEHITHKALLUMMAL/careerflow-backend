import { Router } from 'express';
import { query } from 'express-validator';
import * as collegeController from '../controllers/college.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { collegeIdParamValidator, requestCollegeValidator } from '../validators/college.validator.js';

const router = Router();

// Public — needed unauthenticated for the registration form's college picker.
// Only ever returns approved colleges (enforced in the service).
router.get(
  '/',
  [
    query('search').optional().trim().isLength({ max: 100 }),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validate,
  collegeController.list
);

// Public — most commonly used by someone registering who can't find their
// college yet, so this deliberately doesn't require authentication.
router.post('/request', requestCollegeValidator, validate, collegeController.request);

// superAdmin-only: review and approve/reject pending requests.
router.get('/pending', authenticate, authorize('superAdmin'), collegeController.listPending);
router.patch(
  '/:id/approve',
  authenticate,
  authorize('superAdmin'),
  collegeIdParamValidator,
  validate,
  collegeController.approve
);
router.patch(
  '/:id/reject',
  authenticate,
  authorize('superAdmin'),
  collegeIdParamValidator,
  validate,
  collegeController.reject
);

export default router;
