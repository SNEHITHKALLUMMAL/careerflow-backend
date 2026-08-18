import { parseDurationMs } from '../utils/parseDurationMs.js';

describe('parseDurationMs', () => {
  it('parses seconds, minutes, hours, and days', () => {
    expect(parseDurationMs('30s')).toBe(30 * 1000);
    expect(parseDurationMs('15m')).toBe(15 * 60 * 1000);
    expect(parseDurationMs('12h')).toBe(12 * 60 * 60 * 1000);
    expect(parseDurationMs('30d')).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it('falls back to the default for unparseable input', () => {
    expect(parseDurationMs('not-a-duration', 12345)).toBe(12345);
    expect(parseDurationMs(undefined, 999)).toBe(999);
  });
});
