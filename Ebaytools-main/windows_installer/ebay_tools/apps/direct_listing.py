"""
ebay_direct_listing.py - Demo script for direct eBay listing integration

This script demonstrates how to use the eBay API integration with the elister application
to create direct eBay listings alongside the existing CSV export functionality.
"""

import os
import sys
import json
import logging
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

from ebay_api_integration import EbayAPIIntegration

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("ebay_direct_listing.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class EbayDirectListingDemo:
    """
    Demo application for eBay direct listing.
    """
    
    def __init__(self, root):
        """
        Initialize the demo application.
        
        Args:
            root: tkinter root window
        """
        self.root = root
        self.root.title("eBay Direct Listing Demo")
        self.root.geometry("800x600")
        
        # Initialize eBay API integration
        self.ebay_integration = EbayAPIIntegration()
        
        # Initialize variables
        self.queue_file_path = None
        self.queue_data = []
        self.current_item_index = -1
        
        # Create the UI
        self.create_menu()
        self.create_frames()
        self.create_widgets()
    
    def create_menu(self):
        """Create the application menu."""
        menubar = tk.Menu(self.root)
        
        # File menu
        file_menu = tk.Menu(menubar, tearoff=0)
        file_menu.add_command(label="Load Queue", command=self.load_queue)
        file_menu.add_command(label="Save Queue", command=self.save_queue)
        file_menu.add_separator()
        file_menu.add_command(label="Exit", command=self.root.quit)
        menubar.add_cascade(label="File", menu=file_menu)
        
        # eBay menu
        ebay_menu = tk.Menu(menubar, tearoff=0)
        ebay_menu.add_command(label="Configure eBay API", command=self.configure_ebay_api)
        ebay_menu.add_command(label="Create eBay Listing", command=self.create_ebay_listing)
        menubar.add_cascade(label="eBay", menu=ebay_menu)
        
        self.root.config(menu=menubar)
    
    def create_frames(self):
        """Create the main UI frames."""
        # Main container with left (items) and right (details) panes
        self.main_container = ttk.PanedWindow(self.root, orient=tk.HORIZONTAL)
        self.main_container.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Left frame for item list
        self.left_frame = ttk.Frame(self.main_container, width=250)
        self.main_container.add(self.left_frame, weight=1)
        
        # Right frame for item details
        self.right_frame = ttk.Frame(self.main_container)
        self.main_container.add(self.right_frame, weight=3)
        
        # Status bar
        self.status_bar = ttk.Label(self.root, text="Ready", relief=tk.SUNKEN, anchor=tk.W)
        self.status_bar.pack(side=tk.BOTTOM, fill=tk.X)
    
    def create_widgets(self):
        """Create the UI widgets."""
        # Left frame widgets - Item list
        ttk.Label(self.left_frame, text="Items:").pack(anchor=tk.W, padx=5, pady=5)
        
        # Create a frame for the listbox and scrollbar
        list_frame = ttk.Frame(self.left_frame)
        list_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Items listbox
        self.items_listbox = tk.Listbox(list_frame, selectmode=tk.SINGLE)
        self.items_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self.items_listbox.bind("<<ListboxSelect>>", self.on_item_select)
        
        # Scrollbar for listbox
        scrollbar = ttk.Scrollbar(list_frame, orient=tk.VERTICAL, command=self.items_listbox.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.items_listbox.config(yscrollcommand=scrollbar.set)
        
        # Right frame widgets - Item details
        # Create a notebook with tabs
        self.notebook = ttk.Notebook(self.right_frame)
        self.notebook.pack(fill=tk.BOTH, expand=True)
        
        # Details tab
        self.details_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.details_frame, text="Details")
        
        # Export tab
        self.export_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.export_frame, text="Export")
        
        # Details tab content
        ttk.Label(self.details_frame, text="Item Details:").pack(anchor=tk.W, padx=10, pady=5)
        
        # Details text
        self.details_text = tk.Text(self.details_frame, height=20, width=60, wrap=tk.WORD)
        self.details_text.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        # Edit button frame
        edit_button_frame = ttk.Frame(self.details_frame)
        edit_button_frame.pack(fill=tk.X, padx=10, pady=5)
        
        ttk.Button(
            edit_button_frame,
            text="Edit Item",
            command=self.edit_current_item
        ).pack(side=tk.LEFT, padx=5)
        
        # Export tab content
        ttk.Label(self.export_frame, text="Export Options:").pack(anchor=tk.W, padx=10, pady=5)
        
        # CSV export button
        ttk.Button(
            self.export_frame,
            text="Export to CSV",
            command=self.export_to_csv
        ).pack(anchor=tk.W, padx=10, pady=5)
        
        # Direct listing section
        ebay_frame = ttk.LabelFrame(self.export_frame, text="eBay Direct Listing")
        ebay_frame.pack(fill=tk.X, padx=10, pady=5)
        
        # Status of eBay integration
        self.ebay_status_var = tk.StringVar(value="Not authenticated")
        ttk.Label(ebay_frame, text="Status:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=5)
        ttk.Label(ebay_frame, textvariable=self.ebay_status_var).grid(row=0, column=1, sticky=tk.W, padx=5, pady=5)
        
        # Configure eBay API button
        ttk.Button(
            ebay_frame,
            text="Configure eBay API",
            command=self.configure_ebay_api
        ).grid(row=1, column=0, padx=5, pady=5)
        
        # Create eBay listing button
        self.create_listing_btn = ttk.Button(
            ebay_frame,
            text="Create eBay Listing",
            command=self.create_ebay_listing,
            state=tk.DISABLED
        )
        self.create_listing_btn.grid(row=1, column=1, padx=5, pady=5)
        
        # Update eBay status
        # Update status bar
        if self.ebay_integration.authenticated:
            self.status_bar.config(text="eBay API: Connected (Mock Mode)")
        else:
            self.status_bar.config(text="eBay API: Not configured")
    
    def update_ebay_status(self):
        """Update the eBay authentication status display."""
        if self.ebay_integration.authenticated:
            self.ebay_status_var.set("Authenticated")
            if self.current_item_index >= 0:
                self.create_listing_btn.config(state=tk.NORMAL)
        else:
            self.ebay_status_var.set("Not authenticated")
            self.create_listing_btn.config(state=tk.DISABLED)
    
    def load_queue(self):
        """Load a queue from a JSON file."""
        file_path = filedialog.askopenfilename(
            title="Load Queue",
            filetypes=[("JSON Files", "*.json"), ("All Files", "*.*")]
        )
        
        if not file_path:
            return
        
        try:
            with open(file_path, 'r') as f:
                queue_data = json.load(f)
            
            self.queue_file_path = file_path
            self.queue_data = queue_data
            
            # Update UI
            self.update_items_listbox()
            self.status_bar.config(text=f"Loaded {len(queue_data)} items from {os.path.basename(file_path)}")
            
        except Exception as e:
            logger.error(f"Error loading queue: {str(e)}")
            messagebox.showerror("Error", f"Failed to load queue: {str(e)}")
    
    def save_queue(self):
        """Save the queue to a JSON file."""
        if not self.queue_data:
            messagebox.showinfo("Info", "No queue data to save.")
            return
        
        if not self.queue_file_path:
            file_path = filedialog.asksaveasfilename(
                title="Save Queue",
                defaultextension=".json",
                filetypes=[("JSON Files", "*.json"), ("All Files", "*.*")]
            )
            
            if not file_path:
                return
                
            self.queue_file_path = file_path
        
        try:
            with open(self.queue_file_path, 'w') as f:
                json.dump(self.queue_data, f, indent=2)
            
            self.status_bar.config(text=f"Saved {len(self.queue_data)} items to {os.path.basename(self.queue_file_path)}")
            
        except Exception as e:
            logger.error(f"Error saving queue: {str(e)}")
            messagebox.showerror("Error", f"Failed to save queue: {str(e)}")
    
    def update_items_listbox(self):
        """Update the items listbox with queue data."""
        self.items_listbox.delete(0, tk.END)
        
        for item in self.queue_data:
            title = item.get("title", "") or item.get("temp_title", "")
            sku = item.get("sku", "")
            display_text = f"{sku}: {title}" if sku else title
            
            if not display_text:
                display_text = "Item " + str(self.queue_data.index(item) + 1)
                
            self.items_listbox.insert(tk.END, display_text)
    
    def on_item_select(self, event):
        """Handle item selection in the listbox."""
        selection = self.items_listbox.curselection()
        if not selection:
            return
            
        index = selection[0]
        if index < 0 or index >= len(self.queue_data):
            return
            
        self.current_item_index = index
        self.display_item_details()
        
        # Update eBay listing button state
        if self.ebay_integration.authenticated:
            self.create_listing_btn.config(state=tk.NORMAL)
    
    def display_item_details(self):
        """Display details of the selected item."""
        if self.current_item_index < 0 or self.current_item_index >= len(self.queue_data):
            return
            
        item = self.queue_data[self.current_item_index]
        
        # Clear the details text
        self.details_text.delete("1.0", tk.END)
        
        # Display item details in a formatted way
        details = []
        details.append(f"SKU: {item.get('sku', '')}")
        details.append(f"Title: {item.get('title', '') or item.get('temp_title', '')}")
        details.append(f"Condition: {item.get('condition', '')}")
        details.append(f"Price: {item.get('price', '')}")
        details.append(f"Quantity: {item.get('quantity', '1')}")
        details.append(f"Format: {item.get('format', 'FIXED_PRICE')}")
        details.append(f"Category: {item.get('category', '')}")
        
        # Add item specifics
        details.append("\nItem Specifics:")
        if "item_specifics" in item and isinstance(item["item_specifics"], dict):
            for name, value in item["item_specifics"].items():
                details.append(f"  {name}: {value}")
        
        # Add description
        details.append("\nDescription:")
        details.append(item.get("description", ""))
        
        # Update the text widget
        self.details_text.insert("1.0", "\n".join(details))
    
    def edit_current_item(self):
        """Open dialog to edit the current item."""
        if self.current_item_index < 0 or self.current_item_index >= len(self.queue_data):
            messagebox.showinfo("Info", "No item selected.")
            return
        
        item = self.queue_data[self.current_item_index]
        
        # Create edit dialog
        dialog = tk.Toplevel(self.root)
        dialog.title("Edit Item")
        dialog.geometry("500x600")
        
        # Make dialog modal
        dialog.transient(self.root)
        dialog.grab_set()
        
        # Create fields
        fields = {}
        row = 0
        
        # SKU
        ttk.Label(dialog, text="SKU:").grid(row=row, column=0, sticky=tk.W, padx=10, pady=5)
        fields['sku'] = ttk.Entry(dialog, width=40)
        fields['sku'].insert(0, item.get('sku', ''))
        fields['sku'].grid(row=row, column=1, padx=10, pady=5)
        row += 1
        
        # Title
        ttk.Label(dialog, text="Title:").grid(row=row, column=0, sticky=tk.W, padx=10, pady=5)
        fields['title'] = ttk.Entry(dialog, width=40)
        fields['title'].insert(0, item.get('title', '') or item.get('temp_title', ''))
        fields['title'].grid(row=row, column=1, padx=10, pady=5)
        row += 1
        
        # Condition
        ttk.Label(dialog, text="Condition:").grid(row=row, column=0, sticky=tk.W, padx=10, pady=5)
        fields['condition'] = ttk.Combobox(dialog, width=37)
        fields['condition']['values'] = [
            '1000 - New', '1500 - New Other', '1750 - New with defects',
            '2000 - Certified Refurbished', '2500 - Seller Refurbished',
            '3000 - Used', '4000 - Very Good', '5000 - Good',
            '6000 - Acceptable', '7000 - For parts'
        ]
        current_condition = item.get('condition', '1000')
        # Find matching condition in combobox
        for i, val in enumerate(fields['condition']['values']):
            if val.startswith(current_condition):
                fields['condition'].current(i)
                break
        fields['condition'].grid(row=row, column=1, padx=10, pady=5)
        row += 1
        
        # Price
        ttk.Label(dialog, text="Price:").grid(row=row, column=0, sticky=tk.W, padx=10, pady=5)
        fields['price'] = ttk.Entry(dialog, width=40)
        fields['price'].insert(0, item.get('price', ''))
        fields['price'].grid(row=row, column=1, padx=10, pady=5)
        row += 1
        
        # Quantity
        ttk.Label(dialog, text="Quantity:").grid(row=row, column=0, sticky=tk.W, padx=10, pady=5)
        fields['quantity'] = ttk.Entry(dialog, width=40)
        fields['quantity'].insert(0, item.get('quantity', '1'))
        fields['quantity'].grid(row=row, column=1, padx=10, pady=5)
        row += 1
        
        # Category
        ttk.Label(dialog, text="Category:").grid(row=row, column=0, sticky=tk.W, padx=10, pady=5)
        fields['category'] = ttk.Entry(dialog, width=40)
        fields['category'].insert(0, item.get('category', ''))
        fields['category'].grid(row=row, column=1, padx=10, pady=5)
        row += 1
        
        # Format
        ttk.Label(dialog, text="Format:").grid(row=row, column=0, sticky=tk.W, padx=10, pady=5)
        fields['format'] = ttk.Combobox(dialog, width=37)
        fields['format']['values'] = ['FixedPrice', 'Auction']
        fields['format'].set(item.get('format', 'FixedPrice'))
        fields['format'].grid(row=row, column=1, padx=10, pady=5)
        row += 1
        
        # Description
        ttk.Label(dialog, text="Description:").grid(row=row, column=0, sticky=tk.NW, padx=10, pady=5)
        fields['description'] = tk.Text(dialog, width=40, height=10, wrap=tk.WORD)
        fields['description'].insert("1.0", item.get('description', ''))
        fields['description'].grid(row=row, column=1, padx=10, pady=5)
        row += 1
        
        # Buttons
        button_frame = ttk.Frame(dialog)
        button_frame.grid(row=row, column=0, columnspan=2, pady=10)
        
        def save_changes():
            # Update item with new values
            item['sku'] = fields['sku'].get()
            item['title'] = fields['title'].get()
            
            # Extract condition code from combobox
            condition_val = fields['condition'].get()
            if condition_val:
                item['condition'] = condition_val.split(' - ')[0]
            
            item['price'] = fields['price'].get()
            item['quantity'] = fields['quantity'].get()
            item['category'] = fields['category'].get()
            item['format'] = fields['format'].get()
            item['description'] = fields['description'].get("1.0", tk.END).strip()
            
            # Save queue to file
            self.save_queue()
            
            # Update UI
            self.update_items_listbox()
            self.display_item_details()
            
            # Close dialog
            dialog.destroy()
            
            messagebox.showinfo("Success", "Item updated successfully!")
        
        def cancel():
            dialog.destroy()
        
        ttk.Button(button_frame, text="Save", command=save_changes).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="Cancel", command=cancel).pack(side=tk.LEFT, padx=5)
        
        # Center dialog on parent
        dialog.update_idletasks()
        x = (dialog.winfo_screenwidth() // 2) - (dialog.winfo_width() // 2)
        y = (dialog.winfo_screenheight() // 2) - (dialog.winfo_height() // 2)
        dialog.geometry(f'+{x}+{y}')
    
    def configure_ebay_api(self):
        """Open the eBay API configuration dialog."""
        # For now, use mock configuration
        mock_config = {
            "app_id": "mock_app_id",
            "dev_id": "mock_dev_id",
            "cert_id": "mock_cert_id",
            "user_token": "mock_token"
        }
        success = self.ebay_integration.configure(mock_config)
        if success:
            messagebox.showinfo("eBay API Configuration", 
                              "eBay API configured successfully (Mock Mode)\n\n"
                              "Note: This is a demo mode. Real eBay integration\n"
                              "requires valid API credentials.")
        else:
            messagebox.showerror("Configuration Error", 
                               "Failed to configure eBay API")
        # Update status bar
        if self.ebay_integration.authenticated:
            self.status_bar.config(text="eBay API: Connected (Mock Mode)")
        else:
            self.status_bar.config(text="eBay API: Not configured")
    
    def create_ebay_listing(self):
        """Create an eBay listing for the selected item."""
        if self.current_item_index < 0 or self.current_item_index >= len(self.queue_data):
            messagebox.showinfo("Info", "No item selected.")
            return
            
        item = self.queue_data[self.current_item_index]
        
        # Check if the item has a SKU
        if not item.get("sku"):
            messagebox.showerror("Error", "The selected item must have a SKU to create an eBay listing.")
            return
        
        # Validate and create listing
        validation_result = self.ebay_integration.validate_item(item)
        
        if not validation_result["valid"]:
            error_msg = "Cannot create listing due to validation errors:\n\n"
            error_msg += "\n".join(f"• {error}" for error in validation_result["errors"])
            if validation_result["warnings"]:
                error_msg += "\n\nWarnings:\n"
                error_msg += "\n".join(f"• {warning}" for warning in validation_result["warnings"])
            messagebox.showerror("Validation Error", error_msg)
            return
        
        # Show warnings if any
        if validation_result["warnings"]:
            warning_msg = "The following warnings were found:\n\n"
            warning_msg += "\n".join(f"• {warning}" for warning in validation_result["warnings"])
            warning_msg += "\n\nDo you want to continue?"
            if not messagebox.askyesno("Warnings", warning_msg):
                return
        
        # Create the listing
        result = self.ebay_integration.create_listing(item)
        
        if result["success"]:
            success_msg = f"Listing created successfully!\n\n"
            success_msg += f"Item ID: {result['item_id']}\n"
            success_msg += f"URL: {result['listing_url']}\n\n"
            success_msg += "Note: This is a mock listing for demonstration."
            messagebox.showinfo("Success", success_msg)
        else:
            messagebox.showerror("Error", f"Failed to create listing:\n{result['error']}")
    
    def export_to_csv(self):
        """Export the queue to a CSV file."""
        if not self.queue_data:
            messagebox.showinfo("Info", "No queue data to export.")
            return
        
        file_path = filedialog.asksaveasfilename(
            title="Export to CSV",
            defaultextension=".csv",
            filetypes=[("CSV Files", "*.csv"), ("All Files", "*.*")]
        )
        
        if not file_path:
            return
        
        try:
            # Simple CSV export example
            import csv
            
            with open(file_path, 'w', newline='', encoding='utf-8') as f:
                # Define fields
                fieldnames = [
                    "SKU", "Title", "Condition", "Price", "Quantity", 
                    "Category", "Format", "Description"
                ]
                
                # Add specific fields
                for item in self.queue_data:
                    if "item_specifics" in item:
                        for key in item["item_specifics"].keys():
                            field_name = f"Specific:{key}"
                            if field_name not in fieldnames:
                                fieldnames.append(field_name)
                
                # Create writer
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                
                # Write rows
                for item in self.queue_data:
                    row = {
                        "SKU": item.get("sku", ""),
                        "Title": item.get("title", "") or item.get("temp_title", ""),
                        "Condition": item.get("condition", ""),
                        "Price": item.get("price", ""),
                        "Quantity": item.get("quantity", "1"),
                        "Category": item.get("category", ""),
                        "Format": item.get("format", "FIXED_PRICE"),
                        "Description": item.get("description", "")
                    }
                    
                    # Add item specifics
                    if "item_specifics" in item:
                        for key, value in item["item_specifics"].items():
                            row[f"Specific:{key}"] = value
                    
                    writer.writerow(row)
            
            self.status_bar.config(text=f"Exported {len(self.queue_data)} items to {os.path.basename(file_path)}")
            messagebox.showinfo("Success", f"Successfully exported {len(self.queue_data)} items to CSV.")
            
        except Exception as e:
            logger.error(f"Error exporting to CSV: {str(e)}")
            messagebox.showerror("Error", f"Failed to export to CSV: {str(e)}")


def main():
    """Main function to start the application."""
    try:
        root = tk.Tk()
        app = EbayDirectListingDemo(root)
        root.mainloop()
    except Exception as e:
        logger.error(f"Application error: {str(e)}", exc_info=True)
        messagebox.showerror("Error", f"An error occurred: {str(e)}")


if __name__ == "__main__":
    main()