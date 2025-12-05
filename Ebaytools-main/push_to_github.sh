#!/bin/bash
# Script to push changes to GitHub

echo "Current git status:"
git status

echo -e "\nLast commit:"
git log -1 --oneline

echo -e "\nTo push to GitHub, you have several options:"
echo "1. Using HTTPS (you'll need to enter username and password/token):"
echo "   git push origin main"
echo ""
echo "2. Using SSH (requires SSH key to be added to GitHub):"
echo "   a. First add your SSH key to GitHub:"
echo "      - Go to https://github.com/settings/keys"
echo "      - Click 'New SSH key'"
echo "      - Paste this key:"
cat ~/.ssh/forgit.pub
echo ""
echo "   b. Then switch to SSH and push:"
echo "      git remote set-url origin git@github.com:r0bug/Ebaytools.git"
echo "      git push origin main"
echo ""
echo "3. Using GitHub CLI (if installed):"
echo "   gh auth login"
echo "   git push origin main"

echo -e "\nNote: The commit has been created successfully with all changes."