import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import compression from 'compression';

import { env } from './config/env.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const app = express();

// Render (and most PaaS platforms) terminate TLS at a reverse proxy in front of this app.
// Without trusting the first proxy hop, two things break in production:
//   1. express-rate-limit (v7+) throws on any request carrying an X-Forwarded-For header
//      unless trust proxy is explicitly configured — which every request behind a real
//      proxy has, so this isn't optional there.
//   2. req.secure / the "secure cookie" detection used for the refresh-token cookie relies
//      on X-Forwarded-Proto, which only Express honors once a proxy is trusted.
// `1` means "trust exactly one hop" (the platform's own proxy) — not an open trust of
// arbitrary forwarded headers from the public internet.
if (env.nodeEnv === 'production') {
  app.set('trust proxy', 1);
}

// Security headers
app.use(helmet());

// CORS — only the configured client origin may send credentialed requests
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);

// Body & cookie parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(env.cookieSecret));

// Response compression
app.use(compression());

// Request logging (skip in test to keep test output clean)
if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting for the whole API surface
app.use(`/api/${env.apiVersion}`, apiLimiter);

// Routes
app.use(`/api/${env.apiVersion}`, routes);

// 404 + centralized error handling (must be last)
app.use(notFound);
app.use(errorHandler);

export default app;
