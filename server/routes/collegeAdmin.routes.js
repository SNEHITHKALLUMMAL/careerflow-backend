import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as collegeAdminController from '../controllers/collegeAdmin.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// This module is the college-scoped equivalent of /admin — deliberately
// collegeAdmin-only. superAdmin already has the unscoped platform-wide
// version under /admin; giving superAdmin this route too would just be a
// weaker duplicate of what they already have.
router.use(authenticate, authorize('collegeAdmin'));

router.get('/overview', collegeAdminController.overview);

router.get(
  '/users',
  [
    query('role').optional().isIn(['student', 'mentor', 'placementOfficer']),
    query('search').optional().trim().isLength({ max: 100 }),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validate,
  collegeAdminController.listUsers
);

router.patch(
  '/users/:id/status',
  [
    param('id').isMongoId().withMessage('Invalid user id'),
    body('isActive').isBoolean().withMessage('isActive must be a boolean'),
  ],
  validate,
  collegeAdminController.setUserActive
);

export default router;
