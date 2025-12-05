#!/bin/bash
# Run this after adding the SSH key to GitHub

echo "Testing GitHub connection..."
ssh -T git@github.com

if [ $? -eq 1 ]; then
    echo "✅ GitHub connection successful!"
    echo "Pushing commits..."
    git push origin main
    echo "✅ Commits pushed to GitHub!"
else
    echo "❌ GitHub connection failed. Make sure you added the SSH key."
fi