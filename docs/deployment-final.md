# Alora Deployment Guide (v1.0.0-rc2)

## 🚀 Deployment Steps (Automated)

### 1. Web (Vercel / Firebase)
```bash
npm run build
firebase deploy --only hosting
```
Or git push to `main` (Triggering GitHub Action).

### 2. Mobile (Play Store)
```bash
cd android
./gradlew bundleRelease
cd ..
bundle exec fastlane android internal
```

### 3. Post-Deploy Checks
1. Visit `app.alora.com` - Verify SSL & Headers.
2. Check Cloud Monitoring for Error Spikes.
3. Run `scripts/backup-production.sh` to ensure safety net.

## 🔄 Rollback Procedure
- **Web**: `firebase hosting:rollback`
- **Mobile**: Promote previous release ID in Play Console.
