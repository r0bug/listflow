#!/usr/bin/env python3
"""
eBay Pricing Setup and Integration Script

This script helps setup the complete eBay pricing application and integrate it
with the existing eBay Tools suite.
"""

import os
import sys
import shutil
import json
import subprocess
from pathlib import Path

def check_dependencies():
    """Check if required dependencies are installed."""
    required_packages = [
        'requests',
        'beautifulsoup4',
        'lxml'  # For better HTML parsing
    ]
    
    missing = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✅ {package}")
        except ImportError:
            missing.append(package)
            print(f"❌ {package}")
    
    return missing

def install_dependencies(missing_packages):
    """Install missing dependencies."""
    if not missing_packages:
        print("All dependencies are already installed!")
        return True
    
    print(f"\nInstalling missing packages: {', '.join(missing_packages)}")
    
    try:
        # Try pip3 first, then pip
        pip_cmd = 'pip3' if shutil.which('pip3') else 'pip'
        
        cmd = [pip_cmd, 'install'] + missing_packages
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Dependencies installed successfully!")
            return True
        else:
            print(f"❌ Installation failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error installing dependencies: {e}")
        return False

def setup_pricing_app(ebay_tools_path):
    """Setup the pricing app in the eBay Tools directory."""
    
    # Create pricing directory
    pricing_dir = Path(ebay_tools_path) / "ebay_tools" / "apps"
    pricing_dir.mkdir(parents=True, exist_ok=True)
    
    # Copy the complete pricing app
    pricing_file = pricing_dir / "complete_price_analyzer.py"
    
    # Read the complete app content from the temp file
    with open('/tmp/ebay_pricing_complete.py', 'r') as f:
        content = f.read()
    
    # Write to the apps directory
    with open(pricing_file, 'w') as f:
        f.write(content)
    
    print(f"✅ Pricing app installed: {pricing_file}")
    
    return pricing_file

def create_launcher_script(ebay_tools_path, pricing_file):
    """Create a launcher script for the pricing app."""
    
    launcher_content = f'''#!/usr/bin/env python3
"""
eBay Price Analyzer Launcher

Launch the complete eBay pricing application.
"""

import sys
import os

# Add the eBay tools path to Python path
sys.path.insert(0, '{ebay_tools_path}')

# Import and run the pricing app
if __name__ == "__main__":
    try:
        from ebay_tools.apps.complete_price_analyzer import main
        main()
    except ImportError as e:
        print(f"Error importing pricing app: {{e}}")
        print("Make sure all dependencies are installed:")
        print("pip install requests beautifulsoup4 lxml")
        sys.exit(1)
'''
    
    launcher_file = Path(ebay_tools_path) / "run_price_analyzer.py"
    
    with open(launcher_file, 'w') as f:
        f.write(launcher_content)
    
    # Make executable on Unix systems
    if hasattr(os, 'chmod'):
        os.chmod(launcher_file, 0o755)
    
    print(f"✅ Launcher created: {launcher_file}")
    
    return launcher_file

def create_windows_batch_file(ebay_tools_path):
    """Create Windows batch file for easy launching."""
    
    batch_content = f'''@echo off
cd /d "{ebay_tools_path}"
python run_price_analyzer.py
pause
'''
    
    batch_file = Path(ebay_tools_path) / "Price_Analyzer.bat"
    
    with open(batch_file, 'w') as f:
        f.write(batch_content)
    
    print(f"✅ Windows launcher created: {batch_file}")
    
    return batch_file

def integration_with_processor(ebay_tools_path):
    """Create integration hooks for the processor app."""
    
    integration_code = '''
# Integration code for processor.py
# Add this to the processor.py imports section:

try:
    from ebay_tools.apps.complete_price_analyzer import PriceAnalyzer
    PRICING_AVAILABLE = True
except ImportError:
    PRICING_AVAILABLE = False
    print("Complete price analyzer not available")

# Add this method to the EbayLLMProcessor class:

def analyze_item_pricing_complete(self, item):
    """Analyze pricing using the complete price analyzer."""
    if not PRICING_AVAILABLE:
        self.log("Complete price analyzer not available")
        return False
    
    try:
        # Get search terms from item
        search_terms = []
        if item.get('title'):
            search_terms.append(item['title'])
        if item.get('item_specifics', {}).get('Brand'):
            search_terms.append(item['item_specifics']['Brand'])
        if item.get('item_specifics', {}).get('Model'):
            search_terms.append(item['item_specifics']['Model'])
        
        if not search_terms:
            self.log("No search terms available for pricing")
            return False
        
        search_query = ' '.join(search_terms)
        
        # Initialize analyzer
        analyzer = PriceAnalyzer()
        
        # Perform analysis
        self.log(f"Analyzing pricing for: {search_query}")
        analysis = analyzer.analyze_item(
            search_terms=search_query,
            markup_percent=15,  # Default 15% markup
            sample_limit=20
        )
        
        # Update item with pricing data
        item['price_analysis'] = {
            'suggested_price': analysis.suggested_price,
            'median_price': analysis.median_price,
            'confidence_score': analysis.confidence_score,
            'sample_size': analysis.count,
            'analyzed_at': datetime.now().isoformat()
        }
        
        # Set the price if not already set
        if not item.get('price'):
            item['price'] = str(analysis.suggested_price)
        
        self.log(f"Suggested price: ${analysis.suggested_price:.2f} (confidence: {analysis.confidence_score:.1f}%)")
        
        return True
        
    except Exception as e:
        self.log(f"Pricing analysis failed: {str(e)}")
        return False

# Add this button to the processor UI (in create_processing_controls method):

self.analyze_pricing_btn = ttk.Button(
    controls_frame, 
    text="Analyze Pricing", 
    command=self.run_pricing_analysis
)
self.analyze_pricing_btn.pack(fill=tk.X, pady=2)

# Add this method to handle the pricing analysis:

def run_pricing_analysis(self):
    """Run pricing analysis for current item."""
    if self.current_item_index < 0 or self.current_item_index >= len(self.work_queue):
        messagebox.showinfo("Info", "No item selected")
        return
    
    item = self.work_queue[self.current_item_index]
    
    if self.analyze_item_pricing_complete(item):
        # Save queue with updated pricing
        if self.queue_file_path:
            save_queue(self.work_queue, self.queue_file_path)
            self.log("Queue saved with pricing data")
        
        # Update display
        self.display_current_item()
        
        messagebox.showinfo("Success", 
                          f"Pricing analysis complete!\\n\\n"
                          f"Suggested price: ${item['price_analysis']['suggested_price']:.2f}")
    else:
        messagebox.showerror("Error", "Pricing analysis failed. Check the log for details.")
'''
    
    integration_file = Path(ebay_tools_path) / "processor_pricing_integration.py"
    
    with open(integration_file, 'w') as f:
        f.write(integration_code)
    
    print(f"✅ Integration code created: {integration_file}")
    
    return integration_file

def create_configuration_file(ebay_tools_path):
    """Create a configuration file template."""
    
    config = {
        "ebay_app_id": "",
        "pricing_settings": {
            "default_markup": 15,
            "max_items": 20,
            "days_back": 90,
            "min_results": 3,
            "exclude_words": ["broken", "for parts", "not working", "damaged", "cracked"],
            "confidence_min_items": 5
        },
        "rate_limiting": {
            "min_request_interval": 2.0,
            "api_timeout": 30
        },
        "ui_settings": {
            "window_width": 1000,
            "window_height": 800,
            "remember_window_position": True
        }
    }
    
    config_file = Path(ebay_tools_path) / "pricing_config.json"
    
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"✅ Configuration file created: {config_file}")
    
    return config_file

def create_readme(ebay_tools_path):
    """Create README for the pricing application."""
    
    readme_content = '''# eBay Price Analyzer - Complete Edition

## Overview
Complete eBay pricing application with real market data analysis using eBay sold listings.

## Features
- 🔍 Real eBay sold listings data (API + web scraping)
- 📊 Advanced statistical analysis
- 🎯 Outlier detection and filtering
- 💰 Intelligent pricing suggestions
- 📈 Confidence scoring
- 📤 Export capabilities (CSV, text)
- 🔧 Integration with eBay Tools suite

## Quick Start

### 1. Install Dependencies
```bash
pip install requests beautifulsoup4 lxml
```

### 2. Run the Application
- **Windows**: Double-click `Price_Analyzer.bat`
- **Linux/Mac**: Run `python run_price_analyzer.py`

### 3. Optional: Get eBay App ID
- Go to https://developer.ebay.com/
- Create a developer account and application
- Get your App ID for 5,000 free API calls per day
- Enter in Settings dialog

## Usage

### Basic Analysis
1. Enter search terms (e.g., "iPhone 12 64GB")
2. Set markup percentage (default: 15%)
3. Choose maximum items to analyze
4. Click "Analyze Pricing"

### Advanced Features
- **Condition Filtering**: Analyze only specific conditions
- **Export Results**: Save analysis to CSV or text
- **eBay Links**: Double-click items to view original listings
- **Confidence Scoring**: Understand data reliability

### Integration with eBay Tools
The pricing analyzer can be integrated with the main processor:
1. See `processor_pricing_integration.py` for code examples
2. Adds automated pricing during item processing
3. Saves pricing data with item analysis

## Configuration
Edit `pricing_config.json` to customize:
- Default markup percentages
- Analysis parameters
- Rate limiting settings
- UI preferences

## Data Sources
1. **eBay Finding API** (with App ID)
   - Official eBay API
   - 5,000 calls/day free
   - Most reliable data

2. **Web Scraping** (fallback)
   - Scrapes eBay sold listings
   - Complies with Terms of Service
   - Rate limited and respectful

## Troubleshooting

### No Results Found
- Try broader search terms
- Reduce condition filters
- Increase max items limit
- Check internet connection

### Analysis Errors
- Verify search terms are not too specific
- Check eBay App ID (if using API)
- Ensure dependencies are installed

### Integration Issues
- Make sure all files are in correct locations
- Check Python path includes eBay Tools directory
- Verify imports work correctly

## Support
For issues or questions:
1. Check the console output for error details
2. Verify all dependencies are installed
3. Test with simple search terms first
4. Check eBay Developer documentation if using API

## Legal Notes
- Complies with eBay Terms of Service
- Rate limited to be respectful to eBay servers
- Uses publicly available sold listings data
- For research and competitive analysis purposes
'''
    
    readme_file = Path(ebay_tools_path) / "PRICING_README.md"
    
    with open(readme_file, 'w') as f:
        f.write(readme_content)
    
    print(f"✅ README created: {readme_file}")
    
    return readme_file

def main():
    """Main setup function."""
    print("🎯 eBay Complete Pricing Application Setup")
    print("=" * 50)
    
    # Get eBay Tools path
    if len(sys.argv) > 1:
        ebay_tools_path = sys.argv[1]
    else:
        ebay_tools_path = input("Enter path to eBay Tools directory: ").strip()
        if not ebay_tools_path:
            ebay_tools_path = "/home/robug/projects/ebay_tools"
    
    ebay_tools_path = Path(ebay_tools_path).resolve()
    
    if not ebay_tools_path.exists():
        print(f"❌ Directory not found: {ebay_tools_path}")
        sys.exit(1)
    
    print(f"📁 Installing to: {ebay_tools_path}")
    print()
    
    # Check dependencies
    print("🔍 Checking dependencies...")
    missing = check_dependencies()
    
    if missing:
        install_deps = input(f"\\nInstall missing dependencies? (y/n): ").lower().startswith('y')
        if install_deps:
            if not install_dependencies(missing):
                print("❌ Failed to install dependencies. Please install manually:")
                print(f"pip install {' '.join(missing)}")
                sys.exit(1)
        else:
            print("⚠️  Continuing without installing dependencies...")
    
    print()
    
    # Setup the application
    print("🚀 Setting up pricing application...")
    
    try:
        # Install main app
        pricing_file = setup_pricing_app(ebay_tools_path)
        
        # Create launcher
        launcher_file = create_launcher_script(ebay_tools_path, pricing_file)
        
        # Create Windows batch file
        if sys.platform == 'win32':
            batch_file = create_windows_batch_file(ebay_tools_path)
        
        # Create integration code
        integration_file = integration_with_processor(ebay_tools_path)
        
        # Create configuration
        config_file = create_configuration_file(ebay_tools_path)
        
        # Create documentation
        readme_file = create_readme(ebay_tools_path)
        
        print()
        print("✅ Setup completed successfully!")
        print()
        print("📋 Files created:")
        print(f"   • {pricing_file.name} - Main application")
        print(f"   • {launcher_file.name} - Python launcher")
        if sys.platform == 'win32':
            print(f"   • Price_Analyzer.bat - Windows launcher")
        print(f"   • {integration_file.name} - Processor integration")
        print(f"   • {config_file.name} - Configuration")
        print(f"   • {readme_file.name} - Documentation")
        print()
        print("🚀 To run the pricing application:")
        if sys.platform == 'win32':
            print("   • Double-click Price_Analyzer.bat")
        print(f"   • Or run: python {launcher_file}")
        print()
        print("🔧 Optional: Get eBay App ID from https://developer.ebay.com")
        print("   • 5,000 free API calls per day")
        print("   • More reliable than web scraping")
        print("   • Enter in Settings dialog")
        print()
        print("📚 See PRICING_README.md for detailed usage instructions")
        
        # Offer to run the app
        run_now = input("\\nRun the pricing application now? (y/n): ").lower().startswith('y')
        if run_now:
            print("🚀 Launching pricing application...")
            try:
                sys.path.insert(0, str(ebay_tools_path))
                from ebay_tools.apps.complete_price_analyzer import main
                main()
            except Exception as e:
                print(f"❌ Failed to launch: {e}")
                print(f"Try running manually: python {launcher_file}")
        
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()