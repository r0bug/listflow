@echo off
:: ListFlow Windows Installer Wrapper
:: Runs the PowerShell installer with proper execution policy

echo.
echo ========================================
echo    ListFlow Installer
echo ========================================
echo.

:: Check if PowerShell is available
where powershell >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: PowerShell is required but not found.
    echo Please install PowerShell from https://github.com/PowerShell/PowerShell
    pause
    exit /b 1
)

:: Run the PowerShell installer
powershell -ExecutionPolicy Bypass -File "%~dp0install.ps1" %*

if %ERRORLEVEL% neq 0 (
    echo.
    echo Installation encountered an error.
    echo Please check the output above for details.
    pause
    exit /b 1
)

pause
