# Known SRS Deviations

This file tracks places where the current implementation deliberately does not
match the Software Requirements Specification, along with the reasoning and
what it would take to close the gap. Update this file whenever a phase of the
production-readiness audit finds and knowingly accepts a deviation rather than
fixing it immediately.

---

## AUTH-011 — Email verification ("a consistent production workflow")

**Status:** Deviation accepted. Email verification is fully implemented at the
data/OTP-model level but is **not enforced** in the live registration/login
flow, on either the backend or the frontend.

**What exists in code:**
- `User.model.js` has a full OTP subdocument (hashed code, purpose, expiry,
  attempt counter).
- Backend `auth.service.js` has working `verifyEmail`, `resendOtp`, and OTP
  generation/comparison (`utils/otp.js`) — fully functional if called.
- Backend routes `POST /auth/verify-email` and `POST /auth/resend-otp` exist
  and work.

**What's actually disabled:**
- `auth.service.js#register()` sets `isEmailVerified: true` unconditionally
  and never sends an OTP.
- `auth.service.js#login()` has no check on `isEmailVerified` — unverified
  accounts can log in freely.
- Frontend `RegisterPage.jsx` navigates straight to `/login` after
  registration and there is **no `VerifyEmailPage`** in the frontend at all —
  there's nowhere in the UI to enter a verification code even if the backend
  required one.

**Why:** Most likely disabled during development because `SMTP_HOST` /
`SMTP_USER` / `SMTP_PASS` were not configured locally, and enforcing
verification without a working mail transport would have blocked all local
registration/login. The comments left in the code (`// ← AUTO VERIFY (OTP
disabled)`, `// OTP sending removed`, `// OTP verification disabled → go
directly to login`) confirm this was a deliberate, not accidental, change.

**Decision (2026-08-23):** Leave disabled as-is; do not restore enforcement
as part of this production-readiness pass. Documented here per AUTH-011
instead of silently deviating from the SRS.

**To close this gap in the future**, the work is:
1. Backend: `register()` should send a real OTP and leave `isEmailVerified:
   false`; `login()` should reject unverified accounts with a clear message.
2. Add a dev-mode fallback (e.g. log the OTP to the server console instead of
   emailing it when `SMTP_HOST` is unset and `NODE_ENV !== 'production'`) so
   this doesn't block local development without SMTP credentials configured.
3. Frontend: build a `VerifyEmailPage`, wire it into the post-registration
   navigation and into the login rejection path, and add a "resend code" UI
   backed by the existing `POST /auth/resend-otp` endpoint.
4. Set real `SMTP_*` credentials in the production Render environment (see
   `server/DEPLOYMENT.md`).

**Everything else in AUTH-001 through AUTH-012 was verified compliant** during
Phase 6 of the audit — token rotation, revocation-on-reuse, hashed refresh
tokens, bcrypt password hashing, secure cookie config, Google OAuth
server-side verification, and account-disable enforcement are all correctly
implemented and were not part of this deviation.
