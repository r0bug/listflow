#!/usr/bin/env python3
"""
Test script to verify PriceAnalyzer functionality
"""
import sys
import os

# Add the ebay_tools to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ebay_tools'))

print("Testing PriceAnalyzer...")
print("=" * 50)

try:
    print("1. Importing PriceAnalyzer...")
    from ebay_tools.apps.price_analyzer import PriceAnalyzer
    print("   ✅ Import successful")
    
    print("\n2. Creating PriceAnalyzer instance...")
    analyzer = PriceAnalyzer()
    print("   ✅ Instance created successfully")
    
    print("\n3. Checking available methods...")
    analyze_methods = [method for method in dir(analyzer) if 'analyze' in method.lower()]
    print(f"   Available analyze methods: {analyze_methods}")
    
    print("\n4. Testing specific method existence...")
    print(f"   analyze_item exists: {hasattr(analyzer, 'analyze_item')}")
    print(f"   analyze_item_pricing exists: {hasattr(analyzer, 'analyze_item_pricing')}")
    print(f"   _extract_search_terms exists: {hasattr(analyzer, '_extract_search_terms')}")
    
    print("\n5. Testing method call with dummy data...")
    test_item = {
        "title": "Test Item",
        "item_specifics": {"Brand": "TestBrand", "Model": "TestModel"}
    }
    
    try:
        search_terms = analyzer._extract_search_terms(test_item)
        print(f"   ✅ Search terms extracted: {search_terms}")
        
        # Test the analyze_item method
        results = analyzer.analyze_item(search_terms)
        print(f"   ✅ analyze_item call successful")
        print(f"   Results: {results}")
        
    except Exception as e:
        print(f"   ❌ Method call failed: {e}")
        import traceback
        traceback.print_exc()
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 50)
print("Test completed!")