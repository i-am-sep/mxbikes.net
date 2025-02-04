#!/bin/bash

# Change to the repository directory
cd /mxbikes.net || exit 1

echo "Pulling latest changes from mxbikes.net repository..."

# Fetch and reset to origin/main to ensure we're in sync
git fetch origin
git reset --hard origin/main

echo "Successfully pulled latest changes"
