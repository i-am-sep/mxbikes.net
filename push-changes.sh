#!/bin/bash

# Change to the repository directory
cd /mxbikes.net || exit 1

echo "Pushing changes to mxbikes.net repository..."

# Add all changes
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "No changes to push"
    exit 0
fi

# Commit with timestamp
git commit -m "Auto-update: $(date '+%Y-%m-%d %H:%M:%S')"

# Push to main branch
git push origin main

echo "Successfully pushed changes"
