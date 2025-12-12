# Alora Production Security Posture

## 🛡️ Critical Controls
- **TLS/SSL**: Enforced via HSTS (Preload ready).
- **Authentication**: Firebase Auth with MFA support (Future). Tokens rotated daily.
- **API Security**: Rate Limiting (100 req/min) active on Edge.
- **Database**: Firestore Rules active. Indexes verified.

## 🕵️ Monitoring
- **Abuse**: Logs exported to Cloud Logging.
- **Alerts**: PagerDuty/Slack integration for 5xx errors > 1%.

## 📱 Mobile Hardening
- **Obfuscation**: R8 enabled in Gradle.
- **Deep Links**: Verified AssetLinks.json.
- **Storage**: Secure Enclave for keys.
