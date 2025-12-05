#!/bin/bash

# Quick Build Script for ConsoleEbay (bypasses TS errors)
set -e

echo "🚀 Building ConsoleEbay Deployment Package (Quick Mode)..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get version and timestamp
VERSION="1.0.0"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DEPLOY_DIR="deploy/consoleebay-installer"

echo -e "${YELLOW}Building version: $VERSION${NC}"

# Clean and create deploy directory
echo "📦 Creating deploy directory structure..."
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR/{backend,frontend,desktop,cli,scripts,config}

# Copy source files directly (skip TypeScript compilation)
echo "📂 Copying source files..."
cp -r src $DEPLOY_DIR/backend/
cp package.json package-lock.json $DEPLOY_DIR/backend/
cp -r prisma $DEPLOY_DIR/backend/ 2>/dev/null || true
cp .env $DEPLOY_DIR/backend/.env.current 2>/dev/null || true

# Desktop files
cp -r desktop/* $DEPLOY_DIR/desktop/ 2>/dev/null || true

# CLI files
cp -r src/cli $DEPLOY_DIR/cli/ 2>/dev/null || true

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

# Create the main installer script
echo "🔧 Creating installer script..."
cat > $DEPLOY_DIR/install.sh << 'INSTALLER_EOF'
#!/bin/bash

# ConsoleEbay Quick Installer
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  ConsoleEbay Quick Installer${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Default installation directory
DEFAULT_INSTALL_DIR="$HOME/ConsoleEbay"
BACKUP_DIR="$HOME/ConsoleEbay_backups"

# Get installation directory
read -p "Installation directory [$DEFAULT_INSTALL_DIR]: " INSTALL_DIR
INSTALL_DIR=${INSTALL_DIR:-$DEFAULT_INSTALL_DIR}

# Check if already installed and backup if needed
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}⚠️  Found existing installation${NC}"
    read -p "Backup and upgrade? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
        BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"
        echo -e "${YELLOW}📦 Creating backup...${NC}"
        mkdir -p "$BACKUP_PATH"
        cp -r "$INSTALL_DIR" "$BACKUP_PATH/app"
        
        # Save current .env if exists
        if [ -f "$INSTALL_DIR/.env" ]; then
            cp "$INSTALL_DIR/.env" "$BACKUP_PATH/.env.backup"
        fi
        
        # Save metadata
        cat > "$BACKUP_PATH/backup.info" << EOF
Backup Date: $(date)
Installation Path: $INSTALL_DIR
User: $USER
Hostname: $(hostname)
EOF
        echo -e "${GREEN}✅ Backup saved to $BACKUP_PATH${NC}"
    else
        echo "Installation cancelled."
        exit 1
    fi
fi

# Create installation directory
echo -e "${YELLOW}📂 Installing to $INSTALL_DIR...${NC}"
mkdir -p "$INSTALL_DIR"

# Copy all files
cp -r backend "$INSTALL_DIR/"
cp -r desktop "$INSTALL_DIR/"
cp -r cli "$INSTALL_DIR/"
cp -r config "$INSTALL_DIR/" 2>/dev/null || true

# Setup configuration
if [ ! -f "$INSTALL_DIR/.env" ]; then
    cp config/.env.example "$INSTALL_DIR/.env"
    echo -e "${YELLOW}⚠️  Please configure $INSTALL_DIR/.env${NC}"
else
    echo -e "${GREEN}✅ Preserved existing configuration${NC}"
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
cd "$INSTALL_DIR/backend"
npm install --production

cd "$INSTALL_DIR/desktop"
npm install --production

# Generate Prisma client
cd "$INSTALL_DIR/backend"
npx prisma generate

# Create launcher scripts
cd "$INSTALL_DIR"

# Backend launcher
cat > start-backend.sh << 'EOF'
#!/bin/bash
echo "Starting ConsoleEbay Backend..."
cd backend
npx ts-node src/index.ts
EOF
chmod +x start-backend.sh

# Desktop launcher
cat > start-desktop.sh << 'EOF'
#!/bin/bash
echo "Starting ConsoleEbay Desktop..."
cd desktop
npm start
EOF
chmod +x start-desktop.sh

# CLI launcher
cat > console-ebay << 'EOF'
#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR/backend"
npx ts-node ../cli/ebay-cli.ts "$@"
EOF
chmod +x console-ebay

# Create version file
echo "1.0.0" > VERSION

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ Installation Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Installation directory: $INSTALL_DIR"
echo ""
echo "To start:"
echo "  Backend: cd $INSTALL_DIR && ./start-backend.sh"
echo "  Desktop: cd $INSTALL_DIR && ./start-desktop.sh"
echo "  CLI: cd $INSTALL_DIR && ./console-ebay --help"
echo ""
echo "Configure your API keys in: $INSTALL_DIR/.env"
INSTALLER_EOF

chmod +x $DEPLOY_DIR/install.sh

# Create README
cat > $DEPLOY_DIR/README.md << 'EOF'
# ConsoleEbay Quick Installer

## Installation

Run the installer:
```bash
./install.sh
```

## Configuration

Edit the `.env` file in the installation directory with your:
- Segmind API key
- eBay API credentials
- Database connection string

## Running

After installation:
- Backend: `./start-backend.sh`
- Desktop: `./start-desktop.sh`
- CLI: `./console-ebay --help`

## Backups

Automatic backups are created in `~/ConsoleEbay_backups/` when upgrading.
EOF

# Create tarball
echo "📦 Creating installer package..."
cd deploy
PACKAGE_NAME="consoleebay-installer-${VERSION}-${TIMESTAMP}.tar.gz"
tar -czf "$PACKAGE_NAME" consoleebay-installer

echo ""
echo -e "${GREEN}✅ Build complete!${NC}"
echo ""
echo "📦 Installer package: deploy/$PACKAGE_NAME"
echo ""
echo "To test installation:"
echo "  1. Extract: tar -xzf deploy/$PACKAGE_NAME -C /tmp/"
echo "  2. Install: cd /tmp/consoleebay-installer && ./install.sh"
echo ""
echo "Directories created:"
echo "  📁 deploy/consoleebay-installer/ - Installer files"
echo "  📁 ~/ConsoleEbay/                - Will be created on install"
echo "  📁 ~/ConsoleEbay_backups/        - Will store backups"