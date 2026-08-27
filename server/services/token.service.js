import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../config/env.js';

/** Signs a short-lived access token carrying the user's id and role. */
export function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiry,
  });
}

/** Signs a long-lived refresh token carrying only the user's id. */
export function signRefreshToken(user) {
  return jwt.sign({ sub: user._id.toString() }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiry,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

/** SHA-256 hash of a refresh token, so the raw token is never persisted in the DB. */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
