#!/bin/bash
# scripts/backup-firestore.sh

PROJECT_ID="alora-prod"
BUCKET="gs://alora-backups"

echo "Starting export for $PROJECT_ID..."
gcloud firestore export $BUCKET/$(date +%Y-%m-%d-%H%M%S) --project $PROJECT_ID
echo "Export complete."
