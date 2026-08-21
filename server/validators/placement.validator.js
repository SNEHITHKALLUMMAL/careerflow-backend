import { body } from 'express-validator';
import { DRIVE_STATUSES } from '../models/Drive.model.js';

export const sendNotificationValidator = [
  body('userIds').optional().isArray(),
  body('userIds.*').optional().isMongoId(),
  body('collegeId').optional().isMongoId(),
  body('title').trim().notEmpty().withMessage('title is required').isLength({ max: 150 }),
  body('message').trim().notEmpty().withMessage('message is required').isLength({ max: 1000 }),
  body('link').optional({ values: 'falsy' }).isURL(),
];

export const createDriveValidator = [
  body('jobId').isMongoId().withMessage('A valid jobId is required'),
  body('driveDate').isISO8601().withMessage('driveDate must be a valid date').toDate(),
  body('notes').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }),
  body('collegeId').optional().isMongoId(),
];

export const updateDriveStatusValidator = [
  body('status')
    .isIn(DRIVE_STATUSES)
    .withMessage(`status must be one of: ${DRIVE_STATUSES.join(', ')}`),
];
