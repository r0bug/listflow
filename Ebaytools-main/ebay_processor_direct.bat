@echo off
:: Direct Python Execution - Bypass Path Resolution Issues
:: This launcher attempts to work around Python "failed to make path absolute" errors

title eBay Tools - Processor (Direct Mode)
echo.
echo ==========================================
echo   eBay Tools Processor - Direct Mode
echo ==========================================
echo.
echo Attempting to bypass Python path resolution issues...
echo.

:: Set working directory to a simple path
set "ORIGINAL_DIR=%CD%"
set "SIMPLE_TEMP=C:\temp_ebay"

:: Create a temporary simple directory
if not exist "C:\temp_ebay" mkdir "C:\temp_ebay"

:: Copy the processor script to the simple path
echo Copying processor to simple path...
copy "%~dp0ebay_tools\apps\processor.py" "C:\temp_ebay\processor.py" >nul 2>&1
copy "%~dp0ebay_tools\__init__.py" "C:\temp_ebay\ebay_init.py" >nul 2>&1

:: Copy required modules
if exist "%~dp0ebay_tools\core" (
    xcopy "%~dp0ebay_tools\core" "C:\temp_ebay\core\" /E /Y /Q >nul 2>&1
)
if exist "%~dp0ebay_tools\utils" (
    xcopy "%~dp0ebay_tools\utils" "C:\temp_ebay\utils\" /E /Y /Q >nul 2>&1
)

:: Change to simple directory
cd /d "C:\temp_ebay"

:: Try to run from simple path
echo Attempting to run from simple path (C:\temp_ebay)...

:: Method 1: Direct script execution
python processor.py 2>nul
if %errorlevel% == 0 (
    echo Success! Application ran from simple path.
    goto :cleanup
)

:: Method 2: Try with py launcher
py processor.py 2>nul
if %errorlevel% == 0 (
    echo Success! Application ran with py launcher.
    goto :cleanup
)

:: Method 3: Try creating a standalone script
echo Creating standalone launcher...
echo import sys > run_processor.py
echo sys.path.insert(0, r'%~dp0') >> run_processor.py
echo sys.path.insert(0, r'C:\temp_ebay') >> run_processor.py
echo. >> run_processor.py
echo # Import the processor >> run_processor.py
echo try: >> run_processor.py
echo     exec(open('processor.py').read()) >> run_processor.py
echo except Exception as e: >> run_processor.py
echo     print(f'Error: {e}') >> run_processor.py
echo     input('Press Enter to continue...') >> run_processor.py

python run_processor.py
if %errorlevel% == 0 (
    echo Success! Application ran via standalone script.
    goto :cleanup
)

echo.
echo ==========================================
echo   All Methods Failed
echo ==========================================
echo.
echo The Python path issue appears to be a fundamental problem
echo with your Python installation or Windows environment.
echo.
echo RECOMMENDED SOLUTIONS:
echo.
echo 1. REINSTALL PYTHON:
echo    - Go to https://python.org/downloads/
echo    - Download Python 3.11.9 (more stable than 3.13)
echo    - Run installer as Administrator
echo    - Check "Add Python to PATH"
echo    - Choose "Install for all users"
echo.
echo 2. MOVE TO SHORTER PATH:
echo    - Copy eBay Tools to C:\eBayTools
echo    - Run from that location
echo.
echo 3. TRY DIFFERENT USER:
echo    - Create a new Windows user account
echo    - Install Python under that account
echo.
echo 4. CONTACT SUPPORT:
echo    - This appears to be a Windows/Python environment issue
echo    - Not specific to eBay Tools
echo.

:cleanup
cd /d "%ORIGINAL_DIR%"
if exist "C:\temp_ebay" rmdir /s /q "C:\temp_ebay" 2>nul

echo.
pause