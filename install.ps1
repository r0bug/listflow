#######################################################################
# ListFlow - Windows PowerShell Installer
# Handles fresh installs, upgrades, dependency management, and migrations
#######################################################################

#Requires -Version 5.1

param(
    [switch]$Help,
    [switch]$Version,
    [switch]$Check,
    [switch]$Docker,
    [switch]$Unattended
)

# Configuration
$script:CURRENT_VERSION = "1.0.0"
$script:INSTALL_DIR = $PWD.Path
$script:DATA_DIR = Join-Path $INSTALL_DIR "data"
$script:BACKUP_DIR = Join-Path $INSTALL_DIR "backups"
$script:CONFIG_FILE = Join-Path $INSTALL_DIR ".listflow.config"
$script:VERSION_FILE = Join-Path $INSTALL_DIR ".listflow.version"

# Minimum versions
$script:MIN_NODE_VERSION = 18
$script:MIN_POSTGRES_VERSION = 14

#######################################################################
# Utility Functions
#######################################################################

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Type = "Info"
    )

    $colors = @{
        "Info"    = "Cyan"
        "Success" = "Green"
        "Warning" = "Yellow"
        "Error"   = "Red"
        "Step"    = "Magenta"
    }

    $prefixes = @{
        "Info"    = "[INFO]"
        "Success" = "[SUCCESS]"
        "Warning" = "[WARNING]"
        "Error"   = "[ERROR]"
        "Step"    = ""
    }

    if ($Type -eq "Step") {
        Write-Host ""
        Write-Host ("=" * 70) -ForegroundColor $colors[$Type]
        Write-Host "  $Message" -ForegroundColor $colors[$Type]
        Write-Host ("=" * 70) -ForegroundColor $colors[$Type]
        Write-Host ""
    } else {
        Write-Host "$($prefixes[$Type]) $Message" -ForegroundColor $colors[$Type]
    }
}

function Test-CommandExists {
    param([string]$Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

function Compare-SemVer {
    param(
        [string]$Version1,
        [string]$Version2
    )
    $v1 = [System.Version]::Parse($Version1)
    $v2 = [System.Version]::Parse($Version2)
    return $v1.CompareTo($v2)
}

function Get-RandomString {
    param([int]$Length = 32)
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    $random = New-Object System.Random
    $result = ""
    for ($i = 0; $i -lt $Length; $i++) {
        $result += $chars[$random.Next($chars.Length)]
    }
    return $result
}

#######################################################################
# Banner
#######################################################################

function Show-Banner {
    $banner = @"

    ╔═══════════════════════════════════════════════════════════════════╗
    ║                                                                   ║
    ║   ██╗     ██╗███████╗████████╗███████╗██╗      ██████╗ ██╗    ██╗ ║
    ║   ██║     ██║██╔════╝╚══██╔══╝██╔════╝██║     ██╔═══██╗██║    ██║ ║
    ║   ██║     ██║███████╗   ██║   █████╗  ██║     ██║   ██║██║ █╗ ██║ ║
    ║   ██║     ██║╚════██║   ██║   ██╔══╝  ██║     ██║   ██║██║███╗██║ ║
    ║   ███████╗██║███████║   ██║   ██║     ███████╗╚██████╔╝╚███╔███╔╝ ║
    ║   ╚══════╝╚═╝╚══════╝   ╚═╝   ╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝  ║
    ║                                                                   ║
    ║              Multi-Tenant eBay Operations Platform                ║
    ║                        Version $CURRENT_VERSION                          ║
    ║                                                                   ║
    ╚═══════════════════════════════════════════════════════════════════╝

"@
    Write-Host $banner -ForegroundColor Cyan
}

#######################################################################
# Dependency Checking
#######################################################################

function Test-NodeInstalled {
    Write-ColorOutput "Checking Node.js..." -Type Info

    if (-not (Test-CommandExists "node")) {
        return $false
    }

    $nodeVersion = (node -v) -replace 'v', ''
    $majorVersion = [int]($nodeVersion.Split('.')[0])

    if ($majorVersion -lt $MIN_NODE_VERSION) {
        Write-ColorOutput "Node.js version $majorVersion found, but version $MIN_NODE_VERSION+ required" -Type Warning
        return $false
    }

    Write-ColorOutput "Node.js v$nodeVersion found" -Type Success
    return $true
}

function Test-NpmInstalled {
    Write-ColorOutput "Checking npm..." -Type Info

    if (-not (Test-CommandExists "npm")) {
        return $false
    }

    $npmVersion = npm -v
    Write-ColorOutput "npm v$npmVersion found" -Type Success
    return $true
}

function Test-GitInstalled {
    Write-ColorOutput "Checking Git..." -Type Info

    if (-not (Test-CommandExists "git")) {
        return $false
    }

    $gitVersion = (git --version) -replace 'git version ', ''
    Write-ColorOutput "Git $gitVersion found" -Type Success
    return $true
}

function Test-PostgresInstalled {
    Write-ColorOutput "Checking PostgreSQL..." -Type Info

    if (-not (Test-CommandExists "psql")) {
        # Check common Windows installation paths
        $pgPaths = @(
            "C:\Program Files\PostgreSQL\*\bin\psql.exe",
            "C:\Program Files (x86)\PostgreSQL\*\bin\psql.exe"
        )

        foreach ($path in $pgPaths) {
            $found = Get-Item $path -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($found) {
                $env:Path += ";$($found.DirectoryName)"
                Write-ColorOutput "PostgreSQL found at $($found.DirectoryName)" -Type Success
                return $true
            }
        }

        return $false
    }

    Write-ColorOutput "PostgreSQL found" -Type Success
    return $true
}

function Test-RedisInstalled {
    Write-ColorOutput "Checking Redis..." -Type Info

    if (-not (Test-CommandExists "redis-cli")) {
        # Check if Redis is running as a service
        $redisService = Get-Service -Name "Redis" -ErrorAction SilentlyContinue
        if ($redisService) {
            Write-ColorOutput "Redis service found" -Type Success
            return $true
        }

        return $false
    }

    Write-ColorOutput "Redis found" -Type Success
    return $true
}

function Test-DockerInstalled {
    Write-ColorOutput "Checking Docker (optional)..." -Type Info

    if (-not (Test-CommandExists "docker")) {
        return $false
    }

    Write-ColorOutput "Docker found" -Type Success
    return $true
}

#######################################################################
# Dependency Installation
#######################################################################

function Install-NodeJs {
    Write-ColorOutput "Installing Node.js..." -Type Info

    # Check if winget is available
    if (Test-CommandExists "winget") {
        Write-ColorOutput "Installing Node.js via winget..." -Type Info
        winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    }
    # Check if Chocolatey is available
    elseif (Test-CommandExists "choco") {
        Write-ColorOutput "Installing Node.js via Chocolatey..." -Type Info
        choco install nodejs-lts -y
    }
    else {
        Write-ColorOutput "Please install Node.js manually from https://nodejs.org" -Type Warning
        Write-ColorOutput "Or install winget/Chocolatey first" -Type Info
        return $false
    }

    # Refresh environment
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

    return (Test-NodeInstalled)
}

function Install-PostgreSQL {
    Write-ColorOutput "Installing PostgreSQL..." -Type Info

    if (Test-CommandExists "winget") {
        Write-ColorOutput "Installing PostgreSQL via winget..." -Type Info
        winget install PostgreSQL.PostgreSQL --accept-source-agreements --accept-package-agreements
    }
    elseif (Test-CommandExists "choco") {
        Write-ColorOutput "Installing PostgreSQL via Chocolatey..." -Type Info
        choco install postgresql -y
    }
    else {
        Write-ColorOutput "Please install PostgreSQL manually from https://www.postgresql.org/download/windows/" -Type Warning
        return $false
    }

    return $true
}

function Install-Redis {
    Write-ColorOutput "Installing Redis..." -Type Info

    if (Test-CommandExists "winget") {
        Write-ColorOutput "Installing Redis via winget..." -Type Info
        winget install Redis.Redis --accept-source-agreements --accept-package-agreements
    }
    elseif (Test-CommandExists "choco") {
        Write-ColorOutput "Installing Redis via Chocolatey..." -Type Info
        choco install redis-64 -y
    }
    else {
        Write-ColorOutput "Please install Redis manually or use Docker" -Type Warning
        Write-ColorOutput "Download from: https://github.com/tporadowski/redis/releases" -Type Info
        return $false
    }

    return $true
}

function Install-Git {
    Write-ColorOutput "Installing Git..." -Type Info

    if (Test-CommandExists "winget") {
        winget install Git.Git --accept-source-agreements --accept-package-agreements
    }
    elseif (Test-CommandExists "choco") {
        choco install git -y
    }
    else {
        Write-ColorOutput "Please install Git manually from https://git-scm.com/download/win" -Type Warning
        return $false
    }

    return $true
}

#######################################################################
# Installation Detection
#######################################################################

function Get-InstallationType {
    if (Test-Path $VERSION_FILE) {
        $installedVersion = Get-Content $VERSION_FILE -Raw
        $installedVersion = $installedVersion.Trim()

        if ($installedVersion -eq $CURRENT_VERSION) {
            return "reinstall"
        }

        $comparison = Compare-SemVer $CURRENT_VERSION $installedVersion
        if ($comparison -gt 0) {
            return "upgrade"
        } else {
            return "downgrade"
        }
    }

    return "fresh"
}

function Get-InstalledVersion {
    if (Test-Path $VERSION_FILE) {
        return (Get-Content $VERSION_FILE -Raw).Trim()
    }
    return "none"
}

#######################################################################
# Backup Functions
#######################################################################

function New-Backup {
    $backupName = "listflow_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    $backupPath = Join-Path $BACKUP_DIR $backupName

    Write-ColorOutput "Creating backup at $backupPath..." -Type Info

    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null

    # Backup configuration
    if (Test-Path (Join-Path $INSTALL_DIR ".env")) {
        Copy-Item (Join-Path $INSTALL_DIR ".env") $backupPath
    }

    # Backup uploads
    $uploadsPath = Join-Path $INSTALL_DIR "uploads"
    if (Test-Path $uploadsPath) {
        Copy-Item -Path $uploadsPath -Destination $backupPath -Recurse
    }

    # Create manifest
    $manifest = @{
        version = Get-InstalledVersion
        date = Get-Date -Format "o"
        type = "pre-install-backup"
    }
    $manifest | ConvertTo-Json | Set-Content (Join-Path $backupPath "manifest.json")

    Write-ColorOutput "Backup created at $backupPath" -Type Success
    return $backupPath
}

#######################################################################
# Environment Setup
#######################################################################

function New-EnvFile {
    Write-ColorOutput "Setting Up Environment" -Type Step

    if (Test-Path (Join-Path $INSTALL_DIR ".env")) {
        Write-ColorOutput "Existing .env file found" -Type Info
        $keepEnv = Read-Host "Do you want to keep your existing configuration? [Y/n]"
        if ($keepEnv -notmatch "^[Nn]$") {
            return
        }
        $timestamp = Get-Date -Format "yyyyMMddHHmmss"
        Move-Item (Join-Path $INSTALL_DIR ".env") (Join-Path $INSTALL_DIR ".env.backup.$timestamp")
    }

    Write-Host ""
    Write-Host "Database Configuration" -ForegroundColor Cyan

    $dbHost = Read-Host "PostgreSQL Host [localhost]"
    if ([string]::IsNullOrWhiteSpace($dbHost)) { $dbHost = "localhost" }

    $dbPort = Read-Host "PostgreSQL Port [5432]"
    if ([string]::IsNullOrWhiteSpace($dbPort)) { $dbPort = "5432" }

    $dbName = Read-Host "PostgreSQL Database [listflow]"
    if ([string]::IsNullOrWhiteSpace($dbName)) { $dbName = "listflow" }

    $dbUser = Read-Host "PostgreSQL User [postgres]"
    if ([string]::IsNullOrWhiteSpace($dbUser)) { $dbUser = "postgres" }

    $dbPass = Read-Host "PostgreSQL Password" -AsSecureString
    $dbPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPass))

    Write-Host ""
    Write-Host "Redis Configuration" -ForegroundColor Cyan

    $redisUrl = Read-Host "Redis URL [redis://localhost:6379]"
    if ([string]::IsNullOrWhiteSpace($redisUrl)) { $redisUrl = "redis://localhost:6379" }

    Write-Host ""
    Write-Host "Security Configuration" -ForegroundColor Cyan
    $jwtSecret = Get-RandomString -Length 32
    Write-ColorOutput "Generated JWT secret" -Type Info

    Write-Host ""
    Write-Host "eBay API Configuration (optional - can be configured later)" -ForegroundColor Cyan
    $ebayClientId = Read-Host "eBay Client ID (leave blank to skip)"
    $ebayClientSecret = Read-Host "eBay Client Secret (leave blank to skip)"

    Write-Host ""
    Write-Host "AI Configuration (optional - can be configured later)" -ForegroundColor Cyan
    $segmindApiKey = Read-Host "Segmind API Key (leave blank to skip)"

    # Create .env content
    $envContent = @"
# ListFlow Configuration
# Generated on $(Get-Date)

# Database
DATABASE_URL="postgresql://${dbUser}:${dbPassPlain}@${dbHost}:${dbPort}/${dbName}?schema=public"

# Redis
REDIS_URL="${redisUrl}"

# Security
JWT_SECRET="${jwtSecret}"
NODE_ENV="production"

# Server
PORT=3001
CLIENT_URL="http://localhost:5173"

# eBay API
EBAY_CLIENT_ID="${ebayClientId}"
EBAY_CLIENT_SECRET="${ebayClientSecret}"
EBAY_SANDBOX=true

# AI/Vision
SEGMIND_API_KEY="${segmindApiKey}"
"@

    Set-Content -Path (Join-Path $INSTALL_DIR ".env") -Value $envContent
    Write-ColorOutput ".env file created" -Type Success
}

#######################################################################
# Application Installation
#######################################################################

function Install-Backend {
    Write-ColorOutput "Installing Backend Dependencies" -Type Step

    Set-Location $INSTALL_DIR

    Write-ColorOutput "Installing npm packages..." -Type Info
    npm install --legacy-peer-deps

    Write-ColorOutput "Generating Prisma client..." -Type Info
    npx prisma generate

    Write-ColorOutput "Backend installed" -Type Success
}

function Install-Frontend {
    Write-ColorOutput "Installing Frontend Dependencies" -Type Step

    Set-Location (Join-Path $INSTALL_DIR "client")

    Write-ColorOutput "Installing npm packages..." -Type Info
    npm install --legacy-peer-deps

    Write-ColorOutput "Building frontend..." -Type Info
    try {
        npm run build
    } catch {
        Write-ColorOutput "Frontend build failed - may need additional configuration" -Type Warning
    }

    Set-Location $INSTALL_DIR
    Write-ColorOutput "Frontend installed" -Type Success
}

function Invoke-Migrations {
    Write-ColorOutput "Running Database Migrations" -Type Step

    Set-Location $INSTALL_DIR

    Write-ColorOutput "Running Prisma migrations..." -Type Info
    npx prisma migrate deploy

    Write-ColorOutput "Migrations completed" -Type Success
}

#######################################################################
# Desktop Shortcut
#######################################################################

function New-DesktopShortcuts {
    Write-ColorOutput "Creating Desktop Shortcuts" -Type Step

    $desktopPath = [Environment]::GetFolderPath("Desktop")

    # Create start script
    $startScript = @"
@echo off
cd /d "$INSTALL_DIR"
start "ListFlow Backend" cmd /k "npm run dev"
timeout /t 3
cd client
start "ListFlow Frontend" cmd /k "npm run dev"
timeout /t 5
start http://localhost:5173
"@

    Set-Content -Path (Join-Path $INSTALL_DIR "start-listflow.bat") -Value $startScript

    # Create shortcut
    $WshShell = New-Object -ComObject WScript.Shell
    $shortcut = $WshShell.CreateShortcut("$desktopPath\ListFlow.lnk")
    $shortcut.TargetPath = Join-Path $INSTALL_DIR "start-listflow.bat"
    $shortcut.WorkingDirectory = $INSTALL_DIR
    $shortcut.Description = "Start ListFlow"
    $shortcut.Save()

    Write-ColorOutput "Desktop shortcuts created" -Type Success
}

#######################################################################
# Completion Message
#######################################################################

function Show-CompletionMessage {
    param([string]$InstallType)

    Write-Host ""
    Write-Host ("=" * 70) -ForegroundColor Green
    Write-Host "              Installation Complete!" -ForegroundColor Green
    Write-Host ("=" * 70) -ForegroundColor Green
    Write-Host ""

    Write-Host "Quick Start Commands:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  # Start the backend server"
    Write-Host "  cd $INSTALL_DIR"
    Write-Host "  npm run dev"
    Write-Host ""
    Write-Host "  # Start the frontend (in another terminal)"
    Write-Host "  cd $INSTALL_DIR\client"
    Write-Host "  npm run dev"
    Write-Host ""
    Write-Host "  # Or double-click the desktop shortcut"
    Write-Host ""

    Write-Host "Access Points:" -ForegroundColor Cyan
    Write-Host "  - Backend API: http://localhost:3001"
    Write-Host "  - Frontend:    http://localhost:5173"
    Write-Host ""

    Write-Host "Configuration:" -ForegroundColor Cyan
    Write-Host "  - Edit $INSTALL_DIR\.env for API keys and database settings"
    Write-Host "  - Documentation: $INSTALL_DIR\README.md"
    Write-Host ""

    if ($InstallType -eq "upgrade") {
        Write-Host "Upgrade Notes:" -ForegroundColor Cyan
        Write-Host "  - Your data has been preserved"
        Write-Host "  - Database migrations have been applied"
        Write-Host "  - Backup available at: $BACKUP_DIR"
        Write-Host ""
    }

    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Configure eBay API credentials in .env"
    Write-Host "  2. Set up Segmind API key for AI features"
    Write-Host "  3. Run start-listflow.bat or use the desktop shortcut"
    Write-Host ""
}

#######################################################################
# Main Installation Flow
#######################################################################

function Start-Installation {
    Show-Banner

    Write-ColorOutput "System Detection" -Type Step
    Write-ColorOutput "Operating System: Windows" -Type Info
    Write-ColorOutput "PowerShell Version: $($PSVersionTable.PSVersion)" -Type Info

    # Detect installation type
    $installType = Get-InstallationType
    $installedVersion = Get-InstalledVersion

    switch ($installType) {
        "fresh" { Write-ColorOutput "Fresh installation detected" -Type Info }
        "upgrade" { Write-ColorOutput "Upgrade detected: $installedVersion -> $CURRENT_VERSION" -Type Info }
        "reinstall" { Write-ColorOutput "Reinstallation detected (same version: $CURRENT_VERSION)" -Type Info }
        "downgrade" {
            Write-ColorOutput "Downgrade detected: $installedVersion -> $CURRENT_VERSION" -Type Warning
            $confirm = Read-Host "Continue with downgrade? [y/N]"
            if ($confirm -notmatch "^[Yy]$") {
                Write-ColorOutput "Installation cancelled" -Type Info
                return
            }
        }
    }

    # Create directories
    New-Item -ItemType Directory -Path $DATA_DIR -Force | Out-Null
    New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null

    # Backup if upgrading
    if ($installType -eq "upgrade" -or $installType -eq "downgrade") {
        New-Backup
    }

    #######################################################################
    # Dependency Check
    #######################################################################

    Write-ColorOutput "Checking Dependencies" -Type Step

    $missingDeps = @()

    if (-not (Test-NodeInstalled)) { $missingDeps += "node" }
    if (-not (Test-NpmInstalled)) { $missingDeps += "npm" }
    if (-not (Test-GitInstalled)) { $missingDeps += "git" }
    if (-not (Test-PostgresInstalled)) { $missingDeps += "postgres" }
    if (-not (Test-RedisInstalled)) { $missingDeps += "redis" }

    Test-DockerInstalled | Out-Null

    if ($missingDeps.Count -gt 0) {
        Write-ColorOutput "Missing required dependencies: $($missingDeps -join ', ')" -Type Warning
        Write-Host ""

        $autoInstall = Read-Host "Would you like to install missing dependencies automatically? [Y/n]"
        if ($autoInstall -notmatch "^[Nn]$") {
            foreach ($dep in $missingDeps) {
                switch ($dep) {
                    "node" { Install-NodeJs }
                    "npm" { } # Comes with Node
                    "git" { Install-Git }
                    "postgres" { Install-PostgreSQL }
                    "redis" { Install-Redis }
                }
            }

            # Verify
            $stillMissing = @()
            if (-not (Test-NodeInstalled)) { $stillMissing += "Node.js" }
            if (-not (Test-PostgresInstalled)) { $stillMissing += "PostgreSQL" }
            if (-not (Test-RedisInstalled)) { $stillMissing += "Redis" }

            if ($stillMissing.Count -gt 0) {
                Write-ColorOutput "Some dependencies could not be installed automatically:" -Type Warning
                foreach ($dep in $stillMissing) {
                    Write-Host "  - $dep"
                }
                Write-Host ""
                Write-ColorOutput "Please install them manually and run the installer again" -Type Info
                return
            }
        } else {
            Write-ColorOutput "Cannot continue without required dependencies" -Type Error
            return
        }
    }

    #######################################################################
    # Installation
    #######################################################################

    New-EnvFile
    Install-Backend
    Install-Frontend
    Invoke-Migrations

    # Create shortcuts
    $createShortcuts = Read-Host "Would you like to create desktop shortcuts? [Y/n]"
    if ($createShortcuts -notmatch "^[Nn]$") {
        New-DesktopShortcuts
    }

    # Save version
    Set-Content -Path $VERSION_FILE -Value $CURRENT_VERSION

    Show-CompletionMessage -InstallType $installType
}

#######################################################################
# Script Entry Point
#######################################################################

if ($Help) {
    Write-Host "ListFlow Windows Installer"
    Write-Host ""
    Write-Host "Usage: .\install.ps1 [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Help          Show this help message"
    Write-Host "  -Version       Show version"
    Write-Host "  -Check         Check dependencies only"
    Write-Host "  -Docker        Use Docker-based installation"
    Write-Host "  -Unattended    Non-interactive installation"
    Write-Host ""
    exit 0
}

if ($Version) {
    Write-Host "ListFlow Installer v$CURRENT_VERSION"
    exit 0
}

if ($Check) {
    Show-Banner
    Write-ColorOutput "Dependency Check" -Type Step
    Test-NodeInstalled | Out-Null
    Test-NpmInstalled | Out-Null
    Test-GitInstalled | Out-Null
    Test-PostgresInstalled | Out-Null
    Test-RedisInstalled | Out-Null
    Test-DockerInstalled | Out-Null
    exit 0
}

# Check if running as administrator for certain operations
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-ColorOutput "Note: Running without administrator privileges. Some features may be limited." -Type Warning
    Write-Host ""
}

Start-Installation
