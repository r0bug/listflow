@echo off
:: eBay Tools Windows Installer v3.0.0
:: Comprehensive installation script with enhanced Python detection and dependency management
:: NOTE: For the latest installer, run install.bat from the main directory instead

title eBay Tools Installer v3.0.0
color 0A

echo.
echo =====================================
echo    eBay Tools Installation v3.0.0
echo =====================================
echo.
echo NOTE: You are running the installer from windows_installer folder.
echo For the latest version, run install.bat from the main directory instead.
echo.
echo.
echo This installer will:
echo   - Check for Python installation
echo   - Install required dependencies
echo   - Create application launchers
echo   - Set up desktop shortcuts
echo   - Configure the application
echo.

set "PYTHON_CMD="
set "INSTALL_DIR=%~dp0"

:: Check for Python installation
echo Checking for Python installation...
echo.

:: Try python command first
python --version >nul 2>&1
if %errorlevel% == 0 (
    set "PYTHON_CMD=python"
    echo [OK] Found Python using 'python' command
    python --version
    goto :check_version
)

:: Try py launcher
py --version >nul 2>&1
if %errorlevel% == 0 (
    set "PYTHON_CMD=py"
    echo [OK] Found Python using 'py' launcher
    py --version
    goto :check_version
)

:: Try python3
python3 --version >nul 2>&1
if %errorlevel% == 0 (
    set "PYTHON_CMD=python3"
    echo [OK] Found Python using 'python3' command
    python3 --version
    goto :check_version
)

echo [ERROR] Python not found!
echo.
echo Python 3.8 or higher is required to run eBay Tools.
echo.
echo Please download and install Python from:
echo https://www.python.org/downloads/
echo.
echo IMPORTANT: During installation, make sure to check
echo "Add Python to PATH" option.
echo.
echo Opening download page...
start https://www.python.org/downloads/
echo.
pause
exit /b 1

:check_version
echo.
echo Checking Python version...
%PYTHON_CMD% -c "import sys; exit(0 if sys.version_info >= (3, 8) else 1)" >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python 3.8 or higher is required!
    echo Please update your Python installation.
    pause
    exit /b 1
)
echo [OK] Python version is compatible
echo.

:: Check if pip is available
echo Checking for pip...
%PYTHON_CMD% -m pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] pip is not available!
    echo Please ensure pip is installed with Python.
    pause
    exit /b 1
)
echo [OK] pip is available
echo.

:: Install dependencies
echo Installing required packages...
echo This may take a few minutes...
echo.
%PYTHON_CMD% -m pip install --upgrade pip
if %errorlevel% neq 0 (
    echo [WARNING] Failed to upgrade pip, continuing...
)

%PYTHON_CMD% -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies!
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)
echo [OK] Dependencies installed successfully
echo.

:: Test installation
echo Testing installation...
%PYTHON_CMD% -c "import tkinter, requests, PIL" >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Some dependencies may not be properly installed
    echo The applications may still work, but some features might be limited
    echo.
) else (
    echo [OK] All dependencies are working correctly
    echo.
)

:: Create desktop shortcuts
echo Creating desktop shortcuts...

:: Setup Tool shortcut
powershell "$s=(New-Object -COM WScript.Shell).CreateShortcut('%userprofile%\Desktop\eBay Tools - Setup.lnk');$s.TargetPath='%INSTALL_DIR%ebay_setup.bat';$s.WorkingDirectory='%INSTALL_DIR%';$s.IconLocation='%SystemRoot%\System32\shell32.dll,162';$s.Description='eBay Tools - Setup and Queue Management';$s.Save()"

:: Processor Tool shortcut
powershell "$s=(New-Object -COM WScript.Shell).CreateShortcut('%userprofile%\Desktop\eBay Tools - Processor.lnk');$s.TargetPath='%INSTALL_DIR%ebay_processor.bat';$s.WorkingDirectory='%INSTALL_DIR%';$s.IconLocation='%SystemRoot%\System32\shell32.dll,162';$s.Description='eBay Tools - AI Photo Processing';$s.Save()"

:: Viewer Tool shortcut
powershell "$s=(New-Object -COM WScript.Shell).CreateShortcut('%userprofile%\Desktop\eBay Tools - Viewer.lnk');$s.TargetPath='%INSTALL_DIR%ebay_viewer.bat';$s.WorkingDirectory='%INSTALL_DIR%';$s.IconLocation='%SystemRoot%\System32\shell32.dll,162';$s.Description='eBay Tools - Review and Export';$s.Save()"

:: Price Analyzer shortcut
powershell "$s=(New-Object -COM WScript.Shell).CreateShortcut('%userprofile%\Desktop\eBay Tools - Price Analyzer.lnk');$s.TargetPath='%INSTALL_DIR%ebay_price.bat';$s.WorkingDirectory='%INSTALL_DIR%';$s.IconLocation='%SystemRoot%\System32\shell32.dll,162';$s.Description='eBay Tools - Price Analysis';$s.Save()"

:: User Manual shortcut
powershell "$s=(New-Object -COM WScript.Shell).CreateShortcut('%userprofile%\Desktop\eBay Tools - User Manual.lnk');$s.TargetPath='%INSTALL_DIR%eBay_Tools_User_Manual.md';$s.WorkingDirectory='%INSTALL_DIR%';$s.IconLocation='%SystemRoot%\System32\shell32.dll,70';$s.Description='eBay Tools - Complete User Manual';$s.Save()"

echo [OK] Desktop shortcuts created
echo.

:: Create data directories
echo Creating data directories...
mkdir "%INSTALL_DIR%data" 2>nul
mkdir "%INSTALL_DIR%exports" 2>nul
mkdir "%INSTALL_DIR%logs" 2>nul
mkdir "%INSTALL_DIR%config" 2>nul
echo [OK] Data directories created
echo.

:: Create launch script
echo Creating application launchers...

echo @echo off > "%INSTALL_DIR%run_app.bat"
echo :: Universal application launcher >> "%INSTALL_DIR%run_app.bat"
echo set PYTHONPATH=%%~dp0;%%PYTHONPATH%% >> "%INSTALL_DIR%run_app.bat"
echo cd /d "%%~dp0" >> "%INSTALL_DIR%run_app.bat"
echo %PYTHON_CMD% -m ebay_tools.apps.%%1 >> "%INSTALL_DIR%run_app.bat"
echo if %%errorlevel%% neq 0 pause >> "%INSTALL_DIR%run_app.bat"

echo [OK] Application launchers created
echo.

echo =====================================
echo    Installation Complete!
echo =====================================
echo.
echo eBay Tools has been successfully installed!
echo.
echo Desktop shortcuts have been created for:
echo   - eBay Tools - Setup        (Create item queues)
echo   - eBay Tools - Processor    (AI photo analysis)
echo   - eBay Tools - Viewer       (Review and export)
echo   - eBay Tools - Price Analyzer (Market pricing)
echo   - eBay Tools - User Manual  (Complete documentation)
echo.
echo You can also run applications using the batch files:
echo   - ebay_setup.bat
echo   - ebay_processor.bat  
echo   - ebay_viewer.bat
echo   - ebay_price.bat
echo.
echo Getting Started:
echo 1. Read the User Manual for complete instructions
echo 2. Start with "eBay Tools - Setup" to create your first queue
echo 3. Configure API keys in any application's Settings menu
echo.
echo For support, check the documentation and logs folder.
echo.

:: Offer to open user manual
set /p OPEN_MANUAL="Would you like to open the User Manual now? (y/n): "
if /i "%OPEN_MANUAL%"=="y" (
    start "" "%INSTALL_DIR%eBay_Tools_User_Manual.md"
)

echo.
echo Thank you for installing eBay Tools!
echo.
pause