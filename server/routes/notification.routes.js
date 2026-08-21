import { Router } from 'express';
import { param } from 'express-validator';
import * as notificationController from '../controllers/notification.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { sendNotificationValidator } from '../validators/placement.validator.js';

const NOTIFICATION_SENDER_ROLES = ['mentor', 'placementOfficer', 'collegeAdmin', 'superAdmin'];

const router = Router();

router.use(authenticate);

router.get('/me', notificationController.listMine);
router.patch('/me/read-all', notificationController.markAllRead);
router.patch('/:id/read', [param('id').isMongoId()], validate, notificationController.markRead);

// Sending notifications is a placement/mentor/admin capability, not a student one.
router.post(
  '/',
  authorize(...NOTIFICATION_SENDER_ROLES),
  sendNotificationValidator,
  validate,
  notificationController.send
);

export default router;
