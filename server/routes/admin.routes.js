import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as adminController from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { ACTIVITY_TYPES } from '../models/ActivityLog.model.js';

const router = Router();

router.use(authenticate, authorize('superAdmin'));

router.get('/stats', adminController.stats);

router.get(
  '/activity',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('type').optional().isIn(ACTIVITY_TYPES).withMessage('Invalid activity type'),
    query('collegeId').optional().isMongoId().withMessage('Invalid college id'),
    query('sort').optional().isIn(['asc', 'desc']).withMessage('sort must be asc or desc'),
  ],
  validate,
  adminController.activity
);

router.get(
  '/users',
  [
    query('role').optional().isIn(['student', 'recruiter', 'mentor', 'placementOfficer', 'collegeAdmin', 'superAdmin']),
    query('search').optional().trim().isLength({ max: 100 }),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validate,
  adminController.listUsers
);

router.patch(
  '/users/:id/status',
  [param('id').isMongoId().withMessage('Invalid user id'), body('isActive').isBoolean().withMessage('isActive must be a boolean')],
  validate,
  adminController.setUserActive
);

router.patch(
  '/users/:id/role',
  [
    param('id').isMongoId().withMessage('Invalid user id'),
    body('role')
      .isIn(['student', 'recruiter', 'mentor', 'placementOfficer', 'collegeAdmin', 'superAdmin'])
      .withMessage('Invalid role'),
    body('collegeId').optional({ nullable: true }).isMongoId().withMessage('Invalid college id'),
  ],
  validate,
  adminController.changeRole
);

export default router;
