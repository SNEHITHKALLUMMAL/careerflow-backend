# CareerFlow Backend — Render Deployment

## Environment Variables

Set the following under Render → Service → Environment. See `.env.example`
for the full list with descriptions; this table calls out what's *required*
vs *optional* in production.

### Required (server refuses to boot in production without these)

| Variable | Notes |
|---|---|
| `NODE_ENV` | Set to `production`. |
| `MONGODB_URI` | Your production MongoDB Atlas (or equivalent) connection string. |
| `JWT_ACCESS_SECRET` | Long random string. `openssl rand -base64 48`. |
| `JWT_REFRESH_SECRET` | Different long random string from the access secret. |
| `COOKIE_SECRET` | Different long random string again — used to sign the refresh cookie. |
| `CLIENT_URL` | Your production frontend origin, e.g. `https://careerflow.vercel.app`. Must match exactly (scheme + host) — used for the CORS allowlist. |

### Recommended / feature-dependent

| Variable | Needed for |
|---|---|
| `EXTRA_CLIENT_URLS` | Comma-separated extra allowed origins — e.g. a Vercel preview deployment URL, if you want preview builds to be able to call the API. |
| `PORT` | Render sets this automatically; only override if you know you need to. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth login. Omit to disable that login path (frontend degrades gracefully). |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Resume/file uploads. |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | AI features (skill-gap, chatbot, mock interview, career recommendations). |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM_EMAIL` / `SMTP_FROM_NAME` | OTP emails, notifications. If left unset, password-reset requests still succeed from the caller's perspective (the failed send is logged server-side, not surfaced to the requester — this is deliberate, to avoid leaking whether an email is registered) but no email actually goes out, so reset codes never reach anyone. Set these before relying on password reset in production. |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | Tune general API rate limiting; sane defaults exist. |
| `SEED_SUPERADMIN_EMAIL` / `SEED_SUPERADMIN_PASSWORD` / `SEED_PLACEMENT_OFFICER_EMAIL` / `SEED_PLACEMENT_OFFICER_PASSWORD` | Only needed transiently to run `npm run seed` once. Don't leave set permanently. |

## Production notes already handled in code

- `trust proxy` is set to `1` only when `NODE_ENV=production`, matching Render's
  single reverse-proxy hop — required for both `express-rate-limit` and secure
  cookie detection to work correctly.
- The refresh-token cookie is `httpOnly`, `secure: true`, and `sameSite: 'none'`
  in production (required for the cross-site Vercel ↔ Render setup); `lax` and
  non-secure in development.
- CORS only allows `CLIENT_URL` plus `EXTRA_CLIENT_URLS`; requests with no
  Origin header (health checks, curl) are allowed through since they can't be
  credentialed browser requests.

## Health check

Render should point its health check at `GET /api/v1/health`.

## Start command

```
npm start
```

## Alternative: self-hosted via Docker

A `Dockerfile` is included for deploying outside Render (a VPS, Kubernetes,
etc.). It installs production dependencies only (`npm ci --omit=dev`), runs
`node server.js`, and includes a container-level `HEALTHCHECK` against
`/api/v1/health`. All the same environment variables above must be injected
at container-run time (e.g. `docker run --env-file .env ...`) — none are
baked into the image.
