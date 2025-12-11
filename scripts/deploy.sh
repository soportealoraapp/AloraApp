#!/bin/bash
# scripts/deploy.sh
# Usage: ./deploy.sh [staging|prod]

ENV=$1

if [ "$ENV" == "staging" ]; then
  echo "Deploying to Staging..."
  firebase deploy --project alora-staging --only hosting
elif [ "$ENV" == "prod" ]; then
  echo "Deploying to Production (Canary)..."
  # 1. Deploy to a temporary channel first
  firebase hosting:channel:deploy canary_preview --project alora-prod
  
  echo "Verify canary_preview. If good, run: firebase hosting:clone alora-prod:canary_preview alora-prod:live"
else
  echo "Usage: ./deploy.sh [staging|prod]"
  exit 1
fi
