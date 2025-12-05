@echo off
:: Simplified eBay Tools Processor Launcher
:: Attempts to work around Python path issues

title eBay Tools - Processor (Simple)
echo Starting eBay Tools - Processor (Simple mode)...
echo.

:: Try to launch from absolute paths to avoid path resolution issues
echo Attempting to launch with absolute paths...

:: Find Python executable path
for /f "tokens=*" %%i in ('where python 2^>nul') do set "PYTHON_EXE=%%i"
if not defined PYTHON_EXE (
    for /f "tokens=*" %%i in ('where py 2^>nul') do set "PYTHON_EXE=%%i"
)
if not defined PYTHON_EXE (
    echo ERROR: Could not locate Python executable
    echo Please ensure Python is installed and in your PATH
    pause
    exit /b 1
)

echo Found Python at: %PYTHON_EXE%

:: Set absolute paths
set "SCRIPT_DIR=%~dp0"
set "MODULE_PATH=%SCRIPT_DIR%ebay_tools"

echo Script directory: %SCRIPT_DIR%
echo Module path: %MODULE_PATH%

:: Check if module exists
if not exist "%MODULE_PATH%\apps\processor.py" (
    echo ERROR: Processor module not found at %MODULE_PATH%\apps\processor.py
    echo Please run install.bat first
    pause
    exit /b 1
)

:: Try to run with full absolute paths
echo.
echo Launching processor...
cd /d "%SCRIPT_DIR%"

:: Method 1: Try with PYTHONPATH
set "PYTHONPATH=%SCRIPT_DIR%;%PYTHONPATH%"
"%PYTHON_EXE%" -m ebay_tools.apps.processor
if %errorlevel% == 0 goto :success

:: Method 2: Try running the file directly
echo.
echo Trying direct file execution...
"%PYTHON_EXE%" "%MODULE_PATH%\apps\processor.py"
if %errorlevel% == 0 goto :success

:: Method 3: Try with sys.path modification
echo.
echo Trying with sys.path modification...
"%PYTHON_EXE%" -c "import sys; sys.path.insert(0, r'%SCRIPT_DIR%'); import ebay_tools.apps.processor"
if %errorlevel% == 0 goto :success

echo.
echo ==========================================
echo All launch methods failed
echo ==========================================
echo.
echo This appears to be a Python installation or environment issue.
echo Please try:
echo 1. Run diagnose_python.bat for detailed diagnostics
echo 2. Reinstall Python from https://python.org
echo 3. Restart your computer
echo 4. Run install.bat again
echo.
pause
exit /b 1

:success
echo.
echo Application closed normally.
pause