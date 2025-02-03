#!/bin/bash

# Check if environment argument is provided
if [ "$1" != "staging" ] && [ "$1" != "production" ]; then
    echo "Usage: ./deploy.sh [staging|production]"
    exit 1
fi

ENV=$1
echo "Deploying to $ENV environment..."

# Pull latest code
echo "Pulling latest code from GitHub..."
git pull origin main

# Install/update dependencies
echo "Installing/updating dependencies..."
pip install -r requirements.txt

# Set environment variables based on environment
if [ "$ENV" = "staging" ]; then
    export FLASK_ENV=staging
    export FLASK_DEBUG=1
else
    export FLASK_ENV=production
    export FLASK_DEBUG=0
fi

# Create/update .env file
echo "FLASK_ENV=$FLASK_ENV" > .env
echo "FLASK_DEBUG=$FLASK_DEBUG" >> .env

# Restart Flask application
echo "Restarting Flask application..."
pkill -f "python server.py" || true
nohup python server.py > app.log 2>&1 &

# Wait for application to start
echo "Waiting for application to start..."
sleep 5

# Basic health check
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000)
if [ $response -eq 200 ]; then
    echo "Deployment successful! Application is running."
else
    echo "Warning: Application may not have started correctly. Check app.log for details."
    tail -n 20 app.log
fi
