import { transporter, mailSender } from '../config/mailer.js';

/**
 * Renders a minimal, inbox-safe HTML email for an OTP code. Kept
 * self-contained (no external assets) so it renders consistently.
 */
function otpEmailHtml({ heading, name, otp, expiryMinutes }) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <h2 style="color: #0C1220; margin-bottom: 8px;">${heading}</h2>
      <p style="color: #4B5468; font-size: 15px;">Hi ${name},</p>
      <p style="color: #4B5468; font-size: 15px;">
        Use the code below to continue. It expires in ${expiryMinutes} minutes.
      </p>
      <div style="background: #EEF0FD; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #4548C9;">${otp}</span>
      </div>
      <p style="color: #8A93A6; font-size: 13px;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `;
}

/**
 * @param {{to: string, name: string, otp: string, purpose: 'verify_email' | 'reset_password', expiryMinutes: number}} params
 */
export async function sendOtpEmail({ to, name, otp, purpose, expiryMinutes }) {
  const isReset = purpose === 'reset_password';
  const subject = isReset ? 'Reset your CareerFlow password' : 'Verify your CareerFlow email';
  const heading = isReset ? 'Reset your password' : 'Verify your email';

  await transporter.sendMail({
    from: mailSender,
    to,
    subject,
    html: otpEmailHtml({ heading, name, otp, expiryMinutes }),
  });
}
