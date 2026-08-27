import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import {
  registerValidator,
  verifyEmailValidator,
  resendOtpValidator,
  loginValidator,
  googleValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from '../validators/auth.validator.js';

const router = Router();

router.post('/register', authLimiter, registerValidator, validate, authController.register);
router.post(
  '/verify-email',
  authLimiter,
  verifyEmailValidator,
  validate,
  authController.verifyEmail
);
router.post('/resend-otp', authLimiter, resendOtpValidator, validate, authController.resendOtp);
router.post('/login', authLimiter, loginValidator, validate, authController.login);
router.post('/google', authLimiter, googleValidator, validate, authController.googleAuth);
router.post('/refresh-token', authLimiter, authController.refresh);
router.post('/logout', authLimiter, authController.logout);
router.post(
  '/forgot-password',
  authLimiter,
  forgotPasswordValidator,
  validate,
  authController.forgotPassword
);
router.post(
  '/reset-password',
  authLimiter,
  resetPasswordValidator,
  validate,
  authController.resetPassword
);
router.get('/me', authenticate, authController.me);

export default router;
