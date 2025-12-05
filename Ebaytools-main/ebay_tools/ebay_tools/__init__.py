# eBay Tools - Listing Automation System 
# A comprehensive toolkit for automating eBay listing generation using LLM APIs. 
 
__version__ = "3.0.0" 
__author__ = "Your Name" 

# Handle imports when running directly
import os
import sys

# Add parent directory to path if module not found
try:
    from ebay_tools.core import schema, api, config, exceptions
    from ebay_tools import utils, apps

    # Convenience imports
    from ebay_tools.core.schema import EbayItemSchema
    from ebay_tools.core.api import LLMApiClient, ApiConfig, ApiError
except ModuleNotFoundError:
    # Get the parent directory and add to sys.path
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sys.path.insert(0, parent_dir)
    
    # Try imports again with modified path
    from ebay_tools.core import schema, api, config, exceptions
    from ebay_tools import utils, apps

    # Convenience imports
    from ebay_tools.core.schema import EbayItemSchema
    from ebay_tools.core.api import LLMApiClient, ApiConfig, ApiError

# If this file is run directly, execute the following code
if __name__ == "__main__":
    print("eBay Tools version", __version__)
    print("This is a package and should not be run directly.")
    print("Please use one of the following entry points:")
    print("  - python -m ebay_tools.apps.setup")
    print("  - python -m ebay_tools.apps.processor")
    print("  - python -m ebay_tools.apps.viewer")
    print("  - python -m ebay_tools.apps.price_analyzer")
    print("  - python -m ebay_tools.apps.csv_export")
    print("  - python -m ebay_tools.apps.direct_listing")
