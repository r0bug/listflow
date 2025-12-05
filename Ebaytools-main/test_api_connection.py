#!/usr/bin/env python3
"""
Test script to diagnose LLM API connection issues
"""

import os
import sys
import json
import logging
from datetime import datetime

# Add the ebay_tools directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ebay_tools'))

# Enable debug logging
os.environ['DEBUG_API'] = 'true'

from ebay_tools.core.api import LLMApiClient, ApiConfig, ApiError

# Configure logging for this test script
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(f"api_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


def test_api_connection(api_key, api_url, test_image_path=None):
    """Test the API connection with various scenarios"""
    
    print(f"\n{'='*60}")
    print(f"Testing API Connection")
    print(f"API URL: {api_url}")
    print(f"API Key: {'*' * (len(api_key) - 4) + api_key[-4:] if len(api_key) > 4 else '***'}")
    print(f"{'='*60}\n")
    
    # Create API config
    config = ApiConfig(
        api_key=api_key,
        api_url=api_url,
        delay=1.0,
        max_retries=2,
        timeout=30
    )
    
    # Create client
    client = LLMApiClient(config)
    
    # Test 1: Simple text generation
    print("\n[TEST 1] Simple text generation...")
    try:
        response = client.generate_text("Please respond with: 'API connection successful'")
        print(f"✓ Success! Response: {response[:200]}")
        
        # Check if response contains expected text
        if "successful" in response.lower() or "api connection" in response.lower():
            print("✓ Response validation passed")
        else:
            print("⚠ Warning: Response doesn't contain expected text")
            
    except Exception as e:
        print(f"✗ Failed: {type(e).__name__}: {str(e)}")
        if hasattr(e, 'response_text'):
            print(f"  Response text: {e.response_text[:500]}")
        return False
    
    # Test 2: Image processing (if image provided)
    if test_image_path and os.path.exists(test_image_path):
        print(f"\n[TEST 2] Image processing with {os.path.basename(test_image_path)}...")
        try:
            response = client.process_photo(
                test_image_path,
                "Please describe this image in one sentence."
            )
            print(f"✓ Success! Response: {response[:200]}")
        except Exception as e:
            print(f"✗ Failed: {type(e).__name__}: {str(e)}")
            if hasattr(e, 'response_text'):
                print(f"  Response text: {e.response_text[:500]}")
    else:
        print(f"\n[TEST 2] Skipping image test (no image provided or file not found)")
    
    # Test 3: Rate limiting
    print("\n[TEST 3] Testing rate limiting...")
    try:
        import time
        start_time = time.time()
        
        # Make two quick requests
        response1 = client.generate_text("Say 'one'")
        response2 = client.generate_text("Say 'two'")
        
        elapsed = time.time() - start_time
        print(f"✓ Two requests completed in {elapsed:.2f} seconds")
        
        if elapsed >= config.delay:
            print("✓ Rate limiting is working correctly")
        else:
            print("⚠ Warning: Rate limiting might not be working")
            
    except Exception as e:
        print(f"✗ Failed: {type(e).__name__}: {str(e)}")
    
    # Test 4: Error handling with bad API key
    print("\n[TEST 4] Testing error handling with invalid API key...")
    bad_config = ApiConfig(
        api_key="invalid_key_12345",
        api_url=api_url,
        delay=1.0,
        max_retries=1,
        timeout=10
    )
    bad_client = LLMApiClient(bad_config)
    
    try:
        response = bad_client.generate_text("This should fail")
        print("⚠ Warning: Request succeeded with invalid API key!")
    except ApiError as e:
        print(f"✓ Expected error caught: {e.status_code} - {str(e)[:100]}")
    except Exception as e:
        print(f"✓ Error caught (different type): {type(e).__name__}: {str(e)[:100]}")
    
    print(f"\n{'='*60}")
    print("API connection tests completed!")
    print(f"{'='*60}\n")
    
    return True


def load_api_config_from_file():
    """Try to load API configuration from the standard location"""
    config_paths = [
        os.path.join(os.path.dirname(__file__), "ebay_tools", "ebay_tools", "apps", "api_config.json"),
        os.path.join(os.path.dirname(__file__), "ebay_tools", "apps", "api_config.json"),
        os.path.join(os.path.dirname(__file__), "api_config.json"),
    ]
    
    for config_path in config_paths:
        if os.path.exists(config_path):
            print(f"Found config file: {config_path}")
            try:
                with open(config_path, 'r') as f:
                    config = json.load(f)
                return config.get("api_key"), config.get("api_url")
            except Exception as e:
                print(f"Error loading config: {str(e)}")
    
    return None, None


def main():
    """Main test function"""
    print("eBay Tools LLM API Connection Tester")
    print("====================================\n")
    
    # Try to load config from file first
    api_key, api_url = load_api_config_from_file()
    
    # If not found, ask user
    if not api_key or not api_url:
        print("No configuration file found. Please enter API details:\n")
        
        print("Available API options:")
        print("1. LLaVA v1.6 (https://api.segmind.com/v1/llava-v1.6)")
        print("2. Claude 3.7 Sonnet (https://api.segmind.com/v1/claude-3.7-sonnet)")
        print("3. Claude 3 Opus (https://api.segmind.com/v1/claude-3-opus)")
        print("4. GPT-4 Vision (https://api.openai.com/v1/chat/completions)")
        print("5. Custom URL")
        
        choice = input("\nSelect API (1-5): ").strip()
        
        api_urls = {
            "1": "https://api.segmind.com/v1/llava-v1.6",
            "2": "https://api.segmind.com/v1/claude-3.7-sonnet",
            "3": "https://api.segmind.com/v1/claude-3-opus",
            "4": "https://api.openai.com/v1/chat/completions"
        }
        
        if choice in api_urls:
            api_url = api_urls[choice]
        else:
            api_url = input("Enter custom API URL: ").strip()
        
        api_key = input("Enter API key: ").strip()
    
    # Optional: test with an image
    test_image = None
    if input("\nDo you have a test image? (y/n): ").lower() == 'y':
        test_image = input("Enter image path: ").strip()
    
    # Run tests
    test_api_connection(api_key, api_url, test_image)
    
    # Ask if user wants to save the config
    if input("\nSave this configuration for future use? (y/n): ").lower() == 'y':
        config_path = os.path.join(os.path.dirname(__file__), "api_config.json")
        config = {
            "api_key": api_key,
            "api_url": api_url,
            "delay": 2.0
        }
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
        print(f"Configuration saved to: {config_path}")


if __name__ == "__main__":
    main()