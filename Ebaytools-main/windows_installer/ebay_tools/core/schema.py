"""
Schema definition for eBay listing data structure.
This module provides consistent field names and data validation for the eBay listing tools.
"""

import json
from datetime import datetime
import uuid
from typing import Dict, List, Optional, Union, Any


class EbayItemSchema:
    """
    Schema and validation for eBay item data structure.
    Provides consistent field definitions and helpers for data validation.
    """
    
    # Core fields that should exist in every item
    REQUIRED_FIELDS = [
        "id",          # Unique identifier for the item
        "created_at",  # ISO formatted creation timestamp
        "sku",         # Stock keeping unit (unique identifier)
        "photos",      # List of photo objects
    ]
    
    # Title fields - either title or temp_title should exist
    TITLE_FIELDS = [
        "title",       # Final title for the listing
        "temp_title",  # Temporary/draft title
    ]
    
    # Condition related fields
    CONDITION_FIELDS = [
        "condition",             # eBay condition code (1000=New, 3000=Used, etc.)
        "conditionDescription",  # Text description of condition
    ]
    
    # Pricing and listing fields
    LISTING_FIELDS = [
        "price",       # Price for the item
        "quantity",    # Number available
        "format",      # Listing format (FixedPrice, Auction)
        "duration",    # Listing duration (GTC, Days_3, etc.)
        "category",    # eBay category ID
    ]
    
    # Field mappings from our internal names to eBay CSV field names
    EBAY_CSV_MAPPING = {
        "sku": "CustomLabel",
        "title": "Title",
        "price": "StartPrice",
        "quantity": "Quantity",
        "condition": "ConditionID",
        "conditionDescription": "ConditionDescription",
        "category": "Category",
        "format": "Format",
        "duration": "Duration",
    }
    
    # Mapping of condition codes to readable names
    CONDITION_MAP = {
        "1000": "New", 
        "1500": "New Other", 
        "1750": "New with defects",
        "2000": "Certified Refurbished", 
        "2500": "Seller Refurbished",
        "3000": "Used", 
        "4000": "Very Good", 
        "5000": "Good",
        "6000": "Acceptable", 
        "7000": "For parts"
    }
    
    @staticmethod
    def create_empty_item() -> Dict[str, Any]:
        """Create a new empty item with defaults for required fields."""
        return {
            "id": str(uuid.uuid4()),
            "created_at": datetime.now().isoformat(),
            "temp_title": "Item to be described by LLM",
            "sku": "",
            "category": "",
            "condition": "1000",  # Default to New
            "conditionDescription": "",
            "format": "FixedPrice",
            "price": "",
            "quantity": "1",
            "item_specifics": {},
            "photos": [],
            "process_photos": [],
            "processed": False,
            "api_results": []
        }
    
    @staticmethod
    def validate_item(item: Dict[str, Any]) -> List[str]:
        """
        Validate an item against the schema.
        
        Args:
            item: The item data dictionary to validate
            
        Returns:
            List of validation error messages, empty if valid
        """
        errors = []
        
        # Check required fields
        for field in EbayItemSchema.REQUIRED_FIELDS:
            if field not in item:
                errors.append(f"Missing required field: {field}")
        
        # Check that at least one title field exists
        if not any(field in item for field in EbayItemSchema.TITLE_FIELDS):
            errors.append("Item must have either 'title' or 'temp_title'")
        
        # Validate photos structure if present
        if "photos" in item:
            if not isinstance(item["photos"], list):
                errors.append("'photos' must be a list")
            else:
                for i, photo in enumerate(item["photos"]):
                    if not isinstance(photo, dict):
                        errors.append(f"Photo {i} must be a dictionary")
                    elif "path" not in photo:
                        errors.append(f"Photo {i} missing required 'path' field")
        
        # Validate process_photos references valid photo indices
        if "process_photos" in item and "photos" in item:
            if not isinstance(item["process_photos"], list):
                errors.append("'process_photos' must be a list")
            else:
                photo_count = len(item["photos"])
                for i, idx in enumerate(item["process_photos"]):
                    if not isinstance(idx, int):
                        errors.append(f"process_photos[{i}] must be an integer")
                    elif idx < 0 or idx >= photo_count:
                        errors.append(f"process_photos[{i}] refers to non-existent photo index {idx}")
        
        return errors
    
    @staticmethod
    def get_display_condition(item: Dict[str, Any]) -> str:
        """Get the human-readable condition text for an item."""
        condition_code = item.get("condition", "")
        return EbayItemSchema.CONDITION_MAP.get(condition_code, condition_code)
    
    @staticmethod
    def normalize_item(item: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize an item by ensuring all expected fields exist.
        
        Args:
            item: The item data dictionary to normalize
            
        Returns:
            Normalized item dictionary
        """
        normalized = item.copy()
        
        # Ensure required fields exist
        if "id" not in normalized:
            normalized["id"] = str(uuid.uuid4())
        
        if "created_at" not in normalized:
            normalized["created_at"] = datetime.now().isoformat()
        
        if "sku" not in normalized:
            normalized["sku"] = ""
        
        if "photos" not in normalized:
            normalized["photos"] = []
        
        if "process_photos" not in normalized:
            normalized["process_photos"] = []
        
        # Initialize item_specifics if not present
        if "item_specifics" not in normalized:
            normalized["item_specifics"] = {}
        
        return normalized
    
    @staticmethod
    def extract_item_specifics(item: Dict[str, Any]) -> Dict[str, str]:
        """
        Extract all item specifics from various sources in the item data.
        
        Args:
            item: The item data dictionary
            
        Returns:
            Dictionary of item specifics (name-value pairs)
        """
        item_specifics = {}
        
        # First check for direct item_specifics field
        if "item_specifics" in item and isinstance(item["item_specifics"], dict):
            item_specifics.update(item["item_specifics"])
        
        # Check for C: prefix fields
        for key, value in item.items():
            if key.startswith("C:") and key[2:] and value:
                item_specifics[key[2:]] = value
        
        # Also check api_results for structured data
        if "api_results" in item and isinstance(item["api_results"], list):
            for result in item["api_results"]:
                if isinstance(result, dict) and "item_specifics" in result:
                    if isinstance(result["item_specifics"], dict):
                        for k, v in result["item_specifics"].items():
                            if k not in item_specifics or not item_specifics[k]:
                                item_specifics[k] = v
                
                # Try to extract from final_description if available
                if "final_description" in result:
                    description = result["final_description"]
                    # Extract key specifics that might not be in the structured data
                    for key in ["Brand", "Model", "MPN", "UPC", "EAN", "ISBN"]:
                        if key not in item_specifics or not item_specifics[key]:
                            # Look for patterns like "Brand: Apple" in the description
                            pattern = f"{key}:"
                            if pattern in description:
                                # Extract the value after the pattern
                                parts = description.split(pattern, 1)
                                if len(parts) > 1:
                                    value = parts[1].strip().split("\n")[0].strip()
                                    if value:
                                        item_specifics[key] = value
        
        return item_specifics
    
    @staticmethod
    def to_csv_row(item: Dict[str, Any], default_values: Dict[str, str] = None) -> Dict[str, str]:
        """
        Convert an item to a dictionary suitable for CSV export.
        
        Args:
            item: The item data dictionary
            default_values: Default values for CSV fields
            
        Returns:
            Dictionary with eBay CSV field names
        """
        if default_values is None:
            default_values = {}
        
        # Start with default values
        row = default_values.copy()
        
        # Map our fields to eBay CSV fields
        for our_field, ebay_field in EbayItemSchema.EBAY_CSV_MAPPING.items():
            if our_field in item and item[our_field]:
                row[ebay_field] = item[our_field]
        
        # Special handling for title - use temp_title as fallback
        if "Title" not in row or not row["Title"]:
            if "temp_title" in item and item["temp_title"]:
                row["Title"] = item["temp_title"][:80]  # eBay title limit is 80 chars
        
        # Add item specifics
        item_specifics = EbayItemSchema.extract_item_specifics(item)
        for name, value in item_specifics.items():
            field_name = f"C:{name}"
            row[field_name] = value
        
        # Add product identifiers
        product_ids = item.get("productIdentifiers", {})
        if isinstance(product_ids, dict):
            if "upc" in product_ids:
                row["Product:UPC"] = product_ids["upc"]
            if "ean" in product_ids:
                row["Product:EAN"] = product_ids["ean"]
            if "isbn" in product_ids:
                row["Product:ISBN"] = product_ids["isbn"]
        
        return row


def save_queue(queue: List[Dict[str, Any]], file_path: str) -> None:
    """
    Save a queue of items to a JSON file.
    
    Args:
        queue: List of item dictionaries
        file_path: Path to save the JSON file
    """
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(queue, f, indent=2)


def load_queue(file_path: str) -> List[Dict[str, Any]]:
    """
    Load a queue of items from a JSON file.
    
    Args:
        file_path: Path to the JSON file
        
    Returns:
        List of item dictionaries
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        queue = json.load(f)
    
    # Validate and normalize all items
    normalized_queue = []
    for item in queue:
        normalized_item = EbayItemSchema.normalize_item(item)
        normalized_queue.append(normalized_item)
    
    return normalized_queue