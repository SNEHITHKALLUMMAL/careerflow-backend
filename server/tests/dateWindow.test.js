import { subDays } from '../utils/dateWindow.js';

describe('subDays', () => {
  it('returns a date exactly N days before the reference date', () => {
    const from = new Date('2026-06-15T12:00:00.000Z');
    const result = subDays(7, from);
    expect(result.toISOString()).toBe('2026-06-08T12:00:00.000Z');
  });

  it('returns a date exactly N days before now when no reference is given', () => {
    const before = Date.now();
    const result = subDays(1);
    const expectedMs = before - 24 * 60 * 60 * 1000;
    // Allow a small tolerance for the time elapsed during the test itself.
    expect(Math.abs(result.getTime() - expectedMs)).toBeLessThan(5000);
  });

  it('handles a 0-day window as the same instant', () => {
    const from = new Date('2026-01-01T00:00:00.000Z');
    expect(subDays(0, from).getTime()).toBe(from.getTime());
  });
});
