@echo off
:: Detailed Python Path Diagnostic for "failed to make path absolute" error
:: This error typically indicates a Python installation or environment issue

title Python Path Error Diagnostic
color 0C

echo.
echo ==========================================
echo   Python Path Error Diagnostic
echo ==========================================
echo.
echo Investigating "failed to make path absolute" error...
echo.

:: Check Python installation details
echo [1] Python Installation Analysis:
echo.

for /f "tokens=*" %%i in ('where python 2^>nul') do (
    echo Python executable: %%i
    echo Directory: %%~dpi
    echo Drive: %%~di
)

for /f "tokens=*" %%i in ('where py 2^>nul') do (
    echo Py launcher: %%i
    echo Directory: %%~dpi
    echo Drive: %%~di
)

echo.

:: Check for problematic characters in paths
echo [2] Path Analysis:
echo Current directory: %CD%
echo Install directory: %~dp0

:: Check for path length issues
set "TEST_PATH=%CD%"
echo Path length: 
echo %TEST_PATH% | find /c /v ""

:: Check for special characters
echo Path contains spaces: 
echo %TEST_PATH% | find " " >nul && echo YES || echo NO

echo Path contains special chars:
echo %TEST_PATH% | findstr /R "[&()^!%%]" >nul && echo YES || echo NO

echo.

:: Test minimal Python execution
echo [3] Minimal Python Tests:
echo.

echo Testing basic Python execution:
python -c "print('Basic execution: OK')" 2>nul || echo FAILED

echo Testing Python with explicit working directory:
cd /d C:\
python -c "print('From C: OK')" 2>nul || echo FAILED
cd /d "%~dp0"

echo Testing Python with environment isolation:
set PYTHONPATH=
set PYTHONHOME=
python -c "print('Isolated environment: OK')" 2>nul || echo FAILED

echo.

:: Test different invocation methods
echo [4] Different Invocation Methods:
echo.

echo Method 1 - Direct python command:
python --version 2>nul || echo FAILED

echo Method 2 - Full path invocation:
for /f "tokens=*" %%i in ('where python 2^>nul') do (
    "%%i" --version 2>nul || echo FAILED using %%i
)

echo Method 3 - Py launcher:
py --version 2>nul || echo FAILED

echo Method 4 - Py launcher with version:
py -3 --version 2>nul || echo FAILED

echo.

:: Check Windows environment
echo [5] Windows Environment:
echo.

echo Windows version:
ver

echo User account:
echo %USERNAME%

echo User profile:
echo %USERPROFILE%

echo System drive:
echo %SYSTEMDRIVE%

echo Temp directory:
echo %TEMP%

echo.

:: Test creating simple Python script
echo [6] Script Execution Test:
echo.

echo Creating test script...
echo print("Test script executed successfully") > test_python.py

echo Executing test script:
python test_python.py 2>nul || echo FAILED

echo Executing with py launcher:
py test_python.py 2>nul || echo FAILED

del test_python.py 2>nul

echo.

:: Check for Python registry issues
echo [7] Python Registry/Installation Check:
echo.

echo Python installations found:
py -0 2>nul || echo No Python installations found via py launcher

echo.

:: Environment variables that might affect Python
echo [8] Environment Variables:
echo.

echo PYTHONPATH: %PYTHONPATH%
echo PYTHONHOME: %PYTHONHOME%
echo PATH (Python parts):
echo %PATH% | findstr /I python

echo.

echo ==========================================
echo   Analysis Complete
echo ==========================================
echo.
echo COMMON CAUSES of "failed to make path absolute":
echo.
echo 1. CORRUPTED PYTHON INSTALLATION
echo    - Solution: Uninstall and reinstall Python from python.org
echo.
echo 2. WINDOWS PATH LENGTH LIMITATIONS
echo    - Solution: Move eBay Tools to a shorter path (e.g., C:\eBayTools)
echo.
echo 3. SPECIAL CHARACTERS IN PATH
echo    - Solution: Avoid paths with ^&()!%% and other special characters
echo.
echo 4. PYTHON REGISTRY CORRUPTION
echo    - Solution: Reinstall Python as Administrator
echo.
echo 5. WINDOWS USER PROFILE ISSUES
echo    - Solution: Try running as a different user or Administrator
echo.
echo IMMEDIATE FIXES TO TRY:
echo 1. Copy eBay Tools to C:\eBayTools and run from there
echo 2. Run Command Prompt as Administrator
echo 3. Reinstall Python 3.11 or 3.12 (3.13 is very new, may have issues)
echo.
pause