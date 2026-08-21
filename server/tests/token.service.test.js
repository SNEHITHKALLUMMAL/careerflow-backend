import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
} from '../services/token.service.js';

const fakeUser = { _id: '507f1f77bcf86cd799439011', role: 'student' };

describe('token.service', () => {
  it('signs and verifies an access token with the correct payload', () => {
    const token = signAccessToken(fakeUser);
    const payload = verifyAccessToken(token);

    expect(payload.sub).toBe(fakeUser._id);
    expect(payload.role).toBe('student');
  });

  it('signs and verifies a refresh token carrying only the user id', () => {
    const token = signRefreshToken(fakeUser);
    const payload = verifyRefreshToken(token);

    expect(payload.sub).toBe(fakeUser._id);
    expect(payload.role).toBeUndefined();
  });

  it('rejects a tampered token', () => {
    const token = signAccessToken(fakeUser);
    const tampered = token.slice(0, -2) + 'xx';

    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it('rejects an access token when verified as a refresh token (different secrets)', () => {
    const token = signAccessToken(fakeUser);
    expect(() => verifyRefreshToken(token)).toThrow();
  });

  it('hashToken is deterministic and produces different hashes for different tokens', () => {
    const tokenA = signRefreshToken(fakeUser);
    const tokenB = signRefreshToken({ ...fakeUser, _id: '507f1f77bcf86cd799439099' });

    expect(hashToken(tokenA)).toBe(hashToken(tokenA));
    expect(hashToken(tokenA)).not.toBe(hashToken(tokenB));
  });
});
