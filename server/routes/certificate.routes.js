import { Router } from 'express';
import { param } from 'express-validator';
import * as certificateController from '../controllers/certificate.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(authenticate, authorize('student'));

router.get('/me', certificateController.listMine);
router.get(
  '/:id/download',
  [param('id').isMongoId().withMessage('Invalid certificate id')],
  validate,
  certificateController.download
);

export default router;
