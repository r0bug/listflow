#!/bin/bash

# Build and Deploy Script for ConsoleEbay
# This script creates a deployable installer package

set -e

echo "🚀 Building ConsoleEbay Deployment Package..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DEPLOY_DIR="deploy/consoleebay-installer"

echo -e "${YELLOW}Building version: $VERSION${NC}"

# Clean deploy directory
echo "📦 Cleaning deploy directory..."
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Build backend
echo "🔨 Building backend..."
npm run build

# Build frontend (skip if not ready)
if [ -d "client" ] && [ -f "client/package.json" ]; then
    echo "🎨 Building frontend..."
    cd client
    npm run build 2>/dev/null || echo "Frontend build skipped"
    cd ..
fi

# Build CLI tool
echo "⌨️  Building CLI tool..."
npx tsc src/cli/ebay-cli.ts --outDir dist/cli --module commonjs --target es2020 --esModuleInterop --skipLibCheck 2>/dev/null || echo "CLI build skipped"

# Copy production files
echo "📂 Copying production files..."
mkdir -p $DEPLOY_DIR/{backend,frontend,desktop,cli,scripts,config}

# Backend files
cp -r dist/* $DEPLOY_DIR/backend/ 2>/dev/null || true
cp package.json package-lock.json $DEPLOY_DIR/backend/
cp -r prisma $DEPLOY_DIR/backend/ 2>/dev/null || true
cp -r src $DEPLOY_DIR/backend/ # Include source for now

# Frontend files (if exists)
if [ -d "client/dist" ]; then
    cp -r client/dist/* $DEPLOY_DIR/frontend/ 2>/dev/null || true
fi

# Desktop files
cp -r desktop/dist $DEPLOY_DIR/desktop/ 2>/dev/null || true
cp -r desktop/views $DEPLOY_DIR/desktop/
cp -r desktop/src $DEPLOY_DIR/desktop/
cp desktop/package.json desktop/package-lock.json $DEPLOY_DIR/desktop/ 2>/dev/null || true

# CLI files
if [ -d "dist/cli" ]; then
    cp -r dist/cli/* $DEPLOY_DIR/cli/ 2>/dev/null || true
else
    cp src/cli/ebay-cli.ts $DEPLOY_DIR/cli/ 2>/dev/null || true
fi

# Configuration templates
echo "📝 Creating configuration templates..."
cat > $DEPLOY_DIR/config/.env.example << 'EOF'
# ConsoleEbay Configuration
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/consoleebay

# Segmind API
SEGMIND_API_KEY=your_segmind_api_key_here

# eBay API (Production)
EBAY_SANDBOX=false
EBAY_APP_ID=your_ebay_app_id
EBAY_CERT_ID=your_ebay_cert_id
EBAY_DEV_ID=your_ebay_dev_id
EBAY_AUTH_TOKEN=your_ebay_auth_token

# PayPal
PAYPAL_EMAIL=your_paypal_email

# Location Settings
DEFAULT_LOCATION=Main
DEFAULT_SITE_ID=0
DEFAULT_POSTAL_CODE=10001
EOF

# Create installer script
echo "🔧 Creating installer script..."
cat > $DEPLOY_DIR/install.sh << 'INSTALLER_EOF'
#!/bin/bash

# ConsoleEbay Installer Script
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  ConsoleEbay Installer${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Default installation directory
DEFAULT_INSTALL_DIR="$HOME/ConsoleEbay"
BACKUP_DIR="$HOME/ConsoleEbay_backups"

# Get installation directory
read -p "Installation directory [$DEFAULT_INSTALL_DIR]: " INSTALL_DIR
INSTALL_DIR=${INSTALL_DIR:-$DEFAULT_INSTALL_DIR}

# Check if already installed
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}⚠️  ConsoleEbay is already installed at $INSTALL_DIR${NC}"
    read -p "Do you want to upgrade? This will backup current installation (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Installation cancelled."
        exit 1
    fi
    
    # Create backup
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"
    echo -e "${YELLOW}📦 Creating backup at $BACKUP_PATH...${NC}"
    mkdir -p "$BACKUP_PATH"
    
    # Backup current installation
    cp -r "$INSTALL_DIR" "$BACKUP_PATH/app"
    
    # Backup database if PostgreSQL is running
    if [ -f "$INSTALL_DIR/.env" ]; then
        set +e  # Don't exit on error for database backup
        source "$INSTALL_DIR/.env"
        if [ ! -z "$DATABASE_URL" ]; then
            echo "Attempting to backup database..."
            pg_dump "$DATABASE_URL" > "$BACKUP_PATH/database.sql" 2>/dev/null || echo "Database backup skipped (not accessible)"
        fi
        set -e
    fi
    
    # Backup conversation logs if they exist
    if [ -d "$HOME/.claude" ]; then
        echo "Backing up conversation logs..."
        cp -r "$HOME/.claude" "$BACKUP_PATH/claude_logs" 2>/dev/null || true
    fi
    
    # Save backup metadata
    cat > "$BACKUP_PATH/backup.info" << EOF
Backup Date: $(date)
Previous Version: $(cat "$INSTALL_DIR/VERSION" 2>/dev/null || echo "unknown")
Installation Path: $INSTALL_DIR
User: $USER
Hostname: $(hostname)
EOF
    
    echo -e "${GREEN}✅ Backup created successfully${NC}"
fi

# Create installation directory
echo -e "${YELLOW}📂 Creating installation directory...${NC}"
mkdir -p "$INSTALL_DIR"

# Copy application files
echo -e "${YELLOW}📋 Copying application files...${NC}"
cp -r backend "$INSTALL_DIR/"
cp -r frontend "$INSTALL_DIR/" 2>/dev/null || mkdir -p "$INSTALL_DIR/frontend"
cp -r desktop "$INSTALL_DIR/"
cp -r cli "$INSTALL_DIR/"
cp -r scripts "$INSTALL_DIR/" 2>/dev/null || mkdir -p "$INSTALL_DIR/scripts"

# Copy configuration if not exists
if [ ! -f "$INSTALL_DIR/.env" ]; then
    echo -e "${YELLOW}⚙️  Setting up configuration...${NC}"
    cp config/.env.example "$INSTALL_DIR/.env"
    echo -e "${YELLOW}Please edit $INSTALL_DIR/.env with your settings${NC}"
else
    echo -e "${GREEN}✅ Preserving existing configuration${NC}"
    # Merge any new config keys from template
    cp config/.env.example "$INSTALL_DIR/.env.new"
fi

# Install Node.js dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
cd "$INSTALL_DIR"

# Backend dependencies
echo "Installing backend dependencies..."
cd backend
npm ci --production 2>/dev/null || npm install --production
cd ..

# Desktop dependencies
echo "Installing desktop dependencies..."
cd desktop
npm ci --production 2>/dev/null || npm install --production
cd ..

# Setup database (if PostgreSQL is available)
if command -v psql &> /dev/null; then
    echo -e "${YELLOW}🗄️  Setting up database...${NC}"
    cd backend
    if [ -f "../.env" ]; then
        cp ../.env .env
        npx prisma generate 2>/dev/null || true
        npx prisma migrate deploy 2>/dev/null || echo "Database migration skipped"
    fi
    cd ..
else
    echo -e "${YELLOW}PostgreSQL not found. Please install PostgreSQL and run database setup manually.${NC}"
fi

# Create version file
echo "1.0.0" > VERSION

# Create start scripts
echo -e "${YELLOW}📝 Creating start scripts...${NC}"

# Main start script
cat > start-backend.sh << 'EOF'
#!/bin/bash
echo "Starting ConsoleEbay backend..."
cd backend
node src/index.js &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
echo "Access the API at http://localhost:3001"
echo "Press Ctrl+C to stop"
wait $BACKEND_PID
EOF
chmod +x start-backend.sh

# Desktop app launcher
cat > start-desktop.sh << 'EOF'
#!/bin/bash
echo "Starting ConsoleEbay Desktop Dashboard..."
cd desktop
npm start
EOF
chmod +x start-desktop.sh

# CLI launcher
cat > console-ebay << 'EOF'
#!/bin/bash
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/backend"
node ../cli/ebay-cli.ts "$@" 2>/dev/null || npx ts-node ../cli/ebay-cli.ts "$@"
EOF
chmod +x console-ebay

# Create systemd service file (but don't install)
cat > consoleebay.service << EOF
[Unit]
Description=ConsoleEbay Server
After=network.target postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR/backend
ExecStart=/usr/bin/node src/index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ Installation Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Installation directory: $INSTALL_DIR"
echo ""
echo "Next steps:"
echo "1. Configure your settings:"
echo "   nano $INSTALL_DIR/.env"
echo ""
echo "2. Set up the database (if using PostgreSQL):"
echo "   cd $INSTALL_DIR/backend"
echo "   npx prisma migrate deploy"
echo ""
echo "3. Start the services:"
echo "   Backend: $INSTALL_DIR/start-backend.sh"
echo "   Desktop: $INSTALL_DIR/start-desktop.sh"
echo "   CLI: $INSTALL_DIR/console-ebay --help"
echo ""
echo "Optional: Install as system service"
echo "   sudo cp $INSTALL_DIR/consoleebay.service /etc/systemd/system/"
echo "   sudo systemctl enable consoleebay"
echo "   sudo systemctl start consoleebay"
echo ""
INSTALLER_EOF

chmod +x $DEPLOY_DIR/install.sh

# Create uninstaller
cat > $DEPLOY_DIR/uninstall.sh << 'EOF'
#!/bin/bash

# ConsoleEbay Uninstaller
set -e

echo "ConsoleEbay Uninstaller"
echo "======================"
echo ""

DEFAULT_INSTALL_DIR="$HOME/ConsoleEbay"
read -p "Installation directory [$DEFAULT_INSTALL_DIR]: " INSTALL_DIR
INSTALL_DIR=${INSTALL_DIR:-$DEFAULT_INSTALL_DIR}

if [ ! -d "$INSTALL_DIR" ]; then
    echo "ConsoleEbay not found at $INSTALL_DIR"
    exit 1
fi

echo "This will remove ConsoleEbay from $INSTALL_DIR"
read -p "Are you sure? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Uninstall cancelled."
    exit 1
fi

# Stop service if running
if systemctl is-active --quiet consoleebay 2>/dev/null; then
    echo "Stopping ConsoleEbay service..."
    sudo systemctl stop consoleebay
    sudo systemctl disable consoleebay
    sudo rm /etc/systemd/system/consoleebay.service
    sudo systemctl daemon-reload
fi

# Create final backup
BACKUP_DIR="$HOME/ConsoleEbay_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_PATH="$BACKUP_DIR/final_backup_$TIMESTAMP"
echo "Creating final backup at $BACKUP_PATH..."
mkdir -p "$BACKUP_PATH"
cp -r "$INSTALL_DIR" "$BACKUP_PATH/app"

# Remove installation
echo "Removing installation..."
rm -rf "$INSTALL_DIR"

echo ""
echo "✅ ConsoleEbay has been uninstalled"
echo "Backups are preserved in $BACKUP_DIR"
EOF
chmod +x $DEPLOY_DIR/uninstall.sh

# Copy additional scripts
mkdir -p $DEPLOY_DIR/scripts
cp scripts/*.sh $DEPLOY_DIR/scripts/ 2>/dev/null || true

# Create README
cat > $DEPLOY_DIR/README.md << 'EOF'
# ConsoleEbay Installer Package

## Quick Start

1. Run the installer:
   ```bash
   ./install.sh
   ```

2. Configure your settings:
   - Edit the `.env` file in the installation directory
   - Add your Segmind API key
   - Add your eBay API credentials
   - Configure your database connection

3. Start the application:
   ```bash
   cd ~/ConsoleEbay
   ./start-backend.sh     # Start backend server
   ./start-desktop.sh     # Start desktop GUI
   ./console-ebay         # Use CLI tool
   ```

## Components

- **Backend API**: REST API server (port 3001)
- **Frontend**: Web interface for mobile photo capture (port 80 via nginx)
- **Desktop**: Electron-based dashboard application
- **CLI**: Command-line tool for processing items

## Directory Structure

```
ConsoleEbay/
├── backend/          # API server and business logic
├── frontend/         # Web interface
├── desktop/          # Electron dashboard
├── cli/              # Command-line tool
├── .env              # Configuration file
└── scripts/          # Utility scripts
```

## Upgrading

Run the installer again. It will:
1. Detect existing installation
2. Create a timestamped backup
3. Preserve your configuration
4. Upgrade the application

## Backups

Backups are stored in `~/ConsoleEbay_backups/` with timestamps.
Each backup contains:
- Complete application files
- Configuration (.env)
- Database dump (if available)
- Conversation logs
- Metadata about the backup

## Uninstalling

Run `./uninstall.sh` to remove the application.
Your backups will be preserved.

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is installed and running
- Check DATABASE_URL in .env file
- Run: `cd backend && npx prisma migrate deploy`

### Port Already in Use
- Change PORT in .env file
- Default is 3001

### Desktop App Won't Start
- Ensure X11 is available (for Linux)
- Check desktop/npm-debug.log for errors

## Support

For issues or questions, check the documentation or logs in the installation directory.
EOF

# Create version info
echo "$VERSION" > $DEPLOY_DIR/VERSION
echo "$TIMESTAMP" > $DEPLOY_DIR/BUILD_TIME

# Create tarball
echo "📦 Creating installer package..."
cd deploy
tar -czf "consoleebay-installer-${VERSION}-${TIMESTAMP}.tar.gz" consoleebay-installer
cd ..

echo ""
echo -e "${GREEN}✅ Build complete!${NC}"
echo ""
echo "Installer package created:"
echo "  📦 deploy/consoleebay-installer-${VERSION}-${TIMESTAMP}.tar.gz"
echo ""
echo "Directory structure:"
echo "  📁 deploy/consoleebay-installer/   - Extracted installer files"
echo "  📁 backups/                         - Backup storage (created during upgrades)"
echo "  📁 installed/                       - For installed app (after installation)"
echo ""
echo "To install:"
echo "  1. Extract: tar -xzf deploy/consoleebay-installer-*.tar.gz -C /tmp/"
echo "  2. Run: cd /tmp/consoleebay-installer && ./install.sh"
echo ""
echo "The installer will create:"
echo "  ~/ConsoleEbay/                      - Installed application"
echo "  ~/ConsoleEbay_backups/              - Automatic backups"