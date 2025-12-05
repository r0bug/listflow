#!/bin/bash

# Quick macOS installer for eBay Tools
# For users who already have Python 3.8+ installed

echo "eBay Tools - Quick macOS Installer"
echo "=================================="
echo

# Check Python
if command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD="python3"
    PIP_CMD="pip3"
else
    echo "Error: Python 3 not found. Please install Python 3.8+"
    echo "Visit: https://www.python.org/downloads/"
    exit 1
fi

echo "Found Python: $($PYTHON_CMD --version)"
echo

# Install packages
echo "Installing required packages..."
$PIP_CMD install --upgrade pip
$PIP_CMD install requests>=2.25.1 pillow>=8.2.0 beautifulsoup4>=4.9.3

# Create simple launcher
echo "Creating launcher..."
cat > "eBay_Tools.command" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
python3 -m ebay_tools.apps.setup
EOF
chmod +x eBay_Tools.command

echo
echo "Installation complete!"
echo "Double-click 'eBay_Tools.command' to start"