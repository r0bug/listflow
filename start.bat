@echo off
:: ListFlow Quick Start - Windows
:: Starts both backend and frontend servers

title ListFlow

echo.
echo ==========================================
echo          Starting ListFlow
echo ==========================================
echo.

:: Check if .env exists
if not exist "%~dp0.env" (
    echo Warning: .env file not found. Run install.bat first.
    pause
    exit /b 1
)

:: Check if node_modules exists
if not exist "%~dp0node_modules" (
    echo Warning: Dependencies not installed. Run install.bat first.
    pause
    exit /b 1
)

echo Starting backend server...
start "ListFlow Backend" cmd /k "cd /d %~dp0 && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting frontend server...
start "ListFlow Frontend" cmd /k "cd /d %~dp0client && npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo ==========================================
echo        ListFlow is starting!
echo ==========================================
echo.
echo   Backend API:  http://localhost:3001
echo   Frontend:     http://localhost:5173
echo.
echo   Opening browser...
echo.

:: Open browser
start http://localhost:5173

echo Press any key to close this window (servers will keep running)
pause >nul
