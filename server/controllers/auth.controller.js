import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { REFRESH_COOKIE_NAME, getRefreshCookieOptions } from '../utils/cookieOptions.js';
import * as authService from '../services/auth.service.js';

function deviceInfoFrom(req) {
  return req.headers['user-agent'] || 'unknown device';
}

function sendSession(res, statusCode, { user, accessToken, refreshToken }, message) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
  return new ApiResponse(statusCode, { user, accessToken }, message).send(res);
}

export const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  new ApiResponse(
    201,
    { user },
    'Registered successfully. Check your email for a verification code.'
  ).send(res);
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmail({ ...req.body, deviceInfo: deviceInfoFrom(req) });
  sendSession(res, 200, result, 'Email verified successfully.');
});

export const resendOtp = asyncHandler(async (req, res) => {
  await authService.resendOtp(req.body);
  new ApiResponse(200, null, 'If an account exists, a new code has been sent.').send(res);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login({ ...req.body, deviceInfo: deviceInfoFrom(req) });
  sendSession(res, 200, result, 'Logged in successfully.');
});

export const googleAuth = asyncHandler(async (req, res) => {
  const result = await authService.googleLogin({ ...req.body, deviceInfo: deviceInfoFrom(req) });
  sendSession(res, 200, result, 'Logged in with Google successfully.');
});

export const refresh = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.[REFRESH_COOKIE_NAME];
  const result = await authService.refreshSession({
    refreshToken: incomingToken,
    deviceInfo: deviceInfoFrom(req),
  });
  sendSession(res, 200, result, 'Session refreshed.');
});

export const logout = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.[REFRESH_COOKIE_NAME];
  await authService.logout({ refreshToken: incomingToken });
  res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
  new ApiResponse(200, null, 'Logged out successfully.').send(res);
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body);
  new ApiResponse(200, null, 'If an account exists, a reset code has been sent.').send(res);
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  new ApiResponse(200, null, 'Password reset successfully. Please log in again.').send(res);
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user._id);
  new ApiResponse(200, { user }).send(res);
});
