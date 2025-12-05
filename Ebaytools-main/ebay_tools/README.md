# eBay Tools Package with Price Analysis

This package contains the eBay listing automation toolkit with integrated price analysis functionality.

## Installation

1. **Install Python 3.8 or higher**
   - Download from: https://www.python.org/downloads/
   - Make sure to check "Add Python to PATH" during installation

2. **Install Required Packages**
   ```
   pip install -r requirements.txt
   ```

3. **Run the Application**
   - Use the provided batch files or shell scripts
   - Or run directly using Python modules:
     ```
     python -m ebay_tools.apps.setup
     python -m ebay_tools.apps.processor
     python -m ebay_tools.apps.viewer
     python -m ebay_tools.apps.price_analyzer
     ```

## Directory Structure

```
ebay_tools/
├── apps/               # Application modules
│   ├── setup.py        # Item queue setup
│   ├── processor.py    # AI image processing
│   ├── viewer.py       # Results viewing
│   ├── price_analyzer.py  # Price analysis
│   └── direct_listing.py  # Direct eBay listing
├── core/               # Core functionality
│   ├── api.py          # API client
│   ├── config.py       # Configuration
│   ├── exceptions.py   # Exception handling
│   └── schema.py       # Data schemas
└── utils/              # Utility modules
    ├── background_utils.py  # Background processing
    ├── file_utils.py   # File operations
    ├── image_utils.py  # Image processing
    └── ui_utils.py     # UI components
```

## Using Price Analysis

The price analysis functionality is integrated into the processor application. To use it:

1. In the processor application, check the "Analyze Pricing" checkbox
2. When processing items, prices will be automatically suggested
3. You can also click the "Price Analysis" button to manually analyze prices
4. Prices are stored with the item data for use in the viewer or direct listing

## Price Analysis Integration

A `processor_integration.py` file is included with instructions on how to integrate
the price analyzer into the processor application if it's not already integrated.

## Windows Installation

For Windows users, simply create batch files with the following content:

```batch
@echo off
set PYTHONPATH=%PYTHONPATH%;%~dp0
python -m ebay_tools.apps.[module_name]
pause
```

Replace `[module_name]` with:
- `setup` - For item queue setup
- `processor` - For AI image processing
- `viewer` - For results viewing
- `price_analyzer` - For price analysis
- `direct_listing` - For direct eBay listing