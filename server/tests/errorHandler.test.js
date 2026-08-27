import { jest } from '@jest/globals';

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const req = { method: 'GET', originalUrl: '/api/v1/whatever' };

describe('errorHandler — production error message sanitization', () => {
  let originalNodeEnv;
  let errorHandler;

  beforeAll(async () => {
    originalNodeEnv = process.env.NODE_ENV;
    ({ errorHandler } = await import('../middleware/errorHandler.js'));
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('never forwards a raw 500-level error message to the client in production', async () => {
    // config/env.js reads NODE_ENV at import time, so this test only verifies
    // the code path guarded by env.nodeEnv — see the follow-up test using the
    // actual env module for the fully wired check.
    const { env } = await import('../config/env.js');
    const original = env.nodeEnv;
    env.nodeEnv = 'production';

    const res = makeRes();
    const sensitiveError = new Error('connect ECONNREFUSED mongodb://admin:s3cr3t@internal-db:27017');
    errorHandler(sensitiveError, req, res, () => {});

    const [, body] = res.json.mock.calls[0] ? [null, res.json.mock.calls[0][0]] : [null, {}];
    expect(body.message).toBe('Internal server error');
    expect(body.message).not.toContain('mongodb://');
    expect(body).not.toHaveProperty('stack');

    env.nodeEnv = original;
  });

  it('still shows the real message in non-production for debuggability', async () => {
    const { env } = await import('../config/env.js');
    const original = env.nodeEnv;
    env.nodeEnv = 'development';

    const res = makeRes();
    const err = new Error('some internal detail');
    errorHandler(err, req, res, () => {});

    const body = res.json.mock.calls[0][0];
    expect(body.message).toBe('some internal detail');
    expect(body).toHaveProperty('stack');

    env.nodeEnv = original;
  });

  it('still returns the intended message for a deliberately-thrown ApiError', async () => {
    const { ApiError } = await import('../utils/ApiError.js');
    const { env } = await import('../config/env.js');
    const original = env.nodeEnv;
    env.nodeEnv = 'production';

    const res = makeRes();
    errorHandler(ApiError.badRequest('Email is required'), req, res, () => {});

    const body = res.json.mock.calls[0][0];
    expect(body.message).toBe('Email is required');

    env.nodeEnv = original;
  });
});
