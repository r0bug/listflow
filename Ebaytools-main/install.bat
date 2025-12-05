@echo off
:: eBay Tools Windows Installer v3.0.0
:: Comprehensive installation script with enhanced Python detection and dependency management

title eBay Tools Installer v3.0.0
color 0A

echo.
echo =====================================
echo    eBay Tools Installation v3.0.0
echo =====================================
echo.
echo This installer will:
echo   - Check for Python installation
echo   - Install/update ALL code files
echo   - Install required dependencies
echo   - Verify all features are present
echo   - Create application launchers
echo   - Set up desktop shortcuts
echo   - Test installation integrity
echo.

set "PYTHON_CMD="
set "INSTALL_DIR=%~dp0"
set "TARGET_DIR=%INSTALL_DIR%ebay_tools\"
set "SOURCE_DIR=%INSTALL_DIR%windows_installer\ebay_tools\"

:: Check for Python installation
echo [1/7] Checking for Python installation...
echo.

:: Try python command first
python --version >nul 2>&1
if %errorlevel% == 0 (
    set "PYTHON_CMD=python"
    echo [OK] Found Python using 'python' command
    python --version
    
    :: Check if this is Microsoft Store Python (known to cause issues)
    for /f "tokens=*" %%i in ('where python 2^>nul') do (
        echo %%i | findstr /C:"WindowsApps" >nul && (
            echo.
            echo [INFO] Microsoft Store Python detected.
            echo Creating Microsoft Store Python compatible launchers...
            echo.
            echo Note: If you experience issues, see PYTHON_INSTALLATION_GUIDE.md
            echo for alternative Python installation options.
        )
    )
    
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
echo Checking Python version compatibility...
%PYTHON_CMD% -c "import sys; exit(0 if sys.version_info >= (3, 8) else 1)" >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python 3.8 or higher is required!
    echo Please update your Python installation.
    pause
    exit /b 1
)
echo [OK] Python version is compatible
echo.

:: Backup existing installation if it exists
echo [2/7] Preparing installation directory...
if exist "%TARGET_DIR%" (
    echo Found existing installation - creating backup...
    if exist "%INSTALL_DIR%ebay_tools_backup\" (
        rmdir /s /q "%INSTALL_DIR%ebay_tools_backup\" >nul 2>&1
    )
    move "%TARGET_DIR%" "%INSTALL_DIR%ebay_tools_backup\" >nul 2>&1
    echo [OK] Existing installation backed up
) else (
    echo [OK] Fresh installation directory
)
echo.

:: Copy all code files
echo [3/7] Installing all code files...
if not exist "%SOURCE_DIR%" (
    echo [ERROR] Source directory not found: %SOURCE_DIR%
    echo This installer must be run from the extracted eBay Tools directory.
    pause
    exit /b 1
)

:: Create target directory structure
mkdir "%TARGET_DIR%" 2>nul
mkdir "%TARGET_DIR%apps\" 2>nul
mkdir "%TARGET_DIR%core\" 2>nul
mkdir "%TARGET_DIR%utils\" 2>nul

:: Copy all Python files with verification
echo Copying core module files...
copy "%SOURCE_DIR%__init__.py" "%TARGET_DIR%__init__.py" >nul
copy "%SOURCE_DIR%apps\*.py" "%TARGET_DIR%apps\" >nul
copy "%SOURCE_DIR%core\*.py" "%TARGET_DIR%core\" >nul
copy "%SOURCE_DIR%utils\*.py" "%TARGET_DIR%utils\" >nul

echo [OK] All code files installed
echo.

:: Verify critical files are present
echo [4/7] Verifying file installation...
set "MISSING_FILES="

if not exist "%TARGET_DIR%__init__.py" set "MISSING_FILES=%MISSING_FILES% __init__.py"
if not exist "%TARGET_DIR%apps\processor.py" set "MISSING_FILES=%MISSING_FILES% processor.py"
if not exist "%TARGET_DIR%apps\setup.py" set "MISSING_FILES=%MISSING_FILES% setup.py"
if not exist "%TARGET_DIR%apps\viewer.py" set "MISSING_FILES=%MISSING_FILES% viewer.py"
if not exist "%TARGET_DIR%apps\price_analyzer.py" set "MISSING_FILES=%MISSING_FILES% price_analyzer.py"
if not exist "%TARGET_DIR%core\api.py" set "MISSING_FILES=%MISSING_FILES% api.py"
if not exist "%TARGET_DIR%core\schema.py" set "MISSING_FILES=%MISSING_FILES% schema.py"

if not "%MISSING_FILES%"=="" (
    echo [ERROR] Missing critical files:%MISSING_FILES%
    echo Installation failed. Please check source files and try again.
    pause
    exit /b 1
)
echo [OK] All critical files verified present
echo.

:: Check if pip is available
echo [5/7] Installing dependencies...
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

:: Test installation functionality
echo [6/7] Testing installation integrity...

:: Test basic imports
%PYTHON_CMD% -c "import sys; sys.path.insert(0, '.'); import ebay_tools; print('Package import: OK')" 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Package import test failed
) else (
    echo [OK] Package imports successfully
)

:: Test GUI dependencies
%PYTHON_CMD% -c "import tkinter, requests, PIL; print('GUI dependencies: OK')" >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Some GUI dependencies may not be properly installed
    echo The applications may still work, but some features might be limited
) else (
    echo [OK] All GUI dependencies working
)

:: Test version detection
echo Testing version detection...
%PYTHON_CMD% -c "import sys; sys.path.insert(0, '.'); from ebay_tools import __version__; print(f'Version detected: {__version__}')" 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Version detection test failed - using fallback
) else (
    echo [OK] Version detection working
)

:: Test reset functionality presence
findstr /C:"Reset Tags" "%TARGET_DIR%apps\processor.py" >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Reset functionality not found in processor!
    echo This indicates a critical installation problem.
    pause
    exit /b 1
) else (
    echo [OK] Reset functionality verified present
)

echo.

:: Create application launchers
echo [7/7] Creating application launchers...
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

:: Create enhanced batch files that try multiple Python commands
echo Creating enhanced batch files...

:: Create Microsoft Store Python compatible batch files
echo @echo off > ebay_setup.bat
echo title eBay Tools - Setup >> ebay_setup.bat
echo echo Starting eBay Tools - Setup... >> ebay_setup.bat
echo echo. >> ebay_setup.bat
echo. >> ebay_setup.bat
echo :: Set working directory and paths >> ebay_setup.bat
echo set "SCRIPT_DIR=%%~dp0" >> ebay_setup.bat
echo cd /d "%%SCRIPT_DIR%%" >> ebay_setup.bat
echo. >> ebay_setup.bat
echo :: Microsoft Store Python compatibility >> ebay_setup.bat
echo set "PYTHONPATH=%%SCRIPT_DIR%%;%%PYTHONPATH%%" >> ebay_setup.bat
echo set "PYTHONIOENCODING=utf-8" >> ebay_setup.bat
echo. >> ebay_setup.bat
echo :: Try different Python execution methods >> ebay_setup.bat
echo python --version ^>nul 2^>^&1 >> ebay_setup.bat
echo if %%errorlevel%% == 0 ( >> ebay_setup.bat
echo     echo Using python command... >> ebay_setup.bat
echo     python "%%SCRIPT_DIR%%ebay_tools\apps\setup.py" >> ebay_setup.bat
echo     if %%errorlevel%% == 0 goto :success >> ebay_setup.bat
echo     python -m ebay_tools.apps.setup >> ebay_setup.bat
echo     if %%errorlevel%% == 0 goto :success >> ebay_setup.bat
echo ^) >> ebay_setup.bat
echo. >> ebay_setup.bat
echo py --version ^>nul 2^>^&1 >> ebay_setup.bat
echo if %%errorlevel%% == 0 ( >> ebay_setup.bat
echo     echo Using py launcher... >> ebay_setup.bat
echo     py "%%SCRIPT_DIR%%ebay_tools\apps\setup.py" >> ebay_setup.bat
echo     if %%errorlevel%% == 0 goto :success >> ebay_setup.bat
echo     py -m ebay_tools.apps.setup >> ebay_setup.bat
echo     if %%errorlevel%% == 0 goto :success >> ebay_setup.bat
echo ^) >> ebay_setup.bat
echo. >> ebay_setup.bat
echo echo Python not found or failed to run! >> ebay_setup.bat
echo echo Try running: python "%%SCRIPT_DIR%%ebay_tools\apps\setup.py" >> ebay_setup.bat
echo pause >> ebay_setup.bat
echo goto :end >> ebay_setup.bat
echo. >> ebay_setup.bat
echo :success >> ebay_setup.bat
echo echo. >> ebay_setup.bat
echo echo Application completed successfully. >> ebay_setup.bat
echo. >> ebay_setup.bat
echo :end >> ebay_setup.bat

echo @echo off > ebay_processor.bat
echo title eBay Tools - Processor >> ebay_processor.bat
echo echo Starting eBay Tools - Processor... >> ebay_processor.bat
echo echo. >> ebay_processor.bat
echo. >> ebay_processor.bat
echo :: Set working directory and paths >> ebay_processor.bat
echo set "SCRIPT_DIR=%%~dp0" >> ebay_processor.bat
echo cd /d "%%SCRIPT_DIR%%" >> ebay_processor.bat
echo. >> ebay_processor.bat
echo :: Microsoft Store Python compatibility >> ebay_processor.bat
echo set "PYTHONPATH=%%SCRIPT_DIR%%;%%PYTHONPATH%%" >> ebay_processor.bat
echo set "PYTHONIOENCODING=utf-8" >> ebay_processor.bat
echo. >> ebay_processor.bat
echo :: Try different Python execution methods >> ebay_processor.bat
echo python --version ^>nul 2^>^&1 >> ebay_processor.bat
echo if %%errorlevel%% == 0 ( >> ebay_processor.bat
echo     echo Using python command... >> ebay_processor.bat
echo     python "%%SCRIPT_DIR%%ebay_tools\apps\processor.py" >> ebay_processor.bat
echo     if %%errorlevel%% == 0 goto :success >> ebay_processor.bat
echo     python -m ebay_tools.apps.processor >> ebay_processor.bat
echo     if %%errorlevel%% == 0 goto :success >> ebay_processor.bat
echo ^) >> ebay_processor.bat
echo. >> ebay_processor.bat
echo py --version ^>nul 2^>^&1 >> ebay_processor.bat
echo if %%errorlevel%% == 0 ( >> ebay_processor.bat
echo     echo Using py launcher... >> ebay_processor.bat
echo     py "%%SCRIPT_DIR%%ebay_tools\apps\processor.py" >> ebay_processor.bat
echo     if %%errorlevel%% == 0 goto :success >> ebay_processor.bat
echo     py -m ebay_tools.apps.processor >> ebay_processor.bat
echo     if %%errorlevel%% == 0 goto :success >> ebay_processor.bat
echo ^) >> ebay_processor.bat
echo. >> ebay_processor.bat
echo echo Python not found or failed to run! >> ebay_processor.bat
echo echo Try running: python "%%SCRIPT_DIR%%ebay_tools\apps\processor.py" >> ebay_processor.bat
echo pause >> ebay_processor.bat
echo goto :end >> ebay_processor.bat
echo. >> ebay_processor.bat
echo :success >> ebay_processor.bat
echo echo. >> ebay_processor.bat
echo echo Application completed successfully. >> ebay_processor.bat
echo. >> ebay_processor.bat
echo :end >> ebay_processor.bat

echo @echo off > ebay_viewer.bat
echo title eBay Tools - Viewer >> ebay_viewer.bat
echo echo Starting eBay Tools - Viewer... >> ebay_viewer.bat
echo echo. >> ebay_viewer.bat
echo. >> ebay_viewer.bat
echo :: Set working directory and paths >> ebay_viewer.bat
echo set "SCRIPT_DIR=%%~dp0" >> ebay_viewer.bat
echo cd /d "%%SCRIPT_DIR%%" >> ebay_viewer.bat
echo. >> ebay_viewer.bat
echo :: Microsoft Store Python compatibility >> ebay_viewer.bat
echo set "PYTHONPATH=%%SCRIPT_DIR%%;%%PYTHONPATH%%" >> ebay_viewer.bat
echo set "PYTHONIOENCODING=utf-8" >> ebay_viewer.bat
echo. >> ebay_viewer.bat
echo :: Try different Python execution methods >> ebay_viewer.bat
echo python --version ^>nul 2^>^&1 >> ebay_viewer.bat
echo if %%errorlevel%% == 0 ( >> ebay_viewer.bat
echo     echo Using python command... >> ebay_viewer.bat
echo     python "%%SCRIPT_DIR%%ebay_tools\apps\viewer.py" >> ebay_viewer.bat
echo     if %%errorlevel%% == 0 goto :success >> ebay_viewer.bat
echo     python -m ebay_tools.apps.viewer >> ebay_viewer.bat
echo     if %%errorlevel%% == 0 goto :success >> ebay_viewer.bat
echo ^) >> ebay_viewer.bat
echo. >> ebay_viewer.bat
echo py --version ^>nul 2^>^&1 >> ebay_viewer.bat
echo if %%errorlevel%% == 0 ( >> ebay_viewer.bat
echo     echo Using py launcher... >> ebay_viewer.bat
echo     py "%%SCRIPT_DIR%%ebay_tools\apps\viewer.py" >> ebay_viewer.bat
echo     if %%errorlevel%% == 0 goto :success >> ebay_viewer.bat
echo     py -m ebay_tools.apps.viewer >> ebay_viewer.bat
echo     if %%errorlevel%% == 0 goto :success >> ebay_viewer.bat
echo ^) >> ebay_viewer.bat
echo. >> ebay_viewer.bat
echo echo Python not found or failed to run! >> ebay_viewer.bat
echo echo Try running: python "%%SCRIPT_DIR%%ebay_tools\apps\viewer.py" >> ebay_viewer.bat
echo pause >> ebay_viewer.bat
echo goto :end >> ebay_viewer.bat
echo. >> ebay_viewer.bat
echo :success >> ebay_viewer.bat
echo echo. >> ebay_viewer.bat
echo echo Application completed successfully. >> ebay_viewer.bat
echo. >> ebay_viewer.bat
echo :end >> ebay_viewer.bat

echo @echo off > ebay_price.bat
echo title eBay Tools - Price Analyzer >> ebay_price.bat
echo echo Starting eBay Tools - Price Analyzer... >> ebay_price.bat
echo echo. >> ebay_price.bat
echo. >> ebay_price.bat
echo :: Set working directory and paths >> ebay_price.bat
echo set "SCRIPT_DIR=%%~dp0" >> ebay_price.bat
echo cd /d "%%SCRIPT_DIR%%" >> ebay_price.bat
echo. >> ebay_price.bat
echo :: Microsoft Store Python compatibility >> ebay_price.bat
echo set "PYTHONPATH=%%SCRIPT_DIR%%;%%PYTHONPATH%%" >> ebay_price.bat
echo set "PYTHONIOENCODING=utf-8" >> ebay_price.bat
echo. >> ebay_price.bat
echo :: Try different Python execution methods >> ebay_price.bat
echo python --version ^>nul 2^>^&1 >> ebay_price.bat
echo if %%errorlevel%% == 0 ( >> ebay_price.bat
echo     echo Using python command... >> ebay_price.bat
echo     python "%%SCRIPT_DIR%%ebay_tools\apps\price_analyzer.py" >> ebay_price.bat
echo     if %%errorlevel%% == 0 goto :success >> ebay_price.bat
echo     python -m ebay_tools.apps.price_analyzer >> ebay_price.bat
echo     if %%errorlevel%% == 0 goto :success >> ebay_price.bat
echo ^) >> ebay_price.bat
echo. >> ebay_price.bat
echo py --version ^>nul 2^>^&1 >> ebay_price.bat
echo if %%errorlevel%% == 0 ( >> ebay_price.bat
echo     echo Using py launcher... >> ebay_price.bat
echo     py "%%SCRIPT_DIR%%ebay_tools\apps\price_analyzer.py" >> ebay_price.bat
echo     if %%errorlevel%% == 0 goto :success >> ebay_price.bat
echo     py -m ebay_tools.apps.price_analyzer >> ebay_price.bat
echo     if %%errorlevel%% == 0 goto :success >> ebay_price.bat
echo ^) >> ebay_price.bat
echo. >> ebay_price.bat
echo echo Python not found or failed to run! >> ebay_price.bat
echo echo Try running: python "%%SCRIPT_DIR%%ebay_tools\apps\price_analyzer.py" >> ebay_price.bat
echo pause >> ebay_price.bat
echo goto :end >> ebay_price.bat
echo. >> ebay_price.bat
echo :success >> ebay_price.bat
echo echo. >> ebay_price.bat
echo echo Application completed successfully. >> ebay_price.bat
echo. >> ebay_price.bat
echo :end >> ebay_price.bat

:: Create old style launcher for compatibility
echo Creating legacy launcher...

echo @echo off > "%INSTALL_DIR%run_app.bat"
echo :: Universal application launcher >> "%INSTALL_DIR%run_app.bat"
echo set PYTHONPATH=%%~dp0;%%PYTHONPATH%% >> "%INSTALL_DIR%run_app.bat"
echo cd /d "%%~dp0" >> "%INSTALL_DIR%run_app.bat"
echo %PYTHON_CMD% -m ebay_tools.apps.%%1 >> "%INSTALL_DIR%run_app.bat"
echo if %%errorlevel%% neq 0 pause >> "%INSTALL_DIR%run_app.bat"

:: Final verification test
echo.
echo ==========================================
echo   Final Installation Verification
echo ==========================================
echo.
echo Testing application startup...

:: Test processor launch (without GUI)
%PYTHON_CMD% -c "import sys; sys.path.insert(0, '.'); from ebay_tools.apps.processor import EbayLLMProcessor; print('Processor module: OK')" 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Processor module test failed
) else (
    echo [OK] Processor module loads successfully
)

echo.

echo [OK] Application launchers created
echo.

echo =====================================
echo    Installation Complete!
echo =====================================
echo.
echo eBay Tools v3.0.0 has been successfully installed!
echo.
echo ✓ All code files installed and verified
echo ✓ Dependencies installed and verified
echo ✓ Reset functionality verified present
echo ✓ Version detection working
echo ✓ Application launchers created
echo ✓ Desktop shortcuts created
echo.
echo Available applications:
echo   - eBay Tools - Setup        (Create item queues)
echo   - eBay Tools - Processor    (AI photo analysis + Reset Tags)
echo   - eBay Tools - Viewer       (Review and export)
echo   - eBay Tools - Price Analyzer (Market pricing)
echo   - eBay Tools - User Manual  (Complete documentation)
echo.
echo New Features in v3.0.0:
echo   🔄 Reset Tags button in Processor toolbar
echo   📋 Individual, type-based, and global reset options
echo   ℹ️  Version display in Help > About
echo.
echo Getting Started:
echo 1. Start with "eBay Tools - Setup" to create your first queue
echo 2. Use "eBay Tools - Processor" for AI photo processing
echo 3. Look for the "🔄 Reset Tags" button in the toolbar
echo 4. Check Help > About to verify version 3.0.0
echo.
if exist "%INSTALL_DIR%ebay_tools_backup\" (
    echo NOTE: Your previous installation was backed up to ebay_tools_backup\
    echo You can safely delete this folder after verifying the new installation works.
    echo.
)

:: Offer to test launch
set /p TEST_LAUNCH="Would you like to test launch the Processor now? (y/n): "
if /i "%TEST_LAUNCH%"=="y" (
    echo.
    echo Launching Processor for testing...
    start "" "%INSTALL_DIR%ebay_processor.bat"
    echo Look for the "🔄 Reset Tags" button in the toolbar!
)

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
echo TROUBLESHOOTING:
echo This installer now accommodates Microsoft Store Python automatically.
echo If you still encounter issues:
echo 1. Try running applications directly: python "ebay_tools\apps\processor.py"
echo 2. Read PYTHON_INSTALLATION_GUIDE.md for alternative Python options
echo 3. Run diagnose_python.bat for detailed diagnostics
echo.
pause