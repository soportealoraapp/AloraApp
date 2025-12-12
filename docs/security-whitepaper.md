# Alora Security Whitepaper

## 🧱 Architecture
- **Frontend**: Next.js (SSR) + Capacitor (Android).
- **Backend**: Firebase (Serverless), Cloud Functions.
- **AI**: Edge-inference for Privacy.

## 🔒 Encryption
- **At Rest**: AES-256 (Google Cloud Default).
- **In Transit**: TLS 1.3 (HSTS Enforced).

## 🛡️ Access Control
- **RBAC**: Strict Role-Based Access Control for Admins.
- **MFA**: Required for all Admin access.

## 🐛 Vulnerability Management
- Regular dependencies audit (`npm audit`).
- Automated SAST in CI/CD.
