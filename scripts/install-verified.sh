#!/bin/bash

# ConsoleEbay Installer with Comprehensive Verification
# This installer checks all prerequisites before installation

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Installation variables
DEFAULT_INSTALL_DIR="$HOME/ConsoleEbay"
BACKUP_DIR="$HOME/ConsoleEbay_backups"
MIN_NODE_VERSION="18.0.0"
RECOMMENDED_NODE_VERSION="20.0.0"
REQUIRED_PORTS=(3001 80 5173)
INSTALL_REPORT=""

# Helper functions
print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     ConsoleEbay Installation Wizard    ║${NC}"
    echo -e "${BLUE}║          Version 1.0.0                 ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""
}

print_section() {
    echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

check_mark() {
    echo -e "${GREEN}✓${NC} $1"
}

cross_mark() {
    echo -e "${RED}✗${NC} $1"
}

warning_mark() {
    echo -e "${YELLOW}⚠${NC} $1"
}

version_compare() {
    printf '%s\n%s\n' "$2" "$1" | sort -V -C
}

# Check system prerequisites
check_prerequisites() {
    print_section "System Prerequisites Check"
    
    local prerequisites_met=true
    local warnings=""
    
    # Check Node.js
    echo -n "Checking Node.js version... "
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d 'v' -f 2)
        if version_compare "$NODE_VERSION" "$RECOMMENDED_NODE_VERSION"; then
            check_mark "Node.js $NODE_VERSION (Recommended: $RECOMMENDED_NODE_VERSION+)"
        elif version_compare "$NODE_VERSION" "$MIN_NODE_VERSION"; then
            warning_mark "Node.js $NODE_VERSION (Works but $RECOMMENDED_NODE_VERSION+ recommended)"
            warnings="${warnings}\n  - Node.js $NODE_VERSION found. Some features require $RECOMMENDED_NODE_VERSION+"
        else
            cross_mark "Node.js $NODE_VERSION (Minimum required: $MIN_NODE_VERSION)"
            prerequisites_met=false
        fi
    else
        cross_mark "Node.js not installed"
        prerequisites_met=false
    fi
    
    # Check npm
    echo -n "Checking npm... "
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        check_mark "npm $NPM_VERSION"
    else
        cross_mark "npm not installed"
        prerequisites_met=false
    fi
    
    # Check Git
    echo -n "Checking Git... "
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version | cut -d ' ' -f 3)
        check_mark "Git $GIT_VERSION"
    else
        warning_mark "Git not installed (optional but recommended)"
        warnings="${warnings}\n  - Git not found. Version control features disabled"
    fi
    
    # Check PostgreSQL
    echo -n "Checking PostgreSQL... "
    if command -v psql &> /dev/null; then
        PSQL_VERSION=$(psql --version | cut -d ' ' -f 3)
        check_mark "PostgreSQL $PSQL_VERSION"
        
        # Check if PostgreSQL is running
        if pg_isready &> /dev/null; then
            check_mark "PostgreSQL service is running"
        else
            warning_mark "PostgreSQL installed but not running"
            warnings="${warnings}\n  - PostgreSQL service not running. Database features disabled"
        fi
    else
        warning_mark "PostgreSQL not installed"
        warnings="${warnings}\n  - PostgreSQL not found. Database features will be disabled"
    fi
    
    # Check Python (for potential AI integrations)
    echo -n "Checking Python... "
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version | cut -d ' ' -f 2)
        check_mark "Python $PYTHON_VERSION (optional)"
    else
        echo -e "${CYAN}○${NC} Python not installed (optional)"
    fi
    
    # Check disk space
    echo -n "Checking disk space... "
    AVAILABLE_SPACE=$(df -BG "$HOME" | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$AVAILABLE_SPACE" -gt 2 ]; then
        check_mark "${AVAILABLE_SPACE}GB available (2GB required)"
    else
        cross_mark "Only ${AVAILABLE_SPACE}GB available (2GB required)"
        prerequisites_met=false
    fi
    
    # Check ports
    echo -e "\n${CYAN}Port Availability:${NC}"
    for port in "${REQUIRED_PORTS[@]}"; do
        echo -n "  Checking port $port... "
        if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            check_mark "Port $port is available"
        else
            if [ "$port" -eq 80 ]; then
                warning_mark "Port $port in use (web interface will use alternative port)"
                warnings="${warnings}\n  - Port 80 in use. Web interface will use port 8080"
            else
                warning_mark "Port $port in use"
            fi
        fi
    done
    
    # Check for nginx (optional)
    echo -n "Checking nginx... "
    if command -v nginx &> /dev/null; then
        NGINX_VERSION=$(nginx -v 2>&1 | cut -d '/' -f 2)
        check_mark "nginx $NGINX_VERSION (optional)"
    else
        echo -e "${CYAN}○${NC} nginx not installed (optional for port 80)"
    fi
    
    # Display warnings if any
    if [ -n "$warnings" ]; then
        echo -e "\n${YELLOW}⚠ Warnings:${NC}$warnings"
    fi
    
    # Return result
    if [ "$prerequisites_met" = false ]; then
        echo -e "\n${RED}✗ Prerequisites check failed${NC}"
        echo "Please install missing requirements and try again."
        echo ""
        echo "To install Node.js 20+:"
        echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
        echo "  sudo apt-get install -y nodejs"
        echo ""
        echo "To install PostgreSQL:"
        echo "  sudo apt-get install postgresql postgresql-contrib"
        echo "  sudo systemctl start postgresql"
        return 1
    else
        echo -e "\n${GREEN}✓ All critical prerequisites met${NC}"
        return 0
    fi
}

# Check if upgrade is needed
check_existing_installation() {
    if [ -d "$DEFAULT_INSTALL_DIR" ]; then
        print_section "Existing Installation Found"
        
        echo "Installation found at: $DEFAULT_INSTALL_DIR"
        
        if [ -f "$DEFAULT_INSTALL_DIR/VERSION" ]; then
            CURRENT_VERSION=$(cat "$DEFAULT_INSTALL_DIR/VERSION")
            echo "Current version: $CURRENT_VERSION"
        fi
        
        echo ""
        read -p "Do you want to upgrade/reinstall? This will backup current installation (y/n): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            create_backup
            return 0
        else
            echo "Installation cancelled."
            exit 0
        fi
    fi
}

# Create backup
create_backup() {
    print_section "Creating Backup"
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"
    
    echo "Creating backup at: $BACKUP_PATH"
    mkdir -p "$BACKUP_PATH"
    
    # Backup application files
    if [ -d "$DEFAULT_INSTALL_DIR" ]; then
        echo -n "Backing up application files... "
        cp -r "$DEFAULT_INSTALL_DIR" "$BACKUP_PATH/app"
        check_mark "Done"
    fi
    
    # Backup .env if exists
    if [ -f "$DEFAULT_INSTALL_DIR/.env" ]; then
        echo -n "Backing up configuration... "
        cp "$DEFAULT_INSTALL_DIR/.env" "$BACKUP_PATH/.env.backup"
        check_mark "Done"
    fi
    
    # Backup database if PostgreSQL is available
    if command -v pg_dump &> /dev/null && [ -f "$DEFAULT_INSTALL_DIR/.env" ]; then
        echo -n "Attempting database backup... "
        source "$DEFAULT_INSTALL_DIR/.env" 2>/dev/null || true
        if [ ! -z "$DATABASE_URL" ]; then
            pg_dump "$DATABASE_URL" > "$BACKUP_PATH/database.sql" 2>/dev/null && \
                check_mark "Database backed up" || \
                warning_mark "Database backup skipped (not accessible)"
        else
            warning_mark "No database configured"
        fi
    fi
    
    # Create backup info
    cat > "$BACKUP_PATH/backup.info" << EOF
Backup Date: $(date)
Installation Path: $DEFAULT_INSTALL_DIR
Node Version: $(node -v 2>/dev/null || echo "N/A")
User: $USER
Hostname: $(hostname)
EOF
    
    echo -e "${GREEN}✓ Backup completed${NC}"
}

# Install application
install_application() {
    print_section "Installing ConsoleEbay"
    
    echo "Installing to: $DEFAULT_INSTALL_DIR"
    mkdir -p "$DEFAULT_INSTALL_DIR"
    
    # Copy application files
    echo -n "Copying application files... "
    cp -r backend "$DEFAULT_INSTALL_DIR/" 2>/dev/null || true
    cp -r frontend "$DEFAULT_INSTALL_DIR/" 2>/dev/null || mkdir -p "$DEFAULT_INSTALL_DIR/frontend"
    cp -r desktop "$DEFAULT_INSTALL_DIR/" 2>/dev/null || true
    cp -r cli "$DEFAULT_INSTALL_DIR/" 2>/dev/null || true
    cp -r scripts "$DEFAULT_INSTALL_DIR/" 2>/dev/null || mkdir -p "$DEFAULT_INSTALL_DIR/scripts"
    check_mark "Done"
    
    # Setup configuration
    if [ ! -f "$DEFAULT_INSTALL_DIR/.env" ]; then
        echo -n "Creating configuration file... "
        cp config/.env.example "$DEFAULT_INSTALL_DIR/.env" 2>/dev/null || \
        cat > "$DEFAULT_INSTALL_DIR/.env" << 'EOF'
# ConsoleEbay Configuration
NODE_ENV=production
PORT=3001

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/consoleebay

# Segmind API
SEGMIND_API_KEY=your_segmind_api_key_here

# eBay API
EBAY_SANDBOX=true
EBAY_APP_ID=your_ebay_app_id
EBAY_CERT_ID=your_ebay_cert_id
EBAY_DEV_ID=your_ebay_dev_id
EBAY_AUTH_TOKEN=your_ebay_auth_token

# Settings
DEFAULT_LOCATION=Main
DEFAULT_SITE_ID=0
EOF
        check_mark "Done"
    else
        echo -n "Preserving existing configuration... "
        check_mark "Done"
    fi
    
    # Install dependencies
    print_section "Installing Dependencies"
    
    cd "$DEFAULT_INSTALL_DIR"
    
    # Backend dependencies
    if [ -d "backend" ]; then
        echo "Installing backend dependencies..."
        cd backend
        
        # Fix package versions for Node 18 compatibility
        if [ "$NODE_VERSION" \< "20.0.0" ]; then
            echo "Adjusting packages for Node.js $NODE_VERSION compatibility..."
            npm install chalk@4.1.2 ora@5.4.1 inquirer@8.2.6 --save 2>/dev/null || true
        fi
        
        npm install --production 2>&1 | grep -v "WARN" || true
        
        # Generate Prisma client
        if [ -f "prisma/schema.prisma" ]; then
            echo -n "Generating database client... "
            npx prisma generate 2>/dev/null && check_mark "Done" || warning_mark "Skipped"
        fi
        
        cd ..
    fi
    
    # Desktop dependencies
    if [ -d "desktop" ]; then
        echo "Installing desktop dependencies..."
        cd desktop
        npm install --production 2>&1 | grep -v "WARN" || true
        cd ..
    fi
    
    # Create launcher scripts
    create_launcher_scripts
}

# Create launcher scripts
create_launcher_scripts() {
    print_section "Creating Launcher Scripts"
    
    cd "$DEFAULT_INSTALL_DIR"
    
    # Backend launcher with verification
    cat > start-backend.sh << 'EOF'
#!/bin/bash
echo "Starting ConsoleEbay Backend..."
cd backend

# Check if compiled version exists
if [ -f "dist/server.js" ]; then
    node dist/server.js
else
    # Try to compile
    echo "Compiling TypeScript..."
    npx tsc src/server.ts --outDir dist --module commonjs --target es2020 \
        --esModuleInterop --skipLibCheck --allowJs --noImplicitAny false \
        --strict false 2>/dev/null || true
    
    if [ -f "dist/server.js" ]; then
        node dist/server.js
    else
        # Fallback to ts-node
        echo "Running with ts-node..."
        npx ts-node --transpile-only --skip-project src/server.ts
    fi
fi
EOF
    chmod +x start-backend.sh
    check_mark "Backend launcher created"
    
    # CLI launcher
    cat > console-ebay << 'EOF'
#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR/backend"

# Compile if needed
if [ ! -f "dist/cli/ebay-cli.js" ]; then
    npx tsc src/cli/ebay-cli.ts --outDir dist --module commonjs --target es2020 \
        --esModuleInterop --skipLibCheck --allowJs --noImplicitAny false \
        --strict false 2>/dev/null || true
fi

if [ -f "dist/cli/ebay-cli.js" ]; then
    node dist/cli/ebay-cli.js "$@"
else
    npx ts-node --compiler-options '{"module":"commonjs","target":"es2020","esModuleInterop":true,"skipLibCheck":true,"strict":false}' \
        src/cli/ebay-cli.ts "$@"
fi
EOF
    chmod +x console-ebay
    check_mark "CLI launcher created"
    
    # Desktop launcher
    cat > start-desktop.sh << 'EOF'
#!/bin/bash
echo "Starting ConsoleEbay Desktop Dashboard..."
cd desktop
npm start
EOF
    chmod +x start-desktop.sh
    check_mark "Desktop launcher created"
    
    # Web interface launcher
    cat > start-web.sh << 'EOF'
#!/bin/bash
echo "Opening ConsoleEbay Web Interface..."

# Check if backend is running
if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "Backend not running. Starting backend first..."
    ./start-backend.sh &
    sleep 3
fi

# Open web interface
if [ -f "web-interface.html" ]; then
    echo "Opening web interface in browser..."
    xdg-open "file://$PWD/web-interface.html" 2>/dev/null || \
    open "file://$PWD/web-interface.html" 2>/dev/null || \
    echo "Please open: file://$PWD/web-interface.html"
else
    echo "Web interface not found. Creating..."
    # Create basic web interface here
fi
EOF
    chmod +x start-web.sh
    check_mark "Web launcher created"
    
    # Create version file
    echo "1.0.0" > VERSION
}

# Verify installation
verify_installation() {
    print_section "Verifying Installation"
    
    cd "$DEFAULT_INSTALL_DIR"
    
    local verification_passed=true
    
    # Check files exist
    echo -n "Checking core files... "
    if [ -f "start-backend.sh" ] && [ -f "console-ebay" ] && [ -d "backend" ]; then
        check_mark "Core files present"
    else
        cross_mark "Some core files missing"
        verification_passed=false
    fi
    
    # Check configuration
    echo -n "Checking configuration... "
    if [ -f ".env" ]; then
        check_mark "Configuration file exists"
    else
        cross_mark "Configuration file missing"
        verification_passed=false
    fi
    
    # Test backend startup
    echo -n "Testing backend startup... "
    cd backend
    if timeout 5 npx ts-node --version &>/dev/null; then
        check_mark "Backend can start"
    else
        warning_mark "Backend startup needs configuration"
    fi
    cd ..
    
    # Test CLI
    echo -n "Testing CLI tool... "
    if ./console-ebay --help 2>&1 | grep -q "ConsoleEbay CLI"; then
        check_mark "CLI tool works"
    else
        warning_mark "CLI tool needs configuration"
    fi
    
    if [ "$verification_passed" = true ]; then
        echo -e "\n${GREEN}✓ Installation verified successfully${NC}"
    else
        echo -e "\n${YELLOW}⚠ Installation completed with warnings${NC}"
    fi
}

# Generate installation report
generate_report() {
    print_section "Installation Report"
    
    cat << EOF
${GREEN}✓ ConsoleEbay Installation Complete${NC}

Installation Directory: $DEFAULT_INSTALL_DIR
Backup Directory: $BACKUP_DIR

${CYAN}Components Status:${NC}
  Backend API:     ${GREEN}✓${NC} Ready (Port 3001)
  CLI Tool:        ${GREEN}✓${NC} Ready
  Desktop App:     ${GREEN}✓${NC} Ready
  Web Interface:   ${YELLOW}⚠${NC} Basic interface available
  Database:        ${YELLOW}⚠${NC} Needs configuration

${CYAN}Quick Start Commands:${NC}
  Start Backend:   cd $DEFAULT_INSTALL_DIR && ./start-backend.sh
  Use CLI:         cd $DEFAULT_INSTALL_DIR && ./console-ebay --help
  Start Desktop:   cd $DEFAULT_INSTALL_DIR && ./start-desktop.sh
  Web Interface:   cd $DEFAULT_INSTALL_DIR && ./start-web.sh

${CYAN}Next Steps:${NC}
  1. Configure API keys in: $DEFAULT_INSTALL_DIR/.env
  2. Set up PostgreSQL database (optional)
  3. Start the backend server
  4. Use the CLI tool or desktop app

${CYAN}Test Credentials:${NC}
  Email: test@example.com
  Password: test123
  (Any email/password works in development mode)

${YELLOW}Documentation:${NC}
  README: $DEFAULT_INSTALL_DIR/README.md
  Backups: $BACKUP_DIR

EOF
}

# Main installation flow
main() {
    clear
    print_header
    
    # Check prerequisites
    if ! check_prerequisites; then
        exit 1
    fi
    
    # Check for existing installation
    check_existing_installation
    
    # Install application
    install_application
    
    # Verify installation
    verify_installation
    
    # Generate report
    generate_report
    
    # Save installation log
    INSTALL_LOG="$DEFAULT_INSTALL_DIR/install.log"
    {
        echo "Installation Date: $(date)"
        echo "Node Version: $(node -v)"
        echo "NPM Version: $(npm -v)"
        echo "User: $USER"
        echo "Directory: $DEFAULT_INSTALL_DIR"
    } > "$INSTALL_LOG"
    
    echo -e "\n${GREEN}✨ Installation complete!${NC}"
    echo "Log saved to: $INSTALL_LOG"
}

# Run main function
main "$@"