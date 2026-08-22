import { Router } from 'express';
import * as mentorController from '../controllers/mentor.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import {
  mentorIdParamValidator,
  assignStudentsValidator,
  unassignStudentValidator,
  bulkAutoAssignValidator,
} from '../validators/mentor.validator.js';

const router = Router();

router.use(authenticate);

// Listing mentors and assigning/unassigning students is a placement/admin capability.
router.get('/', authorize('placementOfficer', 'superAdmin'), mentorController.listMentors);

// A mentor's own roster is readable by that mentor as well as placement/admin
// (the controller enforces a mentor can only ever request their own id).
router.get(
  '/:id/students',
  authorize('mentor', 'placementOfficer', 'superAdmin'),
  mentorIdParamValidator,
  validate,
  mentorController.getMentorStudents
);

router.post(
  '/:mentorId/assign',
  authorize('placementOfficer', 'superAdmin'),
  assignStudentsValidator,
  validate,
  mentorController.assignStudents
);

router.post(
  '/bulk-assign',
  authorize('placementOfficer', 'superAdmin'),
  bulkAutoAssignValidator,
  validate,
  mentorController.bulkAutoAssign
);

router.delete(
  '/:mentorId/students/:studentId',
  authorize('placementOfficer', 'superAdmin'),
  unassignStudentValidator,
  validate,
  mentorController.unassignStudent
);

export default router;
