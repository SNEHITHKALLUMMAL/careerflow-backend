import { OAuth2Client } from 'google-auth-library';
import { env } from './env.js';

/** Used to verify Google ID tokens the frontend obtains via Google Identity Services. */
export const googleClient = new OAuth2Client(env.google.clientId);
