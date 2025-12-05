#!/bin/bash
# SSH Setup Script for eBay Tools GitHub Repository
# Run this script whenever SSH authentication fails

echo "Setting up SSH for GitHub access..."

# Start SSH agent
eval "$(ssh-agent -s)"

# Add the ebaytools SSH key
if [ -f ~/.ssh/ebaytools ]; then
    ssh-add ~/.ssh/ebaytools
    echo "✅ Added ebaytools SSH key"
else
    echo "❌ SSH key ~/.ssh/ebaytools not found"
    exit 1
fi

# Create/update SSH config
cat > ~/.ssh/config << 'EOF'
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/ebaytools
    IdentitiesOnly yes
EOF

chmod 600 ~/.ssh/config
echo "✅ SSH config updated"

# Test connection
echo "Testing GitHub connection..."
ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"
if [ $? -eq 0 ]; then
    echo "✅ GitHub SSH connection successful!"
else
    echo "❌ GitHub SSH connection failed"
    ssh -T git@github.com
fi