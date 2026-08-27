import { body } from 'express-validator';
import { LISTING_STATUSES } from '../models/Job.model.js';

const eligibilityValidators = [
  body('eligibility.minCgpa').optional({ values: 'falsy' }).isFloat({ min: 0, max: 10 }),
  body('eligibility.allowedDepartments').optional().isArray(),
  body('eligibility.allowedDepartments.*').optional().isString().trim(),
  body('eligibility.graduationYear').optional({ values: 'falsy' }).isInt({ min: 1950, max: 2100 }),
];

export const createInternshipValidator = [
  body('title').trim().notEmpty().withMessage('title is required').isLength({ max: 200 }),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('description is required')
    .isLength({ max: 5000 }),
  body('requiredSkills').optional().isArray(),
  body('requiredSkills.*').optional().isString().trim(),
  body('location').optional({ values: 'falsy' }).trim().isLength({ max: 150 }),
  body('isRemote').optional().isBoolean().toBoolean(),
  body('durationMonths').optional({ values: 'falsy' }).isInt({ min: 1, max: 24 }),
  body('stipend').optional({ values: 'falsy' }).isFloat({ min: 0 }),
  ...eligibilityValidators,
  body('applicationDeadline').optional({ values: 'falsy' }).isISO8601().toDate(),
];

export const updateInternshipValidator = [
  body('title').optional().trim().notEmpty().isLength({ max: 200 }),
  body('description').optional().trim().notEmpty().isLength({ max: 5000 }),
  body('requiredSkills').optional().isArray(),
  body('location').optional({ values: 'falsy' }).trim().isLength({ max: 150 }),
  body('isRemote').optional().isBoolean().toBoolean(),
  body('durationMonths').optional({ values: 'falsy' }).isInt({ min: 1, max: 24 }),
  body('stipend').optional({ values: 'falsy' }).isFloat({ min: 0 }),
  ...eligibilityValidators,
  body('applicationDeadline').optional({ values: 'falsy' }).isISO8601().toDate(),
];

export const changeStatusValidator = [
  body('status')
    .isIn(LISTING_STATUSES)
    .withMessage(`status must be one of: ${LISTING_STATUSES.join(', ')}`),
];
