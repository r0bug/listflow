#!/bin/bash
# eBay Tools Suite Launcher

echo "Starting eBay Tools Suite..."

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to the script directory
cd "$DIR"

# Launch the main launcher
python3 ebay_tools/ebay_tools/apps/main_launcher.py