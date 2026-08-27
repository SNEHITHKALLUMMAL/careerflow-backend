import { body, param } from 'express-validator';

export const collegeIdParamValidator = [param('id').isMongoId().withMessage('Invalid college id')];

export const requestCollegeValidator = [
  body('name').trim().notEmpty().withMessage('name is required').isLength({ max: 200 }),
  body('domainEmailSuffix').optional({ nullable: true }).trim().isLength({ max: 50 }),
  body('address').optional({ nullable: true }).trim().isLength({ max: 300 }),
  body('city').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('state').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('requesterName').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('requesterEmail').optional({ nullable: true }).trim().isEmail().withMessage('Invalid email'),
];
