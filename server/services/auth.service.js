import { User, SELF_REGISTERABLE_ROLES } from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import {
  generateOtp,
  hashOtp,
  compareOtp,
  OTP_EXPIRY_MINUTES,
  OTP_MAX_ATTEMPTS,
} from '../utils/otp.js';
import { sendOtpEmail } from './email.service.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} from './token.service.js';
import { googleClient } from '../config/googleClient.js';
import { env } from '../config/env.js';

const MAX_ACTIVE_SESSIONS = 5;

/** Generates, stores (hashed), and emails a fresh OTP for the given purpose. */
async function issueOtp(user, purpose) {
  const otp = generateOtp();
  user.otp = {
    codeHash: await hashOtp(otp),
    purpose,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    attempts: 0,
  };
  await user.save();

  await sendOtpEmail({
    to: user.email,
    name: user.name,
    otp,
    purpose,
    expiryMinutes: OTP_EXPIRY_MINUTES,
  });
}

/** Verifies a submitted OTP against the user's stored OTP for a given purpose. Mutates attempts on failure. */
async function verifyOtpOrThrow(user, purpose, submittedOtp) {
  if (!user.otp || user.otp.purpose !== purpose) {
    throw ApiError.badRequest('No pending code for this action. Please request a new one.');
  }

  if (user.otp.expiresAt.getTime() < Date.now()) {
    throw ApiError.badRequest('This code has expired. Please request a new one.');
  }

  if (user.otp.attempts >= OTP_MAX_ATTEMPTS) {
    throw ApiError.badRequest('Too many incorrect attempts. Please request a new code.');
  }

  const isValid = await compareOtp(submittedOtp, user.otp.codeHash);
  if (!isValid) {
    user.otp.attempts += 1;
    await user.save();
    throw ApiError.badRequest('Incorrect code. Please try again.');
  }
}

/** Issues a fresh access+refresh token pair and stores the refresh token (hashed) on the user. */
async function issueSession(user, deviceInfo) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const decoded = verifyRefreshToken(refreshToken);

  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push({
    tokenHash: hashToken(refreshToken),
    deviceInfo: deviceInfo || 'unknown device',
    expiresAt: new Date(decoded.exp * 1000),
  });

  // Cap concurrent sessions per user — drop the oldest if over the limit.
  if (user.refreshTokens.length > MAX_ACTIVE_SESSIONS) {
    user.refreshTokens = user.refreshTokens
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, MAX_ACTIVE_SESSIONS);
  }

  await user.save();
  return { accessToken, refreshToken };
}

export async function register({ name, email, password, role, collegeId }) {
  if (!SELF_REGISTERABLE_ROLES.includes(role)) {
    throw ApiError.badRequest(
      `Self-registration is only available for: ${SELF_REGISTERABLE_ROLES.join(', ')}`
    );
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists.');
  }

  const user = new User({
    name,
    email,
    passwordHash: password, // hashed by the pre-save hook
    role,
    collegeId: role === 'student' ? collegeId || null : null,
    isEmailVerified: true, // ← AUTO VERIFY (OTP disabled)
  });
  await user.save();

  // OTP sending removed

  return user.toSafeJSON();
}

export async function verifyEmail({ email, otp, deviceInfo }) {
  // Keep this function so old links don't break, but it's no longer required
  const user = await User.findOne({ email }).select('+otp +refreshTokens');
  if (!user) throw ApiError.notFound('No account found for this email.');
  if (user.isEmailVerified) throw ApiError.badRequest('This email is already verified.');

  await verifyOtpOrThrow(user, 'verify_email', otp);

  user.isEmailVerified = true;
  user.otp = null;
  user.lastLoginAt = new Date();
  const tokens = await issueSession(user, deviceInfo);

  return { user: user.toSafeJSON(), ...tokens };
}

export async function resendOtp({ email, purpose }) {
  const user = await User.findOne({ email }).select('+otp');

  if (!user) return;
  if (purpose === 'verify_email' && user.isEmailVerified) return;

  await issueOtp(user, purpose);
}

export async function login({ email, password, deviceInfo }) {
  const user = await User.findOne({ email }).select('+passwordHash +refreshTokens');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('This account has been disabled. Contact your administrator.');
  }

  // ← OTP / email verification check REMOVED

  user.lastLoginAt = new Date();
  const tokens = await issueSession(user, deviceInfo);

  return { user: user.toSafeJSON(), ...tokens };
}

export async function googleLogin({ idToken, role, deviceInfo }) {
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.google.clientId,
    });
    payload = ticket.getPayload();
  } catch {
    throw ApiError.unauthorized('Invalid Google credential.');
  }

  if (!payload?.email) {
    throw ApiError.unauthorized('Google account has no verified email.');
  }

  let user = await User.findOne({ googleId: payload.sub }).select('+refreshTokens');

  if (!user) {
    user = await User.findOne({ email: payload.email }).select('+refreshTokens');

    if (user) {
      user.googleId = payload.sub;
    } else {
      const desiredRole = SELF_REGISTERABLE_ROLES.includes(role) ? role : 'student';
      user = new User({
        name: payload.name || payload.email.split('@')[0],
        email: payload.email,
        googleId: payload.sub,
        role: desiredRole,
        avatarUrl: payload.picture || null,
      });
    }
  }

  user.isEmailVerified = true;
  if (!user.avatarUrl && payload.picture) user.avatarUrl = payload.picture;
  user.lastLoginAt = new Date();

  const tokens = await issueSession(user, deviceInfo);
  return { user: user.toSafeJSON(), ...tokens };
}

export async function refreshSession({ refreshToken, deviceInfo }) {
  if (!refreshToken) throw ApiError.unauthorized('No refresh token provided.');

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Session expired. Please log in again.');
  }

  const user = await User.findById(decoded.sub).select('+refreshTokens');
  if (!user) throw ApiError.unauthorized('Session expired. Please log in again.');

  const incomingHash = hashToken(refreshToken);
  const matchIndex = user.refreshTokens.findIndex((t) => t.tokenHash === incomingHash);

  if (matchIndex === -1) {
    user.refreshTokens = [];
    await user.save();
    throw ApiError.unauthorized('Session invalid. Please log in again.');
  }

  user.refreshTokens.splice(matchIndex, 1);
  await user.save();

  const tokens = await issueSession(user, deviceInfo);
  return { user: user.toSafeJSON(), ...tokens };
}

export async function logout({ refreshToken }) {
  if (!refreshToken) return;

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    return;
  }

  const user = await User.findById(decoded.sub).select('+refreshTokens');
  if (!user) return;

  const incomingHash = hashToken(refreshToken);
  user.refreshTokens = user.refreshTokens.filter((t) => t.tokenHash !== incomingHash);
  await user.save();
}

export async function forgotPassword({ email }) {
  const user = await User.findOne({ email });
  if (!user) return;

  await issueOtp(user, 'reset_password');
}

export async function resetPassword({ email, otp, newPassword }) {
  const user = await User.findOne({ email }).select('+otp +passwordHash +refreshTokens');
  if (!user) throw ApiError.notFound('No account found for this email.');

  await verifyOtpOrThrow(user, 'reset_password', otp);

  user.passwordHash = newPassword;
  user.otp = null;
  user.refreshTokens = [];
  await user.save();
}

export async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found.');
  return user.toSafeJSON();
}
