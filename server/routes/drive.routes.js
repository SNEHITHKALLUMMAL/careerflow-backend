import { Router } from 'express';
import { param } from 'express-validator';
import * as driveController from '../controllers/drive.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import {
  createDriveValidator,
  updateDriveStatusValidator,
} from '../validators/placement.validator.js';

const router = Router();
const idParam = [param('id').isMongoId().withMessage('Invalid drive id')];

router.use(authenticate, authorize('placementOfficer', 'collegeAdmin', 'superAdmin'));

router.get('/', driveController.list);
router.post('/', createDriveValidator, validate, driveController.create);
router.get('/:id', idParam, validate, driveController.getOne);
router.patch(
  '/:id/status',
  idParam,
  updateDriveStatusValidator,
  validate,
  driveController.updateStatus
);
router.get('/:id/eligible-students', idParam, validate, driveController.eligibleStudents);

export default router;
