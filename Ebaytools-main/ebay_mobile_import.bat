@echo off
echo Starting eBay Mobile Data Import...
cd /d "%~dp0"
python -m ebay_tools.apps.mobile_import
pause