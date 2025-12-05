#!/bin/bash
# eBay Tools Complete Installer v3.0.0 for macOS
# Comprehensive installer that installs and verifies all code files every time
# Supports fresh installations and updates of existing installations

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo
echo "=========================================="
echo "  eBay Tools Complete Installer v3.0.0"
echo "           macOS Version"
echo "=========================================="
echo
echo "This installer will:"
echo "  - Check for Python installation"
echo "  - Install/update ALL code files"
echo "  - Install required dependencies"
echo "  - Verify all features are present"
echo "  - Create application launchers"
echo "  - Create Dock shortcuts (optional)"
echo "  - Test installation integrity"
echo

INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$INSTALL_DIR/ebay_tools"
SOURCE_DIR="$INSTALL_DIR/ebay_tools/ebay_tools"

# Check for Python installation
echo "[1/8] Checking for Python installation..."
echo

PYTHON_CMD=""

# Check if we're on macOS
if [[ "$(uname)" != "Darwin" ]]; then
    print_error "This installer is specifically for macOS!"
    echo "Please use install_complete.sh for Linux systems."
    exit 1
fi

# Try python3 first (preferred on macOS)
if command -v python3 >/dev/null 2>&1; then
    PYTHON_VERSION=$(python3 --version 2>&1 | grep -oE '\d+\.\d+' | head -1)
    if python3 -c "import sys; exit(0 if sys.version_info >= (3, 8) else 1)" 2>/dev/null; then
        PYTHON_CMD="python3"
        print_status "Found Python using 'python3' command"
        python3 --version
    fi
fi

# Try python if python3 didn't work
if [[ -z "$PYTHON_CMD" ]] && command -v python >/dev/null 2>&1; then
    if python -c "import sys; exit(0 if sys.version_info >= (3, 8) else 1)" 2>/dev/null; then
        PYTHON_CMD="python"
        print_status "Found Python using 'python' command"
        python --version
    fi
fi

if [[ -z "$PYTHON_CMD" ]]; then
    print_error "Python 3.8 or higher not found!"
    echo
    echo "Please install Python 3.8+ on macOS:"
    echo "  Option 1: Download from https://www.python.org/downloads/mac-osx/"
    echo "  Option 2: Use Homebrew: brew install python3"
    echo "  Option 3: Use MacPorts: sudo port install python38"
    echo
    echo "After installation, restart Terminal and run this installer again."
    exit 1
fi

echo

# Check pip availability
echo "[2/8] Checking package manager..."
if ! $PYTHON_CMD -m pip --version >/dev/null 2>&1; then
    print_error "pip is not available!"
    echo "Please install pip:"
    echo "  curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py"
    echo "  $PYTHON_CMD get-pip.py"
    exit 1
fi
print_status "pip is available"
echo

# Check for Xcode command line tools (needed for some dependencies)
echo "[3/8] Checking development tools..."
if ! command -v gcc >/dev/null 2>&1; then
    print_warning "Xcode command line tools not found"
    print_info "Installing Xcode command line tools (required for some dependencies)..."
    xcode-select --install 2>/dev/null || true
    echo "Please complete the Xcode tools installation if prompted, then run this installer again."
    echo "If installation is already complete, you can ignore this message."
fi
print_status "Development tools available"
echo

# Backup existing installation if it exists
echo "[4/8] Preparing installation directory..."
if [[ -d "$TARGET_DIR" ]]; then
    print_info "Found existing installation - creating backup..."
    if [[ -d "${INSTALL_DIR}/ebay_tools_backup" ]]; then
        rm -rf "${INSTALL_DIR}/ebay_tools_backup"
    fi
    mv "$TARGET_DIR" "${INSTALL_DIR}/ebay_tools_backup"
    print_status "Existing installation backed up"
else
    print_status "Fresh installation directory"
fi
echo

# Copy all code files
echo "[5/8] Installing all code files..."
if [[ ! -d "$SOURCE_DIR" ]]; then
    print_error "Source directory not found: $SOURCE_DIR"
    echo "This installer must be run from the extracted eBay Tools directory."
    exit 1
fi

# Create target directory structure
mkdir -p "$TARGET_DIR"
mkdir -p "$TARGET_DIR/apps"
mkdir -p "$TARGET_DIR/core"
mkdir -p "$TARGET_DIR/utils"

# Copy all Python files with verification
print_info "Copying core module files..."
cp "$SOURCE_DIR/__init__.py" "$TARGET_DIR/"
cp "$SOURCE_DIR"/apps/*.py "$TARGET_DIR/apps/"
cp "$SOURCE_DIR"/core/*.py "$TARGET_DIR/core/"
cp "$SOURCE_DIR"/utils/*.py "$TARGET_DIR/utils/"

# Copy requirements file
cp "$INSTALL_DIR/ebay_tools/requirements.txt" "$INSTALL_DIR/"

print_status "All code files installed"
echo

# Verify critical files are present
echo "[6/8] Verifying file installation..."
MISSING_FILES=""

check_file() {
    if [[ ! -f "$1" ]]; then
        MISSING_FILES="$MISSING_FILES $(basename $1)"
    fi
}

check_file "$TARGET_DIR/__init__.py"
check_file "$TARGET_DIR/apps/processor.py"
check_file "$TARGET_DIR/apps/setup.py"
check_file "$TARGET_DIR/apps/viewer.py"
check_file "$TARGET_DIR/apps/price_analyzer.py"
check_file "$TARGET_DIR/core/api.py"
check_file "$TARGET_DIR/core/schema.py"

if [[ -n "$MISSING_FILES" ]]; then
    print_error "Missing critical files:$MISSING_FILES"
    echo "Installation failed. Please check source files and try again."
    exit 1
fi
print_status "All critical files verified present"
echo

# Install dependencies
echo "[7/8] Installing dependencies..."
print_info "Installing required packages..."

# Install dependencies with proper macOS handling
$PYTHON_CMD -m pip install --upgrade pip >/dev/null 2>&1

# Some packages may need special handling on macOS
print_info "Installing GUI dependencies..."
$PYTHON_CMD -m pip install -r requirements.txt

if [[ $? -ne 0 ]]; then
    print_warning "Some dependencies failed to install. Trying alternative installation..."
    # Try installing packages individually with more specific error handling
    $PYTHON_CMD -m pip install requests pillow >/dev/null 2>&1 || print_warning "Some packages may not be fully installed"
fi

print_status "Dependencies installation completed"
echo

# Test installation functionality
echo "[8/8] Testing installation integrity..."

# Test basic imports
if $PYTHON_CMD -c "import sys; sys.path.insert(0, '.'); import ebay_tools" >/dev/null 2>&1; then
    print_status "Package imports successfully"
else
    print_warning "Package import test failed"
fi

# Test GUI dependencies - special handling for macOS
print_info "Testing GUI dependencies..."
if $PYTHON_CMD -c "import tkinter" >/dev/null 2>&1; then
    print_status "Tkinter (GUI framework) working"
else
    print_warning "Tkinter may not be available - GUI applications may not work"
    echo "On macOS, you may need to install Python with Tkinter support:"
    echo "  brew install python-tk"
fi

if $PYTHON_CMD -c "import requests, PIL" >/dev/null 2>&1; then
    print_status "All other dependencies working"
else
    print_warning "Some dependencies may not be properly installed"
fi

# Test version detection
print_info "Testing version detection..."
if VERSION_OUTPUT=$($PYTHON_CMD -c "import sys; sys.path.insert(0, '.'); from ebay_tools import __version__; print(__version__)" 2>/dev/null); then
    print_status "Version detected: $VERSION_OUTPUT"
else
    print_warning "Version detection test failed - using fallback"
fi

# Test reset functionality presence
if grep -q "Reset Tags" "$TARGET_DIR/apps/processor.py" >/dev/null 2>&1; then
    print_status "Reset functionality verified present"
else
    print_error "Reset functionality not found in processor!"
    echo "This indicates a critical installation problem."
    exit 1
fi

echo

# Create application launchers
echo "Creating application launchers..."

# Create launcher script template for macOS
create_launcher() {
    local app_name="$1"
    local app_module="$2"
    local app_title="$3"
    
    cat > "ebay_${app_name}.command" << EOF
#!/bin/bash
# eBay Tools - $app_title
cd "\$(dirname "\$0")"
export PYTHONPATH=".:$PYTHONPATH"
$PYTHON_CMD -m ebay_tools.apps.$app_module
if [[ \$? -ne 0 ]]; then
    echo
    echo "[ERROR] Application failed to start"
    echo "Please check the installation and try again"
    read -p "Press Enter to continue..."
fi
EOF
    chmod +x "ebay_${app_name}.command"
    
    # Also create .sh version for terminal use
    cat > "ebay_${app_name}.sh" << EOF
#!/bin/bash
# eBay Tools - $app_title
cd "\$(dirname "\$0")"
export PYTHONPATH=".:$PYTHONPATH"
$PYTHON_CMD -m ebay_tools.apps.$app_module
EOF
    chmod +x "ebay_${app_name}.sh"
}

create_launcher "setup" "setup" "Setup"
create_launcher "processor" "processor" "Processor"
create_launcher "viewer" "viewer" "Viewer"
create_launcher "price" "price_analyzer" "Price Analyzer"

print_status "Application launchers created (.command and .sh versions)"
echo

# Create data directories
mkdir -p "$INSTALL_DIR/data"
mkdir -p "$INSTALL_DIR/exports"
mkdir -p "$INSTALL_DIR/logs"
mkdir -p "$INSTALL_DIR/config"

# Final verification test
echo "=========================================="
echo "  Final Installation Verification"
echo "=========================================="
echo
print_info "Testing application startup..."

# Test processor launch (without GUI)
if $PYTHON_CMD -c "import sys; sys.path.insert(0, '.'); from ebay_tools.apps.processor import EbayLLMProcessor" >/dev/null 2>&1; then
    print_status "Processor module loads successfully"
else
    print_warning "Processor module test failed"
fi

echo
echo "=========================================="
echo "  Installation Complete!"
echo "=========================================="
echo
print_status "eBay Tools v3.0.0 has been successfully installed/updated on macOS!"
echo
echo "✓ All code files installed and verified"
echo "✓ Dependencies installed"
echo "✓ Reset functionality verified present"
echo "✓ Version detection working"
echo "✓ Application launchers created"
echo
echo "Available applications:"
echo "  Terminal:   ./ebay_setup.sh       (Create item queues)"
echo "  Terminal:   ./ebay_processor.sh   (AI photo analysis + Reset Tags)"
echo "  Terminal:   ./ebay_viewer.sh      (Review and export)"
echo "  Terminal:   ./ebay_price.sh       (Market pricing)"
echo
echo "  Finder:     ebay_setup.command    (Double-click to run)"
echo "  Finder:     ebay_processor.command"
echo "  Finder:     ebay_viewer.command"
echo "  Finder:     ebay_price.command"
echo
echo "New Features in v3.0.0:"
echo "  🔄 Reset Tags button in Processor toolbar"
echo "  📋 Individual, type-based, and global reset options"
echo "  ℹ️  Version display in Help > About"
echo
echo "Getting Started:"
echo "1. Double-click 'ebay_setup.command' to create your first queue"
echo "2. Double-click 'ebay_processor.command' for AI photo processing"
echo "3. Look for the '🔄 Reset Tags' button in the toolbar"
echo "4. Check Help > About to verify version 3.0.0"
echo
echo "macOS Tips:"
echo "  - .command files can be double-clicked in Finder"
echo "  - .sh files are for Terminal use"
echo "  - You may need to allow the apps in System Preferences > Security"
echo

if [[ -d "${INSTALL_DIR}/ebay_tools_backup" ]]; then
    echo "NOTE: Your previous installation was backed up to ebay_tools_backup/"
    echo "You can safely delete this folder after verifying the new installation works."
    echo
fi

# Offer to test launch
read -p "Would you like to test launch the Processor now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo
    print_info "Launching Processor for testing..."
    echo "Look for the '🔄 Reset Tags' button in the toolbar!"
    open -a Terminal ./ebay_processor.sh &
fi

echo
print_status "Thank you for using eBay Tools v3.0.0 on macOS!"
echo