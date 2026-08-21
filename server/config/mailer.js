import nodemailer from 'nodemailer';
import { env } from './env.js';

/**
 * Single SMTP transport for all outgoing mail. Point it at Brevo's SMTP
 * relay (smtp-relay.brevo.com) or Gmail SMTP (smtp.gmail.com) purely by
 * changing SMTP_* env vars — no code path differs between the two.
 */
export const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.port === 465,
  auth: {
    user: env.smtp.user,
    pass: env.smtp.pass,
  },
});

export const mailSender = {
  name: env.smtp.fromName,
  address: env.smtp.fromEmail,
};
