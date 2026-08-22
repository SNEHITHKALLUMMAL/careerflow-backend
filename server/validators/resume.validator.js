import { body } from 'express-validator';
import { RESUME_TEMPLATES } from '../services/resumePdf.service.js';

export const buildResumeValidator = [
  body('template')
    .optional()
    .isIn(RESUME_TEMPLATES)
    .withMessage(`template must be one of: ${RESUME_TEMPLATES.join(', ')}`),
  body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 30 }),
];

export const rebuildResumeValidator = [
  body('template')
    .optional()
    .isIn(RESUME_TEMPLATES)
    .withMessage(`template must be one of: ${RESUME_TEMPLATES.join(', ')}`),
];
