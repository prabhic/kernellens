#!/bin/bash

# Script to delete all branches except main
# This script will delete both local and remote branches

set -e

echo "Branch Cleanup Script"
echo "====================="
echo "This script will delete ALL branches except 'main'"
echo ""

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "Error: Not in a git repository"
    exit 1
fi

# Fetch all branches
echo "Fetching all branches from remote..."
git fetch --all

# Get current branch
current_branch=$(git rev-parse --abbrev-ref HEAD)

# Switch to main if not already there
if [ "$current_branch" != "main" ]; then
    echo "Switching to main branch..."
    git checkout main || git checkout -b main origin/main
fi

# Delete all local branches except main
echo ""
echo "Deleting local branches..."
git branch | grep -v "main" | grep -v "^\*" | xargs -r git branch -D

# Delete all remote branches except main
echo ""
echo "Deleting remote branches..."
git branch -r | grep -v "main" | grep -v "HEAD" | sed 's/origin\///' | xargs -r -I {} git push origin --delete {}

echo ""
echo "Branch cleanup complete!"
echo "Only 'main' branch remains."
