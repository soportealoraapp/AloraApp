# Alora DevOps Runbook

## 🚨 Emergency Rollback
If production is failing:
1. **Web**: Revert hosting to previous version.
   ```bash
   firebase hosting:channel:deploy --project alora-prod
   # Or using GitHub Actions re-run previous successful job
   ```
2. **Mobile**: Submit a hotfix version immediately. You cannot "delete" a release, only supersede it.

## 📱 Publishing to Play Store
1. Ensure `google-services.json` is in `android/app/`.
2. Run Fastlane:
   ```bash
   bundle exec fastlane android beta
   ```
3. Check Play Console "Internal Testing".

## 🛠️ Backup & Restore
- **Backup**: Runs daily via Cloud Scheduler targeting `gs://alora-backups`.
- **Restore**:
  ```bash
  gcloud firestore import gs://alora-backups/2025-XX-XX --project alora-prod
  ```

## 📊 Monitoring
- **Dashboards**: Grafana / Google Cloud Monitoring.
- **Critical Alerts**:
  - Error Rate > 1% (PagerDuty)
  - Latency > 2s (Slack #alerts)
