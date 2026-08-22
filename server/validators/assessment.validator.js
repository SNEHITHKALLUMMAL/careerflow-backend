import { body } from 'express-validator';
import { ASSESSMENT_TYPES } from '../models/Assessment.model.js';

const questionValidator = body('questions')
  .isArray({ min: 0 })
  .withMessage('questions must be an array');

export const createAssessmentValidator = [
  body('title').trim().notEmpty().withMessage('title is required').isLength({ max: 200 }),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }),
  body('type')
    .isIn(ASSESSMENT_TYPES)
    .withMessage(`type must be one of: ${ASSESSMENT_TYPES.join(', ')}`),
  body('durationMinutes')
    .isInt({ min: 1, max: 600 })
    .withMessage('durationMinutes must be between 1 and 600')
    .toInt(),
  body('passingScore')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('passingScore must be 0-100')
    .toInt(),
  questionValidator,
  body('questions.*.questionText')
    .if(questionValidator)
    .trim()
    .notEmpty()
    .withMessage('Each question needs questionText'),
  body('questions.*.marks')
    .if(questionValidator)
    .isInt({ min: 1 })
    .withMessage('Each question needs marks >= 1')
    .toInt(),
];

export const updateAssessmentValidator = [
  body('title').optional().trim().notEmpty().isLength({ max: 200 }),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }),
  body('durationMinutes').optional().isInt({ min: 1, max: 600 }).toInt(),
  body('passingScore').optional().isInt({ min: 0, max: 100 }).toInt(),
  body('questions').optional().isArray(),
];

export const submitAttemptValidator = [
  body('answers').isArray({ min: 1 }).withMessage('answers must be a non-empty array'),
  body('answers.*.questionId').isMongoId().withMessage('Each answer needs a valid questionId'),
  body('answers.*.response').optional({ values: 'falsy' }).isString(),
];

export const gradeAttemptValidator = [
  body('answers').isArray({ min: 1 }).withMessage('answers must be a non-empty array'),
  body('answers.*.questionId')
    .isMongoId()
    .withMessage('Each graded answer needs a valid questionId'),
  body('answers.*.marksAwarded').isFloat({ min: 0 }).withMessage('marksAwarded must be >= 0'),
];
