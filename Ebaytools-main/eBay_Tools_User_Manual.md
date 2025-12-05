# eBay Tools - Complete User Manual

## Table of Contents
1. [Overview](#overview)
2. [Installation](#installation)
3. [Getting Started](#getting-started)
4. [Applications Guide](#applications-guide)
5. [Workflows](#workflows)
6. [Configuration](#configuration)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Features](#advanced-features)

---

## Overview

eBay Tools is a comprehensive automation suite designed to streamline eBay listing creation using AI/LLM technology. The system provides an end-to-end workflow from photo organization to final listing generation, with integrated pricing analysis capabilities.

### Key Features
- **AI-Powered Description Generation**: Uses LLaVA, Claude, or GPT-4 Vision APIs
- **Automated Price Analysis**: Analyzes eBay sold listings for market pricing
- **Photo Processing**: Batch image processing with EXIF handling and thumbnails
- **CSV Export**: Generates eBay-compatible CSV files for bulk uploads
- **Queue Management**: Organize and process multiple items efficiently
- **Complete Workflow**: From setup to final eBay listing

---

## Installation

### Requirements
- **Python 3.8 or higher**
- **Internet connection** for API calls
- **API keys** for LLM services (optional but recommended)

### Quick Installation

#### Windows Users
1. Download the project files
2. Run `create_windows_installer.bat`
3. Follow the automated installation process
4. Desktop shortcuts will be created automatically

#### Manual Installation
1. Clone or download the project:
   ```bash
   git clone [repository] ebay_tools
   cd ebay_tools
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Test installation:
   ```bash
   python -m ebay_tools.apps.setup
   ```

### Dependencies
- `requests` - HTTP requests
- `pillow` - Image processing
- `beautifulsoup4` - Web scraping
- `tkinter` - GUI (usually included with Python)

---

## Getting Started

### First Time Setup

1. **Launch Setup Tool**:
   - Windows: Use desktop shortcut "eBay Tools - Setup"
   - Manual: `python -m ebay_tools.apps.setup`

2. **Configure API Settings** (Optional):
   - Open Settings → API Configuration
   - Add your preferred LLM API key (LLaVA, Claude, or OpenAI)
   - Save configuration

3. **Create Your First Queue**:
   - Click "New Queue"
   - Choose a project name and folder
   - Start adding items

### Basic Workflow

```
Setup Tool → Processor Tool → Viewer Tool → CSV Export → eBay Upload
```

1. **Setup**: Create items, attach photos, set basic info
2. **Process**: AI analyzes photos and generates descriptions
3. **Review**: Edit and finalize descriptions
4. **Export**: Generate eBay-compatible CSV files
5. **Upload**: Use CSV for bulk eBay listing

---

## Applications Guide

### 1. Setup Tool (`setup.py`)

**Purpose**: Create and manage work queues for eBay items

#### Key Features:
- Item queue creation and management
- Photo attachment and organization
- Basic item information entry
- Item specifics management
- Photo context assignment

#### How to Use:

1. **Create New Queue**:
   - File → New Queue
   - Choose project name and location
   - Set default category and condition

2. **Add Items**:
   - Click "Add Item"
   - Enter SKU and basic title
   - Set price and category
   - Add photos by clicking "Add Photos"

3. **Configure Photos**:
   - Select which photos to process
   - Set photo contexts (main, detail, packaging, etc.)
   - Organize photo order

4. **Set Item Specifics**:
   - Fill in relevant item details
   - Use consistent categories for better results

5. **Save Queue**:
   - File → Save Queue
   - Queue is ready for processing

#### Tips:
- Use consistent SKU formats for organization
- Add multiple photos for better AI analysis
- Set accurate categories for pricing analysis

---

### 2. Processor Tool (`processor.py`)

**Purpose**: AI-powered photo analysis and description generation

#### Key Features:
- Multi-API support (LLaVA, Claude, GPT-4 Vision)
- Batch photo processing
- Description generation from images
- Item specifics extraction
- Integrated price analysis
- Background processing with progress tracking

#### How to Use:

1. **Load Queue**:
   - File → Load Queue
   - Select queue file created in Setup Tool

2. **Configure Processing**:
   - **API Settings**: Choose LLM provider and configure
   - **Processing Options**:
     - ☑ Photo Processing (analyze images)
     - ☑ Analyze Pricing (get market prices)
     - ☑ Final Description Generation (compile results)

3. **Process Items**:
   - **Automatic**: Click "Process All Items"
   - **Manual**: Select items and click "Process Selected"
   - **Individual**: Double-click item for manual processing

4. **Monitor Progress**:
   - Progress bar shows overall completion
   - Log panel shows detailed processing status
   - Background processing allows continued work

5. **Review Results**:
   - Generated descriptions appear in text area
   - Pricing analysis shows in dedicated panel
   - Edit descriptions as needed

#### Processing Options Explained:

- **Photo Processing**: AI analyzes each photo and extracts details
- **Analyze Pricing**: Searches eBay sold listings for similar items
- **Final Description Generation**: Compiles all analysis into final description

#### API Configuration:
- **LLaVA**: Free, good for basic analysis
- **Claude**: Excellent for detailed descriptions
- **GPT-4 Vision**: Premium quality, requires OpenAI API key

---

### 3. Viewer Tool (`viewer.py`)

**Purpose**: Review, edit, and export processed items

#### Key Features:
- Item browsing and filtering
- Description review and editing
- Photo viewing
- CSV export for eBay bulk upload
- Individual description export

#### How to Use:

1. **Load Processed Queue**:
   - File → Load Queue
   - Select queue that has been processed

2. **Browse Items**:
   - Use navigation buttons or item list
   - Filter by status or category
   - View photos and descriptions

3. **Edit Descriptions**:
   - Click in description area to edit
   - Use formatting tools if available
   - Save changes automatically

4. **Export Options**:
   - **CSV Export**: File → Export CSV (for eBay bulk upload)
   - **Individual Export**: Right-click item → Export Description
   - **Backup**: File → Save Queue

#### Export Formats:
- **eBay CSV**: Compatible with eBay's bulk listing tool
- **HTML Descriptions**: Separate files for complex formatting
- **Text Files**: Simple description files

---

### 4. Price Analyzer (`price_analyzer.py`)

**Purpose**: Analyze eBay pricing based on sold listings

#### Key Features:
- Automated sold listing analysis
- Price statistics and recommendations
- Markup calculation
- Integration with processor workflow
- Standalone pricing analysis

#### How to Use:

1. **Standalone Mode**:
   - Launch Price Analyzer directly
   - Enter search terms for similar items
   - Click "Analyze Pricing"
   - Review price recommendations

2. **Integrated Mode**:
   - Enable "Analyze Pricing" in Processor Tool
   - Pricing analysis happens automatically
   - Results appear in pricing panel

#### Understanding Results:
- **Average Price**: Mean of sold listings
- **Median Price**: Middle value (more reliable)
- **Recommended Price**: Suggested listing price
- **Markup Percentage**: Profit margin calculation
- **Sample Size**: Number of sold listings analyzed

---

### 5. CSV Export Tool (`csv_export.py`)

**Purpose**: Export item data to eBay-compatible CSV format

#### Features:
- eBay CSV format compliance
- HTML description file generation
- Default value templates
- Batch export processing

#### Column Mapping:
```
SKU → Custom Label
Title → Title
Category → Category
Price → Start Price
Description → Description (HTML file reference)
Photos → Image URLs
Specifics → Item Specifics
```

---

### 6. Direct Listing Tool (`direct_listing.py`)

**Purpose**: Direct eBay API integration for listing creation

#### Features:
- Direct eBay API listing creation
- Real-time listing status
- API authentication management

**Note**: Requires eBay Developer Account and API credentials.

---

## Workflows

### Complete Automation Workflow

**Best for**: High-volume listing with minimal manual review

1. **Setup Phase**:
   - Create queue in Setup Tool
   - Add all items with photos
   - Set basic information (SKU, title, category, price)

2. **Processing Phase**:
   - Load queue in Processor Tool
   - Enable all processing options:
     - ☑ Photo Processing
     - ☑ Analyze Pricing
     - ☑ Final Description Generation
   - Click "Process All Items"
   - Let system run (can take several minutes per item)

3. **Review Phase**:
   - Load processed queue in Viewer Tool
   - Quick review of generated descriptions
   - Make minimal edits if needed

4. **Export Phase**:
   - Export to CSV format
   - Upload CSV to eBay using their bulk listing tool

### Manual Review Workflow

**Best for**: High-quality listings with detailed review

1. **Setup Phase**: Same as automation workflow

2. **Careful Processing Phase**:
   - Load queue in Processor Tool
   - Process items one at a time
   - Review each generated description
   - Edit and refine as needed
   - Save progress frequently

3. **Detailed Review Phase**:
   - Use Viewer Tool for final review
   - Polish descriptions and formatting
   - Verify all item specifics

4. **Export Phase**: Same as automation workflow

### Price Analysis Only Workflow

**Best for**: Existing listings that need pricing updates

1. Launch Price Analyzer tool directly
2. Enter item search terms
3. Review price analysis results
4. Apply pricing to existing listings

### Custom Integration Workflow

**Best for**: Developers or advanced users

1. Use individual modules programmatically
2. Call specific functions from your own scripts
3. Integrate with existing systems

---

## Configuration

### API Configuration

Navigate to Settings → API Configuration in any tool:

#### LLaVA (Free):
- No API key required
- Good performance for basic analysis
- May have slower response times

#### Claude (Anthropic):
- Requires Anthropic API key
- Excellent for detailed descriptions
- Good balance of quality and speed

#### OpenAI GPT-4 Vision:
- Requires OpenAI API key
- Premium quality analysis
- Higher cost per request

### Default Settings

#### Image Processing:
- **Thumbnail Size**: 800x600 (default)
- **Image Quality**: 85% compression
- **Supported Formats**: JPG, PNG, WebP

#### Processing Options:
- **Request Delay**: 2 seconds between API calls
- **Retry Attempts**: 3 attempts for failed requests
- **Timeout**: 30 seconds per request

#### Export Settings:
- **CSV Format**: eBay compatible
- **Description Format**: HTML with fallback to text
- **File Organization**: By SKU or category

### File Locations

```
ebay_tools/
├── data/           # Queue files and exports
├── logs/           # Application logs
├── config/         # Configuration files
├── cache/          # Temporary files and cache
└── exports/        # Generated CSV and HTML files
```

---

## Troubleshooting

### Common Issues

#### Installation Problems

**Python Not Found**:
- Ensure Python 3.8+ is installed
- Check Python is in system PATH
- Try reinstalling Python with "Add to PATH" option

**Missing Dependencies**:
```bash
pip install requests pillow beautifulsoup4
```

**Permission Errors**:
- Run command prompt as Administrator (Windows)
- Use `sudo` for system-wide installation (Linux/Mac)

#### API Issues

**API Key Not Working**:
- Verify API key is correct
- Check account has sufficient credits
- Ensure API key has proper permissions

**Slow Processing**:
- Check internet connection
- Try different API provider
- Reduce image sizes in settings

**Rate Limiting**:
- Increase delay between requests in settings
- Use fewer concurrent requests
- Consider upgrading API plan

#### Interface Issues

**Window Too Small**:
- Use Window → Reset Size menu option
- Try different screen resolution
- Manually resize window components

**Photos Not Loading**:
- Check file permissions
- Verify image file formats (JPG, PNG supported)
- Try copying images to project folder

**CSV Export Problems**:
- Ensure write permissions to export folder
- Check available disk space
- Verify no special characters in filenames

### Error Messages

#### "Queue file not found"
- Verify queue file path is correct
- Check file wasn't moved or deleted
- Create new queue if necessary

#### "API request failed"
- Check internet connection
- Verify API key configuration
- Try again after short delay

#### "Image processing error"
- Check image file integrity
- Try different image format
- Reduce image file size

### Getting Help

1. **Check Logs**: Look in `logs/` folder for detailed error information
2. **Reset Configuration**: Delete `config/` folder to reset all settings
3. **Restart Application**: Close and reopen the problematic tool
4. **Update Dependencies**: Run `pip install --upgrade -r requirements.txt`

---

## Advanced Features

### Batch Processing

#### Large Queues:
- Process items in smaller batches
- Use background processing
- Save progress frequently
- Monitor system resources

#### Optimization Tips:
- Process during off-peak hours for better API response
- Use SSD storage for better file I/O performance
- Close other applications to free memory

### Custom Templates

#### Description Templates:
Create custom description templates in `config/templates/`:

```html
<!-- custom_template.html -->
<h2>{{title}}</h2>
<p>{{description}}</p>
<ul>
{{#item_specifics}}
<li><strong>{{key}}:</strong> {{value}}</li>
{{/item_specifics}}
</ul>
```

#### CSV Templates:
Customize CSV export format by editing `config/csv_template.json`

### API Integration

#### Custom API Endpoints:
Add support for additional LLM providers by extending `core/api.py`

#### Webhook Integration:
Configure webhooks for processing completion notifications

### Scripting and Automation

#### Command Line Usage:
```bash
# Process specific queue
python -m ebay_tools.apps.processor --queue "my_items.json" --auto

# Export to CSV
python -m ebay_tools.apps.csv_export --queue "processed_items.json"

# Batch price analysis
python -m ebay_tools.apps.price_analyzer --search "vintage camera" --export
```

#### Python Integration:
```python
from ebay_tools.core.api import LLMClient
from ebay_tools.core.schema import EbayItem

# Create client
client = LLMClient("claude")

# Process single item
item = EbayItem.from_files(["photo1.jpg", "photo2.jpg"])
description = client.generate_description(item)
```

### Performance Optimization

#### Memory Usage:
- Process large queues in smaller batches
- Clear cache regularly
- Monitor memory usage during processing

#### Speed Optimization:
- Use faster API endpoints when available
- Enable image compression
- Reduce image resolution for analysis

#### Reliability:
- Enable automatic backups
- Use error recovery options
- Set appropriate retry limits

---

## Quick Reference

### Application Launch Commands

```bash
# Setup Tool - Create and manage item queues
python -m ebay_tools.apps.setup

# Processor Tool - AI-powered processing
python -m ebay_tools.apps.processor

# Viewer Tool - Review and export results
python -m ebay_tools.apps.viewer

# Price Analyzer - Standalone pricing analysis
python -m ebay_tools.apps.price_analyzer

# CSV Export Tool - Export to eBay format
python -m ebay_tools.apps.csv_export

# Direct Listing Tool - Direct eBay API integration
python -m ebay_tools.apps.direct_listing
```

### File Extensions
- `.json` - Queue files and configuration
- `.csv` - eBay export files
- `.html` - Description files
- `.log` - Application logs

### Directory Structure
```
ebay_tools/
├── apps/           # GUI applications
├── core/           # Core functionality
├── utils/          # Utility modules
├── data/           # User data and queues
├── config/         # Configuration files
├── logs/           # Application logs
└── exports/        # Generated files
```

---

## Appendix

### Supported File Formats

#### Images:
- JPG/JPEG (recommended)
- PNG
- WebP
- BMP
- TIFF

#### Data Files:
- JSON (queue files)
- CSV (export format)
- HTML (descriptions)
- TXT (simple descriptions)

### API Rate Limits

#### Default Limits:
- **LLaVA**: No official limits, but 2-second delays recommended
- **Claude**: Varies by plan, typically 1000 requests/minute
- **OpenAI**: Varies by plan, typically 3 requests/minute for GPT-4 Vision

### System Requirements

#### Minimum:
- Python 3.8+
- 4 GB RAM
- 1 GB free disk space
- Internet connection

#### Recommended:
- Python 3.9+
- 8 GB RAM
- 10 GB free disk space
- High-speed internet
- SSD storage

---

*eBay Tools User Manual - Version 3.0.0*
*For support and updates, check the project repository*