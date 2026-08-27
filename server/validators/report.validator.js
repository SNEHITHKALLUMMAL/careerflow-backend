import { body } from 'express-validator';
import { REPORT_SCOPES } from '../models/Report.model.js';

export const generateReportValidator = [
  body('scope')
    .isIn(REPORT_SCOPES)
    .withMessage(`scope must be one of: ${REPORT_SCOPES.join(', ')}`),
];
