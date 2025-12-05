# eBay Tools - macOS Installation Guide

## Quick Install (Recommended)

If you already have Python 3.8+ installed:

```bash
# Download and run quick installer
./quick_install_mac.sh
```

## Full Installation

For a complete installation with all dependencies:

```bash
# Download and run full installer
./install_dependencies_mac.sh
```

This installer will:
- Install Homebrew (if needed)
- Install Python 3.11 (if needed)
- Install all system dependencies
- Install Python packages
- Create application launchers
- Add desktop shortcut

## Manual Installation

1. **Install Homebrew** (if not installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install Python 3.8+**:
   ```bash
   brew install python@3.11
   ```

3. **Install system dependencies**:
   ```bash
   brew install python-tk jpeg libpng freetype webp
   ```

4. **Install Python packages**:
   ```bash
   pip3 install requests pillow beautifulsoup4
   ```

5. **Run the application**:
   ```bash
   python3 -m ebay_tools.apps.setup
   ```

## Using the Launchers

After installation, you'll find launchers in the `launchers/mac/` directory:

- **eBay Tools.command** - Main menu launcher
- **Setup.command** - Item queue setup
- **Processor.command** - AI image processing  
- **Viewer.command** - Results viewing
- **Price Analyzer.command** - Price analysis
- **Direct Listing.command** - Direct eBay listing
- **CSV Export.command** - Export to CSV

Double-click any `.command` file to launch the application.

## Desktop Shortcut

The installer creates a desktop shortcut called "eBay Tools". Double-click to access the main menu.

## Troubleshooting

### "Cannot be opened because it is from an unidentified developer"

Right-click the `.command` file and select "Open", then click "Open" in the dialog.

### Python not found

Make sure Python is in your PATH:
```bash
echo 'export PATH="/opt/homebrew/opt/python@3.11/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Tkinter not working

Install python-tk:
```bash
brew install python-tk
```

### Permission denied

Make the launcher executable:
```bash
chmod +x launchers/mac/*.command
```

## Requirements

- macOS 10.15 (Catalina) or later
- Python 3.8 or higher
- 4 GB RAM minimum
- 1 GB free disk space

## Apple Silicon (M1/M2) Support

The installer automatically detects and configures for Apple Silicon Macs. Homebrew will be installed in `/opt/homebrew` instead of `/usr/local`.

## Uninstalling

To remove eBay Tools:

1. Delete the eBay Tools folder
2. Remove desktop shortcut
3. Optionally remove Python packages:
   ```bash
   pip3 uninstall requests pillow beautifulsoup4
   ```

## Getting Help

- Check the main [User Manual](eBay_Tools_User_Manual.md)
- Report issues on GitHub
- See [Troubleshooting](#troubleshooting) section above