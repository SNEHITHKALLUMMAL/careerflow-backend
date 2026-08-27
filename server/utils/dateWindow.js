const DAY_MS = 24 * 60 * 60 * 1000;

/** @returns {Date} a new Date `days` before the given date (or now). */
export function subDays(days, from = new Date()) {
  return new Date(from.getTime() - days * DAY_MS);
}
