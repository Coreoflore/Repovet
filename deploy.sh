#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e

echo "============================================="
echo "  Repovet Automatic Deployment Script"
echo "============================================="

# 1. Pull latest code from Git
echo "Fetching latest changes..."
git pull

# 2. Update and restart Backend
echo "Updating backend dependencies..."
cd backend
npm install
echo "Restarting backend service in PM2 with updated environment..."
pm2 restart repovet-backend --update-env

# 3. Rebuild Frontend static assets
echo "Updating frontend dependencies..."
cd ../frontend
npm install
echo "Rebuilding frontend static assets..."
npm run build

echo "============================================="
echo "  Deployment successful! App is updated."
echo "============================================="
