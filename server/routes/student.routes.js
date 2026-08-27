import { Router } from 'express';
import * as studentController from '../controllers/student.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { uploadResumeFile, verifyFileSignature } from '../middleware/upload.js';
import { STUDENT_ARRAY_FIELDS } from '../models/Student.model.js';
import {
  updateProfileValidator,
  itemIdParamValidator,
  studentItemValidators,
} from '../validators/student.validator.js';

const router = Router();

// Every route in this file is a student acting on their own profile.
router.use(authenticate, authorize('student'));

router.get('/me', studentController.getMe);
router.patch('/me', updateProfileValidator, validate, studentController.updateMe);
router.get('/me/completion', studentController.getCompletion);
router.post('/me/resume', uploadResumeFile, verifyFileSignature, studentController.uploadResume);

for (const field of STUDENT_ARRAY_FIELDS) {
  const { create, update } = studentItemValidators[field];

  router.post(`/me/${field}`, create, validate, studentController.addItem(field));
  router.patch(
    `/me/${field}/:itemId`,
    itemIdParamValidator,
    update,
    validate,
    studentController.updateItem(field)
  );
  router.delete(
    `/me/${field}/:itemId`,
    itemIdParamValidator,
    validate,
    studentController.removeItem(field)
  );
}

export default router;
