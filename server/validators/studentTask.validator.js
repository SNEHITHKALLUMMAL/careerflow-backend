import { body, param } from 'express-validator';

export const createTaskValidator = [
  body('studentId').isMongoId().withMessage('Invalid student id'),
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Invalid due date'),
];

export const taskIdParamValidator = [param('id').isMongoId().withMessage('Invalid task id')];

export const updateTaskValidator = [
  param('id').isMongoId().withMessage('Invalid task id'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 150 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Invalid due date'),
];
