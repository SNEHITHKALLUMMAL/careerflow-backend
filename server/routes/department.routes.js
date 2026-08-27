import { Router } from 'express';
import { query } from 'express-validator';
import * as departmentController from '../controllers/department.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import {
  departmentIdParamValidator,
  createDepartmentValidator,
  updateDepartmentValidator,
} from '../validators/department.validator.js';

const router = Router();

router.use(authenticate);

// Placement officers and college admins get their own college's departments
// implicitly; superAdmin may pass ?collegeId= to scope to one, or omit it for
// every department.
router.get(
  '/',
  authorize('placementOfficer', 'collegeAdmin', 'superAdmin'),
  [query('collegeId').optional().isMongoId().withMessage('Invalid college id')],
  validate,
  departmentController.list
);

// Creating/editing/deleting departments is a college-admin capability (or superAdmin).
router.post(
  '/',
  authorize('collegeAdmin', 'superAdmin'),
  createDepartmentValidator,
  validate,
  departmentController.create
);

router.patch(
  '/:id',
  authorize('collegeAdmin', 'superAdmin'),
  departmentIdParamValidator,
  updateDepartmentValidator,
  validate,
  departmentController.update
);

router.delete(
  '/:id',
  authorize('collegeAdmin', 'superAdmin'),
  departmentIdParamValidator,
  validate,
  departmentController.remove
);

export default router;
