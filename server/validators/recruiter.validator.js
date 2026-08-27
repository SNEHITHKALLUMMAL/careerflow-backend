import { body } from 'express-validator';

export const updateRecruiterValidator = [
  body('companyName').optional().trim().notEmpty().isLength({ max: 150 }),
  body('companyLogoUrl').optional({ values: 'falsy' }).isURL(),
  body('companyWebsite').optional({ values: 'falsy' }).isURL(),
  body('industry').optional({ values: 'falsy' }).trim().isLength({ max: 100 }),
];
