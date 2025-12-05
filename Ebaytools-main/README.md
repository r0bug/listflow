# eBay Tools v3.0.0

A comprehensive automation suite for creating eBay listings using AI/LLM technology. This system provides an end-to-end workflow from photo organization to final listing generation with integrated pricing analysis.

## ✨ New in v3.0.0

- 🔍 **Smart Search Modification** - Preview and modify search terms before pricing analysis
- 🔄 **Processing Tags Reset System** - Individual, type-based, and global reset options
- 📋 **Interactive Pricing with User Approval** - Full transparency and research display  
- 🔍 **Professional Research Tools** - Manual verification workflows and third-party service recommendations
- ℹ️ **Version Display in All Applications** - Help > About shows v3.0.0 across suite
- 🛠️ **Complete Installers** - Overwrite previous versions safely with verification
- 🎯 **Enhanced UI Integration** - Reset button and pricing controls in main workflow

## Features

- 🤖 **AI-Powered Description Generation** - Uses LLaVA, Claude, or GPT-4 Vision APIs
- 💰 **Interactive Pricing Analysis** - Research eBay sold listings with user approval
- 🔍 **Smart Search Modification** - Preview and choose from multiple search strategies
- 🔍 **Professional Research Tools** - Manual verification URLs, checklists, and export templates
- 🔄 **Processing Tags Reset** - Reset individual items, by type, or globally
- 📸 **Photo Processing** - Batch image processing with EXIF handling
- 📊 **CSV Export** - Generates eBay-compatible CSV files for bulk uploads
- 📋 **Queue Management** - Organize and process multiple items efficiently
- 🎯 **Complete Workflow** - From setup to final eBay listing
- 🌐 **HTML Gallery Creator** - Create classified ad-style galleries for local sales
- 📱 **Mobile Integration** - Android app for on-the-go photo collection

## Installation

### 🚀 **Single Installers (Recommended)**

Simple, reliable installers for each platform:

#### Windows
```bash
# Run from the main eBay Tools directory (NOT from windows_installer folder)
install.bat
```

#### Linux
```bash
# Single installer for Linux
./install.sh
```

#### macOS  
```bash
# Single installer for macOS
./install_mac.sh
```

### ✨ **What These Installers Do:**
- ✅ **Install Dependencies** - Handles Python packages automatically
- ✅ **Create Application Shortcuts** - Desktop shortcuts for all tools
- ✅ **Configure Application Launchers** - Platform-appropriate batch/shell files
- ✅ **Verify Installation** - Tests that all dependencies work correctly
- ✅ **Setup Data Directories** - Creates folders for logs, exports, config


## Quick Start

1. **Setup Tool** - Create item queues and add photos
   ```bash
   python -m ebay_tools.apps.setup
   ```
   ✨ *Check Help > About to verify version 3.0.0*

2. **Processor Tool** - AI analyzes photos and generates descriptions
   ```bash
   python -m ebay_tools.apps.processor
   ```
   ✨ *Look for "🔄 Reset Tags" button in toolbar for reset functionality*

3. **Viewer Tool** - Review and edit generated descriptions
   ```bash
   python -m ebay_tools.apps.viewer
   ```

4. **Price Analyzer** - Interactive pricing with market research
   ```bash
   python -m ebay_tools.apps.price_analyzer
   ```
   ✨ *User approval required, includes manual verification tools and third-party service recommendations*

5. **Export** - Generate CSV for eBay bulk upload

### 🎯 **New Features to Try:**
- **Reset Processing Tags**: Use "🔄 Reset Tags" button in Processor for individual, type-based, or global resets
- **Interactive Pricing**: Price Analyzer now shows research data and requires user approval
- **Professional Research**: Access manual verification URLs, research checklists, and export templates
- **Third-Party Services**: Get recommendations for ZIK Analytics, WatchCount, and other legitimate tools
- **Version Verification**: Check Help > About in any application to confirm v3.0.0

## Applications

- **Setup Tool** (`setup.py`) - Create and manage work queues  
  *✨ Help > About shows version 3.0.0*
- **Processor Tool** (`processor.py`) - AI-powered photo analysis with reset functionality  
  *✨ Features "🔄 Reset Tags" button for individual, type-based, and global resets*
- **Viewer Tool** (`viewer.py`) - Review and export results  
  *✨ Updated with standardized version display*
- **Price Analyzer** (`price_analyzer.py`) - Interactive market price analysis  
  *✨ User approval workflow with research transparency, manual verification tools, and third-party service recommendations*
- **Main Launcher** (`main_launcher.py`) - Central hub for launching all tools  
  *✨ New centralized launcher with version information*
- **Gallery Creator** (`gallery_creator.py`) - Create HTML classified ad galleries
- **Mobile Import** (`mobile_import.py`) - Import data from mobile app
- **Direct Listing** (`direct_listing.py`) - Direct eBay API integration
- **CSV Export** (`csv_export.py`) - Export to eBay format

### 🔖 **All Applications Feature:**
- **Help > About Menu** - Shows version 3.0.0 and application-specific features
- **Consistent UI** - Standardized menus and dialogs across all tools
- **Error Handling** - Improved error reporting and user feedback

## Requirements

- Python 3.8 or higher
- 4 GB RAM minimum
- Internet connection for API calls
- API keys for LLM services (optional but recommended)

## Documentation

- **[Complete Installer Guide](INSTALLER_README.md)** - New comprehensive installers
- [Full User Manual](eBay_Tools_User_Manual.md) - Comprehensive guide
- [Gallery Creator Guide](GALLERY_README.md) - HTML gallery documentation
- [Mobile Integration Guide](MOBILE_INTEGRATION.md) - Android app and import docs
- [macOS Installation](README_MAC.md) - macOS specific instructions
- [API Documentation](ebay_tools/README.md) - Technical details

### 📋 **Latest Updates:**
- **v3.0.0 Features** - Reset functionality and interactive pricing
- **Complete Installers** - Safe update system with verification
- **Version Display** - All applications show consistent version information

## Project Structure

```
Ebaytools/
├── ebay_tools/              # Main package
│   ├── apps/                # GUI applications
│   ├── core/                # Core functionality
│   └── utils/               # Utility modules (includes version_utils.py)
├── windows_installer/       # Windows installer files
├── install_complete.bat     # ✨ NEW: Complete Windows installer
├── install_complete.sh      # ✨ NEW: Complete Linux installer  
├── install_complete_mac.sh  # ✨ NEW: Complete macOS installer
├── INSTALLER_README.md      # ✨ NEW: Complete installer documentation
├── install_dependencies.py  # Legacy: Dependencies only
├── install_dependencies_mac.sh  # Legacy: macOS dependencies only
└── README.md               # This file
```

### 🆕 **New Files in v3.0.0:**
- **Complete Installers**: `install_complete.bat`, `install_complete.sh`, `install_complete_mac.sh`
- **Installer Documentation**: `INSTALLER_README.md`
- **Version Utilities**: `ebay_tools/utils/version_utils.py`
- **Enhanced Applications**: All GUI apps now have Help > About with version display

## API Configuration

The tool supports multiple LLM providers:

- **LLaVA** - Free, good for basic analysis
- **Claude** - Excellent for detailed descriptions
- **GPT-4 Vision** - Premium quality, requires OpenAI API key

Configure your preferred API in Settings → API Configuration.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

- Report issues on [GitHub Issues](https://github.com/r0bug/Ebaytools/issues)
- Check the [User Manual](eBay_Tools_User_Manual.md) for detailed help
- See platform-specific guides for installation help

## Acknowledgments

- Built with Python and Tkinter
- Uses Pillow for image processing
- BeautifulSoup4 for web scraping
- Supports multiple LLM providers