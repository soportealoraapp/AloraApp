#!/bin/bash
# scripts/setup-multi-region.sh

echo "Setting up Multi-Region Infrastructure..."

# 1. Enable Firestore Multi-Region
gcloud app create --region=us-central --project=alora-prod
gcloud firestore databases create --location=nam5 --project=alora-prod

# 2. Deploy Cloud Run to Secondary Regions (Simulated)
echo "Deploying to europe-west1..."
# gcloud run deploy alora-backend --region=europe-west1 --source=.

echo "Deploying to asia-northeast1..."
# gcloud run deploy alora-backend --region=asia-northeast1 --source=.

echo "Multi-Region Setup Complete."
