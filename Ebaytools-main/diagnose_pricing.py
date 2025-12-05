#!/usr/bin/env python3
"""
Diagnostic script to identify pricing issues
"""
import sys
import os
import inspect

print("=== eBay Tools Pricing Diagnostics ===")
print(f"Python version: {sys.version}")
print(f"Current working directory: {os.getcwd()}")
print(f"Python path: {sys.path[:3]}...")  # Show first 3 entries

# Test 1: Check if we can import the modules
print("\n1. Testing imports...")
try:
    sys.path.insert(0, 'ebay_tools')
    from ebay_tools.apps.price_analyzer import PriceAnalyzer
    print("✅ PriceAnalyzer imported successfully")
    
    # Get the file location
    analyzer_file = inspect.getfile(PriceAnalyzer)
    print(f"   Imported from: {analyzer_file}")
    
except Exception as e:
    print(f"❌ Failed to import PriceAnalyzer: {e}")
    sys.exit(1)

# Test 2: Check available methods
print("\n2. Checking available methods...")
analyzer = PriceAnalyzer()
all_methods = [method for method in dir(analyzer) if not method.startswith('_')]
analyze_methods = [method for method in dir(analyzer) if 'analyze' in method.lower()]

print(f"   All public methods: {all_methods}")
print(f"   Analyze methods: {analyze_methods}")
print(f"   Has analyze_item: {hasattr(analyzer, 'analyze_item')}")
print(f"   Has analyze_item_pricing: {hasattr(analyzer, 'analyze_item_pricing')}")

# Test 3: Check method signature
print("\n3. Checking analyze_item method signature...")
if hasattr(analyzer, 'analyze_item'):
    sig = inspect.signature(analyzer.analyze_item)
    print(f"   Method signature: analyze_item{sig}")
else:
    print("   ❌ analyze_item method not found!")

# Test 4: Test method call
print("\n4. Testing method call...")
try:
    test_item = {
        "title": "Test Item for Diagnostics",
        "item_specifics": {"Brand": "TestBrand", "Model": "TestModel"}
    }
    
    search_terms = analyzer._extract_search_terms(test_item)
    print(f"   Search terms extracted: {search_terms}")
    
    results = analyzer.analyze_item(search_terms)
    print(f"   ✅ analyze_item call successful")
    print(f"   Results success: {results.get('success', False)}")
    print(f"   Suggested price: ${results.get('suggested_price', 0):.2f}")
    
except Exception as e:
    print(f"   ❌ Method call failed: {e}")
    import traceback
    traceback.print_exc()

# Test 5: Check for any old cached files
print("\n5. Checking for cache files...")
cache_files = []
for root, dirs, files in os.walk('.'):
    for file in files:
        if file.endswith('.pyc') or '__pycache__' in root:
            cache_files.append(os.path.join(root, file))

if cache_files:
    print(f"   Found {len(cache_files)} cache files:")
    for cache_file in cache_files[:5]:  # Show first 5
        print(f"   - {cache_file}")
    if len(cache_files) > 5:
        print(f"   ... and {len(cache_files) - 5} more")
else:
    print("   ✅ No cache files found")

print("\n=== Diagnostics Complete ===")
print("\nIf all tests passed, the PriceAnalyzer should work correctly.")
print("If you're still getting analyze_item_pricing errors, you may be running")
print("an older version of the code or there are cached files interfering.")