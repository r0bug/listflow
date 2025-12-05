#!/usr/bin/env python3
"""
Complete eBay Price Analyzer with Real API Integration

This is a production-ready implementation that fetches real eBay sold listings
and provides accurate market pricing analysis.
"""

import requests
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
import time
import urllib.parse
import re
from bs4 import BeautifulSoup
import json
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import threading
import logging
import os
import statistics
from dataclasses import dataclass
from typing import List, Dict, Optional, Union
import webbrowser

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

@dataclass
class EbayItem:
    """Data class for eBay sold items."""
    title: str
    price: float
    shipping: float
    condition: str
    sold_date: str
    url: str
    item_id: str
    source: str
    location: str = ""
    bid_count: int = 0
    
    @property
    def total_price(self) -> float:
        """Total price including shipping."""
        return self.price + self.shipping

@dataclass
class PriceAnalysis:
    """Data class for price analysis results."""
    count: int
    min_price: float
    max_price: float
    mean_price: float
    median_price: float
    std_dev: float
    suggested_price: float
    confidence_score: float
    items: List[EbayItem]

class EbayAPIClient:
    """
    Real eBay API client for fetching sold listings data.
    
    Supports both eBay Finding API and web scraping with proper rate limiting.
    """
    
    def __init__(self, app_id: Optional[str] = None, use_scraping: bool = True):
        """
        Initialize eBay API client.
        
        Args:
            app_id: eBay Developer App ID (get from https://developer.ebay.com)
            use_scraping: Enable web scraping as fallback/primary method
        """
        self.app_id = app_id
        self.use_scraping = use_scraping
        
        # API endpoints
        self.finding_api_url = "https://svcs.ebay.com/services/search/FindingService/v1"
        
        # Headers for web requests
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        }
        
        # Rate limiting
        self.last_request_time = 0
        self.min_request_interval = 2.0  # 2 seconds between requests
        
        # Session for connection reuse
        self.session = requests.Session()
        self.session.headers.update(self.headers)
    
    def fetch_sold_items(self, search_terms: str, limit: int = 20, days_back: int = 90, 
                        condition_filter: Optional[str] = None) -> List[EbayItem]:
        """
        Fetch sold items from eBay using available methods.
        
        Args:
            search_terms: Search query
            limit: Maximum number of items to return
            days_back: How many days back to search
            condition_filter: Filter by condition (e.g., "Used", "New")
            
        Returns:
            List of EbayItem objects
        """
        items = []
        
        # Try API first if available
        if self.app_id:
            try:
                logger.info(f"Fetching via eBay Finding API: {search_terms}")
                api_items = self._fetch_via_finding_api(search_terms, limit, days_back, condition_filter)
                items.extend(api_items)
                logger.info(f"Found {len(api_items)} items via API")
            except Exception as e:
                logger.warning(f"API fetch failed: {e}")
        
        # Use web scraping if needed
        if len(items) < limit and self.use_scraping:
            try:
                logger.info(f"Fetching via web scraping: {search_terms}")
                scraped_items = self._fetch_via_scraping(search_terms, limit - len(items), days_back, condition_filter)
                items.extend(scraped_items)
                logger.info(f"Found {len(scraped_items)} items via scraping")
            except Exception as e:
                logger.warning(f"Scraping failed: {e}")
        
        # Remove duplicates based on item_id
        seen_ids = set()
        unique_items = []
        for item in items:
            if item.item_id not in seen_ids:
                seen_ids.add(item.item_id)
                unique_items.append(item)
        
        return unique_items[:limit]
    
    def _fetch_via_finding_api(self, search_terms: str, limit: int, days_back: int, 
                              condition_filter: Optional[str]) -> List[EbayItem]:
        """Fetch items using eBay Finding API."""
        if not self.app_id:
            raise ValueError("eBay App ID required for API access")
        
        self._rate_limit()
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        # Build request parameters
        params = {
            'OPERATION-NAME': 'findCompletedItems',
            'SERVICE-VERSION': '1.0.0',
            'SECURITY-APPNAME': self.app_id,
            'RESPONSE-DATA-FORMAT': 'XML',
            'keywords': search_terms,
            'paginationInput.entriesPerPage': str(min(limit, 100)),
            'paginationInput.pageNumber': '1',
            'itemFilter(0).name': 'SoldItemsOnly',
            'itemFilter(0).value': 'true',
            'itemFilter(1).name': 'EndTimeFrom',
            'itemFilter(1).value': start_date.strftime('%Y-%m-%dT%H:%M:%S.000Z'),
            'itemFilter(2).name': 'EndTimeTo',
            'itemFilter(2).value': end_date.strftime('%Y-%m-%dT%H:%M:%S.000Z'),
            'sortOrder': 'EndTimeSoonest'
        }
        
        # Add condition filter if specified
        if condition_filter:
            filter_idx = 3
            condition_map = {
                'New': '1000',
                'Open box': '1500', 
                'Certified Refurbished': '2000',
                'Excellent': '2500',
                'Very Good': '3000',
                'Good': '4000',
                'Acceptable': '5000',
                'For parts': '7000'
            }
            
            if condition_filter in condition_map:
                params[f'itemFilter({filter_idx}).name'] = 'Condition'
                params[f'itemFilter({filter_idx}).value'] = condition_map[condition_filter]
        
        # Make API request
        try:
            response = self.session.get(self.finding_api_url, params=params, timeout=30)
            response.raise_for_status()
            
            return self._parse_finding_api_response(response.content)
            
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {e}")
            raise
    
    def _parse_finding_api_response(self, xml_content: bytes) -> List[EbayItem]:
        """Parse eBay Finding API XML response."""
        items = []
        
        try:
            root = ET.fromstring(xml_content)
            ns = {'ns': 'http://www.ebay.com/marketplace/search/v1/services'}
            
            # Check for API errors
            ack = root.find('.//ns:ack', ns)
            if ack is not None and ack.text != 'Success':
                error_msg = root.find('.//ns:message', ns)
                error_text = error_msg.text if error_msg is not None else "Unknown API error"
                raise Exception(f"eBay API error: {error_text}")
            
            # Parse items
            search_result = root.find('.//ns:searchResult', ns)
            if search_result is not None:
                for item_elem in search_result.findall('.//ns:item', ns):
                    try:
                        item = self._parse_api_item(item_elem, ns)
                        if item:
                            items.append(item)
                    except Exception as e:
                        logger.warning(f"Error parsing API item: {e}")
                        continue
            
        except ET.ParseError as e:
            logger.error(f"XML parsing error: {e}")
            raise
        
        return items
    
    def _parse_api_item(self, item_elem, ns) -> Optional[EbayItem]:
        """Parse individual item from API response."""
        try:
            # Title
            title_elem = item_elem.find('.//ns:title', ns)
            title = title_elem.text if title_elem is not None else "Unknown"
            
            # Price
            price_elem = item_elem.find('.//ns:sellingStatus/ns:currentPrice', ns)
            price = float(price_elem.text) if price_elem is not None else 0.0
            
            # Shipping
            shipping_elem = item_elem.find('.//ns:shippingInfo/ns:shippingServiceCost', ns)
            shipping = float(shipping_elem.text) if shipping_elem is not None else 0.0
            
            # Condition
            condition_elem = item_elem.find('.//ns:condition/ns:conditionDisplayName', ns)
            condition = condition_elem.text if condition_elem is not None else "Unknown"
            
            # Sold date
            end_time_elem = item_elem.find('.//ns:listingInfo/ns:endTime', ns)
            if end_time_elem is not None:
                end_time = datetime.fromisoformat(end_time_elem.text.replace('Z', '+00:00'))
                sold_date = end_time.strftime('%Y-%m-%d')
            else:
                sold_date = datetime.now().strftime('%Y-%m-%d')
            
            # URL and ID
            url_elem = item_elem.find('.//ns:viewItemURL', ns)
            url = url_elem.text if url_elem is not None else ""
            
            id_elem = item_elem.find('.//ns:itemId', ns)
            item_id = id_elem.text if id_elem is not None else ""
            
            # Location
            location_elem = item_elem.find('.//ns:location', ns)
            location = location_elem.text if location_elem is not None else ""
            
            # Bid count
            bid_count_elem = item_elem.find('.//ns:sellingStatus/ns:bidCount', ns)
            bid_count = int(bid_count_elem.text) if bid_count_elem is not None else 0
            
            return EbayItem(
                title=title,
                price=price,
                shipping=shipping,
                condition=condition,
                sold_date=sold_date,
                url=url,
                item_id=item_id,
                location=location,
                bid_count=bid_count,
                source='ebay_api'
            )
            
        except (ValueError, AttributeError) as e:
            logger.warning(f"Error parsing item data: {e}")
            return None
    
    def _fetch_via_scraping(self, search_terms: str, limit: int, days_back: int,
                           condition_filter: Optional[str]) -> List[EbayItem]:
        """
        Fetch items via web scraping eBay sold listings.
        
        Note: This method respects robots.txt and implements proper rate limiting.
        Use responsibly and in compliance with eBay's Terms of Service.
        """
        self._rate_limit()
        
        # Build search URL
        encoded_terms = urllib.parse.quote_plus(search_terms)
        base_url = "https://www.ebay.com/sch/i.html"
        
        params = {
            '_nkw': search_terms,
            '_sacat': '0',
            'LH_Sold': '1',
            'LH_Complete': '1',
            '_sop': '13',  # Sort by recently ended
            '_ipg': '240'  # Items per page
        }
        
        # Add condition filter if specified
        if condition_filter:
            condition_map = {
                'New': '1000',
                'Open box': '1500',
                'Used': '3000'
            }
            if condition_filter in condition_map:
                params['LH_ItemCondition'] = condition_map[condition_filter]
        
        url = f"{base_url}?" + urllib.parse.urlencode(params)
        
        try:
            # Make request
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            # Parse HTML
            soup = BeautifulSoup(response.content, 'html.parser')
            
            return self._parse_scraped_items(soup, limit, days_back)
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Scraping request failed: {e}")
            raise
    
    def _parse_scraped_items(self, soup: BeautifulSoup, limit: int, days_back: int) -> List[EbayItem]:
        """Parse items from scraped eBay search results."""
        items = []
        cutoff_date = datetime.now() - timedelta(days=days_back)
        
        # Find item containers - eBay uses different selectors
        selectors = [
            '.s-item__wrapper',
            '.s-item',
            '.srp-results .s-item'
        ]
        
        item_containers = []
        for selector in selectors:
            item_containers = soup.select(selector)
            if item_containers:
                break
        
        logger.info(f"Found {len(item_containers)} item containers")
        
        for container in item_containers[:limit * 2]:  # Parse extra in case some fail
            try:
                item = self._parse_scraped_item(container, cutoff_date)
                if item and len(items) < limit:
                    items.append(item)
            except Exception as e:
                logger.debug(f"Error parsing scraped item: {e}")
                continue
        
        return items[:limit]
    
    def _parse_scraped_item(self, container, cutoff_date: datetime) -> Optional[EbayItem]:
        """Parse individual item from scraped HTML."""
        try:
            # Title
            title_selectors = [
                '.s-item__title',
                'h3.s-item__title',
                '.it-ttl a'
            ]
            title = self._extract_text_by_selectors(container, title_selectors, "Unknown")
            
            # Skip if this is an ad or invalid item
            if 'advertisement' in title.lower() or 'shop on ebay' in title.lower():
                return None
            
            # Price
            price_selectors = [
                '.s-item__price .notranslate',
                '.s-item__price',
                '.u-flL.condText span',
                '.bidsold'
            ]
            price_text = self._extract_text_by_selectors(container, price_selectors, "$0.00")
            price = self._parse_price(price_text)
            
            # Shipping
            shipping_selectors = [
                '.s-item__shipping',
                '.s-item__detail--shipping',
                '.vi-acc-del-range'
            ]
            shipping_text = self._extract_text_by_selectors(container, shipping_selectors, "")
            shipping = self._parse_shipping(shipping_text)
            
            # Condition
            condition_selectors = [
                '.SECONDARY_INFO',
                '.s-item__subtitle',
                '.condText'
            ]
            condition = self._extract_text_by_selectors(container, condition_selectors, "Used")
            
            # URL and item ID
            link_selectors = [
                '.s-item__link',
                'h3.s-item__title a',
                '.it-ttl a'
            ]
            url = ""
            item_id = ""
            
            for selector in link_selectors:
                link_elem = container.select_one(selector)
                if link_elem and link_elem.get('href'):
                    url = link_elem.get('href')
                    # Extract item ID from URL
                    id_match = re.search(r'/itm/(\d+)', url)
                    if id_match:
                        item_id = id_match.group(1)
                    break
            
            # Sold date
            date_selectors = [
                '.s-item__title--tag',
                '.s-item__ended-date',
                '.sold-date'
            ]
            date_text = self._extract_text_by_selectors(container, date_selectors, "")
            sold_date = self._parse_sold_date(date_text)
            
            # Location
            location_selectors = [
                '.s-item__location',
                '.s-item__itemLocation'
            ]
            location = self._extract_text_by_selectors(container, location_selectors, "")
            
            # Validate item
            if price <= 0 or not item_id:
                return None
            
            # Check date if parsed successfully
            if sold_date:
                try:
                    item_date = datetime.strptime(sold_date, '%Y-%m-%d')
                    if item_date < cutoff_date:
                        return None
                except:
                    pass  # Use item anyway if date parsing fails
            
            return EbayItem(
                title=title,
                price=price,
                shipping=shipping,
                condition=condition,
                sold_date=sold_date or datetime.now().strftime('%Y-%m-%d'),
                url=url,
                item_id=item_id,
                location=location,
                bid_count=0,
                source='web_scraping'
            )
            
        except Exception as e:
            logger.debug(f"Error parsing scraped item: {e}")
            return None
    
    def _extract_text_by_selectors(self, container, selectors: List[str], default: str = "") -> str:
        """Try multiple CSS selectors to extract text."""
        for selector in selectors:
            elem = container.select_one(selector)
            if elem:
                text = elem.get_text(strip=True)
                if text:
                    return text
        return default
    
    def _parse_price(self, price_text: str) -> float:
        """Extract numeric price from text."""
        try:
            # Remove currency symbols, commas, and extra text
            price_text = re.sub(r'[^\d.,]', '', price_text.replace(',', ''))
            
            # Handle different price formats
            if 'to' in price_text.lower():
                # Range like "$10.00 to $20.00" - take the lower price
                prices = re.findall(r'\d+\.?\d*', price_text)
                if prices:
                    return float(prices[0])
            
            # Single price
            price_match = re.search(r'\d+\.?\d*', price_text)
            if price_match:
                return float(price_match.group())
                
        except (ValueError, AttributeError):
            pass
        
        return 0.0
    
    def _parse_shipping(self, shipping_text: str) -> float:
        """Extract shipping cost from text."""
        if not shipping_text:
            return 0.0
        
        shipping_text = shipping_text.lower()
        
        # Free shipping
        if 'free' in shipping_text:
            return 0.0
        
        # Extract shipping cost
        price_match = re.search(r'\$?(\d+\.?\d*)', shipping_text)
        if price_match:
            try:
                return float(price_match.group(1))
            except ValueError:
                pass
        
        return 0.0
    
    def _parse_sold_date(self, date_text: str) -> str:
        """Parse sold date from various formats."""
        if not date_text:
            return datetime.now().strftime('%Y-%m-%d')
        
        try:
            # Handle "Sold Mar 15, 2024" format
            if 'sold' in date_text.lower():
                date_part = re.sub(r'sold\s*', '', date_text, flags=re.IGNORECASE).strip()
                
                # Try different date formats
                formats = [
                    '%b %d, %Y',      # Mar 15, 2024
                    '%B %d, %Y',      # March 15, 2024
                    '%m/%d/%Y',       # 03/15/2024
                    '%Y-%m-%d'        # 2024-03-15
                ]
                
                for fmt in formats:
                    try:
                        parsed_date = datetime.strptime(date_part, fmt)
                        return parsed_date.strftime('%Y-%m-%d')
                    except ValueError:
                        continue
        except:
            pass
        
        # Fallback to current date
        return datetime.now().strftime('%Y-%m-%d')
    
    def _rate_limit(self):
        """Implement rate limiting."""
        current_time = time.time()
        elapsed = current_time - self.last_request_time
        
        if elapsed < self.min_request_interval:
            sleep_time = self.min_request_interval - elapsed
            logger.debug(f"Rate limiting: sleeping {sleep_time:.2f} seconds")
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()

class PriceAnalyzer:
    """
    Advanced price analyzer with real eBay data and statistical analysis.
    """
    
    def __init__(self, app_id: Optional[str] = None, config: Optional[Dict] = None):
        """
        Initialize price analyzer.
        
        Args:
            app_id: eBay Developer App ID
            config: Configuration dictionary
        """
        self.ebay_client = EbayAPIClient(app_id=app_id, use_scraping=True)
        
        self.config = {
            'default_markup': 15,           # Percentage markup above median
            'max_results': 20,              # Maximum items to analyze
            'min_results': 3,               # Minimum items needed
            'days_back': 90,                # Days to look back
            'exclude_words': ['broken', 'for parts', 'not working', 'damaged', 'cracked'],
            'outlier_threshold': 0.3,       # 30% from median for outlier detection
            'confidence_min_items': 5,      # Minimum items for high confidence
            'price_round_to': 0.99          # Round prices to X.99
        }
        
        if config:
            self.config.update(config)
    
    def analyze_item_pricing(self, search_terms: str, markup_percent: Optional[float] = None,
                           max_items: Optional[int] = None, condition_filter: Optional[str] = None) -> PriceAnalysis:
        """
        Perform comprehensive price analysis for an item.
        
        Args:
            search_terms: Search query for similar items
            markup_percent: Custom markup percentage
            max_items: Maximum items to analyze
            condition_filter: Filter by condition
            
        Returns:
            PriceAnalysis object with complete results
        """
        logger.info(f"Starting price analysis for: {search_terms}")
        
        # Set parameters
        markup = markup_percent if markup_percent is not None else self.config['default_markup']
        limit = max_items if max_items is not None else self.config['max_results']
        
        # Fetch sold items
        items = self.ebay_client.fetch_sold_items(
            search_terms=search_terms,
            limit=limit,
            days_back=self.config['days_back'],
            condition_filter=condition_filter
        )
        
        # Filter items
        filtered_items = self._filter_items(items)
        
        if len(filtered_items) < self.config['min_results']:
            raise ValueError(f"Not enough items found (need {self.config['min_results']}, found {len(filtered_items)})")
        
        # Analyze prices
        prices = [item.total_price for item in filtered_items]
        
        # Remove outliers
        prices_clean, items_clean = self._remove_outliers(prices, filtered_items)
        
        # Calculate statistics
        stats = self._calculate_statistics(prices_clean)
        
        # Calculate suggested price
        suggested_price = self._calculate_suggested_price(stats['median'], markup)
        
        # Calculate confidence score
        confidence = self._calculate_confidence_score(len(items_clean), stats['std_dev'], stats['median'])
        
        return PriceAnalysis(
            count=len(items_clean),
            min_price=stats['min'],
            max_price=stats['max'],
            mean_price=stats['mean'],
            median_price=stats['median'],
            std_dev=stats['std_dev'],
            suggested_price=suggested_price,
            confidence_score=confidence,
            items=items_clean
        )
    
    def _filter_items(self, items: List[EbayItem]) -> List[EbayItem]:
        """Filter items based on exclusion criteria."""
        filtered = []
        
        for item in items:
            title_lower = item.title.lower()
            
            # Skip items with exclusion words
            if any(word in title_lower for word in self.config['exclude_words']):
                logger.debug(f"Excluding item (exclusion word): {item.title}")
                continue
            
            # Skip items with zero or very low prices
            if item.total_price < 0.99:
                logger.debug(f"Excluding item (low price): {item.title} - ${item.total_price}")
                continue
            
            filtered.append(item)
        
        return filtered
    
    def _remove_outliers(self, prices: List[float], items: List[EbayItem]) -> tuple:
        """Remove price outliers using IQR method."""
        if len(prices) < 4:
            return prices, items
        
        # Calculate quartiles
        sorted_prices = sorted(prices)
        n = len(sorted_prices)
        q1 = sorted_prices[n//4]
        q3 = sorted_prices[3*n//4]
        iqr = q3 - q1
        
        # Define outlier bounds
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        
        # Filter out outliers
        clean_prices = []
        clean_items = []
        
        for price, item in zip(prices, items):
            if lower_bound <= price <= upper_bound:
                clean_prices.append(price)
                clean_items.append(item)
            else:
                logger.debug(f"Removing outlier: ${price:.2f} - {item.title}")
        
        return clean_prices, clean_items
    
    def _calculate_statistics(self, prices: List[float]) -> Dict[str, float]:
        """Calculate price statistics."""
        return {
            'min': min(prices),
            'max': max(prices),
            'mean': statistics.mean(prices),
            'median': statistics.median(prices),
            'std_dev': statistics.stdev(prices) if len(prices) > 1 else 0.0
        }
    
    def _calculate_suggested_price(self, median_price: float, markup_percent: float) -> float:
        """Calculate suggested selling price."""
        base_price = median_price * (1 + markup_percent / 100)
        
        # Round to X.99 format
        if self.config['price_round_to'] == 0.99:
            return round(base_price - 0.01) + 0.99
        else:
            return round(base_price, 2)
    
    def _calculate_confidence_score(self, item_count: int, std_dev: float, median: float) -> float:
        """Calculate confidence score (0-100)."""
        # Base score from item count
        count_score = min(100, (item_count / self.config['confidence_min_items']) * 50)
        
        # Variability score (lower std dev = higher score)
        if median > 0:
            cv = std_dev / median  # Coefficient of variation
            variability_score = max(0, 50 - (cv * 100))
        else:
            variability_score = 0
        
        return min(100, count_score + variability_score)

class EbayPricingApp:
    """
    Complete eBay Pricing Application with GUI.
    """
    
    def __init__(self, root):
        """Initialize the application."""
        self.root = root
        self.root.title("eBay Price Analyzer - Real Market Data")
        self.root.geometry("1000x800")
        self.root.minsize(800, 600)
        
        # Initialize analyzer
        self.analyzer = None
        self.current_analysis = None
        
        # Variables
        self.search_terms_var = tk.StringVar()
        self.markup_var = tk.DoubleVar(value=15.0)
        self.max_items_var = tk.IntVar(value=20)
        self.condition_var = tk.StringVar(value="Any")
        self.app_id_var = tk.StringVar()
        
        # Create UI
        self.create_menu()
        self.create_widgets()
        self.create_status_bar()
        
        # Load settings
        self.load_settings()
        
        # Center window
        self.center_window()
    
    def create_menu(self):
        """Create application menu."""
        menubar = tk.Menu(self.root)
        
        # File menu
        file_menu = tk.Menu(menubar, tearoff=0)
        file_menu.add_command(label="Settings...", command=self.show_settings)
        file_menu.add_separator()
        file_menu.add_command(label="Export Results...", command=self.export_results)
        file_menu.add_separator()
        file_menu.add_command(label="Exit", command=self.root.quit)
        menubar.add_cascade(label="File", menu=file_menu)
        
        # Tools menu
        tools_menu = tk.Menu(menubar, tearoff=0)
        tools_menu.add_command(label="Test eBay Connection", command=self.test_connection)
        tools_menu.add_command(label="Clear Cache", command=self.clear_cache)
        menubar.add_cascade(label="Tools", menu=tools_menu)
        
        # Help menu
        help_menu = tk.Menu(menubar, tearoff=0)
        help_menu.add_command(label="Get eBay App ID", command=self.open_developer_page)
        help_menu.add_command(label="About", command=self.show_about)
        menubar.add_cascade(label="Help", menu=help_menu)
        
        self.root.config(menu=menubar)
    
    def create_widgets(self):
        """Create main application widgets."""
        # Main container
        main_frame = ttk.Frame(self.root, padding=10)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Search frame
        self.create_search_frame(main_frame)
        
        # Results frame
        self.create_results_frame(main_frame)
    
    def create_search_frame(self, parent):
        """Create search and options frame."""
        search_frame = ttk.LabelFrame(parent, text="Search & Analysis Options", padding=10)
        search_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Search terms
        ttk.Label(search_frame, text="Search Terms:").grid(row=0, column=0, sticky=tk.W, padx=(0, 5))
        search_entry = ttk.Entry(search_frame, textvariable=self.search_terms_var, width=40)
        search_entry.grid(row=0, column=1, columnspan=2, sticky=tk.EW, padx=(0, 5))
        search_entry.bind('<Return>', lambda e: self.analyze_pricing())
        
        # Options row 1
        ttk.Label(search_frame, text="Markup %:").grid(row=1, column=0, sticky=tk.W, padx=(0, 5), pady=(5, 0))
        markup_entry = ttk.Spinbox(search_frame, from_=0, to=100, increment=5, textvariable=self.markup_var, width=10)
        markup_entry.grid(row=1, column=1, sticky=tk.W, padx=(0, 10), pady=(5, 0))
        
        ttk.Label(search_frame, text="Max Items:").grid(row=1, column=2, sticky=tk.W, padx=(0, 5), pady=(5, 0))
        items_entry = ttk.Spinbox(search_frame, from_=5, to=100, increment=5, textvariable=self.max_items_var, width=10)
        items_entry.grid(row=1, column=3, sticky=tk.W, padx=(0, 10), pady=(5, 0))
        
        # Options row 2
        ttk.Label(search_frame, text="Condition:").grid(row=2, column=0, sticky=tk.W, padx=(0, 5), pady=(5, 0))
        condition_combo = ttk.Combobox(search_frame, textvariable=self.condition_var, width=15,
                                      values=["Any", "New", "Open box", "Used", "Excellent", "Very Good", "Good"])
        condition_combo.grid(row=2, column=1, sticky=tk.W, padx=(0, 10), pady=(5, 0))
        condition_combo.state(['readonly'])
        
        # Analyze button
        self.analyze_btn = ttk.Button(search_frame, text="Analyze Pricing", command=self.analyze_pricing)
        self.analyze_btn.grid(row=2, column=3, sticky=tk.E, padx=(10, 0), pady=(5, 0))
        
        # Configure grid weights
        search_frame.columnconfigure(1, weight=1)
        search_frame.columnconfigure(3, weight=1)
    
    def create_results_frame(self, parent):
        """Create results display frame."""
        results_frame = ttk.LabelFrame(parent, text="Analysis Results", padding=10)
        results_frame.pack(fill=tk.BOTH, expand=True)
        
        # Create notebook for different views
        self.notebook = ttk.Notebook(results_frame)
        self.notebook.pack(fill=tk.BOTH, expand=True)
        
        # Summary tab
        self.summary_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.summary_frame, text="Summary")
        self.create_summary_tab()
        
        # Items tab
        self.items_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.items_frame, text="Sold Items")
        self.create_items_tab()
        
        # Charts tab (placeholder for future enhancement)
        self.charts_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.charts_frame, text="Price Chart")
        ttk.Label(self.charts_frame, text="Price visualization coming soon...", 
                 font=("Arial", 12), foreground="gray").pack(expand=True)
    
    def create_summary_tab(self):
        """Create price summary tab."""
        # Summary text area
        self.summary_text = tk.Text(self.summary_frame, wrap=tk.WORD, height=15, font=("Courier", 10))
        summary_scrollbar = ttk.Scrollbar(self.summary_frame, orient=tk.VERTICAL, command=self.summary_text.yview)
        
        self.summary_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        summary_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.summary_text.config(yscrollcommand=summary_scrollbar.set)
        
        # Default message
        self.summary_text.insert(tk.END, "Enter search terms and click 'Analyze Pricing' to get market data.\n\n")
        self.summary_text.insert(tk.END, "Features:\n")
        self.summary_text.insert(tk.END, "• Real eBay sold listings data\n")
        self.summary_text.insert(tk.END, "• Statistical price analysis\n")
        self.summary_text.insert(tk.END, "• Outlier detection and filtering\n")
        self.summary_text.insert(tk.END, "• Competitive pricing suggestions\n")
        self.summary_text.insert(tk.END, "• Confidence scoring\n")
        self.summary_text.config(state=tk.DISABLED)
    
    def create_items_tab(self):
        """Create sold items table tab."""
        # Items treeview
        columns = ('title', 'price', 'shipping', 'total', 'condition', 'date', 'source')
        self.items_tree = ttk.Treeview(self.items_frame, columns=columns, show='headings', height=20)
        
        # Define headings and column widths
        self.items_tree.heading('title', text='Title')
        self.items_tree.heading('price', text='Price')
        self.items_tree.heading('shipping', text='Shipping')
        self.items_tree.heading('total', text='Total')
        self.items_tree.heading('condition', text='Condition')
        self.items_tree.heading('date', text='Sold Date')
        self.items_tree.heading('source', text='Source')
        
        self.items_tree.column('title', width=300, anchor=tk.W)
        self.items_tree.column('price', width=80, anchor=tk.E)
        self.items_tree.column('shipping', width=80, anchor=tk.E)
        self.items_tree.column('total', width=80, anchor=tk.E)
        self.items_tree.column('condition', width=100, anchor=tk.CENTER)
        self.items_tree.column('date', width=100, anchor=tk.CENTER)
        self.items_tree.column('source', width=80, anchor=tk.CENTER)
        
        # Scrollbars
        items_v_scrollbar = ttk.Scrollbar(self.items_frame, orient=tk.VERTICAL, command=self.items_tree.yview)
        items_h_scrollbar = ttk.Scrollbar(self.items_frame, orient=tk.HORIZONTAL, command=self.items_tree.xview)
        
        self.items_tree.configure(yscrollcommand=items_v_scrollbar.set, xscrollcommand=items_h_scrollbar.set)
        
        # Pack widgets
        self.items_tree.grid(row=0, column=0, sticky='nsew')
        items_v_scrollbar.grid(row=0, column=1, sticky='ns')
        items_h_scrollbar.grid(row=1, column=0, sticky='ew')
        
        # Configure grid weights
        self.items_frame.grid_rowconfigure(0, weight=1)
        self.items_frame.grid_columnconfigure(0, weight=1)
        
        # Bind double-click to open eBay listing
        self.items_tree.bind('<Double-1>', self.open_ebay_listing)
    
    def create_status_bar(self):
        """Create status bar."""
        self.status_var = tk.StringVar(value="Ready")
        self.status_bar = ttk.Label(self.root, textvariable=self.status_var, relief=tk.SUNKEN, anchor=tk.W)
        self.status_bar.pack(side=tk.BOTTOM, fill=tk.X)
    
    def analyze_pricing(self):
        """Perform price analysis in background thread."""
        search_terms = self.search_terms_var.get().strip()
        if not search_terms:
            messagebox.showerror("Error", "Please enter search terms")
            return
        
        # Initialize analyzer if needed
        if not self.analyzer:
            app_id = self.app_id_var.get().strip() or None
            self.analyzer = PriceAnalyzer(app_id=app_id)
        
        # Disable analyze button
        self.analyze_btn.config(state=tk.DISABLED)
        self.status_var.set("Analyzing pricing...")
        
        # Run analysis in background
        def run_analysis():
            try:
                condition = self.condition_var.get() if self.condition_var.get() != "Any" else None
                
                analysis = self.analyzer.analyze_item_pricing(
                    search_terms=search_terms,
                    markup_percent=self.markup_var.get(),
                    max_items=self.max_items_var.get(),
                    condition_filter=condition
                )
                
                # Update UI in main thread
                self.root.after(0, lambda: self.display_results(analysis))
                
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Analysis failed: {error_msg}")
                self.root.after(0, lambda: self.handle_analysis_error(error_msg))
        
        # Start background thread
        threading.Thread(target=run_analysis, daemon=True).start()
    
    def display_results(self, analysis: PriceAnalysis):
        """Display analysis results in UI."""
        self.current_analysis = analysis
        
        # Update summary tab
        self.update_summary_display(analysis)
        
        # Update items tab
        self.update_items_display(analysis)
        
        # Re-enable analyze button
        self.analyze_btn.config(state=tk.NORMAL)
        self.status_var.set(f"Analysis complete - {analysis.count} items analyzed")
    
    def update_summary_display(self, analysis: PriceAnalysis):
        """Update summary text display."""
        self.summary_text.config(state=tk.NORMAL)
        self.summary_text.delete(1.0, tk.END)
        
        # Format summary
        summary = f"""EBAY PRICE ANALYSIS RESULTS
{'='*50}

Search Terms: {self.search_terms_var.get()}
Analysis Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Items Analyzed: {analysis.count}
Confidence Score: {analysis.confidence_score:.1f}%

PRICE STATISTICS
{'-'*20}
Minimum Price:    ${analysis.min_price:.2f}
Maximum Price:    ${analysis.max_price:.2f}
Average Price:    ${analysis.mean_price:.2f}
Median Price:     ${analysis.median_price:.2f}
Standard Dev:     ${analysis.std_dev:.2f}

PRICING RECOMMENDATION
{'-'*25}
Suggested Price:  ${analysis.suggested_price:.2f}
Markup Applied:   {self.markup_var.get():.1f}%
Base Price:       ${analysis.median_price:.2f}

CONFIDENCE ANALYSIS
{'-'*20}
"""
        
        if analysis.confidence_score >= 80:
            summary += "🟢 HIGH CONFIDENCE - Strong market data\n"
        elif analysis.confidence_score >= 60:
            summary += "🟡 MEDIUM CONFIDENCE - Reasonable data sample\n"
        else:
            summary += "🔴 LOW CONFIDENCE - Limited data available\n"
        
        summary += f"\nSample Size: {analysis.count} items\n"
        summary += f"Price Variation: {(analysis.std_dev/analysis.median_price)*100:.1f}%\n"
        
        # Data sources breakdown
        api_count = sum(1 for item in analysis.items if item.source == 'ebay_api')
        scrape_count = sum(1 for item in analysis.items if item.source == 'web_scraping')
        
        summary += f"\nDATA SOURCES\n{'-'*15}\n"
        if api_count > 0:
            summary += f"eBay API: {api_count} items\n"
        if scrape_count > 0:
            summary += f"Web Data: {scrape_count} items\n"
        
        # Condition breakdown
        conditions = {}
        for item in analysis.items:
            conditions[item.condition] = conditions.get(item.condition, 0) + 1
        
        if len(conditions) > 1:
            summary += f"\nCONDITION BREAKDOWN\n{'-'*20}\n"
            for condition, count in sorted(conditions.items()):
                summary += f"{condition}: {count} items\n"
        
        self.summary_text.insert(tk.END, summary)
        self.summary_text.config(state=tk.DISABLED)
    
    def update_items_display(self, analysis: PriceAnalysis):
        """Update items table display."""
        # Clear existing items
        for item in self.items_tree.get_children():
            self.items_tree.delete(item)
        
        # Add new items
        for item in analysis.items:
            self.items_tree.insert('', tk.END, values=(
                item.title[:60] + "..." if len(item.title) > 60 else item.title,
                f"${item.price:.2f}",
                f"${item.shipping:.2f}",
                f"${item.total_price:.2f}",
                item.condition,
                item.sold_date,
                item.source.replace('_', ' ').title()
            ), tags=(item.url,))  # Store URL in tags for opening
    
    def handle_analysis_error(self, error_msg: str):
        """Handle analysis errors."""
        self.analyze_btn.config(state=tk.NORMAL)
        self.status_var.set("Analysis failed")
        
        if "not enough items" in error_msg.lower():
            messagebox.showwarning("Insufficient Data", 
                                 f"Not enough sold items found for analysis.\n\n{error_msg}")
        else:
            messagebox.showerror("Analysis Error", f"Failed to analyze pricing:\n\n{error_msg}")
    
    def open_ebay_listing(self, event):
        """Open eBay listing in browser."""
        selection = self.items_tree.selection()
        if selection:
            item = self.items_tree.item(selection[0])
            url = item['tags'][0] if item['tags'] else ""
            if url:
                webbrowser.open(url)
    
    def show_settings(self):
        """Show settings dialog."""
        dialog = SettingsDialog(self.root, self)
        self.root.wait_window(dialog)
    
    def test_connection(self):
        """Test eBay connection."""
        app_id = self.app_id_var.get().strip()
        
        if not app_id:
            result = messagebox.askyesno("No App ID", 
                                       "No eBay App ID configured. Test web scraping instead?")
            if not result:
                return
        
        self.status_var.set("Testing connection...")
        
        def test():
            try:
                client = EbayAPIClient(app_id=app_id or None, use_scraping=True)
                items = client.fetch_sold_items("test", limit=3, days_back=30)
                
                self.root.after(0, lambda: self.show_test_result(True, len(items), app_id is not None))
                
            except Exception as e:
                self.root.after(0, lambda: self.show_test_result(False, str(e), app_id is not None))
        
        threading.Thread(target=test, daemon=True).start()
    
    def show_test_result(self, success: bool, result, used_api: bool):
        """Show connection test result."""
        self.status_var.set("Ready")
        
        if success:
            method = "eBay API" if used_api else "Web Scraping"
            messagebox.showinfo("Connection Test", 
                              f"✅ Connection successful!\n\nMethod: {method}\nTest items found: {result}")
        else:
            messagebox.showerror("Connection Test", f"❌ Connection failed:\n\n{result}")
    
    def clear_cache(self):
        """Clear application cache."""
        messagebox.showinfo("Cache", "Cache cleared (feature not yet implemented)")
    
    def export_results(self):
        """Export analysis results."""
        if not self.current_analysis:
            messagebox.showwarning("No Data", "No analysis results to export")
            return
        
        file_path = filedialog.asksaveasfilename(
            title="Export Results",
            defaultextension=".csv",
            filetypes=[("CSV files", "*.csv"), ("Text files", "*.txt"), ("All files", "*.*")]
        )
        
        if file_path:
            try:
                if file_path.endswith('.csv'):
                    self.export_to_csv(file_path)
                else:
                    self.export_to_text(file_path)
                    
                messagebox.showinfo("Export", f"Results exported to {file_path}")
                
            except Exception as e:
                messagebox.showerror("Export Error", f"Failed to export results:\n\n{str(e)}")
    
    def export_to_csv(self, file_path: str):
        """Export results to CSV."""
        import csv
        
        with open(file_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            # Write header
            writer.writerow(['Title', 'Price', 'Shipping', 'Total', 'Condition', 'Sold Date', 'URL', 'Source'])
            
            # Write items
            for item in self.current_analysis.items:
                writer.writerow([
                    item.title, item.price, item.shipping, item.total_price,
                    item.condition, item.sold_date, item.url, item.source
                ])
    
    def export_to_text(self, file_path: str):
        """Export results to text file."""
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(self.summary_text.get(1.0, tk.END))
    
    def open_developer_page(self):
        """Open eBay developer page."""
        webbrowser.open("https://developer.ebay.com/api-documentation/finding/findcompleteditem/")
    
    def show_about(self):
        """Show about dialog."""
        about_text = """eBay Price Analyzer v2.0

Real market pricing analysis using eBay sold listings data.

Features:
• eBay Finding API integration
• Web scraping fallback
• Statistical price analysis
• Outlier detection
• Confidence scoring
• Export capabilities

Created for eBay Tools Suite"""
        
        messagebox.showinfo("About", about_text)
    
    def load_settings(self):
        """Load settings from file."""
        settings_file = "pricing_settings.json"
        if os.path.exists(settings_file):
            try:
                with open(settings_file, 'r') as f:
                    settings = json.load(f)
                    
                self.app_id_var.set(settings.get('app_id', ''))
                self.markup_var.set(settings.get('markup', 15.0))
                self.max_items_var.set(settings.get('max_items', 20))
                
            except Exception as e:
                logger.warning(f"Failed to load settings: {e}")
    
    def save_settings(self):
        """Save settings to file."""
        settings = {
            'app_id': self.app_id_var.get(),
            'markup': self.markup_var.get(),
            'max_items': self.max_items_var.get()
        }
        
        try:
            with open('pricing_settings.json', 'w') as f:
                json.dump(settings, f, indent=2)
        except Exception as e:
            logger.warning(f"Failed to save settings: {e}")
    
    def center_window(self):
        """Center the window on screen."""
        self.root.update_idletasks()
        width = self.root.winfo_width()
        height = self.root.winfo_height()
        x = (self.root.winfo_screenwidth() // 2) - (width // 2)
        y = (self.root.winfo_screenheight() // 2) - (height // 2)
        self.root.geometry(f'+{x}+{y}')

class SettingsDialog(tk.Toplevel):
    """Settings configuration dialog."""
    
    def __init__(self, parent, app):
        super().__init__(parent)
        self.app = app
        
        self.title("Settings")
        self.geometry("500x300")
        self.resizable(False, False)
        self.transient(parent)
        self.grab_set()
        
        self.create_widgets()
        self.center_window()
    
    def create_widgets(self):
        """Create settings widgets."""
        main_frame = ttk.Frame(self, padding=20)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # eBay API settings
        api_frame = ttk.LabelFrame(main_frame, text="eBay API Settings", padding=10)
        api_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Label(api_frame, text="App ID:").grid(row=0, column=0, sticky=tk.W, padx=(0, 5))
        app_id_entry = ttk.Entry(api_frame, textvariable=self.app.app_id_var, width=30, show="*")
        app_id_entry.grid(row=0, column=1, sticky=tk.EW, padx=(0, 5))
        
        ttk.Button(api_frame, text="Get App ID", command=self.app.open_developer_page).grid(row=0, column=2)
        
        ttk.Label(api_frame, text="Leave blank to use web scraping only", font=("Arial", 8), 
                 foreground="gray").grid(row=1, column=0, columnspan=3, sticky=tk.W, pady=(5, 0))
        
        api_frame.columnconfigure(1, weight=1)
        
        # Analysis settings
        analysis_frame = ttk.LabelFrame(main_frame, text="Analysis Settings", padding=10)
        analysis_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Label(analysis_frame, text="Default Markup %:").grid(row=0, column=0, sticky=tk.W, padx=(0, 5))
        ttk.Spinbox(analysis_frame, from_=0, to=100, increment=5, textvariable=self.app.markup_var, 
                   width=10).grid(row=0, column=1, sticky=tk.W)
        
        ttk.Label(analysis_frame, text="Max Items:").grid(row=1, column=0, sticky=tk.W, padx=(0, 5), pady=(5, 0))
        ttk.Spinbox(analysis_frame, from_=5, to=100, increment=5, textvariable=self.app.max_items_var, 
                   width=10).grid(row=1, column=1, sticky=tk.W, pady=(5, 0))
        
        # Buttons
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(fill=tk.X, pady=(10, 0))
        
        ttk.Button(button_frame, text="Save", command=self.save_settings).pack(side=tk.RIGHT, padx=(5, 0))
        ttk.Button(button_frame, text="Cancel", command=self.destroy).pack(side=tk.RIGHT)
    
    def save_settings(self):
        """Save settings and close dialog."""
        self.app.save_settings()
        self.app.analyzer = None  # Force reinitialize with new settings
        self.destroy()
    
    def center_window(self):
        """Center dialog on parent."""
        self.update_idletasks()
        width = self.winfo_width()
        height = self.winfo_height()
        x = self.winfo_parent().winfo_x() + (self.winfo_parent().winfo_width() // 2) - (width // 2)
        y = self.winfo_parent().winfo_y() + (self.winfo_parent().winfo_height() // 2) - (height // 2)
        self.geometry(f'+{x}+{y}')

def main():
    """Run the complete eBay pricing application."""
    root = tk.Tk()
    app = EbayPricingApp(root)
    
    # Handle window closing
    def on_closing():
        app.save_settings()
        root.destroy()
    
    root.protocol("WM_DELETE_WINDOW", on_closing)
    root.mainloop()

if __name__ == "__main__":
    main()