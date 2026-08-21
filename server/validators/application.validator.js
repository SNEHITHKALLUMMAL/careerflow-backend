import { body, param } from 'express-validator';
import { APPLICATION_STATUSES } from '../models/Application.model.js';

export const targetTypeParamValidator = [
  param('targetType')
    .isIn(['job', 'internship'])
    .withMessage('targetType must be job or internship'),
  param('targetId').isMongoId().withMessage('Invalid target id'),
];

export const updateStatusValidator = [
  body('status')
    .isIn(APPLICATION_STATUSES)
    .withMessage(`status must be one of: ${APPLICATION_STATUSES.join(', ')}`),
];

export const scheduleInterviewValidator = [
  body('scheduledAt').isISO8601().withMessage('scheduledAt must be a valid date').toDate(),
  body('mode')
    .isIn(['online', 'in-person', 'phone'])
    .withMessage('mode must be online, in-person, or phone'),
  body('link').optional({ values: 'falsy' }).isURL().withMessage('link must be a valid URL'),
  body('notes').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }),
];

export const issueOfferLetterValidator = [
  body('position').trim().notEmpty().withMessage('position is required').isLength({ max: 150 }),
  body('salary').optional({ values: 'falsy' }).trim().isLength({ max: 100 }),
  body('startDate').isISO8601().withMessage('startDate must be a valid date').toDate(),
];
