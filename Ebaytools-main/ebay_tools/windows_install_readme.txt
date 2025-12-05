===== eBay Tools Package with Price Analysis =====

This package contains the eBay tools application with integrated price analysis.

== INSTALLATION INSTRUCTIONS ==

1. Extract this package to a Windows computer
2. Copy the "ebay_tools" folder to your project directory
3. Run the "create_windows_installer.bat" file to create an installer
4. The installer will be created in a folder named "ebay_tools_installer"
5. Copy this installer to any Windows computer where you want to use the application
6. On the target computer, run "install.bat" in the installer folder

== PRICE ANALYSIS INTEGRATION ==

To integrate the price analyzer with the processor:

1. The price_analyzer.py module is already included in the apps directory
2. Follow the instructions in processor_integration.py to add the code to your processor.py file

== FILES INCLUDED ==

- ebay_tools/            - The complete ebay_tools package
  - apps/                - Application modules
    - price_analyzer.py  - New price analysis functionality
    - processor.py       - Image processing application
    - viewer.py          - Results viewing application
    - setup.py           - Setup application
    - etc.
  - core/                - Core functionality
  - utils/               - Utility modules

- processor_integration.py  - Instructions for integrating price analysis
- requirements.txt          - Required Python packages
- create_windows_installer.bat - Script to create Windows installer

== REQUIREMENTS ==

- Python 3.8 or higher
- Required packages (installed by the installer):
  - requests
  - beautifulsoup4
  - pillow