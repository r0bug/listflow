#!/bin/bash
# eBay Mobile Data Import launcher for Linux/Mac

echo "Starting eBay Mobile Data Import..."
cd "$(dirname "$0")"
python3 -m ebay_tools.apps.mobile_import