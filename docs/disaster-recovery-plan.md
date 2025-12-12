# Alora Disaster Recovery Plan (DRP)

## 🚨 Triggers
- **Data Loss**: Accidental deletion > 10% of users.
- **Regional Outage**: Firebase region failure > 1 hour.
- **Security Breach**: Confirmed unauthorized access.

## 🔄 RPO/RTO Objectives
- **RPO (Recovery Point Objective)**: 24 Hours (Last Snapshot).
- **RTO (Recovery Time Objective)**: 4 Hours (Restore Service).

## 🛠️ Recovery Procedures
### 1. Database Restoration
```bash
# From local admin shell
./scripts/restore-production.sh gs://alora-backups/2025-XX-XX
```

### 2. Infrastructure Rebuild
- Redeploy Web: `firebase deploy --only hosting`
- Redeploy Functions: `firebase deploy --only functions`

## 🧪 Testing Schedule
- **Monthly**: Verify backup integrity (size/checksum).
- **Quarterly**: Full dry-run recovery in `alora-staging`.
