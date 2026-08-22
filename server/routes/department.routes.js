import { Router } from 'express';
import { query } from 'express-validator';
import * as departmentController from '../controllers/department.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(authenticate);

// Placement officers get their own college's departments implicitly; superAdmin
// may pass ?collegeId= to scope to one, or omit it for every department.
router.get(
  '/',
  authorize('placementOfficer', 'superAdmin'),
  [query('collegeId').optional().isMongoId().withMessage('Invalid college id')],
  validate,
  departmentController.list
);

export default router;
