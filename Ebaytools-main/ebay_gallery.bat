@echo off
echo Starting eBay Gallery Creator...
cd /d "%~dp0"
python -m ebay_tools.apps.gallery_creator
pause