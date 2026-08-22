import { Router } from 'express';
import * as taskController from '../controllers/studentTask.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import {
  createTaskValidator,
  taskIdParamValidator,
  updateTaskValidator,
} from '../validators/studentTask.validator.js';

const router = Router();

router.use(authenticate);

// Mentor, recruiter, and superAdmin can assign tasks — each scoped to their
// own students (see studentTask.service.js#assertCanAssign).
router.post(
  '/',
  authorize('mentor', 'recruiter', 'superAdmin'),
  createTaskValidator,
  validate,
  taskController.create
);

router.get('/mine', authorize('student'), taskController.listMine);

router.get('/created', authorize('mentor', 'recruiter', 'superAdmin'), taskController.listCreated);

router.patch(
  '/:id/complete',
  authorize('student'),
  taskIdParamValidator,
  validate,
  taskController.complete
);

router.patch(
  '/:id',
  authorize('mentor', 'recruiter', 'superAdmin'),
  updateTaskValidator,
  validate,
  taskController.update
);

router.delete(
  '/:id',
  authorize('mentor', 'recruiter', 'superAdmin'),
  taskIdParamValidator,
  validate,
  taskController.cancel
);

export default router;
