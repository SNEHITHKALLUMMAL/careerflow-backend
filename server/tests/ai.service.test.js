import { isQuotaError, isRetryable } from '../services/ai.service.js';

describe('ai.service — isQuotaError', () => {
  it('recognizes a 429 status as a quota error', () => {
    expect(isQuotaError({ status: 429, message: 'blocked' })).toBe(true);
  });

  it('recognizes "quota" in the message even without a status code', () => {
    expect(isQuotaError({ message: 'Quota exceeded for this project' })).toBe(true);
  });

  it('recognizes "rate limit" in the message', () => {
    expect(isQuotaError({ message: 'Rate limit exceeded, slow down' })).toBe(true);
  });

  it('does not flag an ordinary server error as a quota error', () => {
    expect(isQuotaError({ status: 500, message: 'Internal error' })).toBe(false);
  });

  it('does not throw on an error with no message', () => {
    expect(isQuotaError({})).toBe(false);
  });
});

describe('ai.service — isRetryable', () => {
  it('never retries a quota error — retrying would not help', () => {
    expect(isRetryable({ status: 429, message: 'quota exceeded' })).toBe(false);
  });

  it('never retries a 4xx client error (bad request, invalid API key, etc.)', () => {
    expect(isRetryable({ status: 400, message: 'invalid argument' })).toBe(false);
    expect(isRetryable({ status: 401, message: 'unauthenticated' })).toBe(false);
  });

  it('retries a 5xx server error — likely transient', () => {
    expect(isRetryable({ status: 503, message: 'service unavailable' })).toBe(true);
  });

  it('retries an error with no status at all (e.g. a network/timeout failure)', () => {
    expect(isRetryable({ message: 'timeout' })).toBe(true);
  });
});
