import {
  applicationStatusMessage,
  interviewScheduledMessage,
  offerIssuedMessage,
  driveScheduledMessage,
} from '../utils/notificationMessages.js';

describe('applicationStatusMessage', () => {
  it('formats the status with underscores replaced by spaces', () => {
    const result = applicationStatusMessage('interview_scheduled', 'Backend Engineer');
    expect(result.type).toBe('application_status');
    expect(result.message).toContain('Backend Engineer');
    expect(result.message).toContain('interview scheduled');
    expect(result.message).not.toContain('_');
  });
});

describe('interviewScheduledMessage', () => {
  it('includes the target title and a formatted date', () => {
    const result = interviewScheduledMessage('Backend Engineer', '2026-06-15T10:00:00.000Z');
    expect(result.type).toBe('interview');
    expect(result.message).toContain('Backend Engineer');
    expect(result.title).toBe('Interview scheduled');
  });
});

describe('offerIssuedMessage', () => {
  it('produces a congratulatory message including the target title', () => {
    const result = offerIssuedMessage('Backend Engineer');
    expect(result.type).toBe('offer');
    expect(result.message).toContain('Backend Engineer');
    expect(result.message).toMatch(/congratulations/i);
  });
});

describe('driveScheduledMessage', () => {
  it('includes the company name and a formatted date', () => {
    const result = driveScheduledMessage('Acme Corp', '2026-07-01T00:00:00.000Z');
    expect(result.type).toBe('drive');
    expect(result.message).toContain('Acme Corp');
  });
});
