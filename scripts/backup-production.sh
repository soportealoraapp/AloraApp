#!/bin/bash
# scripts/backup-production.sh

PROJECT_ID="alora-prod"
BUCKET="gs://alora-prod-backups"

echo "Starting Production Backup..."
gcloud firestore export $BUCKET/daily-$(date +%Y-%m-%d) --project $PROJECT_ID
echo "Verifying Backup..."
gsutil ls $BUCKET/daily-$(date +%Y-%m-%d)
echo "Done."
