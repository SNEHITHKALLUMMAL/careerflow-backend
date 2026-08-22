import { generateOtp, hashOtp, compareOtp } from '../utils/otp.js';

describe('otp utils', () => {
  it('generates a 6-digit numeric OTP', () => {
    const otp = generateOtp();
    expect(otp).toMatch(/^\d{6}$/);
  });

  it('generates different OTPs across calls (not guaranteed but overwhelmingly likely)', () => {
    const otps = new Set(Array.from({ length: 20 }, () => generateOtp()));
    expect(otps.size).toBeGreaterThan(1);
  });

  it('hashes an OTP and correctly compares it back', async () => {
    const otp = generateOtp();
    const hash = await hashOtp(otp);

    expect(hash).not.toBe(otp);
    await expect(compareOtp(otp, hash)).resolves.toBe(true);
    await expect(compareOtp('000000', hash)).resolves.toBe(false);
  });

  it('compareOtp returns false when there is no hash to compare against', async () => {
    await expect(compareOtp('123456', null)).resolves.toBe(false);
  });
});
