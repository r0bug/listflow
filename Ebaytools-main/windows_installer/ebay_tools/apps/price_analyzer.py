#!/usr/bin/env python3
"""
eBay Price Analyzer

This module provides functionality to analyze eBay pricing based on 
similar sold items. It can be used standalone or integrated with
the eBay processing workflow.
"""

import json
import re
import random
import tkinter as tk
from tkinter import ttk, messagebox, simpledialog
import webbrowser
from datetime import datetime, timedelta
import threading
import urllib.parse
import statistics
import csv
import os
import string
from collections import Counter

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Required packages not found. Install with: pip install requests beautifulsoup4")

# Import from ebay_tools package
try:
    from ebay_tools.core import schema, config, exceptions
    from ebay_tools.utils import ui_utils, background_utils
except ImportError:
    # For standalone use
    print("Running in standalone mode without ebay_tools package")


class eBaySearchURLGenerator:
    """
    Generate eBay search URLs for manual research and verification.
    Based on the comprehensive eBay API guide recommendations.
    """
    
    BASE_URL = "https://www.ebay.com/sch/i.html"
    
    @staticmethod
    def generate_sold_listings_url(
        keywords, 
        price_min=None, 
        price_max=None,
        condition=None,
        sold_days_ago=None,
        items_per_page=200,
        category_id=None
    ):
        """Generate URL for eBay sold listings search with comprehensive filtering."""
        
        params = {
            '_nkw': keywords,
            'LH_Sold': '1',        # Show sold items
            'LH_Complete': '1',    # Show completed listings
            '_ipg': str(min(items_per_page, 200)),  # Items per page (max 200)
            '_sop': '13'           # Sort by newest first
        }
        
        # Price range filters
        if price_min:
            params['_udlo'] = str(price_min)
        if price_max:
            params['_udhi'] = str(price_max)
        
        # Category filter
        if category_id:
            params['_sacat'] = str(category_id)
        
        # Condition filters
        condition_codes = {
            'new': '1000',
            'open_box': '1500', 
            'refurbished': '2000,2010,2020,2030',
            'used': '3000,4000,5000,6000,7000'
        }
        if condition and condition in condition_codes:
            params['LH_ItemCondition'] = condition_codes[condition]
        
        # Date range (last N days)
        if sold_days_ago:
            params['LH_DAYS_TYPE'] = '1'
            params['LH_DAYS'] = str(sold_days_ago)
        
        # Build URL
        query_string = urllib.parse.urlencode(params)
        return f"{eBaySearchURLGenerator.BASE_URL}?{query_string}"
    
    @staticmethod
    def generate_current_listings_url(keywords, **kwargs):
        """Generate URL for current active listings."""
        params = {
            '_nkw': keywords,
            '_ipg': str(min(kwargs.get('items_per_page', 200), 200)),
            '_sop': '13'  # Sort by newest first
        }
        
        # Add price filters if specified
        if 'price_min' in kwargs and kwargs['price_min']:
            params['_udlo'] = str(kwargs['price_min'])
        if 'price_max' in kwargs and kwargs['price_max']:
            params['_udhi'] = str(kwargs['price_max'])
        
        # Add category if specified
        if 'category_id' in kwargs and kwargs['category_id']:
            params['_sacat'] = str(kwargs['category_id'])
        
        query_string = urllib.parse.urlencode(params)
        return f"{eBaySearchURLGenerator.BASE_URL}?{query_string}"


class ResearchDataManager:
    """Manage research data export and documentation workflow."""
    
    def __init__(self):
        self.research_data = []
    
    def create_research_template(self, product_keyword, search_terms):
        """Create a template for manual research documentation."""
        return {
            'timestamp': datetime.now().isoformat(),
            'product': product_keyword,
            'search_terms': search_terms,
            'research_method': 'manual_verification',
            'data_source': 'ebay_sold_listings_search',
            'urls': {
                'sold_listings': None,  # To be filled
                'current_listings': None  # To be filled
            },
            'findings': {
                'average_price': None,
                'sales_volume': None,
                'sell_through_rate': None,
                'competition_level': None,
                'trend_direction': None,
                'seasonal_patterns': None,
                'notes': ""
            },
            'next_research_date': (datetime.now() + timedelta(days=30)).isoformat(),
            'action_items': [],
            'confidence_level': 'medium'  # low, medium, high
        }
    
    def export_research_data(self, file_path, format='json'):
        """Export collected research data."""
        try:
            if format == 'json':
                with open(file_path, 'w') as f:
                    json.dump(self.research_data, f, indent=2)
            elif format == 'csv':
                self._export_to_csv(file_path)
            return True
        except Exception as e:
            print(f"Export failed: {e}")
            return False
    
    def _export_to_csv(self, file_path):
        """Export research data to CSV format."""
        if not self.research_data:
            return
        
        fieldnames = [
            'timestamp', 'product', 'search_terms', 'research_method',
            'average_price', 'sales_volume', 'confidence_level', 'notes'
        ]
        
        with open(file_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            
            for item in self.research_data:
                row = {
                    'timestamp': item['timestamp'],
                    'product': item['product'],
                    'search_terms': item['search_terms'],
                    'research_method': item['research_method'],
                    'average_price': item['findings'].get('average_price', ''),
                    'sales_volume': item['findings'].get('sales_volume', ''),
                    'confidence_level': item['confidence_level'],
                    'notes': item['findings'].get('notes', '')
                }
                writer.writerow(row)


class SmartSearchExtractor:
    """
    Intelligent search term extraction that breaks down titles into meaningful components
    and mines descriptions for additional search terms.
    """
    
    def __init__(self):
        # Common brand patterns and their variations
        self.brand_patterns = {
            # Electronics
            'apple': ['apple', 'iphone', 'ipad', 'macbook', 'airpods'],
            'samsung': ['samsung', 'galaxy'],
            'sony': ['sony', 'playstation', 'ps3', 'ps4', 'ps5'],
            'nintendo': ['nintendo', 'switch', 'wii', 'gameboy'],
            'microsoft': ['microsoft', 'xbox', 'surface'],
            
            # Collectibles
            'madame alexander': ['madame alexander', 'madam alexander'],
            'barbie': ['barbie', 'mattel barbie'],
            'american girl': ['american girl', 'ag doll'],
            'hot wheels': ['hot wheels', 'hotwheels'],
            'lego': ['lego', 'legos'],
            
            # Watches
            'rolex': ['rolex'],
            'omega': ['omega'],
            'seiko': ['seiko'],
            'casio': ['casio', 'g-shock'],
            
            # Fashion
            'coach': ['coach'],
            'louis vuitton': ['louis vuitton', 'lv'],
            'gucci': ['gucci'],
            
            # Tools
            'dewalt': ['dewalt'],
            'milwaukee': ['milwaukee'],
            'makita': ['makita']
        }
        
        # Common model/product type patterns
        self.model_patterns = {
            # iPhone models
            'iphone': r'iphone\s*(\d+)\s*(pro|plus|max|mini)?',
            # Watch models
            'submariner': r'submariner',
            'speedmaster': r'speedmaster',
            # Doll models
            'cinderella': r'cinderella',
            'poor cinderella': r'poor\s+cinderella'
        }
        
        # Stop words to remove
        self.stop_words = {
            'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
            'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
            'after', 'above', 'below', 'between', 'among', 'this', 'that', 'these',
            'those', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
            'could', 'can', 'may', 'might', 'must', 'shall', 'very', 'too', 'so',
            'just', 'now', 'only', 'also', 'really', 'quite', 'still', 'already',
            'yet', 'again', 'back', 'here', 'there', 'where', 'when', 'why', 'how',
            'what', 'which', 'who', 'whom', 'whose', 'all', 'both', 'each', 'few',
            'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'own',
            'same', 'than', 'then', 'them', 'they', 'we', 'you', 'your', 'yours',
            'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its', 'our', 'ours',
            'their', 'theirs', 'me', 'my', 'mine', 'us'
        }
        
        # eBay-specific noise words to remove
        self.ebay_noise = {
            'fast', 'free', 'shipping', 'new', 'used', 'nice', 'great', 'excellent',
            'rare', 'vintage', 'antique', 'beautiful', 'stunning', 'amazing',
            'perfect', 'mint', 'condition', 'collectible', 'estate', 'sale',
            'lot', 'bundle', 'set', 'collection', 'authentic', 'genuine',
            'original', 'oem', 'replacement', 'part', 'parts', 'working',
            'tested', 'refurbished', 'restored', 'repair', 'broken', 'damaged',
            'untested', 'as-is', 'asis', 'read', 'description', 'please',
            'look', 'see', 'photos', 'pictures', 'pics', 'nr', 'reserve',
            'auction', 'buy', 'now', 'bin', 'obo', 'offer', 'best', 'reduced',
            'price', 'drop', 'must', 'sell', 'moving', 'quick', 'fast'
        }
    
    def extract_search_terms(self, item_data):
        """Extract intelligent search terms from item data."""
        all_text = self._gather_text_sources(item_data)
        
        # Generate multiple search strategies
        search_strategies = []
        
        # Strategy 1: Brand + Model + Key Features
        brand_model = self._extract_brand_model_terms(all_text)
        if brand_model:
            search_strategies.append({
                'terms': brand_model,
                'strategy': 'brand_model',
                'confidence': 'high'
            })
        
        # Strategy 2: Key Features + Type
        feature_type = self._extract_feature_type_terms(all_text)
        if feature_type:
            search_strategies.append({
                'terms': feature_type,
                'strategy': 'feature_type',
                'confidence': 'medium'
            })
        
        # Strategy 3: Important Keywords from description
        keyword_terms = self._extract_keyword_terms(all_text)
        if keyword_terms:
            search_strategies.append({
                'terms': keyword_terms,
                'strategy': 'keywords',
                'confidence': 'medium'
            })
        
        # Strategy 4: Cleaned title fallback
        title_fallback = self._extract_cleaned_title(all_text)
        if title_fallback:
            search_strategies.append({
                'terms': title_fallback,
                'strategy': 'title_cleaned',
                'confidence': 'low'
            })
        
        return search_strategies
    
    def _gather_text_sources(self, item_data):
        """Gather all available text from item data."""
        text_sources = {}
        
        # Title sources
        if "title" in item_data and item_data["title"]:
            text_sources['title'] = item_data["title"]
        elif "temp_title" in item_data and item_data["temp_title"]:
            text_sources['title'] = item_data["temp_title"]
        
        # Description sources
        if "description" in item_data and item_data["description"]:
            text_sources['description'] = item_data["description"]
        elif "temp_description" in item_data and item_data["temp_description"]:
            text_sources['description'] = item_data["temp_description"]
        
        # Item specifics
        if "item_specifics" in item_data and isinstance(item_data["item_specifics"], dict):
            specifics_text = []
            for key, value in item_data["item_specifics"].items():
                if value and isinstance(value, str):
                    specifics_text.append(f"{key}: {value}")
            if specifics_text:
                text_sources['specifics'] = " ".join(specifics_text)
        
        return text_sources
    
    def _extract_brand_model_terms(self, text_sources):
        """Extract brand and model information."""
        all_text = " ".join(text_sources.values()).lower()
        
        found_brands = []
        found_models = []
        
        # Find brands
        for brand, variations in self.brand_patterns.items():
            for variation in variations:
                if variation.lower() in all_text:
                    found_brands.append(brand)
                    break
        
        # Find models using regex patterns
        import re
        for model_name, pattern in self.model_patterns.items():
            matches = re.findall(pattern, all_text, re.IGNORECASE)
            if matches:
                found_models.append(model_name)
        
        # Combine brand and model
        if found_brands and found_models:
            return f"{found_brands[0]} {found_models[0]}"
        elif found_brands:
            # Add common product type from title
            title = text_sources.get('title', '')
            product_type = self._extract_product_type(title)
            if product_type:
                return f"{found_brands[0]} {product_type}"
            return found_brands[0]
        elif found_models:
            return found_models[0]
        
        return None
    
    def _extract_feature_type_terms(self, text_sources):
        """Extract key features and product type."""
        title = text_sources.get('title', '').lower()
        description = text_sources.get('description', '').lower()
        
        # Common product types
        product_types = {
            'doll': ['doll', 'dolls'],
            'watch': ['watch', 'watches', 'timepiece'],
            'phone': ['phone', 'smartphone', 'iphone', 'android'],
            'game': ['game', 'gaming', 'console', 'xbox', 'playstation'],
            'tool': ['tool', 'drill', 'saw', 'wrench', 'screwdriver'],
            'bag': ['bag', 'purse', 'handbag', 'backpack'],
            'jewelry': ['ring', 'necklace', 'bracelet', 'earrings'],
            'book': ['book', 'novel', 'guide', 'manual'],
            'toy': ['toy', 'action figure', 'collectible']
        }
        
        found_type = None
        for type_name, keywords in product_types.items():
            for keyword in keywords:
                if keyword in title or keyword in description:
                    found_type = type_name
                    break
            if found_type:
                break
        
        # Extract important descriptors
        descriptors = []
        important_words = self._extract_important_words(title + " " + description)
        
        if important_words:
            # Take top 3-4 most important words
            descriptors = important_words[:4]
        
        if found_type and descriptors:
            return f"{' '.join(descriptors)} {found_type}"
        elif found_type:
            return found_type
        elif descriptors:
            return ' '.join(descriptors)
        
        return None
    
    def _extract_keyword_terms(self, text_sources):
        """Extract important keywords from description."""
        description = text_sources.get('description', '')
        if not description:
            return None
        
        # Extract important words from description
        important_words = self._extract_important_words(description)
        
        if len(important_words) >= 2:
            return ' '.join(important_words[:3])  # Top 3 keywords
        
        return None
    
    def _extract_cleaned_title(self, text_sources):
        """Extract and clean the title as fallback."""
        title = text_sources.get('title', '')
        if not title:
            return None
        
        # Clean the title
        words = title.lower().split()
        cleaned_words = []
        
        for word in words:
            # Remove punctuation
            word = word.strip(string.punctuation)
            
            # Skip if empty, stop word, or noise word
            if (word and 
                word not in self.stop_words and 
                word not in self.ebay_noise and
                len(word) > 2):  # Skip very short words
                cleaned_words.append(word)
        
        # Return first 4-5 meaningful words
        return ' '.join(cleaned_words[:5])
    
    def _extract_important_words(self, text):
        """Extract important words using frequency analysis."""
        if not text:
            return []
        
        words = text.lower().split()
        cleaned_words = []
        
        for word in words:
            # Remove punctuation
            word = word.strip(string.punctuation)
            
            # Skip if empty, stop word, or noise word
            if (word and 
                word not in self.stop_words and 
                word not in self.ebay_noise and
                len(word) > 2 and
                not word.isdigit()):  # Skip pure numbers
                cleaned_words.append(word)
        
        # Count frequency and return most common
        if cleaned_words:
            word_counts = Counter(cleaned_words)
            # Return words that appear at least once, sorted by frequency
            return [word for word, count in word_counts.most_common(10)]
        
        return []
    
    def _extract_product_type(self, title):
        """Extract product type from title."""
        title_lower = title.lower()
        
        # Common product indicators
        if any(word in title_lower for word in ['doll', 'dolls']):
            return 'doll'
        elif any(word in title_lower for word in ['watch', 'timepiece']):
            return 'watch'
        elif any(word in title_lower for word in ['phone', 'iphone']):
            return 'phone'
        elif any(word in title_lower for word in ['game', 'console']):
            return 'game'
        elif any(word in title_lower for word in ['tool', 'drill']):
            return 'tool'
        elif any(word in title_lower for word in ['bag', 'purse']):
            return 'bag'
        elif any(word in title_lower for word in ['book', 'manual']):
            return 'book'
        
        return None


class PriceAnalyzer:
    """eBay price analyzer that finds similar sold items and recommends pricing."""
    
    def __init__(self, config_file=None):
        """Initialize the price analyzer with optional config file."""
        self.config = self._load_config(config_file)
        self.user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        self.url_generator = eBaySearchURLGenerator()
        self.research_manager = ResearchDataManager()
        self.search_extractor = SmartSearchExtractor()
        
    def _load_config(self, config_file=None):
        """Load configuration from file or use defaults."""
        default_config = {
            "default_markup": 15,  # Percentage markup above average
            "max_results": 10,     # Maximum number of results to analyze
            "min_results": 3,      # Minimum results needed for analysis
            "days_back": 90,       # How far back to look for sold items
            "exclude_words": ["broken", "for parts", "not working", "damaged"],
            "price_threshold": 0.3  # Threshold for excluding outliers (30% from median)
        }
        
        if config_file:
            try:
                with open(config_file, 'r') as f:
                    loaded_config = json.load(f)
                    # Update default config with loaded values
                    default_config.update(loaded_config)
            except Exception as e:
                print(f"Error loading config file: {e}")
                
        return default_config
    
    def analyze_item(self, search_terms=None, item_data=None, markup_percent=None, sample_limit=None):
        """
        Analyze eBay pricing for an item using multiple search strategies.
        
        Args:
            search_terms: Search terms to use for finding similar items
            item_data: Dictionary containing item data (optional)
            markup_percent: Custom markup percentage (overrides config)
            sample_limit: Limit the number of samples to analyze
            
        Returns:
            Dictionary with pricing analysis results
        """
        # Extract multiple search strategies if we have item data
        search_strategies = []
        
        if not search_terms and item_data:
            # Use smart search extraction to get multiple strategies
            search_strategies = self.search_extractor.extract_search_terms(item_data)
        elif search_terms:
            # Use provided search terms as primary strategy
            search_strategies = [{
                'terms': search_terms,
                'strategy': 'provided',
                'confidence': 'high'
            }]
        
        if not search_strategies:
            raise ValueError("Search terms or item data must be provided")
        
        # Try each search strategy until we find results
        best_result = None
        tried_strategies = []
        
        for strategy in search_strategies:
            search_terms = strategy['terms']
            tried_strategies.append({
                'terms': search_terms,
                'strategy': strategy['strategy'],
                'confidence': strategy['confidence']
            })
            
            result = self._analyze_with_search_terms(search_terms, markup_percent, sample_limit, strategy)
            
            if result['success'] or (result.get('current_items') and len(result['current_items']) > 0):
                # Found results with this strategy
                result['search_strategies_tried'] = tried_strategies
                result['successful_strategy'] = strategy
                return result
            
            # If this strategy didn't work, try the next one
            print(f"Strategy '{strategy['strategy']}' with terms '{search_terms}' returned no results, trying next...")
        
        # If no strategies worked, return the last attempt with all tried strategies
        if best_result is None:
            best_result = self._analyze_with_search_terms(search_strategies[0]['terms'], markup_percent, sample_limit, search_strategies[0])
        
        best_result['search_strategies_tried'] = tried_strategies
        best_result['message'] = f"No results found with {len(tried_strategies)} search strategies. Consider manual research."
        
        return best_result
    
    def _analyze_with_search_terms(self, search_terms, markup_percent, sample_limit, strategy_info):
        """
        Perform analysis with specific search terms.
        """
        if not search_terms:
            return {
                "success": False,
                "message": "No search terms provided",
                "search_terms": search_terms
            }
            
        # Use provided markup or default from config
        markup = markup_percent if markup_percent is not None else self.config["default_markup"]
        
        # Set sample limit
        limit = sample_limit if sample_limit is not None else self.config["max_results"]
        
        # Get sold items
        sold_items = self._fetch_sold_items(search_terms, limit)
        current_items = []
        
        if not sold_items or len(sold_items) < self.config["min_results"]:
            # If no sold items found, get current listings for reference
            current_items = self._fetch_current_listings(search_terms, limit)
            
            if not current_items:
                return {
                    "success": False,
                    "message": f"No sold items found (needed {self.config['min_results']}, found {len(sold_items)}) and no current listings available",
                    "search_terms": search_terms,
                    "sold_items": sold_items,
                    "current_items": current_items
                }
            
            # Return result with current items but no pricing suggestion + research tools
            return {
                "success": False,
                "message": f"No sold items found for pricing analysis. Showing {len(current_items)} current listings for reference.",
                "search_terms": search_terms,
                "sold_items": sold_items,
                "current_items": current_items,
                "requires_manual_pricing": True,
                "research_tools": {
                    "manual_checklist": self.generate_manual_research_checklist(search_terms),
                    "third_party_recommendation": self.get_third_party_recommendations(search_terms),
                    "verification_urls": {
                        "sold_listings": self.url_generator.generate_sold_listings_url(search_terms, sold_days_ago=90),
                        "current_listings": self.url_generator.generate_current_listings_url(search_terms)
                    }
                }
            }
            
        # Analyze prices
        price_analysis = self._analyze_prices(sold_items)
        
        # Calculate suggested price
        suggested_price = self._calculate_suggested_price(price_analysis, markup)
        
        # Return complete results with research tools
        result = {
            "success": True,
            "search_terms": search_terms,
            "sold_items": sold_items,
            "current_items": current_items,
            "price_analysis": price_analysis,
            "suggested_price": suggested_price,
            "markup_percent": markup,
            "analyzed_at": datetime.now().isoformat(),
            "research_tools": {
                "manual_checklist": self.generate_manual_research_checklist(search_terms),
                "third_party_recommendation": self.get_third_party_recommendations(search_terms),
                "verification_urls": {
                    "sold_listings": self.url_generator.generate_sold_listings_url(search_terms, sold_days_ago=90),
                    "current_listings": self.url_generator.generate_current_listings_url(search_terms)
                }
            }
        }
        
        return result
    
    def _extract_search_terms(self, item_data):
        """Legacy method - now delegates to SmartSearchExtractor."""
        strategies = self.search_extractor.extract_search_terms(item_data)
        
        # Return the best strategy's terms, or fallback to title
        if strategies:
            return strategies[0]['terms']
        
        # Fallback to simple title extraction
        if "title" in item_data and item_data["title"]:
            return item_data["title"]
        elif "temp_title" in item_data and item_data["temp_title"]:
            return item_data["temp_title"]
        
        return "unknown item"
    
    def _fetch_real_sold_items(self, search_terms, limit=10):
        """
        Attempt to fetch real sold items data.
        
        As of 2024-2025, eBay's API landscape for sold listings has become highly restricted:
        - findCompletedItems API: Decommissioned February 5, 2025
        - Marketplace Insights API: Requires business partnership approval
        - Third-party APIs: Often unreliable or prohibited by eBay ToS
        
        Current options for real data:
        1. Official Marketplace Insights API (requires eBay business approval)
        2. eBay Terapeak (requires seller account)
        3. Third-party services like SerpApi (paid, legal)
        4. Manual verification via eBay sold listings search
        """
        
        # Try SerpApi integration (example implementation)
        try:
            return self._try_serpapi_integration(search_terms, limit)
        except Exception as e:
            print(f"SerpApi integration not available: {e}")
        
        # Try other legitimate APIs here
        # Note: Most free unofficial APIs violate eBay ToS or are unreliable
        
        print("Real-time sold data APIs require business partnerships or paid services.")
        print("Using demo mode with manual verification links.")
        return None
    
    def _try_serpapi_integration(self, search_terms, limit=10):
        """
        Example implementation for SerpApi eBay sold listings integration.
        
        SerpApi is a legitimate third-party service that provides eBay data access.
        Requires API key and paid subscription beyond free tier.
        See: https://serpapi.com/ebay-search-api
        """
        try:
            import requests
            import os
            
            # Check for SerpApi key (user would need to set this)
            api_key = os.environ.get('SERPAPI_KEY')
            if not api_key:
                print("SerpApi integration requires SERPAPI_KEY environment variable")
                return None
            
            # SerpApi eBay endpoint
            url = "https://serpapi.com/search"
            
            params = {
                'engine': 'ebay',
                'ebay_domain': 'ebay.com',
                '_nkw': search_terms,
                'LH_Sold': '1',
                'LH_Complete': '1',
                'api_key': api_key,
                'num': min(limit, 100)
            }
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if 'organic_results' in data:
                    sold_items = []
                    for item in data['organic_results'][:limit]:
                        # Convert SerpApi response to our format
                        sold_item = {
                            "title": item.get('title', 'Unknown Item'),
                            "price": self._parse_price(item.get('price', '')),
                            "shipping": self._parse_price(item.get('shipping', '')),
                            "sold_date": item.get('sold_date', ''),
                            "url": item.get('link', ''),
                            "condition": item.get('condition', 'Unknown'),
                            "item_id": item.get('item_id', '')
                        }
                        sold_items.append(sold_item)
                    
                    print(f"Successfully fetched {len(sold_items)} real sold items via SerpApi")
                    return sold_items
            
            print(f"SerpApi request failed with status {response.status_code}")
            return None
            
        except ImportError:
            print("requests library not available for SerpApi integration")
            return None
        except Exception as e:
            print(f"SerpApi error: {e}")
            return None
    
    def _parse_price(self, price_str):
        """Parse price string to float."""
        if not price_str:
            return 0.0
        try:
            # Remove currency symbols and parse
            cleaned = ''.join(c for c in str(price_str) if c.isdigit() or c == '.')
            return float(cleaned) if cleaned else 0.0
        except:
            return 0.0
    
    def _fetch_sold_items(self, search_terms, limit=10):
        """
        Fetch sold items from eBay.
        
        First tries unofficial API, falls back to simulated data for demo.
        """
        # Try to fetch real sold data first
        try:
            real_sold_items = self._fetch_real_sold_items(search_terms, limit)
            if real_sold_items:
                return real_sold_items
        except Exception as e:
            print(f"Note: Could not fetch real sold data ({e}), using simulated data")
        
        # Fall back to simulated data with proper eBay URLs for manual verification
        # Uses legitimate eBay search URLs as recommended in the comprehensive API guide
        def simulate_sold_items_with_verification_urls(search_terms, count=10):
            """Generate simulated sold items with proper eBay verification URLs."""
            base_price = random.uniform(20, 200)
            variation = base_price * 0.3  # 30% variation
            
            # Generate proper eBay sold listings URL for manual verification
            verification_url = self.url_generator.generate_sold_listings_url(
                keywords=search_terms,
                sold_days_ago=90,
                items_per_page=200
            )
            
            sold_items = []
            for i in range(count):
                # Simulate price with some variation
                price = max(0.99, base_price + random.uniform(-variation, variation))
                
                # Random date within the past 90 days
                days_ago = random.randint(1, 90)
                sold_date = datetime.now() - timedelta(days=days_ago)
                
                # Create individual item data with verification URL
                item = {
                    "title": f"{search_terms} - Sample Item {i+1}",
                    "price": round(price, 2),
                    "shipping": round(random.uniform(0, 15), 2),
                    "sold_date": sold_date.strftime("%Y-%m-%d"),
                    "url": verification_url,  # Use proper eBay search URL
                    "condition": random.choice(["New", "Used", "Open box", "Refurbished"]),
                    "item_id": f"{random.randint(100000000, 999999999)}",
                    "verification_url": verification_url,  # Additional field for research
                    "research_notes": "Manual verification recommended via eBay sold listings search"
                }
                sold_items.append(item)
                
            # Create research template for manual follow-up
            research_template = self.research_manager.create_research_template(
                search_terms, search_terms
            )
            research_template['urls']['sold_listings'] = verification_url
            research_template['urls']['current_listings'] = self.url_generator.generate_current_listings_url(search_terms)
            
            return sold_items, research_template
            
        # Generate simulated data with proper verification URLs and research templates
        sold_items, research_template = simulate_sold_items_with_verification_urls(search_terms, limit)
        
        # Store research template for potential export
        self.last_research_template = research_template
        
        return sold_items

    def _fetch_current_listings(self, search_terms, limit=10):
        """
        Fetch current active listings from eBay when no sold items found.
        
        In a real implementation, this would use the eBay API or scrape current listings.
        For demo purposes, we'll generate simulated data.
        """
        def simulate_current_listings_with_verification_urls(search_terms, count=10):
            """Generate simulated current listings with proper eBay verification URLs."""
            base_price = random.uniform(25, 250)
            variation = base_price * 0.4  # 40% variation for active listings
            
            # Generate proper eBay current listings URL for manual verification
            verification_url = self.url_generator.generate_current_listings_url(
                keywords=search_terms,
                items_per_page=200
            )
            
            current_items = []
            for i in range(count):
                # Simulate price with some variation
                price = max(0.99, base_price + random.uniform(-variation, variation))
                
                # Random listing date within the past 30 days
                days_ago = random.randint(1, 30)
                list_date = datetime.now() - timedelta(days=days_ago)
                
                item = {
                    "title": f"{search_terms} - Current Listing {i+1}",
                    "price": round(price, 2),
                    "shipping": round(random.uniform(0, 20), 2),
                    "list_date": list_date.strftime("%Y-%m-%d"),
                    "url": verification_url,  # Use proper eBay search URL
                    "condition": random.choice(["New", "Used", "Open box", "Refurbished"]),
                    "item_id": f"{random.randint(100000000, 999999999)}",
                    "watchers": random.randint(0, 15),
                    "views": random.randint(10, 200),
                    "verification_url": verification_url,
                    "research_notes": "Manual verification recommended via eBay current listings search"
                }
                current_items.append(item)
                
            return current_items
            
        current_items = simulate_current_listings_with_verification_urls(search_terms, limit)
        return current_items
    
    def _analyze_prices(self, sold_items):
        """Analyze prices from sold items."""
        if not sold_items:
            return None
            
        # Extract prices (item price + shipping)
        prices = [item["price"] + item["shipping"] for item in sold_items]
        
        # Calculate statistics
        stats = {
            "count": len(prices),
            "min": min(prices),
            "max": max(prices),
            "mean": statistics.mean(prices),
            "median": statistics.median(prices)
        }
        
        # Calculate standard deviation if we have enough data points
        if len(prices) >= 2:
            stats["stdev"] = statistics.stdev(prices)
        else:
            stats["stdev"] = 0
            
        return stats
    
    def _calculate_suggested_price(self, price_analysis, markup_percent):
        """Calculate suggested price based on analysis and markup."""
        if not price_analysis:
            return None
            
        # Use median price as baseline (more robust than mean against outliers)
        baseline = price_analysis["median"]
        
        # Calculate markup amount
        markup_amount = baseline * (markup_percent / 100)
        
        # Calculate suggested price
        suggested_price = baseline + markup_amount
        
        # Round to nearest $0.99
        suggested_price = round(suggested_price - 0.01, 0) + 0.99
        
        return suggested_price
    
    def export_research_template(self, file_path=None):
        """Export the last research template for manual completion."""
        if not hasattr(self, 'last_research_template'):
            return False
        
        if not file_path:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            file_path = f"ebay_research_{timestamp}.json"
        
        try:
            with open(file_path, 'w') as f:
                json.dump(self.last_research_template, f, indent=2)
            return file_path
        except Exception as e:
            print(f"Export failed: {e}")
            return False
    
    def get_third_party_recommendations(self, search_terms, budget_range='medium'):
        """Provide recommendations for legitimate third-party research services."""
        recommendations = {
            'budget': {
                'service': 'WatchCount + Manual Research',
                'cost': 'Free tier available',
                'features': ['Basic auction analysis', 'Manual eBay research'],
                'best_for': 'Occasional research, low volume'
            },
            'medium': {
                'service': 'ZIK Analytics Basic',
                'cost': '$97/month',
                'features': ['eBay sold listings analysis', 'Competitor research', 'Keyword optimization'],
                'best_for': 'Regular sellers, moderate volume'
            },
            'premium': {
                'service': 'ZIK Analytics Pro',
                'cost': '$497/month',
                'features': ['Full research suite', 'API access', 'Advanced analytics'],
                'best_for': 'High-volume sellers, professional operations'
            }
        }
        
        return recommendations.get(budget_range, recommendations['medium'])
    
    def generate_manual_research_checklist(self, search_terms):
        """Generate a checklist for manual eBay research."""
        urls = {
            'sold_listings': self.url_generator.generate_sold_listings_url(
                keywords=search_terms,
                sold_days_ago=90
            ),
            'current_listings': self.url_generator.generate_current_listings_url(
                keywords=search_terms
            ),
            'sold_30_days': self.url_generator.generate_sold_listings_url(
                keywords=search_terms,
                sold_days_ago=30
            )
        }
        
        checklist = {
            'research_steps': [
                'Open eBay sold listings URL in browser',
                'Review first 2-3 pages of sold items',
                'Note price range and average selling price',
                'Check shipping costs and total prices',
                'Identify seasonal patterns if visible',
                'Check current listings for competition',
                'Document findings in research template'
            ],
            'urls': urls,
            'data_to_collect': [
                'Average sold price',
                'Price range (min/max)',
                'Number of listings sold per page',
                'Common conditions sold',
                'Shipping cost patterns',
                'Competition level assessment'
            ],
            'red_flags': [
                'Very few sold listings',
                'Wide price variations',
                'Many "for parts" listings',
                'Seasonal items out of season'
            ]
        }
        
        return checklist


class PriceAnalyzerGUI(tk.Toplevel):
    """GUI for the eBay Price Analyzer."""
    
    def __init__(self, parent, item_data=None, callback=None):
        """Initialize the price analyzer GUI."""
        super().__init__(parent)
        self.title("eBay Price Analyzer")
        self.geometry("800x600")
        self.minsize(600, 400)
        
        self.parent = parent
        self.item_data = item_data or {}
        self.callback = callback
        self.analyzer = PriceAnalyzer()
        self.results = None
        
        # Set up variables
        self.search_terms_var = tk.StringVar()
        if item_data:
            self.search_terms_var.set(self.analyzer._extract_search_terms(item_data))
            
        self.markup_var = tk.StringVar(value=str(self.analyzer.config["default_markup"]))
        self.sample_limit_var = tk.StringVar(value=str(self.analyzer.config["max_results"]))
        self.final_price_var = tk.StringVar()
        self.price_approved = False
        
        # Create UI
        self._create_widgets()
        
        # Center the window
        self.update_idletasks()
        width = self.winfo_width()
        height = self.winfo_height()
        x = (self.winfo_screenwidth() // 2) - (width // 2)
        y = (self.winfo_screenheight() // 2) - (height // 2)
        self.geometry(f'+{x}+{y}')
        
        # Make modal only if parent is visible
        if parent and parent.winfo_viewable():
            self.transient(parent)
            self.grab_set()
        else:
            # For standalone use, make it a normal window
            self.protocol("WM_DELETE_WINDOW", self._on_close)
        
    def _create_widgets(self):
        """Create GUI widgets."""
        # Main container
        main_frame = ttk.Frame(self, padding=10)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Search frame
        search_frame = ttk.LabelFrame(main_frame, text="Search")
        search_frame.pack(fill=tk.X, pady=5)
        
        ttk.Label(search_frame, text="Search Terms:").grid(row=0, column=0, padx=5, pady=5, sticky=tk.W)
        search_entry = ttk.Entry(search_frame, textvariable=self.search_terms_var, width=50)
        search_entry.grid(row=0, column=1, padx=5, pady=5, sticky=tk.EW)
        
        # Configure grid weights
        search_frame.grid_columnconfigure(1, weight=1)
        
        # Search strategy selection frame
        self.strategy_frame = ttk.LabelFrame(search_frame, text="🔍 Search Strategy Options")
        self.strategy_frame.grid(row=1, column=0, columnspan=2, padx=5, pady=5, sticky=tk.EW)
        self.strategy_frame.grid_remove()  # Initially hidden
        
        # Strategy selection variables
        self.selected_strategy_var = tk.StringVar()
        self.custom_search_var = tk.StringVar()
        
        # Options frame
        options_frame = ttk.Frame(search_frame)
        options_frame.grid(row=2, column=0, columnspan=2, padx=5, pady=5, sticky=tk.EW)
        
        ttk.Label(options_frame, text="Markup %:").pack(side=tk.LEFT, padx=5)
        ttk.Entry(options_frame, textvariable=self.markup_var, width=5).pack(side=tk.LEFT, padx=5)
        
        ttk.Label(options_frame, text="Sample Limit:").pack(side=tk.LEFT, padx=5)
        ttk.Entry(options_frame, textvariable=self.sample_limit_var, width=5).pack(side=tk.LEFT, padx=5)
        
        # Buttons frame
        buttons_frame = ttk.Frame(options_frame)
        buttons_frame.pack(side=tk.RIGHT, padx=5)
        
        ttk.Button(buttons_frame, text="🔍 Preview Search", command=self._preview_search_strategies).pack(side=tk.LEFT, padx=2)
        ttk.Button(buttons_frame, text="Analyze", command=self._analyze_pricing).pack(side=tk.LEFT, padx=2)
        
        # Results frame
        self.results_frame = ttk.LabelFrame(main_frame, text="Results")
        self.results_frame.pack(fill=tk.BOTH, expand=True, pady=5)
        
        # Initial message
        ttk.Label(
            self.results_frame, 
            text="Enter search terms and click Analyze to get price recommendations",
            font=("Segoe UI", 10, "italic")
        ).pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        # Button frame
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(fill=tk.X, pady=10)
        
        self.apply_button = ttk.Button(
            button_frame, 
            text="Apply Price", 
            command=self._apply_price,
            state=tk.DISABLED
        )
        self.apply_button.pack(side=tk.RIGHT, padx=5)
        
        ttk.Button(
            button_frame, 
            text="Cancel", 
            command=self.destroy
        ).pack(side=tk.RIGHT, padx=5)
        
    def _preview_search_strategies(self):
        """Preview and allow modification of search strategies."""
        search_terms = self.search_terms_var.get().strip()
        if not search_terms and not self.item_data:
            messagebox.showerror("Error", "Please enter search terms or provide item data")
            return
        
        # Get search strategies
        if self.item_data:
            strategies = self.analyzer.search_extractor.extract_search_terms(self.item_data)
        else:
            # Create basic strategy from manual search terms
            strategies = [{
                'terms': search_terms,
                'strategy': 'manual',
                'confidence': 'high'
            }]
        
        if not strategies:
            strategies = [{
                'terms': search_terms or "unknown item",
                'strategy': 'fallback',
                'confidence': 'low'
            }]
        
        # Display strategy selection
        self._display_strategy_selection(strategies)
    
    def _display_strategy_selection(self, strategies):
        """Display strategy selection interface."""
        # Clear strategy frame
        for widget in self.strategy_frame.winfo_children():
            widget.destroy()
        
        # Show strategy frame
        self.strategy_frame.grid()
        
        # Strategy selection header
        header_frame = ttk.Frame(self.strategy_frame)
        header_frame.pack(fill=tk.X, padx=10, pady=5)
        
        ttk.Label(
            header_frame,
            text="Choose a search strategy or create a custom one:",
            font=("Segoe UI", 10, "bold")
        ).pack(anchor=tk.W)
        
        # Strategy radio buttons
        strategies_container = ttk.Frame(self.strategy_frame)
        strategies_container.pack(fill=tk.X, padx=10, pady=5)
        
        for i, strategy in enumerate(strategies):
            confidence_color = {
                'high': 'darkgreen',
                'medium': 'orange',
                'low': 'gray'
            }.get(strategy['confidence'], 'black')
            
            strategy_frame = ttk.Frame(strategies_container)
            strategy_frame.pack(fill=tk.X, pady=2)
            
            # Radio button
            radio = ttk.Radiobutton(
                strategy_frame,
                text=f"{strategy['strategy'].title()}: '{strategy['terms']}'" + 
                     f" ({strategy['confidence']} confidence)",
                variable=self.selected_strategy_var,
                value=strategy['terms']
            )
            radio.pack(anchor=tk.W)
            
            # Set first strategy as default
            if i == 0:
                self.selected_strategy_var.set(strategy['terms'])
        
        # Custom search option
        custom_frame = ttk.Frame(strategies_container)
        custom_frame.pack(fill=tk.X, pady=5)
        
        custom_radio = ttk.Radiobutton(
            custom_frame,
            text="Custom search terms:",
            variable=self.selected_strategy_var,
            value="custom"
        )
        custom_radio.pack(side=tk.LEFT)
        
        custom_entry = ttk.Entry(
            custom_frame,
            textvariable=self.custom_search_var,
            width=40
        )
        custom_entry.pack(side=tk.LEFT, padx=10, fill=tk.X, expand=True)
        
        # Bind custom entry to select custom radio
        def on_custom_entry_focus(event):
            self.selected_strategy_var.set("custom")
        
        custom_entry.bind("<FocusIn>", on_custom_entry_focus)
        custom_entry.bind("<KeyPress>", on_custom_entry_focus)
        
        # Action buttons
        action_frame = ttk.Frame(self.strategy_frame)
        action_frame.pack(fill=tk.X, padx=10, pady=10)
        
        ttk.Button(
            action_frame,
            text="✅ Use Selected Strategy",
            command=self._use_selected_strategy
        ).pack(side=tk.LEFT, padx=5)
        
        ttk.Button(
            action_frame,
            text="❌ Cancel",
            command=self._hide_strategy_selection
        ).pack(side=tk.LEFT, padx=5)
        
        # Tips
        tips_frame = ttk.Frame(self.strategy_frame)
        tips_frame.pack(fill=tk.X, padx=10, pady=5)
        
        tips_text = (
            "💡 Tips: High confidence strategies usually work better. "
            "Try specific brand/model terms for best results. "
            "Custom terms allow complete control over the search."
        )
        
        ttk.Label(
            tips_frame,
            text=tips_text,
            font=("Segoe UI", 8),
            foreground="gray",
            wraplength=500
        ).pack(anchor=tk.W)
    
    def _use_selected_strategy(self):
        """Use the selected search strategy for analysis."""
        selected = self.selected_strategy_var.get()
        
        if not selected:
            messagebox.showerror("Error", "Please select a search strategy")
            return
        
        if selected == "custom":
            custom_terms = self.custom_search_var.get().strip()
            if not custom_terms:
                messagebox.showerror("Error", "Please enter custom search terms")
                return
            search_terms = custom_terms
        else:
            search_terms = selected
        
        # Update search terms field
        self.search_terms_var.set(search_terms)
        
        # Hide strategy selection
        self._hide_strategy_selection()
        
        # Start analysis
        self._analyze_pricing()
    
    def _hide_strategy_selection(self):
        """Hide the strategy selection interface."""
        self.strategy_frame.grid_remove()
    
    def _analyze_pricing(self):
        """Analyze pricing based on search terms."""
        search_terms = self.search_terms_var.get().strip()
        if not search_terms:
            messagebox.showerror("Error", "Please enter search terms or use search preview")
            return
        
        # Hide strategy selection if visible
        self._hide_strategy_selection()
            
        try:
            markup = float(self.markup_var.get())
            sample_limit = int(self.sample_limit_var.get())
        except ValueError:
            messagebox.showerror("Error", "Markup and sample limit must be valid numbers")
            return
            
        # Show loading indicator
        for widget in self.results_frame.winfo_children():
            widget.destroy()
            
        loading_label = ttk.Label(
            self.results_frame, 
            text="Analyzing prices...",
            font=("Segoe UI", 10, "italic")
        )
        loading_label.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        self.update_idletasks()
        
        # Run analysis in background thread
        def run_analysis():
            try:
                results = self.analyzer.analyze_item(
                    search_terms=search_terms,
                    item_data=self.item_data,
                    markup_percent=markup,
                    sample_limit=sample_limit
                )
                self.after(0, lambda: self._display_results(results))
            except Exception as e:
                self.after(0, lambda: messagebox.showerror("Error", f"Analysis failed: {str(e)}"))
                
        threading.Thread(target=run_analysis).start()
        
    def _display_results(self, results):
        """Display price analysis results with enhanced approval workflow."""
        self.results = results
        
        # Clear results frame
        for widget in self.results_frame.winfo_children():
            widget.destroy()
            
        # Create scrollable frame
        container = ttk.Frame(self.results_frame)
        container.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        canvas = tk.Canvas(container)
        scrollbar = ttk.Scrollbar(container, orient="vertical", command=canvas.yview)
        scrollable_frame = ttk.Frame(canvas)
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(
                scrollregion=canvas.bbox("all")
            )
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        # Handle different result types
        if not results["success"]:
            if "requires_manual_pricing" in results and results["requires_manual_pricing"]:
                self._display_manual_pricing_mode(scrollable_frame, results)
            else:
                ttk.Label(
                    scrollable_frame, 
                    text=f"Analysis failed: {results['message']}",
                    font=("Segoe UI", 10, "italic"),
                    foreground="red"
                ).pack(fill=tk.X, padx=10, pady=5)
            return
            
        # Display successful analysis with sold items
        self._display_successful_analysis(scrollable_frame, results)

    def _display_manual_pricing_mode(self, parent, results):
        """Display current listings when no sold items found."""
        # Message frame
        message_frame = ttk.LabelFrame(parent, text="⚠️ No Sold Items Found")
        message_frame.pack(fill=tk.X, padx=10, pady=5)
        
        ttk.Label(
            message_frame,
            text=results["message"],
            font=("Segoe UI", 10),
            foreground="orange"
        ).pack(fill=tk.X, padx=10, pady=5)
        
        # Manual pricing frame
        pricing_frame = ttk.LabelFrame(parent, text="💡 Manual Price Entry")
        pricing_frame.pack(fill=tk.X, padx=10, pady=5)
        
        ttk.Label(
            pricing_frame,
            text="Based on current market listings below, enter your price:",
            font=("Segoe UI", 10)
        ).pack(fill=tk.X, padx=10, pady=5)
        
        price_entry_frame = ttk.Frame(pricing_frame)
        price_entry_frame.pack(fill=tk.X, padx=10, pady=5)
        
        ttk.Label(price_entry_frame, text="Price: $", font=("Segoe UI", 12, "bold")).pack(side=tk.LEFT, padx=5)
        price_entry = ttk.Entry(price_entry_frame, textvariable=self.final_price_var, width=10, font=("Segoe UI", 12))
        price_entry.pack(side=tk.LEFT, padx=5)
        
        def validate_price():
            try:
                price = float(self.final_price_var.get())
                if price > 0:
                    self.price_approved = True
                    self.apply_button.configure(state=tk.NORMAL)
                else:
                    self.apply_button.configure(state=tk.DISABLED)
            except ValueError:
                self.apply_button.configure(state=tk.DISABLED)
        
        self.final_price_var.trace('w', lambda *args: validate_price())
        
        # Current listings table
        if "current_items" in results and results["current_items"]:
            self._display_current_listings(parent, results["current_items"])
        
        # Search Strategies Information for manual pricing mode
        if "search_strategies_tried" in results:
            self._display_search_strategies(parent, results)
        
        # Research Tools for manual pricing mode
        if "research_tools" in results:
            self._display_research_tools(parent, results["research_tools"])

    def _display_current_listings(self, parent, current_items):
        """Display current active listings for reference."""
        listings_frame = ttk.LabelFrame(parent, text="📊 Current Market Listings (Reference)")
        listings_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        # Calculate price statistics for reference
        prices = [item["price"] + item["shipping"] for item in current_items]
        if prices:
            min_price = min(prices)
            max_price = max(prices)
            avg_price = sum(prices) / len(prices)
            
            stats_text = f"Current listings: {len(current_items)} • "
            stats_text += f"Price range: ${min_price:.2f} - ${max_price:.2f} • "
            stats_text += f"Average: ${avg_price:.2f}"
            
            ttk.Label(
                listings_frame,
                text=stats_text,
                font=("Segoe UI", 9, "italic")
            ).pack(fill=tk.X, padx=10, pady=5)
        
        # Create table for current listings
        columns = ("title", "price", "shipping", "total", "condition", "date", "watchers", "views")
        tree = ttk.Treeview(listings_frame, columns=columns, show="headings", height=8)
        
        # Define headings
        tree.heading("title", text="Item Title")
        tree.heading("price", text="Price")
        tree.heading("shipping", text="Shipping")
        tree.heading("total", text="Total")
        tree.heading("condition", text="Condition")
        tree.heading("date", text="Listed")
        tree.heading("watchers", text="Watchers")
        tree.heading("views", text="Views")
        
        # Define columns
        tree.column("title", width=200)
        tree.column("price", width=60, anchor=tk.E)
        tree.column("shipping", width=60, anchor=tk.E)
        tree.column("total", width=60, anchor=tk.E)
        tree.column("condition", width=80)
        tree.column("date", width=80)
        tree.column("watchers", width=60, anchor=tk.E)
        tree.column("views", width=60, anchor=tk.E)
        
        # Add scrollbar
        yscrollbar = ttk.Scrollbar(listings_frame, orient="vertical", command=tree.yview)
        tree.configure(yscrollcommand=yscrollbar.set)
        
        # Add items to table
        for item in current_items:
            total = item["price"] + item["shipping"]
            tree.insert("", tk.END, values=(
                item["title"],
                f"${item['price']:.2f}",
                f"${item['shipping']:.2f}",
                f"${total:.2f}",
                item["condition"],
                item["list_date"],
                item["watchers"],
                item["views"]
            ))
            
        # Pack tree and scrollbar
        tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        yscrollbar.pack(side=tk.RIGHT, fill=tk.Y)

    def _display_successful_analysis(self, parent, results):
        """Display successful price analysis with sold items."""
        analysis = results["price_analysis"]
        
        # Price calculation breakdown
        calc_frame = ttk.LabelFrame(parent, text="🧮 Price Calculation Breakdown")
        calc_frame.pack(fill=tk.X, padx=10, pady=5)
        
        # Step-by-step calculation
        steps_frame = ttk.Frame(calc_frame)
        steps_frame.pack(fill=tk.X, padx=10, pady=5)
        
        # Step 1: Base price (median)
        step1_frame = ttk.Frame(steps_frame)
        step1_frame.pack(fill=tk.X, pady=2)
        ttk.Label(step1_frame, text="1. Median price from sold items:", font=("Segoe UI", 10)).pack(side=tk.LEFT)
        ttk.Label(step1_frame, text=f"${analysis['median']:.2f}", font=("Segoe UI", 10, "bold")).pack(side=tk.RIGHT)
        
        # Step 2: Markup calculation
        markup_amount = analysis['median'] * (results['markup_percent'] / 100)
        step2_frame = ttk.Frame(steps_frame)
        step2_frame.pack(fill=tk.X, pady=2)
        ttk.Label(step2_frame, text=f"2. Markup ({results['markup_percent']}%):", font=("Segoe UI", 10)).pack(side=tk.LEFT)
        ttk.Label(step2_frame, text=f"+${markup_amount:.2f}", font=("Segoe UI", 10, "bold")).pack(side=tk.RIGHT)
        
        # Step 3: Final suggested price
        ttk.Separator(steps_frame, orient="horizontal").pack(fill=tk.X, pady=5)
        step3_frame = ttk.Frame(steps_frame)
        step3_frame.pack(fill=tk.X, pady=2)
        ttk.Label(step3_frame, text="3. Suggested price:", font=("Segoe UI", 12, "bold")).pack(side=tk.LEFT)
        ttk.Label(step3_frame, text=f"${results['suggested_price']:.2f}", font=("Segoe UI", 12, "bold"), foreground="green").pack(side=tk.RIGHT)
        
        # Price approval section
        approval_frame = ttk.LabelFrame(parent, text="✅ Price Approval")
        approval_frame.pack(fill=tk.X, padx=10, pady=5)
        
        # Set initial value
        self.final_price_var.set(f"{results['suggested_price']:.2f}")
        
        price_approval_frame = ttk.Frame(approval_frame)
        price_approval_frame.pack(fill=tk.X, padx=10, pady=10)
        
        ttk.Label(price_approval_frame, text="Final Price: $", font=("Segoe UI", 12, "bold")).pack(side=tk.LEFT, padx=5)
        price_entry = ttk.Entry(price_approval_frame, textvariable=self.final_price_var, width=10, font=("Segoe UI", 12))
        price_entry.pack(side=tk.LEFT, padx=5)
        
        ttk.Button(
            price_approval_frame,
            text="Use Suggested",
            command=lambda: self.final_price_var.set(f"{results['suggested_price']:.2f}")
        ).pack(side=tk.LEFT, padx=10)
        
        def validate_and_approve():
            try:
                price = float(self.final_price_var.get())
                if price > 0:
                    self.price_approved = True
                    self.apply_button.configure(state=tk.NORMAL, text=f"Apply ${price:.2f}")
                    # Update results with final price
                    self.results["final_price"] = price
                else:
                    self.apply_button.configure(state=tk.DISABLED, text="Apply Price")
            except ValueError:
                self.apply_button.configure(state=tk.DISABLED, text="Apply Price")
        
        self.final_price_var.trace('w', lambda *args: validate_and_approve())
        
        # Statistics summary
        stats_frame = ttk.LabelFrame(parent, text="📈 Market Analysis Summary")
        stats_frame.pack(fill=tk.X, padx=10, pady=5)
        
        stats_text = f"Analyzed {analysis['count']} sold items • "
        stats_text += f"Range: ${analysis['min']:.2f} - ${analysis['max']:.2f} • "
        stats_text += f"Average: ${analysis['mean']:.2f} • "
        stats_text += f"Median: ${analysis['median']:.2f}"
        
        if "stdev" in analysis and analysis["stdev"] > 0:
            stats_text += f" • Std Dev: ${analysis['stdev']:.2f}"
            
        ttk.Label(
            stats_frame, 
            text=stats_text,
            justify=tk.LEFT,
            font=("Segoe UI", 9)
        ).pack(fill=tk.X, padx=10, pady=5)
        
        # Sold items table
        items_frame = ttk.LabelFrame(parent, text="📋 Recent Sold Items")
        items_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        # Create table
        columns = ("title", "price", "shipping", "total", "condition", "date", "url")
        tree = ttk.Treeview(items_frame, columns=columns, show="headings", height=10)
        
        # Define headings
        tree.heading("title", text="Item Title")
        tree.heading("price", text="Price")
        tree.heading("shipping", text="Shipping")
        tree.heading("total", text="Total")
        tree.heading("condition", text="Condition")
        tree.heading("date", text="Sold Date")
        tree.heading("url", text="eBay Link")
        
        # Define columns
        tree.column("title", width=200)
        tree.column("price", width=70, anchor=tk.E)
        tree.column("shipping", width=70, anchor=tk.E)
        tree.column("total", width=70, anchor=tk.E)
        tree.column("condition", width=100)
        tree.column("date", width=100)
        tree.column("url", width=100, anchor=tk.CENTER)
        
        # Add scrollbar
        yscrollbar = ttk.Scrollbar(items_frame, orient="vertical", command=tree.yview)
        tree.configure(yscrollcommand=yscrollbar.set)
        
        # Add items to table
        for item in results["sold_items"]:
            total = item["price"] + item["shipping"]
            # Format URL for display
            url_display = "Click to Open" if item.get("url") else "N/A"
            tree.insert("", tk.END, values=(
                item["title"],
                f"${item['price']:.2f}",
                f"${item['shipping']:.2f}",
                f"${total:.2f}",
                item["condition"],
                item["sold_date"],
                url_display
            ))
            
        # Add click handler to open URLs
        def on_item_click(event):
            """Handle double-click on tree items to open eBay listing URLs."""
            selection = tree.selection()
            if selection:
                # Get the selected item
                item_id = selection[0]
                item_values = tree.item(item_id, 'values')
                
                # Find the corresponding sold item by matching title and price
                if item_values:
                    title = item_values[0]
                    price_str = item_values[1]
                    
                    # Find matching item in results
                    for sold_item in results["sold_items"]:
                        if (sold_item["title"] == title and 
                            f"${sold_item['price']:.2f}" == price_str):
                            url = sold_item.get("url")
                            if url:
                                try:
                                    import webbrowser
                                    webbrowser.open(url)
                                    self.status_bar.update(f"Opened eBay listing: {title}")
                                except Exception as e:
                                    messagebox.showerror("Error", f"Failed to open URL: {str(e)}")
                            else:
                                messagebox.showinfo("No URL", "No URL available for this item")
                            break
        
        # Bind double-click event
        tree.bind("<Double-1>", on_item_click)
        
        # Pack tree and scrollbar
        tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        yscrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Add instruction label
        instruction_frame = ttk.Frame(items_frame)
        instruction_frame.pack(fill=tk.X, padx=10, pady=5)
        ttk.Label(
            instruction_frame, 
            text="💡 Double-click any row to view the actual eBay listing (if real data) or search sold listings",
            font=("Segoe UI", 9),
            foreground="blue"
        ).pack(anchor=tk.W)
        
        # Check if we're using real or simulated data to display appropriate message
        using_real_data = any(not item["title"].endswith(f"Sample Item {i+1}") for i, item in enumerate(results["sold_items"], 1))
        
        if using_real_data:
            info_text = "✅ Using real sold listing data from eBay API. Links open actual sold listings."
            info_color = "green"
        else:
            info_text = "ℹ️  Demo mode: Simulated data shown. Links open eBay sold listings search for verification."
            info_color = "gray"
        
        # API status information
        api_status_frame = ttk.Frame(instruction_frame)
        api_status_frame.pack(fill=tk.X, pady=(5,0))
        
        ttk.Label(
            api_status_frame, 
            text=info_text,
            font=("Segoe UI", 8),
            foreground=info_color
        ).pack(anchor=tk.W)
        
        # Show API limitation notice
        ttk.Label(
            api_status_frame,
            text="⚠️  eBay API Update (2024-2025): findCompletedItems deprecated Feb 2025. Marketplace Insights requires business approval.",
            font=("Segoe UI", 7),
            foreground="orange"
        ).pack(anchor=tk.W, pady=(2,0))
        
        # Search Strategies Information
        if "search_strategies_tried" in results:
            self._display_search_strategies(parent, results)
        
        # Research Tools and Alternatives Section
        if "research_tools" in results:
            self._display_research_tools(parent, results["research_tools"])
        
        # Initial validation
        validate_and_approve()
    
    def _display_search_strategies(self, parent, results):
        """Display information about search strategies that were tried."""
        strategies_frame = ttk.LabelFrame(parent, text="🔍 Search Strategy Analysis")
        strategies_frame.pack(fill=tk.X, padx=10, pady=5)
        
        strategies_info = ttk.Frame(strategies_frame)
        strategies_info.pack(fill=tk.X, padx=10, pady=5)
        
        # Show successful strategy if any
        if "successful_strategy" in results:
            strategy = results["successful_strategy"]
            ttk.Label(
                strategies_info,
                text=f"✅ Successful Strategy: {strategy['strategy'].title()} ({strategy['confidence']} confidence)",
                font=("Segoe UI", 9, "bold"),
                foreground="green"
            ).pack(anchor=tk.W, pady=2)
            
            ttk.Label(
                strategies_info,
                text=f"Search Terms Used: '{strategy['terms']}'",
                font=("Segoe UI", 9)
            ).pack(anchor=tk.W, padx=10, pady=1)
        
        # Show all strategies tried
        if "search_strategies_tried" in results and len(results["search_strategies_tried"]) > 1:
            ttk.Label(
                strategies_info,
                text="Strategies Tried:",
                font=("Segoe UI", 9, "bold")
            ).pack(anchor=tk.W, pady=(5,2))
            
            for i, strategy in enumerate(results["search_strategies_tried"], 1):
                confidence_color = {
                    'high': 'darkgreen',
                    'medium': 'orange', 
                    'low': 'gray'
                }.get(strategy['confidence'], 'black')
                
                strategy_text = f"{i}. {strategy['strategy'].title()}: '{strategy['terms']}' ({strategy['confidence']} confidence)"
                
                ttk.Label(
                    strategies_info,
                    text=strategy_text,
                    font=("Segoe UI", 8),
                    foreground=confidence_color
                ).pack(anchor=tk.W, padx=15, pady=1)
        
        # Show strategy explanation
        explanation_text = (
            "The system tries multiple search strategies to find the best results:\n"
            "• Brand + Model: Combines detected brand and model information\n"
            "• Feature + Type: Uses key features and product type\n"
            "• Keywords: Important words from description\n"
            "• Title Cleaned: Cleaned version of the original title"
        )
        
        explanation_label = ttk.Label(
            strategies_info,
            text=explanation_text,
            font=("Segoe UI", 8),
            foreground="gray",
            justify=tk.LEFT
        )
        explanation_label.pack(anchor=tk.W, pady=(5,0))
    
    def _display_research_tools(self, parent, research_tools):
        """Display research tools and manual verification options."""
        tools_frame = ttk.LabelFrame(parent, text="🔍 Research Tools & Manual Verification")
        tools_frame.pack(fill=tk.X, padx=10, pady=5)
        
        # Create notebook for different research options
        tools_notebook = ttk.Notebook(tools_frame)
        tools_notebook.pack(fill=tk.X, padx=10, pady=5)
        
        # Manual Verification Tab
        manual_frame = ttk.Frame(tools_notebook)
        tools_notebook.add(manual_frame, text="Manual Verification")
        
        # URLs for manual research
        urls_frame = ttk.LabelFrame(manual_frame, text="Verification URLs")
        urls_frame.pack(fill=tk.X, padx=5, pady=5)
        
        verification_urls = research_tools.get("verification_urls", {})
        
        # Sold listings URL
        sold_frame = ttk.Frame(urls_frame)
        sold_frame.pack(fill=tk.X, padx=5, pady=2)
        ttk.Label(sold_frame, text="Sold Listings:", font=("Segoe UI", 9, "bold")).pack(side=tk.LEFT)
        sold_url_button = ttk.Button(
            sold_frame,
            text="Open eBay Sold Listings",
            command=lambda: webbrowser.open(verification_urls.get("sold_listings", ""))
        )
        sold_url_button.pack(side=tk.RIGHT, padx=5)
        
        # Current listings URL
        current_frame = ttk.Frame(urls_frame)
        current_frame.pack(fill=tk.X, padx=5, pady=2)
        ttk.Label(current_frame, text="Current Listings:", font=("Segoe UI", 9, "bold")).pack(side=tk.LEFT)
        current_url_button = ttk.Button(
            current_frame,
            text="Open eBay Current Listings",
            command=lambda: webbrowser.open(verification_urls.get("current_listings", ""))
        )
        current_url_button.pack(side=tk.RIGHT, padx=5)
        
        # Manual research checklist
        checklist_frame = ttk.LabelFrame(manual_frame, text="Research Checklist")
        checklist_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        checklist_text = tk.Text(checklist_frame, height=8, wrap=tk.WORD, font=("Segoe UI", 9))
        checklist_text.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Add checklist content
        manual_checklist = research_tools.get("manual_checklist", {})
        checklist_content = "Manual Research Steps:\n\n"
        for i, step in enumerate(manual_checklist.get("research_steps", []), 1):
            checklist_content += f"{i}. {step}\n"
        
        checklist_content += "\nData to Collect:\n"
        for item in manual_checklist.get("data_to_collect", []):
            checklist_content += f"• {item}\n"
        
        checklist_content += "\nRed Flags to Watch:\n"
        for flag in manual_checklist.get("red_flags", []):
            checklist_content += f"⚠️ {flag}\n"
        
        checklist_text.insert("1.0", checklist_content)
        checklist_text.config(state=tk.DISABLED)
        
        # Third-Party Services Tab
        services_frame = ttk.Frame(tools_notebook)
        tools_notebook.add(services_frame, text="Third-Party Services")
        
        # Service recommendation
        recommendation = research_tools.get("third_party_recommendation", {})
        
        rec_frame = ttk.LabelFrame(services_frame, text="Recommended Service")
        rec_frame.pack(fill=tk.X, padx=5, pady=5)
        
        ttk.Label(
            rec_frame,
            text=f"Service: {recommendation.get('service', 'N/A')}",
            font=("Segoe UI", 10, "bold")
        ).pack(anchor=tk.W, padx=10, pady=2)
        
        ttk.Label(
            rec_frame,
            text=f"Cost: {recommendation.get('cost', 'N/A')}",
            font=("Segoe UI", 9)
        ).pack(anchor=tk.W, padx=10, pady=1)
        
        ttk.Label(
            rec_frame,
            text=f"Best for: {recommendation.get('best_for', 'N/A')}",
            font=("Segoe UI", 9)
        ).pack(anchor=tk.W, padx=10, pady=1)
        
        features_label = ttk.Label(
            rec_frame,
            text="Features: " + ", ".join(recommendation.get('features', [])),
            font=("Segoe UI", 9),
            wraplength=400
        )
        features_label.pack(anchor=tk.W, padx=10, pady=2)
        
        # Export Tab
        export_frame = ttk.Frame(tools_notebook)
        tools_notebook.add(export_frame, text="Export Research")
        
        export_info_frame = ttk.LabelFrame(export_frame, text="Research Data Export")
        export_info_frame.pack(fill=tk.X, padx=5, pady=5)
        
        ttk.Label(
            export_info_frame,
            text="Export research template for manual completion and documentation.",
            font=("Segoe UI", 9)
        ).pack(anchor=tk.W, padx=10, pady=5)
        
        export_button_frame = ttk.Frame(export_info_frame)
        export_button_frame.pack(fill=tk.X, padx=10, pady=5)
        
        def export_research_template():
            try:
                file_path = self.analyzer.export_research_template()
                if file_path:
                    messagebox.showinfo(
                        "Export Successful",
                        f"Research template exported to:\n{file_path}\n\nComplete the template with your manual research findings."
                    )
                else:
                    messagebox.showerror("Export Failed", "Could not export research template.")
            except Exception as e:
                messagebox.showerror("Export Error", f"Export failed: {str(e)}")
        
        ttk.Button(
            export_button_frame,
            text="Export Research Template",
            command=export_research_template
        ).pack(side=tk.LEFT, padx=5)
        
        ttk.Label(
            export_info_frame,
            text="Template includes verification URLs, data collection fields, and research guidelines.",
            font=("Segoe UI", 8),
            foreground="gray"
        ).pack(anchor=tk.W, padx=10, pady=(0,5))
        
    def _apply_price(self):
        """Apply the approved price to the item."""
        # Get the final price from the entry field
        try:
            final_price = float(self.final_price_var.get())
        except ValueError:
            messagebox.showerror("Error", "Please enter a valid price")
            return
            
        if final_price <= 0:
            messagebox.showerror("Error", "Price must be greater than 0")
            return
        
        # Update results with final approved price
        if self.results:
            self.results["final_price"] = final_price
            self.results["user_approved"] = True
        else:
            # Manual pricing mode - create minimal results
            self.results = {
                "success": True,
                "final_price": final_price,
                "user_approved": True,
                "search_terms": self.search_terms_var.get(),
                "manual_pricing": True
            }
        
        if not self.callback:
            # If no callback, just copy to clipboard
            self.clipboard_clear()
            self.clipboard_append(f"{final_price:.2f}")
            messagebox.showinfo("Price Copied", f"The price ${final_price:.2f} has been copied to clipboard")
        else:
            # Call the callback function with results
            self.callback(self.results)
            messagebox.showinfo("Price Applied", f"Applied price ${final_price:.2f} to item")
            
        self.destroy()
    
    def _on_close(self):
        """Handle window close event for standalone use."""
        self.destroy()
        if self.parent:
            self.parent.quit()


def main():
    """Run the eBay Price Analyzer as a standalone application."""
    root = tk.Tk()
    root.title("eBay Price Analyzer")
    root.withdraw()  # Hide the root window
    
    # Create and show the analyzer GUI
    analyzer_gui = PriceAnalyzerGUI(root)
    
    # Ensure the window is visible and on top
    analyzer_gui.deiconify()
    analyzer_gui.lift()
    analyzer_gui.focus_force()
    
    # Wait for the window to be closed
    root.wait_window(analyzer_gui)
    
    # Exit the application
    root.destroy()


if __name__ == "__main__":
    main()