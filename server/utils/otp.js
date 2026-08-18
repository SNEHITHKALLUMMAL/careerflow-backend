import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

/** Generates a 6-digit numeric OTP as a string, e.g. "042917". */
export function generateOtp() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

/** Hashes an OTP for storage — never store OTPs in plaintext. */
export async function hashOtp(otp) {
  return bcrypt.hash(otp, 10);
}

/** Compares a submitted OTP against its stored hash. */
export async function compareOtp(candidate, hash) {
  if (!hash) return false;
  return bcrypt.compare(candidate, hash);
}

export const OTP_EXPIRY_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
