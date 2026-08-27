import { body, param } from 'express-validator';

export const departmentIdParamValidator = [
  param('id').isMongoId().withMessage('Invalid department id'),
];

export const createDepartmentValidator = [
  body('name').trim().notEmpty().withMessage('name is required').isLength({ max: 100 }),
  body('hodName').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('collegeId').optional().isMongoId().withMessage('Invalid college id'),
];

export const updateDepartmentValidator = [
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('hodName').optional({ nullable: true }).trim().isLength({ max: 100 }),
];
