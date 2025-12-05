"""
eBay Processor Price Integration Guide

This file explains how to integrate the pricing functionality into the processor.py file.
Copy the code blocks below into the appropriate locations in processor.py.
"""

# ===============================================================
# 1. ADD IMPORTS
# Add these imports at the top of the file, around line 14
# ===============================================================

# Add to existing imports section:
from tkinter import simpledialog
import statistics
import webbrowser

# Add after other ebay_tools imports:
try:
    from ebay_tools.apps.price_analyzer import PriceAnalyzer, PriceAnalyzerGUI
except ImportError:
    PriceAnalyzer = None
    PriceAnalyzerGUI = None
    print("Price analyzer module not available. Pricing functionality disabled.")

# ===============================================================
# 2. ADD UI ELEMENTS
# Add these UI elements to the create_widgets method
# around line 275-280 (after generate_final_var checkbox)
# ===============================================================

# After generate_final_check.pack() line, add:
# Price analysis checkbox
self.analyze_price_var = tk.BooleanVar(value=False)
self.analyze_price_check = ttk.Checkbutton(
    self.progress_frame, 
    text="Analyze Pricing", 
    variable=self.analyze_price_var
)
self.analyze_price_check.pack(side=tk.LEFT, padx=5)

# Price analysis button (for manual analysis)
self.price_analysis_btn = ttk.Button(
    self.progress_frame,
    text="Price Analysis",
    command=self.show_price_analyzer
)
self.price_analysis_btn.pack(side=tk.LEFT, padx=5)

# ===============================================================
# 3. ADD PRICE ANALYZER METHOD
# Add this method to the EbayLLMProcessor class
# around line 1450 (after generate_final_description method)
# ===============================================================

def analyze_price(self, item):
    """Analyze pricing for the current item using eBay sold listings."""
    try:
        if not PriceAnalyzer:
            self.log("Price analyzer module not available - skipping price analysis")
            return False
            
        self.log(f"Analyzing pricing for item {item.get('sku', '')}")
        
        # Initialize price analyzer
        analyzer = PriceAnalyzer()
        
        # Extract search terms from item data
        title = item.get('title', '')
        brand = item.get('item_specifics', {}).get('Brand', '')
        model = item.get('item_specifics', {}).get('Model', '')
        
        # Use brand and model if available, otherwise use title
        search_terms = f"{brand} {model}".strip() if brand or model else title
        
        if not search_terms:
            self.log("No search terms available for price analysis")
            return False
            
        # Analyze pricing
        results = analyzer.analyze_item(
            search_terms=search_terms,
            item_data=item,
            markup_percent=15,  # Default markup, could be configurable
            sample_limit=10     # Default sample limit, could be configurable
        )
        
        # Update item with pricing information
        if results and results.get('success') and 'suggested_price' in results:
            if 'price' not in item or not item['price']:
                item['price'] = results['suggested_price']
            item['price_analysis'] = results
            self.log(f"Suggested price: ${results['suggested_price']:.2f}")
            
            # Add timestamp for pricing
            item['priced_at'] = datetime.now().isoformat()
            
            # Auto-save queue
            if self.queue_file_path:
                save_queue(self.work_queue, self.queue_file_path)
                self.log("Queue auto-saved with pricing information")
                
            return True
        else:
            message = results.get('message', 'Price analysis did not return a suggested price')
            self.log(f"Price analysis unsuccessful: {message}")
            return False
    
    except Exception as e:
        error_msg = f"Error analyzing price: {str(e)}"
        self.log(error_msg)
        
        # Add error information to the item
        if "api_results" not in item:
            item["api_results"] = []
        
        item["api_results"].append({
            "processed_at": datetime.now().isoformat(),
            "price_analysis_error": error_msg
        })
        
        return False

def show_price_analyzer(self):
    """Show the price analyzer GUI for the current item."""
    if not PriceAnalyzerGUI:
        messagebox.showerror("Error", "Price analyzer module not available")
        return
        
    if not self.current_item:
        messagebox.showerror("Error", "No item selected")
        return
        
    # Define callback to update item price
    def update_price(results):
        if results and results.get('success') and 'suggested_price' in results:
            self.current_item['price'] = results['suggested_price']
            self.current_item['price_analysis'] = results
            self.current_item['priced_at'] = datetime.now().isoformat()
            
            # Update queue
            if self.queue_file_path:
                save_queue(self.work_queue, self.queue_file_path)
                self.log(f"Updated price for item {self.current_item.get('sku', '')}: ${results['suggested_price']:.2f}")
    
    # Create and show price analyzer GUI
    analyzer_gui = PriceAnalyzerGUI(self.root, self.current_item, update_price)

# ===============================================================
# 4. MODIFY PROCESS_ITEM METHOD
# Add pricing call in the process_item method
# around line 625 (after process_api_check condition)
# ===============================================================

# After the line: if self.generate_final_var.get():
#                     self.generate_final_description(item)
# Add:
# Analyze pricing if requested
if self.analyze_price_var.get():
    self.analyze_price(item)

# ===============================================================
# 5. MODIFY REPROCESS_CURRENT_ITEM METHOD
# Add pricing call in the reprocess_current_item method
# around line 640-650
# ===============================================================

# After the line: if self.generate_final_var.get():
#                     self.generate_final_description(self.current_item)
# Add:
# Analyze pricing if requested
if self.analyze_price_var.get():
    self.analyze_price(self.current_item)