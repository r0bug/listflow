@echo off
:: eBay Tools Windows Installer Creation Script
:: This script creates a simple installer for eBay Tools with pricing functionality

echo ===== eBay Tools Windows Installer Creation =====
echo.

:: Set up directories
set "SCRIPT_DIR=%~dp0"
set "INSTALLER_DIR=%SCRIPT_DIR%ebay_tools_installer"
set "PACKAGE_NAME=eBay_Tools"
set "VERSION=3.0.0"

echo.
echo Creating installer directory...
if exist "%INSTALLER_DIR%" rmdir /s /q "%INSTALLER_DIR%"
mkdir "%INSTALLER_DIR%"
mkdir "%INSTALLER_DIR%\ebay_tools"
mkdir "%INSTALLER_DIR%\configs"
mkdir "%INSTALLER_DIR%\docs"

echo.
echo Copying essential package files...
xcopy /s /i /q "%SCRIPT_DIR%\ebay_tools" "%INSTALLER_DIR%\ebay_tools"

echo.
echo Copying configuration files...
copy "%SCRIPT_DIR%\*.json" "%INSTALLER_DIR%\configs\" > nul

echo.
echo Copying documentation...
copy "%SCRIPT_DIR%\README.md" "%INSTALLER_DIR%\docs\" > nul

echo.
echo Creating requirements.txt file...
copy "%SCRIPT_DIR%\requirements.txt" "%INSTALLER_DIR%\" > nul

echo.
echo Creating application batch files...

:: Create a batch file to check for Python and handle errors
echo @echo off > "%INSTALLER_DIR%\check_python.bat"
echo.>> "%INSTALLER_DIR%\check_python.bat"
echo set PYTHON_FOUND=0 >> "%INSTALLER_DIR%\check_python.bat"
echo.>> "%INSTALLER_DIR%\check_python.bat"
echo echo Checking for Python installation... >> "%INSTALLER_DIR%\check_python.bat"
echo python --version >nul 2>nul >> "%INSTALLER_DIR%\check_python.bat"
echo if %%errorlevel%% equ 0 ( >> "%INSTALLER_DIR%\check_python.bat"
echo   set PYTHON_FOUND=1 >> "%INSTALLER_DIR%\check_python.bat"
echo   echo Python found. >> "%INSTALLER_DIR%\check_python.bat"
echo ) else ( >> "%INSTALLER_DIR%\check_python.bat"
echo   echo Python not found in PATH. Checking for py launcher... >> "%INSTALLER_DIR%\check_python.bat"
echo   py --version >nul 2>nul >> "%INSTALLER_DIR%\check_python.bat"
echo   if %%errorlevel%% equ 0 ( >> "%INSTALLER_DIR%\check_python.bat"
echo     set PYTHON_FOUND=1 >> "%INSTALLER_DIR%\check_python.bat"
echo     echo Python found using py launcher. >> "%INSTALLER_DIR%\check_python.bat"
echo   ) else ( >> "%INSTALLER_DIR%\check_python.bat"
echo     echo Python not found. >> "%INSTALLER_DIR%\check_python.bat"
echo     echo Please install Python from https://www.python.org/downloads/ >> "%INSTALLER_DIR%\check_python.bat"
echo     echo Make sure to check "Add Python to PATH" during installation. >> "%INSTALLER_DIR%\check_python.bat"
echo     start https://www.python.org/downloads/ >> "%INSTALLER_DIR%\check_python.bat"
echo     exit /b 1 >> "%INSTALLER_DIR%\check_python.bat"
echo   ) >> "%INSTALLER_DIR%\check_python.bat"
echo ) >> "%INSTALLER_DIR%\check_python.bat"
echo exit /b 0 >> "%INSTALLER_DIR%\check_python.bat"

:: Setup application
echo @echo off > "%INSTALLER_DIR%\ebay_setup.bat"
echo call check_python.bat >> "%INSTALLER_DIR%\ebay_setup.bat"
echo if %%errorlevel%% neq 0 exit /b >> "%INSTALLER_DIR%\ebay_setup.bat"
echo echo Starting eBay Setup Tool... >> "%INSTALLER_DIR%\ebay_setup.bat"
echo set PYTHONPATH=%%PYTHONPATH%%;%%~dp0 >> "%INSTALLER_DIR%\ebay_setup.bat"
echo if %%PYTHON_FOUND%% equ 1 ( >> "%INSTALLER_DIR%\ebay_setup.bat"
echo   python -m ebay_tools.apps.setup >> "%INSTALLER_DIR%\ebay_setup.bat"
echo ) else ( >> "%INSTALLER_DIR%\ebay_setup.bat"
echo   py -m ebay_tools.apps.setup >> "%INSTALLER_DIR%\ebay_setup.bat"
echo ) >> "%INSTALLER_DIR%\ebay_setup.bat"
echo pause >> "%INSTALLER_DIR%\ebay_setup.bat"

:: Processor application
echo @echo off > "%INSTALLER_DIR%\ebay_processor.bat"
echo call check_python.bat >> "%INSTALLER_DIR%\ebay_processor.bat"
echo if %%errorlevel%% neq 0 exit /b >> "%INSTALLER_DIR%\ebay_processor.bat"
echo echo Starting eBay Processor Tool... >> "%INSTALLER_DIR%\ebay_processor.bat"
echo set PYTHONPATH=%%PYTHONPATH%%;%%~dp0 >> "%INSTALLER_DIR%\ebay_processor.bat"
echo if %%PYTHON_FOUND%% equ 1 ( >> "%INSTALLER_DIR%\ebay_processor.bat"
echo   python -m ebay_tools.apps.processor >> "%INSTALLER_DIR%\ebay_processor.bat"
echo ) else ( >> "%INSTALLER_DIR%\ebay_processor.bat"
echo   py -m ebay_tools.apps.processor >> "%INSTALLER_DIR%\ebay_processor.bat"
echo ) >> "%INSTALLER_DIR%\ebay_processor.bat"
echo pause >> "%INSTALLER_DIR%\ebay_processor.bat"

:: Viewer application
echo @echo off > "%INSTALLER_DIR%\ebay_viewer.bat"
echo call check_python.bat >> "%INSTALLER_DIR%\ebay_viewer.bat"
echo if %%errorlevel%% neq 0 exit /b >> "%INSTALLER_DIR%\ebay_viewer.bat"
echo echo Starting eBay Viewer Tool... >> "%INSTALLER_DIR%\ebay_viewer.bat"
echo set PYTHONPATH=%%PYTHONPATH%%;%%~dp0 >> "%INSTALLER_DIR%\ebay_viewer.bat"
echo if %%PYTHON_FOUND%% equ 1 ( >> "%INSTALLER_DIR%\ebay_viewer.bat"
echo   python -m ebay_tools.apps.viewer >> "%INSTALLER_DIR%\ebay_viewer.bat"
echo ) else ( >> "%INSTALLER_DIR%\ebay_viewer.bat"
echo   py -m ebay_tools.apps.viewer >> "%INSTALLER_DIR%\ebay_viewer.bat"
echo ) >> "%INSTALLER_DIR%\ebay_viewer.bat"
echo pause >> "%INSTALLER_DIR%\ebay_viewer.bat"

:: Price analyzer application
echo @echo off > "%INSTALLER_DIR%\ebay_price.bat"
echo call check_python.bat >> "%INSTALLER_DIR%\ebay_price.bat"
echo if %%errorlevel%% neq 0 exit /b >> "%INSTALLER_DIR%\ebay_price.bat"
echo echo Starting eBay Price Analyzer Tool... >> "%INSTALLER_DIR%\ebay_price.bat"
echo set PYTHONPATH=%%PYTHONPATH%%;%%~dp0 >> "%INSTALLER_DIR%\ebay_price.bat"
echo if %%PYTHON_FOUND%% equ 1 ( >> "%INSTALLER_DIR%\ebay_price.bat"
echo   python -m ebay_tools.apps.price_analyzer >> "%INSTALLER_DIR%\ebay_price.bat"
echo ) else ( >> "%INSTALLER_DIR%\ebay_price.bat"
echo   py -m ebay_tools.apps.price_analyzer >> "%INSTALLER_DIR%\ebay_price.bat"
echo ) >> "%INSTALLER_DIR%\ebay_price.bat"
echo pause >> "%INSTALLER_DIR%\ebay_price.bat"

:: Direct listing application
echo @echo off > "%INSTALLER_DIR%\ebay_direct_listing.bat"
echo call check_python.bat >> "%INSTALLER_DIR%\ebay_direct_listing.bat"
echo if %%errorlevel%% neq 0 exit /b >> "%INSTALLER_DIR%\ebay_direct_listing.bat"
echo echo Starting eBay Direct Listing Tool... >> "%INSTALLER_DIR%\ebay_direct_listing.bat"
echo set PYTHONPATH=%%PYTHONPATH%%;%%~dp0 >> "%INSTALLER_DIR%\ebay_direct_listing.bat"
echo if %%PYTHON_FOUND%% equ 1 ( >> "%INSTALLER_DIR%\ebay_direct_listing.bat"
echo   python -m ebay_tools.apps.direct_listing >> "%INSTALLER_DIR%\ebay_direct_listing.bat"
echo ) else ( >> "%INSTALLER_DIR%\ebay_direct_listing.bat"
echo   py -m ebay_tools.apps.direct_listing >> "%INSTALLER_DIR%\ebay_direct_listing.bat"
echo ) >> "%INSTALLER_DIR%\ebay_direct_listing.bat"
echo pause >> "%INSTALLER_DIR%\ebay_direct_listing.bat"

:: Create installation script
echo.
echo Creating installation script...
echo @echo off > "%INSTALLER_DIR%\install.bat"
echo echo ===== eBay Tools Installation ===== >> "%INSTALLER_DIR%\install.bat"
echo echo. >> "%INSTALLER_DIR%\install.bat"
echo echo Checking for Python installation... >> "%INSTALLER_DIR%\install.bat"
echo call check_python.bat >> "%INSTALLER_DIR%\install.bat"
echo if %%errorlevel%% neq 0 ( >> "%INSTALLER_DIR%\install.bat"
echo   echo Please install Python and run this script again. >> "%INSTALLER_DIR%\install.bat"
echo   pause >> "%INSTALLER_DIR%\install.bat"
echo   exit /b >> "%INSTALLER_DIR%\install.bat"
echo ) >> "%INSTALLER_DIR%\install.bat"
echo echo. >> "%INSTALLER_DIR%\install.bat"
echo echo Installing required dependencies... >> "%INSTALLER_DIR%\install.bat"
echo if %%PYTHON_FOUND%% equ 1 ( >> "%INSTALLER_DIR%\install.bat"
echo   python -m pip install -r requirements.txt >> "%INSTALLER_DIR%\install.bat"
echo ) else ( >> "%INSTALLER_DIR%\install.bat"
echo   py -m pip install -r requirements.txt >> "%INSTALLER_DIR%\install.bat"
echo ) >> "%INSTALLER_DIR%\install.bat"
echo echo. >> "%INSTALLER_DIR%\install.bat"
echo echo Creating desktop shortcuts... >> "%INSTALLER_DIR%\install.bat"
echo echo. >> "%INSTALLER_DIR%\install.bat"

echo powershell "$s=(New-Object -COM WScript.Shell).CreateShortcut('%userprofile%\Desktop\eBay Setup.lnk');$s.TargetPath='%%~dp0ebay_setup.bat';$s.WorkingDirectory='%%~dp0';$s.Save()" >> "%INSTALLER_DIR%\install.bat"
echo powershell "$s=(New-Object -COM WScript.Shell).CreateShortcut('%userprofile%\Desktop\eBay Processor.lnk');$s.TargetPath='%%~dp0ebay_processor.bat';$s.WorkingDirectory='%%~dp0';$s.Save()" >> "%INSTALLER_DIR%\install.bat"
echo powershell "$s=(New-Object -COM WScript.Shell).CreateShortcut('%userprofile%\Desktop\eBay Viewer.lnk');$s.TargetPath='%%~dp0ebay_viewer.bat';$s.WorkingDirectory='%%~dp0';$s.Save()" >> "%INSTALLER_DIR%\install.bat"
echo powershell "$s=(New-Object -COM WScript.Shell).CreateShortcut('%userprofile%\Desktop\eBay Price Analyzer.lnk');$s.TargetPath='%%~dp0ebay_price.bat';$s.WorkingDirectory='%%~dp0';$s.Save()" >> "%INSTALLER_DIR%\install.bat"

echo echo. >> "%INSTALLER_DIR%\install.bat"
echo echo Installation complete! >> "%INSTALLER_DIR%\install.bat"
echo echo You can now use the eBay Tools applications. >> "%INSTALLER_DIR%\install.bat"
echo echo. >> "%INSTALLER_DIR%\install.bat"
echo echo Shortcuts have been created on your desktop. >> "%INSTALLER_DIR%\install.bat"
echo echo. >> "%INSTALLER_DIR%\install.bat"
echo pause >> "%INSTALLER_DIR%\install.bat"

:: Create README file
echo.
echo Creating README file...
echo ===== eBay Tools %VERSION% ===== > "%INSTALLER_DIR%\README.txt"
echo. >> "%INSTALLER_DIR%\README.txt"
echo Installation Instructions: >> "%INSTALLER_DIR%\README.txt"
echo 1. Make sure Python 3.8 or higher is installed on your system >> "%INSTALLER_DIR%\README.txt"
echo    Download from: https://www.python.org/downloads/ >> "%INSTALLER_DIR%\README.txt"
echo    IMPORTANT: Check "Add Python to PATH" during installation >> "%INSTALLER_DIR%\README.txt"
echo 2. Run install.bat to install dependencies and create shortcuts >> "%INSTALLER_DIR%\README.txt"
echo 3. You can then run any of the applications using the shortcuts or batch files >> "%INSTALLER_DIR%\README.txt"
echo. >> "%INSTALLER_DIR%\README.txt"
echo Applications: >> "%INSTALLER_DIR%\README.txt"
echo - ebay_setup.bat: Tool for creating item queues >> "%INSTALLER_DIR%\README.txt"
echo - ebay_processor.bat: Tool for processing photos with AI >> "%INSTALLER_DIR%\README.txt"
echo - ebay_viewer.bat: Tool for viewing and exporting results >> "%INSTALLER_DIR%\README.txt"
echo - ebay_price.bat: Tool for price analysis >> "%INSTALLER_DIR%\README.txt"
echo - ebay_direct_listing.bat: Tool for direct listing to eBay >> "%INSTALLER_DIR%\README.txt"
echo. >> "%INSTALLER_DIR%\README.txt"
echo Integrated Workflow: >> "%INSTALLER_DIR%\README.txt"
echo 1. Use Setup Tool to create item queues with photos >> "%INSTALLER_DIR%\README.txt"
echo 2. Use Processor Tool to analyze photos and generate descriptions >> "%INSTALLER_DIR%\README.txt"
echo    - Enable "Analyze Pricing" to automatically suggest prices >> "%INSTALLER_DIR%\README.txt"
echo 3. Use Viewer Tool to review results and export to eBay >> "%INSTALLER_DIR%\README.txt"
echo. >> "%INSTALLER_DIR%\README.txt"
echo Documentation is available in the docs folder. >> "%INSTALLER_DIR%\README.txt"

echo.
echo ===== Installation package created successfully! =====
echo.
echo The installer has been created at:
echo %INSTALLER_DIR%
echo.
echo To use this package on a Windows computer:
echo 1. Copy the ebay_tools_installer folder to the target computer
echo 2. Run install.bat to set up the application
echo.
pause