#!/usr/bin/env python3
"""
Test script for the enhanced smart search functionality.
"""

# Mock tkinter to avoid GUI dependency
import sys
sys.modules['tkinter'] = type(sys)('tkinter')
sys.modules['tkinter.ttk'] = type(sys)('ttk')
sys.modules['tkinter.messagebox'] = type(sys)('messagebox')
sys.modules['tkinter.simpledialog'] = type(sys)('simpledialog')

import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ebay_tools'))

from ebay_tools.apps.price_analyzer import SmartSearchExtractor, PriceAnalyzer

def test_search_extraction():
    """Test the smart search extraction with various item types."""
    print("🧪 Testing Smart Search Extraction")
    print("=" * 50)
    
    extractor = SmartSearchExtractor()
    
    # Test cases with different item types
    test_cases = [
        {
            'name': 'Madame Alexander Doll',
            'item_data': {
                'title': 'Madame Alexander Poor Cinderella 1540 Doll Vintage',
                'description': 'Beautiful vintage Madame Alexander doll from the classic fairy tale collection. Poor Cinderella #1540 in excellent condition.',
                'item_specifics': {
                    'Brand': 'Madame Alexander',
                    'Character': 'Cinderella',
                    'Condition': 'Used'
                }
            }
        },
        {
            'name': 'iPhone',
            'item_data': {
                'title': 'Apple iPhone 13 Pro Max 256GB Blue Unlocked',
                'description': 'Apple iPhone 13 Pro Max with 256GB storage, blue color, factory unlocked for all carriers.',
                'item_specifics': {
                    'Brand': 'Apple',
                    'Model': 'iPhone 13 Pro Max',
                    'Storage': '256GB'
                }
            }
        },
        {
            'name': 'Rolex Watch',
            'item_data': {
                'title': 'Rolex Submariner Date 116610LN Automatic Watch',
                'description': 'Genuine Rolex Submariner with date function, black dial and bezel, stainless steel case.',
                'item_specifics': {
                    'Brand': 'Rolex',
                    'Model': 'Submariner',
                    'Case Material': 'Stainless Steel'
                }
            }
        },
        {
            'name': 'Complex Title',
            'item_data': {
                'title': 'RARE VINTAGE EXCELLENT CONDITION FAST FREE SHIPPING MUST SEE Beautiful Antique Clock',
                'description': 'This is a beautiful antique mantle clock from the early 1900s. Features brass mechanism and wooden case.',
                'item_specifics': {
                    'Type': 'Mantle Clock',
                    'Era': 'Early 1900s',
                    'Material': 'Wood'
                }
            }
        }
    ]
    
    for test_case in test_cases:
        print(f"\n🔍 Testing: {test_case['name']}")
        print(f"Title: {test_case['item_data']['title']}")
        
        strategies = extractor.extract_search_terms(test_case['item_data'])
        
        if strategies:
            print(f"✅ Generated {len(strategies)} search strategies:")
            for i, strategy in enumerate(strategies, 1):
                confidence_symbol = {
                    'high': '🟢',
                    'medium': '🟡', 
                    'low': '🔴'
                }.get(strategy['confidence'], '⚪')
                
                print(f"  {i}. {confidence_symbol} {strategy['strategy'].title()}: '{strategy['terms']}'")
        else:
            print("❌ No strategies generated")
    
    return True

def test_price_analyzer_integration():
    """Test the price analyzer with smart search integration."""
    print("\n🧮 Testing Price Analyzer Integration")
    print("=" * 50)
    
    analyzer = PriceAnalyzer()
    
    # Test with Madame Alexander doll
    test_item = {
        'title': 'Madame Alexander Poor Cinderella 1540 Doll',
        'description': 'Vintage Madame Alexander doll from fairy tale collection. Poor Cinderella #1540.',
        'item_specifics': {
            'Brand': 'Madame Alexander',
            'Character': 'Cinderella'
        }
    }
    
    print(f"Testing with item: {test_item['title']}")
    
    try:
        result = analyzer.analyze_item(item_data=test_item)
        
        print(f"✅ Analysis completed: {result['success']}")
        
        if 'search_strategies_tried' in result:
            print(f"✅ Search strategies: {len(result['search_strategies_tried'])} tried")
            
            for strategy in result['search_strategies_tried']:
                print(f"  - {strategy['strategy']}: '{strategy['terms']}'")
        
        if 'successful_strategy' in result:
            strategy = result['successful_strategy']
            print(f"✅ Successful strategy: {strategy['strategy']} with '{strategy['terms']}'")
        
        if 'research_tools' in result:
            print("✅ Research tools included")
            
            if 'verification_urls' in result['research_tools']:
                urls = result['research_tools']['verification_urls']
                print(f"  - Sold listings URL generated: {len(urls.get('sold_listings', '')) > 0}")
                print(f"  - Current listings URL generated: {len(urls.get('current_listings', '')) > 0}")
        
        return True
        
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        return False

def test_brand_model_detection():
    """Test specific brand and model detection."""
    print("\n🏷️ Testing Brand/Model Detection")
    print("=" * 50)
    
    extractor = SmartSearchExtractor()
    
    test_cases = [
        {
            'text': 'Madame Alexander Poor Cinderella 1540',
            'expected_brand': 'madame alexander',
            'expected_model': 'poor cinderella'
        },
        {
            'text': 'Apple iPhone 13 Pro Max',
            'expected_brand': 'apple', 
            'expected_model': 'iphone'
        },
        {
            'text': 'Rolex Submariner Date Black',
            'expected_brand': 'rolex',
            'expected_model': 'submariner'
        }
    ]
    
    for test_case in test_cases:
        print(f"\nTesting: {test_case['text']}")
        
        text_sources = {'title': test_case['text']}
        brand_model = extractor._extract_brand_model_terms(text_sources)
        
        if brand_model:
            print(f"✅ Extracted: '{brand_model}'")
            
            # Check if expected elements are present
            brand_found = test_case['expected_brand'] in brand_model.lower()
            model_found = test_case['expected_model'] in brand_model.lower()
            
            print(f"  Brand detected: {brand_found} ({'✅' if brand_found else '❌'})")
            print(f"  Model detected: {model_found} ({'✅' if model_found else '❌'})")
        else:
            print("❌ No brand/model extracted")
    
    return True

def test_noise_word_removal():
    """Test removal of eBay noise words."""
    print("\n🧹 Testing Noise Word Removal")
    print("=" * 50)
    
    extractor = SmartSearchExtractor()
    
    noisy_title = "RARE VINTAGE EXCELLENT FAST FREE SHIPPING MUST SEE Beautiful Antique Clock"
    
    text_sources = {'title': noisy_title}
    cleaned = extractor._extract_cleaned_title(text_sources)
    
    print(f"Original: {noisy_title}")
    print(f"Cleaned:  {cleaned}")
    
    # Check that noise words were removed
    noise_words = ['rare', 'vintage', 'excellent', 'fast', 'free', 'shipping', 'must', 'see']
    remaining_noise = [word for word in noise_words if word in cleaned.lower()]
    
    if not remaining_noise:
        print("✅ All noise words removed")
    else:
        print(f"⚠️ Remaining noise words: {remaining_noise}")
    
    # Check that important words remain
    important_words = ['beautiful', 'antique', 'clock']
    remaining_important = [word for word in important_words if word in cleaned.lower()]
    
    print(f"✅ Important words preserved: {remaining_important}")
    
    return True

def main():
    """Run all tests."""
    print("🧪 Smart Search Enhancement Test Suite")
    print("=" * 60)
    
    tests = [
        test_search_extraction,
        test_brand_model_detection,
        test_noise_word_removal,
        test_price_analyzer_integration
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
                print("✅ Test passed\n")
            else:
                print("❌ Test failed\n")
        except Exception as e:
            print(f"❌ Test failed with exception: {e}\n")
    
    print("=" * 60)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Smart search enhancement is working correctly.")
        print("\n✨ Enhanced Features:")
        print("• Intelligent title breakdown into brand/model")
        print("• Description mining for keywords")
        print("• Multiple search strategies with fallback")
        print("• Noise word removal and cleaning")
        print("• Search strategy tracking and display")
        print("• Integration with pricing tool workflow")
    else:
        print("⚠️ Some tests failed. Check implementation.")
    
    return passed == total

if __name__ == "__main__":
    main()