#!/usr/bin/env python3
"""
Simplified PriceAnalyzer without tkinter dependency for auto pricing
"""
import json
import re
import random
from datetime import datetime, timedelta
import statistics

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Required packages not found. Install with: pip install requests beautifulsoup4")

class SimplePriceAnalyzer:
    """eBay price analyzer that finds similar sold items and recommends pricing (no GUI)."""
    
    def __init__(self, config_file=None):
        """Initialize the price analyzer with optional config file."""
        self.config = self._load_config(config_file)
        self.user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        
    def _load_config(self, config_file=None):
        """Load configuration from file or use defaults."""
        default_config = {
            "default_markup": 15,  # Percentage markup above average
            "max_results": 10,     # Maximum number of results to analyze
            "min_results": 3,      # Minimum results needed for analysis
            "days_back": 90,       # How far back to look for sold items
        }
        
        if config_file and os.path.exists(config_file):
            try:
                with open(config_file, 'r') as f:
                    loaded_config = json.load(f)
                default_config.update(loaded_config)
            except Exception as e:
                print(f"Warning: Could not load config from {config_file}: {e}")
        
        return default_config
    
    def analyze_item(self, search_terms=None, item_data=None, markup_percent=None, sample_limit=None):
        """
        Analyze eBay pricing for an item.
        
        Args:
            search_terms: Search terms to use for finding similar items
            item_data: Dictionary containing item data (optional)
            markup_percent: Custom markup percentage (overrides config)
            sample_limit: Limit the number of samples to analyze
            
        Returns:
            Dictionary with pricing analysis results
        """
        if not search_terms and item_data:
            # Extract search terms from item data
            search_terms = self._extract_search_terms(item_data)
        
        if not search_terms:
            raise ValueError("Search terms or item data must be provided")
            
        # Use provided markup or default from config
        markup = markup_percent if markup_percent is not None else self.config["default_markup"]
        
        # Set sample limit
        limit = sample_limit if sample_limit is not None else self.config["max_results"]
        
        # Get sold items
        sold_items = self._fetch_sold_items(search_terms, limit)
        
        if not sold_items or len(sold_items) < self.config["min_results"]:
            return {
                "success": False,
                "message": f"Not enough sold items found (needed {self.config['min_results']}, found {len(sold_items)})",
                "search_terms": search_terms,
                "sold_items": sold_items
            }
            
        # Analyze prices
        price_analysis = self._analyze_prices(sold_items)
        
        # Calculate suggested price
        suggested_price = self._calculate_suggested_price(price_analysis, markup)
        
        # Return complete results
        return {
            "success": True,
            "search_terms": search_terms,
            "sold_items": sold_items,
            "price_analysis": price_analysis,
            "suggested_price": suggested_price,
            "markup_percent": markup,
            "analyzed_at": datetime.now().isoformat()
        }
    
    def _extract_search_terms(self, item_data):
        """Extract search terms from item data."""
        search_terms = []
        
        # Use title if available
        if "title" in item_data and item_data["title"]:
            search_terms.append(item_data["title"])
            
        # Use brand and model if available in item specifics
        if "item_specifics" in item_data:
            specifics = item_data["item_specifics"]
            if "Brand" in specifics and specifics["Brand"]:
                search_terms.append(specifics["Brand"])
            if "Model" in specifics and specifics["Model"]:
                search_terms.append(specifics["Model"])
        
        # Join terms and clean up
        search_query = " ".join(search_terms)
        return search_query[:80]  # Limit length
    
    def _fetch_sold_items(self, search_terms, limit=10):
        """
        Fetch sold items from eBay.
        
        In a real implementation, this would use the eBay API or scrape eBay sold listings.
        For demo purposes, we'll generate simulated data.
        """
        # IMPORTANT: In a production environment, replace this with actual eBay API calls
        # or proper web scraping with appropriate rate limiting and compliance with eBay's TOS
        
        # For demonstration purposes only, generate simulated sold items
        # In a real implementation, you would use the eBay API or properly scrape eBay
        def simulate_sold_items(search_terms, count=10):
            """Generate simulated sold items for demonstration."""
            base_price = random.uniform(20, 200)
            variation = base_price * 0.3  # 30% variation
            
            sold_items = []
            for i in range(count):
                # Simulate price with some variation
                price = base_price + random.uniform(-variation, variation)
                price = max(5, price)  # Minimum price of $5
                
                sold_item = {
                    "title": f"Similar Item {i+1} - {search_terms[:30]}",
                    "price": round(price, 2),
                    "sold_date": (datetime.now() - timedelta(days=random.randint(1, 90))).isoformat(),
                    "condition": random.choice(["New", "Used", "Like New", "Very Good"]),
                    "shipping": round(random.uniform(0, 15), 2)
                }
                sold_items.append(sold_item)
            
            return sold_items
        
        print(f"Simulating sold items for: {search_terms}")
        return simulate_sold_items(search_terms, min(limit, 20))
    
    def _analyze_prices(self, sold_items):
        """Analyze the prices of sold items."""
        prices = [item["price"] for item in sold_items]
        
        analysis = {
            "count": len(prices),
            "min_price": min(prices),
            "max_price": max(prices),
            "average_price": sum(prices) / len(prices),
            "median_price": statistics.median(prices),
        }
        
        # Calculate standard deviation if we have enough data
        if len(prices) > 1:
            analysis["std_deviation"] = statistics.stdev(prices)
        else:
            analysis["std_deviation"] = 0
            
        return analysis
    
    def _calculate_suggested_price(self, price_analysis, markup_percent):
        """Calculate suggested price based on analysis and markup."""
        # Use median price as base (more robust than average)
        base_price = price_analysis["median_price"]
        
        # Apply markup
        markup_multiplier = 1 + (markup_percent / 100)
        suggested_price = base_price * markup_multiplier
        
        # Round to nearest cent
        return round(suggested_price, 2)

# For compatibility with existing processor code
PriceAnalyzer = SimplePriceAnalyzer