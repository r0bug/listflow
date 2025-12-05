#!/bin/bash

#######################################################################
# ListFlow - Complete Installer
# Handles fresh installs, upgrades, dependency management, and migrations
#######################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="${INSTALL_DIR:-$(pwd)}"
DATA_DIR="${DATA_DIR:-$INSTALL_DIR/data}"
BACKUP_DIR="${BACKUP_DIR:-$INSTALL_DIR/backups}"
CONFIG_FILE="$INSTALL_DIR/.listflow.config"
VERSION_FILE="$INSTALL_DIR/.listflow.version"
CURRENT_VERSION="1.0.0"

# Minimum versions
MIN_NODE_VERSION="18"
MIN_POSTGRES_VERSION="14"
MIN_REDIS_VERSION="6"

#######################################################################
# Utility Functions
#######################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

compare_versions() {
    # Returns 0 if $1 >= $2, 1 otherwise
    printf '%s\n%s\n' "$2" "$1" | sort -V -C
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

get_os() {
    case "$(uname -s)" in
        Linux*)     echo "linux";;
        Darwin*)    echo "macos";;
        CYGWIN*|MINGW*|MSYS*) echo "windows";;
        *)          echo "unknown";;
    esac
}

get_distro() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo "$ID"
    elif [ -f /etc/debian_version ]; then
        echo "debian"
    elif [ -f /etc/redhat-release ]; then
        echo "rhel"
    else
        echo "unknown"
    fi
}

#######################################################################
# Banner
#######################################################################

show_banner() {
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════════════╗"
    echo "║                                                                   ║"
    echo "║   ██╗     ██╗███████╗████████╗███████╗██╗      ██████╗ ██╗    ██╗ ║"
    echo "║   ██║     ██║██╔════╝╚══██╔══╝██╔════╝██║     ██╔═══██╗██║    ██║ ║"
    echo "║   ██║     ██║███████╗   ██║   █████╗  ██║     ██║   ██║██║ █╗ ██║ ║"
    echo "║   ██║     ██║╚════██║   ██║   ██╔══╝  ██║     ██║   ██║██║███╗██║ ║"
    echo "║   ███████╗██║███████║   ██║   ██║     ███████╗╚██████╔╝╚███╔███╔╝ ║"
    echo "║   ╚══════╝╚═╝╚══════╝   ╚═╝   ╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝  ║"
    echo "║                                                                   ║"
    echo "║              Multi-Tenant eBay Operations Platform                ║"
    echo "║                        Version $CURRENT_VERSION                          ║"
    echo "║                                                                   ║"
    echo "╚═══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

#######################################################################
# Dependency Checking
#######################################################################

check_node() {
    log_info "Checking Node.js..."

    if ! command_exists node; then
        return 1
    fi

    local node_version=$(node -v | sed 's/v//' | cut -d. -f1)
    if [ "$node_version" -lt "$MIN_NODE_VERSION" ]; then
        log_warning "Node.js version $node_version found, but version $MIN_NODE_VERSION+ required"
        return 1
    fi

    log_success "Node.js $(node -v) found"
    return 0
}

check_npm() {
    log_info "Checking npm..."

    if ! command_exists npm; then
        return 1
    fi

    log_success "npm $(npm -v) found"
    return 0
}

check_postgres() {
    log_info "Checking PostgreSQL..."

    if ! command_exists psql; then
        return 1
    fi

    local pg_version=$(psql --version | grep -oE '[0-9]+' | head -1)
    if [ "$pg_version" -lt "$MIN_POSTGRES_VERSION" ]; then
        log_warning "PostgreSQL version $pg_version found, but version $MIN_POSTGRES_VERSION+ required"
        return 1
    fi

    log_success "PostgreSQL $pg_version found"
    return 0
}

check_redis() {
    log_info "Checking Redis..."

    if ! command_exists redis-cli; then
        return 1
    fi

    local redis_version=$(redis-cli --version | grep -oE '[0-9]+\.[0-9]+' | head -1 | cut -d. -f1)
    if [ "$redis_version" -lt "$MIN_REDIS_VERSION" ]; then
        log_warning "Redis version $redis_version found, but version $MIN_REDIS_VERSION+ required"
        return 1
    fi

    log_success "Redis $(redis-cli --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1) found"
    return 0
}

check_docker() {
    log_info "Checking Docker (optional)..."

    if command_exists docker; then
        log_success "Docker $(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1) found"
        return 0
    fi

    return 1
}

check_docker_compose() {
    log_info "Checking Docker Compose (optional)..."

    if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
        log_success "Docker Compose found"
        return 0
    fi

    return 1
}

check_git() {
    log_info "Checking Git..."

    if ! command_exists git; then
        return 1
    fi

    log_success "Git $(git --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1) found"
    return 0
}

#######################################################################
# Dependency Installation
#######################################################################

install_node_linux() {
    local distro=$(get_distro)

    log_info "Installing Node.js $MIN_NODE_VERSION on $distro..."

    case "$distro" in
        ubuntu|debian|linuxmint|pop)
            # Using NodeSource repository
            curl -fsSL https://deb.nodesource.com/setup_${MIN_NODE_VERSION}.x | sudo -E bash -
            sudo apt-get install -y nodejs
            ;;
        fedora|rhel|centos|rocky|almalinux)
            curl -fsSL https://rpm.nodesource.com/setup_${MIN_NODE_VERSION}.x | sudo bash -
            sudo dnf install -y nodejs || sudo yum install -y nodejs
            ;;
        arch|manjaro)
            sudo pacman -S --noconfirm nodejs npm
            ;;
        *)
            log_error "Unsupported distribution: $distro"
            log_info "Please install Node.js $MIN_NODE_VERSION+ manually from https://nodejs.org"
            return 1
            ;;
    esac
}

install_node_macos() {
    log_info "Installing Node.js on macOS..."

    if command_exists brew; then
        brew install node@$MIN_NODE_VERSION
        brew link node@$MIN_NODE_VERSION --force --overwrite
    else
        log_warning "Homebrew not found. Installing Homebrew first..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        brew install node@$MIN_NODE_VERSION
    fi
}

install_postgres_linux() {
    local distro=$(get_distro)

    log_info "Installing PostgreSQL on $distro..."

    case "$distro" in
        ubuntu|debian|linuxmint|pop)
            sudo apt-get update
            sudo apt-get install -y postgresql postgresql-contrib
            sudo systemctl enable postgresql
            sudo systemctl start postgresql
            ;;
        fedora|rhel|centos|rocky|almalinux)
            sudo dnf install -y postgresql-server postgresql-contrib || \
            sudo yum install -y postgresql-server postgresql-contrib
            sudo postgresql-setup --initdb || sudo postgresql-setup initdb
            sudo systemctl enable postgresql
            sudo systemctl start postgresql
            ;;
        arch|manjaro)
            sudo pacman -S --noconfirm postgresql
            sudo -u postgres initdb -D /var/lib/postgres/data
            sudo systemctl enable postgresql
            sudo systemctl start postgresql
            ;;
        *)
            log_error "Unsupported distribution: $distro"
            return 1
            ;;
    esac
}

install_postgres_macos() {
    log_info "Installing PostgreSQL on macOS..."

    if command_exists brew; then
        brew install postgresql@$MIN_POSTGRES_VERSION
        brew services start postgresql@$MIN_POSTGRES_VERSION
    else
        log_error "Homebrew required. Please install from https://brew.sh"
        return 1
    fi
}

install_redis_linux() {
    local distro=$(get_distro)

    log_info "Installing Redis on $distro..."

    case "$distro" in
        ubuntu|debian|linuxmint|pop)
            sudo apt-get update
            sudo apt-get install -y redis-server
            sudo systemctl enable redis-server
            sudo systemctl start redis-server
            ;;
        fedora|rhel|centos|rocky|almalinux)
            sudo dnf install -y redis || sudo yum install -y redis
            sudo systemctl enable redis
            sudo systemctl start redis
            ;;
        arch|manjaro)
            sudo pacman -S --noconfirm redis
            sudo systemctl enable redis
            sudo systemctl start redis
            ;;
        *)
            log_error "Unsupported distribution: $distro"
            return 1
            ;;
    esac
}

install_redis_macos() {
    log_info "Installing Redis on macOS..."

    if command_exists brew; then
        brew install redis
        brew services start redis
    else
        log_error "Homebrew required. Please install from https://brew.sh"
        return 1
    fi
}

install_dependency() {
    local dep=$1
    local os=$(get_os)

    case "$dep" in
        node)
            case "$os" in
                linux) install_node_linux ;;
                macos) install_node_macos ;;
                *) log_error "Unsupported OS for automatic Node.js installation" ;;
            esac
            ;;
        postgres)
            case "$os" in
                linux) install_postgres_linux ;;
                macos) install_postgres_macos ;;
                *) log_error "Unsupported OS for automatic PostgreSQL installation" ;;
            esac
            ;;
        redis)
            case "$os" in
                linux) install_redis_linux ;;
                macos) install_redis_macos ;;
                *) log_error "Unsupported OS for automatic Redis installation" ;;
            esac
            ;;
    esac
}

#######################################################################
# Installation Detection
#######################################################################

detect_installation_type() {
    if [ -f "$VERSION_FILE" ]; then
        local installed_version=$(cat "$VERSION_FILE")

        if [ "$installed_version" = "$CURRENT_VERSION" ]; then
            echo "reinstall"
        elif compare_versions "$CURRENT_VERSION" "$installed_version"; then
            echo "upgrade"
        else
            echo "downgrade"
        fi
    else
        echo "fresh"
    fi
}

get_installed_version() {
    if [ -f "$VERSION_FILE" ]; then
        cat "$VERSION_FILE"
    else
        echo "none"
    fi
}

#######################################################################
# Backup Functions
#######################################################################

create_backup() {
    local backup_name="listflow_backup_$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"

    log_info "Creating backup at $backup_path..."

    mkdir -p "$backup_path"

    # Backup configuration
    if [ -f "$INSTALL_DIR/.env" ]; then
        cp "$INSTALL_DIR/.env" "$backup_path/"
    fi

    if [ -f "$CONFIG_FILE" ]; then
        cp "$CONFIG_FILE" "$backup_path/"
    fi

    # Backup database
    if command_exists pg_dump && [ -n "$DATABASE_URL" ]; then
        log_info "Backing up PostgreSQL database..."
        pg_dump "$DATABASE_URL" > "$backup_path/database.sql" 2>/dev/null || \
            log_warning "Database backup failed (this is normal for fresh installs)"
    fi

    # Backup uploads directory
    if [ -d "$INSTALL_DIR/uploads" ]; then
        log_info "Backing up uploads..."
        cp -r "$INSTALL_DIR/uploads" "$backup_path/"
    fi

    # Create backup manifest
    cat > "$backup_path/manifest.json" << EOF
{
    "version": "$(get_installed_version)",
    "date": "$(date -Iseconds)",
    "type": "pre-install-backup"
}
EOF

    log_success "Backup created at $backup_path"
    echo "$backup_path"
}

#######################################################################
# Migration Functions
#######################################################################

run_migrations() {
    local from_version=$1
    local to_version=$2

    log_step "Running Database Migrations"

    # Generate Prisma client
    log_info "Generating Prisma client..."
    cd "$INSTALL_DIR"
    npx prisma generate

    # Run migrations
    log_info "Running database migrations..."
    npx prisma migrate deploy

    log_success "Migrations completed"
}

migrate_config() {
    local from_version=$1
    local to_version=$2

    log_info "Migrating configuration from $from_version to $to_version..."

    # Version-specific config migrations
    # Add migration logic here as needed

    log_success "Configuration migrated"
}

#######################################################################
# Environment Setup
#######################################################################

setup_env() {
    log_step "Setting Up Environment"

    if [ -f "$INSTALL_DIR/.env" ]; then
        log_info "Existing .env file found"
        read -p "Do you want to keep your existing configuration? [Y/n] " keep_env
        if [[ "$keep_env" =~ ^[Nn]$ ]]; then
            mv "$INSTALL_DIR/.env" "$INSTALL_DIR/.env.backup.$(date +%s)"
            create_env_file
        fi
    else
        create_env_file
    fi
}

create_env_file() {
    log_info "Creating .env configuration file..."

    # Interactive configuration
    echo ""
    echo -e "${CYAN}Database Configuration${NC}"
    read -p "PostgreSQL Host [localhost]: " db_host
    db_host=${db_host:-localhost}

    read -p "PostgreSQL Port [5432]: " db_port
    db_port=${db_port:-5432}

    read -p "PostgreSQL Database [listflow]: " db_name
    db_name=${db_name:-listflow}

    read -p "PostgreSQL User [postgres]: " db_user
    db_user=${db_user:-postgres}

    read -sp "PostgreSQL Password: " db_pass
    echo ""

    echo ""
    echo -e "${CYAN}Redis Configuration${NC}"
    read -p "Redis URL [redis://localhost:6379]: " redis_url
    redis_url=${redis_url:-redis://localhost:6379}

    echo ""
    echo -e "${CYAN}Security Configuration${NC}"
    jwt_secret=$(openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
    log_info "Generated JWT secret"

    echo ""
    echo -e "${CYAN}eBay API Configuration (optional - can be configured later)${NC}"
    read -p "eBay Client ID (leave blank to skip): " ebay_client_id
    read -p "eBay Client Secret (leave blank to skip): " ebay_client_secret

    echo ""
    echo -e "${CYAN}AI Configuration (optional - can be configured later)${NC}"
    read -p "Segmind API Key (leave blank to skip): " segmind_api_key

    # Write .env file
    cat > "$INSTALL_DIR/.env" << EOF
# ListFlow Configuration
# Generated on $(date)

# Database
DATABASE_URL="postgresql://${db_user}:${db_pass}@${db_host}:${db_port}/${db_name}?schema=public"

# Redis
REDIS_URL="${redis_url}"

# Security
JWT_SECRET="${jwt_secret}"
NODE_ENV="production"

# Server
PORT=3001
CLIENT_URL="http://localhost:5173"

# eBay API
EBAY_CLIENT_ID="${ebay_client_id}"
EBAY_CLIENT_SECRET="${ebay_client_secret}"
EBAY_SANDBOX=true

# AI/Vision
SEGMIND_API_KEY="${segmind_api_key}"
EOF

    chmod 600 "$INSTALL_DIR/.env"
    log_success ".env file created"
}

#######################################################################
# Database Setup
#######################################################################

setup_database() {
    log_step "Setting Up Database"

    # Load environment
    if [ -f "$INSTALL_DIR/.env" ]; then
        export $(grep -v '^#' "$INSTALL_DIR/.env" | xargs)
    fi

    # Check if database exists
    local db_name=$(echo "$DATABASE_URL" | grep -oP '(?<=/)[^?]+(?=\?)' | tail -1)
    db_name=${db_name:-listflow}

    log_info "Checking if database '$db_name' exists..."

    if command_exists psql; then
        # Try to create database if it doesn't exist
        sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '$db_name'" | grep -q 1 || {
            log_info "Creating database '$db_name'..."
            sudo -u postgres createdb "$db_name" 2>/dev/null || {
                log_warning "Could not create database automatically"
                log_info "Please create the database manually: createdb $db_name"
            }
        }
    fi
}

#######################################################################
# Application Installation
#######################################################################

install_backend() {
    log_step "Installing Backend Dependencies"

    cd "$INSTALL_DIR"

    log_info "Installing npm packages..."
    npm install --legacy-peer-deps

    log_info "Generating Prisma client..."
    npx prisma generate

    log_success "Backend installed"
}

install_frontend() {
    log_step "Installing Frontend Dependencies"

    cd "$INSTALL_DIR/client"

    log_info "Installing npm packages..."
    npm install --legacy-peer-deps

    log_info "Building frontend..."
    npm run build || log_warning "Frontend build failed - may need additional configuration"

    log_success "Frontend installed"
}

#######################################################################
# Service Setup
#######################################################################

create_systemd_service() {
    log_step "Creating System Services"

    local service_file="/etc/systemd/system/listflow.service"

    if [ -f "$service_file" ]; then
        log_info "Service file already exists"
        return
    fi

    log_info "Creating systemd service..."

    sudo tee "$service_file" > /dev/null << EOF
[Unit]
Description=ListFlow - eBay Operations Platform
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
ExecStart=$(which node) $INSTALL_DIR/dist/server.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=listflow
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    log_success "Systemd service created"

    read -p "Would you like to enable ListFlow to start on boot? [y/N] " enable_service
    if [[ "$enable_service" =~ ^[Yy]$ ]]; then
        sudo systemctl enable listflow
        log_success "Service enabled"
    fi
}

#######################################################################
# Docker Setup (Alternative)
#######################################################################

setup_docker() {
    log_step "Docker Setup"

    if ! check_docker || ! check_docker_compose; then
        log_warning "Docker or Docker Compose not found"
        return 1
    fi

    log_info "Building Docker images..."
    docker-compose build

    log_success "Docker setup complete"
    log_info "Run 'docker-compose up -d' to start services"
}

#######################################################################
# Post-Installation
#######################################################################

save_version() {
    echo "$CURRENT_VERSION" > "$VERSION_FILE"
}

show_completion_message() {
    local install_type=$1

    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                                   ║${NC}"
    echo -e "${GREEN}║              Installation Complete!                               ║${NC}"
    echo -e "${GREEN}║                                                                   ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo -e "${CYAN}Quick Start Commands:${NC}"
    echo ""
    echo "  # Start the backend server"
    echo "  cd $INSTALL_DIR && npm run dev"
    echo ""
    echo "  # Start the frontend (in another terminal)"
    echo "  cd $INSTALL_DIR/client && npm run dev"
    echo ""
    echo "  # Or use Docker"
    echo "  docker-compose up -d"
    echo ""

    echo -e "${CYAN}Access Points:${NC}"
    echo "  - Backend API: http://localhost:3001"
    echo "  - Frontend:    http://localhost:5173"
    echo ""

    echo -e "${CYAN}Configuration:${NC}"
    echo "  - Edit $INSTALL_DIR/.env for API keys and database settings"
    echo "  - Documentation: $INSTALL_DIR/README.md"
    echo ""

    if [ "$install_type" = "upgrade" ]; then
        echo -e "${CYAN}Upgrade Notes:${NC}"
        echo "  - Your data has been preserved"
        echo "  - Database migrations have been applied"
        echo "  - Backup available at: $BACKUP_DIR"
        echo ""
    fi

    echo -e "${YELLOW}Next Steps:${NC}"
    echo "  1. Configure eBay API credentials in .env"
    echo "  2. Set up Segmind API key for AI features"
    echo "  3. Run 'npm run dev' to start development server"
    echo ""
}

#######################################################################
# Main Installation Flow
#######################################################################

main() {
    show_banner

    log_step "System Detection"

    local os=$(get_os)
    local distro=$(get_distro)
    log_info "Operating System: $os"
    log_info "Distribution: $distro"

    # Detect installation type
    local install_type=$(detect_installation_type)
    local installed_version=$(get_installed_version)

    case "$install_type" in
        fresh)
            log_info "Fresh installation detected"
            ;;
        upgrade)
            log_info "Upgrade detected: $installed_version -> $CURRENT_VERSION"
            ;;
        reinstall)
            log_info "Reinstallation detected (same version: $CURRENT_VERSION)"
            ;;
        downgrade)
            log_warning "Downgrade detected: $installed_version -> $CURRENT_VERSION"
            read -p "Continue with downgrade? [y/N] " confirm_downgrade
            if [[ ! "$confirm_downgrade" =~ ^[Yy]$ ]]; then
                log_info "Installation cancelled"
                exit 0
            fi
            ;;
    esac

    # Create directories
    mkdir -p "$DATA_DIR" "$BACKUP_DIR"

    # Backup if upgrading
    if [ "$install_type" = "upgrade" ] || [ "$install_type" = "downgrade" ]; then
        create_backup
    fi

    #######################################################################
    # Dependency Check
    #######################################################################

    log_step "Checking Dependencies"

    local missing_deps=()
    local optional_deps=()

    # Required dependencies
    check_node || missing_deps+=("node")
    check_npm || missing_deps+=("npm")
    check_git || missing_deps+=("git")

    # Database dependencies
    check_postgres || missing_deps+=("postgres")
    check_redis || missing_deps+=("redis")

    # Optional dependencies
    check_docker || optional_deps+=("docker")
    check_docker_compose || optional_deps+=("docker-compose")

    # Handle missing dependencies
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_warning "Missing required dependencies: ${missing_deps[*]}"
        echo ""

        read -p "Would you like to install missing dependencies automatically? [Y/n] " auto_install
        if [[ ! "$auto_install" =~ ^[Nn]$ ]]; then
            for dep in "${missing_deps[@]}"; do
                install_dependency "$dep"
            done

            # Verify installation
            for dep in "${missing_deps[@]}"; do
                case "$dep" in
                    node) check_node || { log_error "Node.js installation failed"; exit 1; } ;;
                    postgres) check_postgres || { log_error "PostgreSQL installation failed"; exit 1; } ;;
                    redis) check_redis || { log_error "Redis installation failed"; exit 1; } ;;
                esac
            done
        else
            log_error "Cannot continue without required dependencies"
            echo ""
            echo "Please install the following manually:"
            for dep in "${missing_deps[@]}"; do
                echo "  - $dep"
            done
            exit 1
        fi
    fi

    if [ ${#optional_deps[@]} -gt 0 ]; then
        log_info "Optional dependencies not found: ${optional_deps[*]}"
        log_info "Docker is optional but recommended for production deployments"
    fi

    #######################################################################
    # Installation
    #######################################################################

    # Environment setup
    setup_env

    # Database setup
    setup_database

    # Install application
    install_backend
    install_frontend

    # Run migrations
    if [ "$install_type" = "upgrade" ] || [ "$install_type" = "downgrade" ]; then
        migrate_config "$installed_version" "$CURRENT_VERSION"
    fi
    run_migrations "$installed_version" "$CURRENT_VERSION"

    # Create systemd service (Linux only)
    if [ "$os" = "linux" ]; then
        read -p "Would you like to create a systemd service? [y/N] " create_service
        if [[ "$create_service" =~ ^[Yy]$ ]]; then
            create_systemd_service
        fi
    fi

    # Docker setup (optional)
    if check_docker && check_docker_compose; then
        read -p "Would you like to build Docker images? [y/N] " use_docker
        if [[ "$use_docker" =~ ^[Yy]$ ]]; then
            setup_docker
        fi
    fi

    # Save version
    save_version

    # Show completion message
    show_completion_message "$install_type"
}

#######################################################################
# Script Entry Point
#######################################################################

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            echo "ListFlow Installer"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --help, -h          Show this help message"
            echo "  --version, -v       Show version"
            echo "  --check             Check dependencies only"
            echo "  --docker            Use Docker-based installation"
            echo "  --unattended        Non-interactive installation"
            echo ""
            exit 0
            ;;
        --version|-v)
            echo "ListFlow Installer v$CURRENT_VERSION"
            exit 0
            ;;
        --check)
            show_banner
            log_step "Dependency Check"
            check_node
            check_npm
            check_git
            check_postgres
            check_redis
            check_docker
            check_docker_compose
            exit 0
            ;;
        --docker)
            DOCKER_INSTALL=true
            shift
            ;;
        --unattended)
            UNATTENDED=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main installation
main
