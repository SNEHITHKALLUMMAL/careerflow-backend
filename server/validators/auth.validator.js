import { body } from 'express-validator';
import { SELF_REGISTERABLE_ROLES } from '../models/User.model.js';

const emailField = body('email')
  .trim()
  .isEmail()
  .withMessage('A valid email is required')
  .normalizeEmail();

const passwordField = (field = 'password') =>
  body(field)
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain at least one letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number');

const otpField = body('otp')
  .trim()
  .isLength({ min: 6, max: 6 })
  .withMessage('Code must be 6 digits')
  .isNumeric()
  .withMessage('Code must be numeric');

export const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  emailField,
  passwordField(),
  body('role')
    .trim()
    .isIn(SELF_REGISTERABLE_ROLES)
    .withMessage(`Role must be one of: ${SELF_REGISTERABLE_ROLES.join(', ')}`),
  body('collegeId').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid college id'),
];

export const verifyEmailValidator = [emailField, otpField];

export const resendOtpValidator = [
  emailField,
  body('purpose')
    .trim()
    .isIn(['verify_email', 'reset_password'])
    .withMessage('purpose must be verify_email or reset_password'),
];

export const loginValidator = [
  emailField,
  body('password').notEmpty().withMessage('Password is required'),
];

export const googleValidator = [
  body('idToken').notEmpty().withMessage('idToken is required'),
  body('role').optional().isIn(SELF_REGISTERABLE_ROLES),
];

export const forgotPasswordValidator = [emailField];

export const resetPasswordValidator = [emailField, otpField, passwordField('newPassword')];
