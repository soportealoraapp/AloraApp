# Alora Security Hardening (RC-1)

## Overview
We have transitioned from development security to a hardened, production-ready posture.

## Measures Implemented

### 1. Hardened Headers (Helmet/Middleware)
- **CSP**: Strict `default-src 'self'`, blocking unauthorized scripts/objects.
- **HSTS**: Enforced Strict-Transport-Security for 1 year.
- **X-Frame-Options**: Prevent clickjacking (SAMEORIGIN).
- **Referrer-Policy**: Strict origin-when-cross-origin.

### 2. Rate Limiting
- **Mechanism**: Token Bucket (Middleware Level).
- **Limits**: 100 requests/minute per IP.
- **Goal**: Prevent brute-force and simple DDoS.

### 3. Input Sanitization
- **Validation**: Zod schemas enforced on Server Actions.
- **Sanitization**: Inputs trimmed and escaped before DB ops.

### 4. Auth Security
- **Cookies**: `SameSite=Strict`, `Secure=True` (Prod).
- **Session**: Invalidated on server logout.
- **Abuse Detection**: Rate limiting on `/login` and `/auth` routes to slow down credential stuffing.

### 5. Mobile Security
- **Deep Links**: HTTPS-only verified links.
- **Storage**: Secure storage for refresh tokens (via Capacitor Secure Storage plugin recommendation).
