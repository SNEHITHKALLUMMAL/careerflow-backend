const UNIT_MS = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

/**
 * Parses a short duration string like '15m', '12h', '30d' into milliseconds.
 * Falls back to a safe default if the input doesn't match the expected shape.
 */
export function parseDurationMs(input, fallbackMs = 15 * 60 * 1000) {
  const match = /^(\d+)([smhd])$/.exec(String(input).trim());
  if (!match) return fallbackMs;

  const [, amount, unit] = match;
  return Number(amount) * UNIT_MS[unit];
}
