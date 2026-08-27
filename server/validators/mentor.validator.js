import { body, param } from 'express-validator';

export const mentorIdParamValidator = [param('id').isMongoId().withMessage('Invalid mentor id')];

export const mentorIdRouteParamValidator = [
  param('mentorId').isMongoId().withMessage('Invalid mentor id'),
];

export const assignStudentsValidator = [
  param('mentorId').isMongoId().withMessage('Invalid mentor id'),
  body('studentIds').isArray({ min: 1 }).withMessage('studentIds must be a non-empty array'),
  body('studentIds.*').isMongoId().withMessage('Each studentId must be a valid id'),
];

export const bulkAutoAssignValidator = [
  body('mentorIds').isArray({ min: 1 }).withMessage('mentorIds must be a non-empty array'),
  body('mentorIds.*').isMongoId().withMessage('Each mentorId must be a valid id'),
  body('departmentId').optional({ nullable: true }).isMongoId().withMessage('Invalid department id'),
];

export const unassignStudentValidator = [
  param('mentorId').isMongoId().withMessage('Invalid mentor id'),
  param('studentId').isMongoId().withMessage('Invalid student id'),
];
