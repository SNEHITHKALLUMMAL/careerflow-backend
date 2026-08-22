import { jest } from '@jest/globals';

describe('trust proxy configuration (production hardening for Render/reverse-proxy deployment)', () => {
  afterEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('trusts exactly the first proxy hop when NODE_ENV=production', async () => {
    jest.resetModules();
    process.env.NODE_ENV = 'production';

    const app = (await import('../app.js')).default;
    expect(app.get('trust proxy')).toBe(1);
  });

  it('does not trust a proxy outside production (avoids trusting spoofable headers in dev/test)', async () => {
    jest.resetModules();
    process.env.NODE_ENV = 'test';

    const app = (await import('../app.js')).default;
    expect(app.get('trust proxy')).toBeFalsy();
  });
});
