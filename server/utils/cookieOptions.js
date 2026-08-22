import { env } from '../config/env.js';
import { parseDurationMs } from './parseDurationMs.js';

export const REFRESH_COOKIE_NAME = 'refreshToken';

/** Cookie options for setting/clearing the refresh token cookie. */
export function getRefreshCookieOptions() {
  const isProd = env.nodeEnv === 'production';
  return {
    httpOnly: true,
    secure: isProd, // must be true when sameSite is 'none'
    sameSite: isProd ? 'none' : 'lax', // 'none' needed for cross-site (Vercel <-> Render) in prod
    path: `/api/${env.apiVersion}/auth`,
    maxAge: parseDurationMs(env.jwt.refreshExpiry, 30 * 24 * 60 * 60 * 1000),
  };
}
