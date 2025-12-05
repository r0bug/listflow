@echo off
:: Python Diagnostic Tool for eBay Tools
:: Helps troubleshoot Python path issues

title Python Diagnostic Tool
color 0E

echo.
echo ==========================================
echo   Python Diagnostic Tool
echo ==========================================
echo.
echo This tool will help diagnose Python path issues.
echo.

:: Show current directory and path info
echo [1] Current Environment:
echo Current Directory: %CD%
echo Install Directory: %~dp0
echo Working Directory: %~dp0
echo.

:: Test Python commands individually
echo [2] Testing Python Commands:
echo.

echo Testing 'python' command:
python --version 2>nul
if %errorlevel% == 0 (
    echo   ✓ python command works
    python -c "print('  ✓ python execution works')" 2>nul || echo   ✗ python execution failed
) else (
    echo   ✗ python command not found
)
echo.

echo Testing 'py' launcher:
py --version 2>nul
if %errorlevel% == 0 (
    echo   ✓ py launcher works
    py -c "print('  ✓ py execution works')" 2>nul || echo   ✗ py execution failed
) else (
    echo   ✗ py launcher not found
)
echo.

echo Testing 'python3' command:
python3 --version 2>nul
if %errorlevel% == 0 (
    echo   ✓ python3 command works
    python3 -c "print('  ✓ python3 execution works')" 2>nul || echo   ✗ python3 execution failed
) else (
    echo   ✗ python3 command not found
)
echo.

:: Test with different working directories
echo [3] Testing from different directories:
echo.

echo Testing from current directory (%CD%):
python -c "import sys; print(f'  Current working dir: {sys.path[0]}')" 2>nul || echo   ✗ Failed

echo Testing from install directory (%~dp0):
cd /d "%~dp0"
python -c "import sys; print(f'  Install dir: {sys.path[0]}')" 2>nul || echo   ✗ Failed

echo Testing from system directory:
cd /d C:\
python -c "import sys; print(f'  System dir: {sys.path[0]}')" 2>nul || echo   ✗ Failed
cd /d "%~dp0"
echo.

:: Test PYTHONPATH variations
echo [4] Testing PYTHONPATH configurations:
echo.

echo Testing without PYTHONPATH:
set PYTHONPATH=
python -c "import sys; print(f'  No PYTHONPATH: {len(sys.path)} paths')" 2>nul || echo   ✗ Failed

echo Testing with current directory:
set PYTHONPATH=.
python -c "import sys; print(f'  PYTHONPATH=.: {len(sys.path)} paths')" 2>nul || echo   ✗ Failed

echo Testing with install directory:
set PYTHONPATH=%~dp0
python -c "import sys; print(f'  PYTHONPATH=%~dp0: {len(sys.path)} paths')" 2>nul || echo   ✗ Failed

echo Testing with install directory + current:
set PYTHONPATH=%~dp0;.
python -c "import sys; print(f'  PYTHONPATH=%~dp0;.: {len(sys.path)} paths')" 2>nul || echo   ✗ Failed
echo.

:: Test module import
echo [5] Testing eBay Tools module import:
echo.

set PYTHONPATH=%~dp0;%PYTHONPATH%
if exist "ebay_tools\__init__.py" (
    echo   ✓ ebay_tools directory exists
    echo   ✓ __init__.py file found
    
    python -c "import ebay_tools; print('  ✓ ebay_tools module imports successfully')" 2>nul || echo   ✗ ebay_tools import failed
    python -c "from ebay_tools.apps import processor; print('  ✓ processor module imports successfully')" 2>nul || echo   ✗ processor import failed
) else (
    echo   ✗ ebay_tools directory not found
)
echo.

:: Test with verbose Python output
echo [6] Testing with verbose Python output:
echo.
echo Running: python -v -c "print('test')"
echo (This will show detailed import information)
echo.
python -v -c "print('Verbose test successful')" 2>&1 | findstr /I /C:"error" /C:"failed" /C:"exception" || echo   No obvious errors in verbose output

echo.
echo ==========================================
echo   Diagnostic Complete
echo ==========================================
echo.
echo If you see errors above, please:
echo 1. Reinstall Python from https://python.org
echo 2. Make sure to check "Add Python to PATH" during installation
echo 3. Restart your computer after Python installation
echo 4. Try running this diagnostic again
echo.
pause