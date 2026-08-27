import 'dotenv/config';

/**
 * Every environment variable the server depends on, grouped by concern.
 * Vars listed in REQUIRED_IN_PRODUCTION must be set before the server will
 * boot in production; in development a warning is logged instead so the
 * app can still run against partially-configured local setups.
 */
const REQUIRED_IN_PRODUCTION = [
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'COOKIE_SECRET',
  'CLIENT_URL',
];

function loadEnv() {
  const missing = REQUIRED_IN_PRODUCTION.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(', ')}`;
    if (process.env.NODE_ENV === 'production') {
      throw new Error(message);
    }

    console.warn(`⚠️  ${message} (continuing because NODE_ENV !== production)`);
  }

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT) || 5000,
    apiVersion: process.env.API_VERSION || 'v1',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
    // Optional extra allowed origins (e.g. a Vercel preview URL or a custom
    // domain alongside the primary CLIENT_URL), comma-separated.
    extraClientUrls: (process.env.EXTRA_CLIENT_URLS || '')
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean),

    mongodbUri: process.env.MONGODB_URI,

    jwt: {
      accessSecret: process.env.JWT_ACCESS_SECRET,
      accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
      refreshSecret: process.env.JWT_REFRESH_SECRET,
      refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',
    },
    cookieSecret: process.env.COOKIE_SECRET,

    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },

    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    },

    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    },

    smtp: {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      fromEmail: process.env.SMTP_FROM_EMAIL || 'no-reply@careerflow.app',
      fromName: process.env.SMTP_FROM_NAME || 'CareerFlow',
    },

    rateLimit: {
      windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      max: Number(process.env.RATE_LIMIT_MAX) || 200,
    },
  };
}

export const env = loadEnv();
