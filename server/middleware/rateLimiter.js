import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

/** General API-wide limiter — generous, just a backstop against abuse. */
export const apiLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

/** Stricter limiter for sensitive auth endpoints (login, OTP, password reset). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts. Please try again in 15 minutes.',
  },
});

/** Limiter for AI endpoints — each call costs real money against the Gemini API. */
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'You have hit the AI usage limit. Please try again in a few minutes.',
  },
});
