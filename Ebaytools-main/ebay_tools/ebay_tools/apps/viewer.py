"""
eBay JSON Viewer - View and explore eBay listing data from JSON files.

This module provides a GUI application for viewing eBay listing data, browsing through
items, viewing photos, and exploring generated descriptions and item specifics.
"""

import os
import sys
import json
import logging
import tkinter as tk
from tkinter import filedialog, messagebox, ttk
from tkinter.font import Font
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
import webbrowser

# Add parent directory to path to allow imports when run directly
if __name__ == "__main__":
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Import core modules
from ebay_tools.core.schema import EbayItemSchema, load_queue
from ebay_tools.core.config import ConfigManager

# Import utility modules
from ebay_tools.utils.image_utils import open_image_with_orientation, fit_image_to_frame, create_photo_image
from ebay_tools.utils.ui_utils import StatusBar, center_window
from ebay_tools.utils.launcher_utils import ToolLauncher, create_tools_menu
from ebay_tools.utils.version_utils import show_about_dialog, VIEWER_FEATURES

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("ebay_viewer.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class EbayJsonViewer:
    """
    GUI application for viewing eBay listing data from JSON files.
    """
    def __init__(self, root, file_path=None):
        """Initialize the viewer application."""
        self.root = root
        self.root.title("eBay Listing Viewer")
        self.root.geometry("1200x800")
        
        # Set application icon if available
        try:
            self.root.iconbitmap("resources/icon.ico")
        except:
            pass  # Continue without icon if it's missing
        
        # Initialize variables
        self.items = []
        self.current_index = 0
        self.current_photo_index = 0
        self.current_photo_image = None  # Store reference to prevent garbage collection
        
        # Configure styles
        self.configure_styles()
        
        # Create UI components
        self.create_menu()
        self.create_frames()
        self.create_widgets()
        
        # Load config manager
        self.config_manager = ConfigManager()
        self.config_manager.load()
        
        # Create status bar
        self.status_bar = StatusBar(self.root, "Ready")
        
        # Load file if provided
        if file_path:
            self.load_file(file_path)
    
    def configure_styles(self):
        """Configure ttk styles for the application."""
        style = ttk.Style()
        
        # Configure heading style
        style.configure("Heading.TLabel", font=("Helvetica", 14, "bold"))
        
        # Configure item info style
        style.configure("Info.TLabel", font=("Helvetica", 12))
        
        # Configure section heading style
        style.configure("Section.TLabel", font=("Helvetica", 12, "bold"), padding=5)
        
        # Configure description text style
        try:
            self.description_font = Font(family="Helvetica", size=11)
        except:
            self.description_font = None  # Use default if custom font fails
    
    def create_menu(self):
        """Create application menu."""
        menubar = tk.Menu(self.root)
        
        # File menu
        file_menu = tk.Menu(menubar, tearoff=0)
        file_menu.add_command(label="Open...", command=self.open_file)
        file_menu.add_separator()
        file_menu.add_command(label="Exit", command=self.root.quit)
        menubar.add_cascade(label="File", menu=file_menu)
        
        # Tools menu
        tools_menu = tk.Menu(menubar, tearoff=0)
        tools_menu.add_command(label="Export Current Description", command=self.export_description)
        tools_menu.add_command(label="Export All Descriptions", command=self.export_all_descriptions)
        tools_menu.add_command(label="Export Item as CSV", command=self.export_item_as_csv)
        tools_menu.add_separator()
        
        # Add launch options for other tools
        tools_menu.add_command(label="Launch Setup", command=lambda: ToolLauncher.launch_setup())
        tools_menu.add_command(label="Launch Processor", command=self.launch_processor)
        tools_menu.add_command(label="Launch Price Analyzer", command=self.launch_price_analyzer)
        tools_menu.add_command(label="Launch Gallery Creator", command=self.launch_gallery)
        tools_menu.add_separator()
        tools_menu.add_command(label="Launch CSV Export", command=self.launch_csv_export)
        tools_menu.add_command(label="Launch Mobile Import", command=lambda: ToolLauncher.launch_mobile_import())
        tools_menu.add_command(label="Launch Direct Listing", command=lambda: ToolLauncher.launch_direct_listing())
        
        menubar.add_cascade(label="Tools", menu=tools_menu)
        
        # Help menu
        help_menu = tk.Menu(menubar, tearoff=0)
        help_menu.add_command(label="About", command=self.show_about)
        menubar.add_cascade(label="Help", menu=help_menu)
        
        self.root.config(menu=menubar)
    
    def create_frames(self):
        """Create the main UI frames."""
        # Main container with left (navigation) and right (content) panes
        self.main_paned = ttk.PanedWindow(self.root, orient=tk.HORIZONTAL)
        self.main_paned.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Left frame for item list
        self.left_frame = ttk.Frame(self.main_paned, width=300)
        self.main_paned.add(self.left_frame, weight=1)
        
        # Right frame for item details
        self.right_frame = ttk.Frame(self.main_paned)
        self.main_paned.add(self.right_frame, weight=3)
        
        # Split right frame into top (details) and bottom (photos)
        self.right_paned = ttk.PanedWindow(self.right_frame, orient=tk.VERTICAL)
        self.right_paned.pack(fill=tk.BOTH, expand=True)
        
        # Top right: item details
        self.details_frame = ttk.Frame(self.right_paned)
        self.right_paned.add(self.details_frame, weight=2)
        
        # Bottom right: photo and description
        self.photo_desc_frame = ttk.Frame(self.right_paned)
        self.right_paned.add(self.photo_desc_frame, weight=3)
        
        # Split photo/description frame horizontally
        self.photo_desc_paned = ttk.PanedWindow(self.photo_desc_frame, orient=tk.HORIZONTAL)
        self.photo_desc_paned.pack(fill=tk.BOTH, expand=True)
        
        # Left side: photo display
        self.photo_frame = ttk.LabelFrame(self.photo_desc_paned, text="Photos")
        self.photo_desc_paned.add(self.photo_frame, weight=1)
        
        # Right side: description text
        self.description_frame = ttk.LabelFrame(self.photo_desc_paned, text="Description")
        self.photo_desc_paned.add(self.description_frame, weight=1)
    
    def create_widgets(self):
        """Create all UI widgets."""
        # Left frame - Item list
        self.create_item_list_widgets()
        
        # Details frame - Item information
        self.create_item_details_widgets()
        
        # Photo frame - Photo display and navigation
        self.create_photo_widgets()
        
        # Description frame - Description text display
        self.create_description_widgets()
    
    def create_item_list_widgets(self):
        """Create widgets for the item list in the left frame."""
        # Search filter
        filter_frame = ttk.Frame(self.left_frame)
        filter_frame.pack(fill=tk.X, padx=5, pady=5)
        
        ttk.Label(filter_frame, text="Filter:").pack(side=tk.LEFT)
        self.filter_var = tk.StringVar()
        self.filter_entry = ttk.Entry(filter_frame, textvariable=self.filter_var)
        self.filter_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=5)
        self.filter_entry.bind("<KeyRelease>", self.apply_filter)
        
        # Status filters
        self.show_processed_var = tk.BooleanVar(value=True)
        self.show_unprocessed_var = tk.BooleanVar(value=True)
        
        filter_checks = ttk.Frame(self.left_frame)
        filter_checks.pack(fill=tk.X, padx=5, pady=2)
        
        ttk.Checkbutton(filter_checks, text="Processed", variable=self.show_processed_var, 
                      command=self.apply_filter).pack(side=tk.LEFT, padx=5)
        ttk.Checkbutton(filter_checks, text="Unprocessed", variable=self.show_unprocessed_var, 
                      command=self.apply_filter).pack(side=tk.LEFT, padx=5)
        
        # Item listbox with scrollbar
        list_frame = ttk.Frame(self.left_frame)
        list_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        self.item_listbox = tk.Listbox(list_frame, selectmode=tk.SINGLE)
        self.item_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self.item_listbox.bind("<<ListboxSelect>>", self.on_item_select)
        
        scrollbar = ttk.Scrollbar(list_frame, orient=tk.VERTICAL, command=self.item_listbox.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.item_listbox.config(yscrollcommand=scrollbar.set)
        
        # Navigation frame
        nav_frame = ttk.Frame(self.left_frame)
        nav_frame.pack(fill=tk.X, padx=5, pady=5)
        
        self.prev_item_btn = ttk.Button(nav_frame, text="← Previous", command=self.prev_item)
        self.prev_item_btn.pack(side=tk.LEFT, padx=2, pady=5)
        
        self.next_item_btn = ttk.Button(nav_frame, text="Next →", command=self.next_item)
        self.next_item_btn.pack(side=tk.LEFT, padx=2, pady=5)
        
        # Status count
        self.status_count = ttk.Label(self.left_frame, text="0 items")
        self.status_count.pack(pady=5)
    
    def create_item_details_widgets(self):
        """Create widgets for item details display."""
        # Item header with title and SKU
        header_frame = ttk.Frame(self.details_frame)
        header_frame.pack(fill=tk.X, padx=10, pady=5)
        
        self.title_label = ttk.Label(header_frame, text="No item selected", style="Heading.TLabel")
        self.title_label.pack(anchor=tk.W)
        
        self.sku_label = ttk.Label(header_frame, text="", style="Info.TLabel")
        self.sku_label.pack(anchor=tk.W)
        
        # Create a notebook with tabs for different sections
        self.notebook = ttk.Notebook(self.details_frame)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Basic info tab
        self.basic_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.basic_frame, text="Basic Info")
        
        # Item specifics tab
        self.specifics_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.specifics_frame, text="Item Specifics")
        
        # API results tab
        self.api_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.api_frame, text="API Results")
        
        # Create widgets for basic info tab
        self.create_basic_info_widgets()
        
        # Create widgets for item specifics tab
        self.create_item_specifics_widgets()
        
        # Create widgets for API results tab
        self.create_api_results_widgets()
    
    def create_basic_info_widgets(self):
        """Create widgets for the basic info tab."""
        # Create a frame with a grid layout
        frame = ttk.Frame(self.basic_frame, padding=10)
        frame.pack(fill=tk.BOTH, expand=True)
        
        # Create labels and value displays
        ttk.Label(frame, text="Category:", anchor=tk.E).grid(row=0, column=0, sticky=tk.E, padx=5, pady=2)
        self.category_value = ttk.Label(frame, text="", anchor=tk.W)
        self.category_value.grid(row=0, column=1, sticky=tk.W, padx=5, pady=2)
        
        ttk.Label(frame, text="Condition:", anchor=tk.E).grid(row=1, column=0, sticky=tk.E, padx=5, pady=2)
        self.condition_value = ttk.Label(frame, text="", anchor=tk.W)
        self.condition_value.grid(row=1, column=1, sticky=tk.W, padx=5, pady=2)
        
        ttk.Label(frame, text="Price:", anchor=tk.E).grid(row=2, column=0, sticky=tk.E, padx=5, pady=2)
        self.price_value = ttk.Label(frame, text="", anchor=tk.W)
        self.price_value.grid(row=2, column=1, sticky=tk.W, padx=5, pady=2)
        
        ttk.Label(frame, text="Quantity:", anchor=tk.E).grid(row=3, column=0, sticky=tk.E, padx=5, pady=2)
        self.quantity_value = ttk.Label(frame, text="", anchor=tk.W)
        self.quantity_value.grid(row=3, column=1, sticky=tk.W, padx=5, pady=2)
        
        ttk.Label(frame, text="Format:", anchor=tk.E).grid(row=4, column=0, sticky=tk.E, padx=5, pady=2)
        self.format_value = ttk.Label(frame, text="", anchor=tk.W)
        self.format_value.grid(row=4, column=1, sticky=tk.W, padx=5, pady=2)
        
        ttk.Label(frame, text="Duration:", anchor=tk.E).grid(row=5, column=0, sticky=tk.E, padx=5, pady=2)
        self.duration_value = ttk.Label(frame, text="", anchor=tk.W)
        self.duration_value.grid(row=5, column=1, sticky=tk.W, padx=5, pady=2)
        
        ttk.Label(frame, text="Created:", anchor=tk.E).grid(row=6, column=0, sticky=tk.E, padx=5, pady=2)
        self.created_value = ttk.Label(frame, text="", anchor=tk.W)
        self.created_value.grid(row=6, column=1, sticky=tk.W, padx=5, pady=2)
        
        ttk.Label(frame, text="Processed:", anchor=tk.E).grid(row=7, column=0, sticky=tk.E, padx=5, pady=2)
        self.processed_value = ttk.Label(frame, text="", anchor=tk.W)
        self.processed_value.grid(row=7, column=1, sticky=tk.W, padx=5, pady=2)
        
        # Condition Description
        ttk.Label(frame, text="Condition Description:", anchor=tk.W).grid(row=8, column=0, columnspan=2, sticky=tk.W, padx=5, pady=(10, 2))
        self.condition_desc_text = tk.Text(frame, wrap=tk.WORD, height=4, width=50)
        self.condition_desc_text.grid(row=9, column=0, columnspan=2, sticky=tk.EW, padx=5, pady=2)
        self.condition_desc_text.config(state=tk.DISABLED)
        
        # Configure the grid to expand properly
        frame.columnconfigure(1, weight=1)
    
    def create_item_specifics_widgets(self):
        """Create widgets for the item specifics tab."""
        # Create a frame with a treeview
        frame = ttk.Frame(self.specifics_frame, padding=10)
        frame.pack(fill=tk.BOTH, expand=True)
        
        # Create a treeview for item specifics
        columns = ("Name", "Value")
        self.specifics_tree = ttk.Treeview(frame, columns=columns, show="headings")
        self.specifics_tree.heading("Name", text="Name")
        self.specifics_tree.heading("Value", text="Value")
        self.specifics_tree.column("Name", width=150)
        self.specifics_tree.column("Value", width=350)
        self.specifics_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        # Add a scrollbar
        scrollbar = ttk.Scrollbar(frame, orient=tk.VERTICAL, command=self.specifics_tree.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.specifics_tree.config(yscrollcommand=scrollbar.set)
    
    def create_api_results_widgets(self):
        """Create widgets for the API results tab."""
        # Create a frame with a text widget
        frame = ttk.Frame(self.api_frame, padding=10)
        frame.pack(fill=tk.BOTH, expand=True)
        
        # Text widget for API results
        self.api_text = tk.Text(frame, wrap=tk.WORD)
        self.api_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self.api_text.config(state=tk.DISABLED)
        
        # Add a scrollbar
        scrollbar = ttk.Scrollbar(frame, orient=tk.VERTICAL, command=self.api_text.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.api_text.config(yscrollcommand=scrollbar.set)
    
    def create_photo_widgets(self):
        """Create widgets for photo display and navigation."""
        # Photo display area
        photo_display = ttk.Frame(self.photo_frame, padding=5)
        photo_display.pack(fill=tk.BOTH, expand=True)
        
        # Photo label (where the image will be displayed)
        self.photo_label = ttk.Label(photo_display, text="No photo", anchor=tk.CENTER)
        self.photo_label.pack(fill=tk.BOTH, expand=True)
        
        # Photo navigation controls
        nav_frame = ttk.Frame(self.photo_frame)
        nav_frame.pack(fill=tk.X, padx=5, pady=5)
        
        self.prev_photo_btn = ttk.Button(nav_frame, text="← Previous Photo", command=self.prev_photo)
        self.prev_photo_btn.pack(side=tk.LEFT, padx=2)
        
        self.photo_index_label = ttk.Label(nav_frame, text="")
        self.photo_index_label.pack(side=tk.LEFT, padx=10)
        
        self.next_photo_btn = ttk.Button(nav_frame, text="Next Photo →", command=self.next_photo)
        self.next_photo_btn.pack(side=tk.LEFT, padx=2)
        
        # Open photo button
        self.open_photo_btn = ttk.Button(nav_frame, text="Open Photo", command=self.open_current_photo)
        self.open_photo_btn.pack(side=tk.RIGHT, padx=2)
        
        # Photo context display
        self.photo_context_label = ttk.Label(self.photo_frame, text="")
        self.photo_context_label.pack(fill=tk.X, padx=5, pady=5)
    
    def create_description_widgets(self):
        """Create widgets for description display."""
        # Description text widget with scrollbar
        desc_frame = ttk.Frame(self.description_frame, padding=5)
        desc_frame.pack(fill=tk.BOTH, expand=True)
        
        self.description_text = tk.Text(desc_frame, wrap=tk.WORD)
        if self.description_font:
            self.description_text.configure(font=self.description_font)
        self.description_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self.description_text.config(state=tk.DISABLED)
        
        scrollbar = ttk.Scrollbar(desc_frame, orient=tk.VERTICAL, command=self.description_text.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.description_text.config(yscrollcommand=scrollbar.set)
        
        # Copy button
        button_frame = ttk.Frame(self.description_frame)
        button_frame.pack(fill=tk.X, padx=5, pady=5)
        
        self.copy_desc_btn = ttk.Button(button_frame, text="Copy Description", command=self.copy_description)
        self.copy_desc_btn.pack(side=tk.LEFT, padx=2)
    
    def open_file(self):
        """Open a file dialog to select a JSON file."""
        file_path = filedialog.askopenfilename(
            title="Open eBay Queue File",
            filetypes=[("JSON Files", "*.json"), ("All Files", "*.*")],
            initialdir=os.path.dirname(self.config_manager.get("paths.last_queue_file", ""))
        )
        
        if file_path:
            self.load_file(file_path)
    
    def load_file(self, file_path):
        """Load items from a JSON file."""
        try:
            # Load the items using the schema loader
            self.items = load_queue(file_path)
            
            # Update the config
            self.config_manager.set("paths.last_queue_file", file_path)
            self.config_manager.save()
            
            # Update the item listbox
            self.update_item_listbox()
            
            # Set current index to first item
            if self.items:
                self.current_index = 0
                self.current_photo_index = 0
                self.display_current_item()
            
            # Update status
            self.status_bar.update(f"Loaded {len(self.items)} items from {os.path.basename(file_path)}")
            
        except Exception as e:
            logger.error(f"Error loading file: {str(e)}")
            messagebox.showerror("Error", f"Failed to load file: {str(e)}")
    
    def update_item_listbox(self):
        """Update the item listbox with filtered items."""
        self.item_listbox.delete(0, tk.END)
        
        filter_text = self.filter_var.get().lower()
        show_processed = self.show_processed_var.get()
        show_unprocessed = self.show_unprocessed_var.get()
        
        filtered_items = []
        for i, item in enumerate(self.items):
            # Check processed status filters
            is_processed = item.get("processed", False)
            if (is_processed and not show_processed) or (not is_processed and not show_unprocessed):
                continue
            
            # Check text filter
            if filter_text:
                title = item.get("title", "").lower()
                temp_title = item.get("temp_title", "").lower()
                sku = item.get("sku", "").lower()
                
                if not (filter_text in title or filter_text in temp_title or filter_text in sku):
                    continue
            
            # Item passed all filters, add to listbox and filtered items
            filtered_items.append(i)
            
            # Create display text
            title = item.get("title", "") or item.get("temp_title", "Untitled")
            sku = item.get("sku", "")
            prefix = "✓ " if item.get("processed", False) else "□ "
            display_text = f"{prefix}{sku}: {title}" if sku else f"{prefix}{title}"
            
            self.item_listbox.insert(tk.END, display_text)
        
        # Update status count
        self.status_count.config(text=f"{len(filtered_items)} / {len(self.items)} items")
    
    def apply_filter(self, event=None):
        """Apply the current filter settings."""
        self.update_item_listbox()
    
    def on_item_select(self, event):
        """Handle item selection from the listbox."""
        selection = self.item_listbox.curselection()
        if not selection:
            return
        
        # Get the index in the filtered list
        listbox_index = selection[0]
        
        # Find the corresponding index in the full list
        filter_text = self.filter_var.get().lower()
        show_processed = self.show_processed_var.get()
        show_unprocessed = self.show_unprocessed_var.get()
        
        item_indices = []
        for i, item in enumerate(self.items):
            # Check processed status filters
            is_processed = item.get("processed", False)
            if (is_processed and not show_processed) or (not is_processed and not show_unprocessed):
                continue
            
            # Check text filter
            if filter_text:
                title = item.get("title", "").lower()
                temp_title = item.get("temp_title", "").lower()
                sku = item.get("sku", "").lower()
                
                if not (filter_text in title or filter_text in temp_title or filter_text in sku):
                    continue
            
            item_indices.append(i)
        
        if listbox_index < len(item_indices):
            self.current_index = item_indices[listbox_index]
            self.current_photo_index = 0
            self.display_current_item()
    
    def prev_item(self):
        """Navigate to the previous item."""
        if not self.items or self.current_index <= 0:
            return
        
        self.current_index -= 1
        self.current_photo_index = 0
        self.display_current_item()
        
        # Update selection in listbox
        self.update_listbox_selection()
    
    def next_item(self):
        """Navigate to the next item."""
        if not self.items or self.current_index >= len(self.items) - 1:
            return
        
        self.current_index += 1
        self.current_photo_index = 0
        self.display_current_item()
        
        # Update selection in listbox
        self.update_listbox_selection()
    
    def update_listbox_selection(self):
        """Update the listbox selection to match the current index."""
        # Clear current selection
        self.item_listbox.selection_clear(0, tk.END)
        
        # Find the current item in the filtered list
        filter_text = self.filter_var.get().lower()
        show_processed = self.show_processed_var.get()
        show_unprocessed = self.show_unprocessed_var.get()
        
        filtered_indices = []
        for i, item in enumerate(self.items):
            # Check processed status filters
            is_processed = item.get("processed", False)
            if (is_processed and not show_processed) or (not is_processed and not show_unprocessed):
                continue
            
            # Check text filter
            if filter_text:
                title = item.get("title", "").lower()
                temp_title = item.get("temp_title", "").lower()
                sku = item.get("sku", "").lower()
                
                if not (filter_text in title or filter_text in temp_title or filter_text in sku):
                    continue
            
            filtered_indices.append(i)
        
        # Find current index in filtered list
        try:
            listbox_index = filtered_indices.index(self.current_index)
            self.item_listbox.selection_set(listbox_index)
            self.item_listbox.see(listbox_index)
        except ValueError:
            # Current item not in filtered list
            pass
    
    def prev_photo(self):
        """Navigate to the previous photo."""
        if not self.items or self.current_index < 0 or self.current_index >= len(self.items):
            return
        
        item = self.items[self.current_index]
        photos = item.get("photos", [])
        
        if not photos or self.current_photo_index <= 0:
            return
        
        self.current_photo_index -= 1
        self.display_current_photo()
    
    def next_photo(self):
        """Navigate to the next photo."""
        if not self.items or self.current_index < 0 or self.current_index >= len(self.items):
            return
        
        item = self.items[self.current_index]
        photos = item.get("photos", [])
        
        if not photos or self.current_photo_index >= len(photos) - 1:
            return
        
        self.current_photo_index += 1
        self.display_current_photo()
    
    def display_current_item(self):
        """Display details for the current item."""
        if not self.items or self.current_index < 0 or self.current_index >= len(self.items):
            # Clear display
            self.clear_item_display()
            return
        
        item = self.items[self.current_index]
        
        # Update title and SKU
        title = item.get("title", "") or item.get("temp_title", "Untitled")
        sku = item.get("sku", "")
        
        self.title_label.config(text=title)
        self.sku_label.config(text=f"SKU: {sku}" if sku else "")
        
        # Update basic info
        category = item.get("category", "")
        self.category_value.config(text=category)
        
        condition_code = item.get("condition", "")
        condition_text = EbayItemSchema.get_display_condition(item)
        self.condition_value.config(text=condition_text)
        
        price = item.get("price", "")
        self.price_value.config(text=f"${price}" if price else "")
        
        quantity = item.get("quantity", "")
        self.quantity_value.config(text=quantity)
        
        format_value = item.get("format", "")
        self.format_value.config(text=format_value)
        
        duration = item.get("duration", "")
        self.duration_value.config(text=duration)
        
        created_at = item.get("created_at", "")
        if created_at:
            try:
                created_date = datetime.fromisoformat(created_at).strftime("%Y-%m-%d %H:%M")
                self.created_value.config(text=created_date)
            except:
                self.created_value.config(text=created_at)
        else:
            self.created_value.config(text="")
        
        processed = "Yes" if item.get("processed", False) else "No"
        processed_at = item.get("processed_at", "")
        if processed_at:
            try:
                processed_date = datetime.fromisoformat(processed_at).strftime("%Y-%m-%d %H:%M")
                self.processed_value.config(text=f"{processed} ({processed_date})")
            except:
                self.processed_value.config(text=f"{processed} ({processed_at})")
        else:
            self.processed_value.config(text=processed)
        
        # Update condition description
        condition_desc = item.get("conditionDescription", "")
        self.condition_desc_text.config(state=tk.NORMAL)
        self.condition_desc_text.delete(1.0, tk.END)
        self.condition_desc_text.insert(tk.END, condition_desc)
        self.condition_desc_text.config(state=tk.DISABLED)
        
        # Update item specifics
        self.specifics_tree.delete(*self.specifics_tree.get_children())
        
        item_specifics = EbayItemSchema.extract_item_specifics(item)
        for name, value in sorted(item_specifics.items()):
            self.specifics_tree.insert("", "end", values=(name, value))
        
        # Update API results
        self.api_text.config(state=tk.NORMAL)
        self.api_text.delete(1.0, tk.END)
        
        api_results = item.get("api_results", [])
        if api_results:
            for i, result in enumerate(api_results):
                if i > 0:
                    self.api_text.insert(tk.END, "\n" + "-" * 40 + "\n\n")
                
                processed_at = result.get("processed_at", "")
                if processed_at:
                    try:
                        date_str = datetime.fromisoformat(processed_at).strftime("%Y-%m-%d %H:%M:%S")
                        self.api_text.insert(tk.END, f"Processed at: {date_str}\n\n")
                    except:
                        self.api_text.insert(tk.END, f"Processed at: {processed_at}\n\n")
                
                if "final_description" in result:
                    self.api_text.insert(tk.END, result["final_description"])
                elif "error" in result:
                    self.api_text.insert(tk.END, f"Error: {result['error']}")
        else:
            self.api_text.insert(tk.END, "No API results available")
        
        self.api_text.config(state=tk.DISABLED)
        
        # Display the first photo
        self.display_current_photo()
        
        # Get the main description if available
        self.description_text.config(state=tk.NORMAL)
        self.description_text.delete(1.0, tk.END)
        
        description = item.get("description", "")
        if description:
            self.description_text.insert(tk.END, description)
        else:
            self.description_text.insert(tk.END, "No description available")
        
        self.description_text.config(state=tk.DISABLED)
        
        # Update navigation buttons
        self.update_navigation_buttons()
    
    def display_current_photo(self):
        """Display the current photo."""
        if not self.items or self.current_index < 0 or self.current_index >= len(self.items):
            return
        
        item = self.items[self.current_index]
        photos = item.get("photos", [])
        
        if not photos or self.current_photo_index < 0 or self.current_photo_index >= len(photos):
            # No photos or invalid index
            self.photo_label.config(image="", text="No photos available")
            self.current_photo_image = None
            self.photo_context_label.config(text="")
            self.photo_index_label.config(text="No photos")
            return
        
        # Get current photo
        photo_data = photos[self.current_photo_index]
        photo_path = photo_data.get("path", "")
        
        if not photo_path or not os.path.exists(photo_path):
            # Photo file not found
            self.photo_label.config(image="", text=f"Photo not found: {photo_path}")
            self.current_photo_image = None
            return
        
        try:
            # Clear previous image reference
            self.photo_label.config(image="")
            self.current_photo_image = None
            
            # Load and display the image
            image = open_image_with_orientation(photo_path)
            
            # Get frame dimensions
            self.photo_frame.update_idletasks()
            frame_width = self.photo_frame.winfo_width() - 20
            frame_height = self.photo_frame.winfo_height() - 80
            
            # Minimum dimensions if frame not properly sized yet
            frame_width = max(frame_width, 300)
            frame_height = max(frame_height, 300)
            
            # Resize image to fit the frame
            display_image = fit_image_to_frame(image, frame_width, frame_height)
            
            # Convert to PhotoImage
            photo_image = create_photo_image(display_image)
            self.current_photo_image = photo_image
            
            # Update display
            self.photo_label.config(image=photo_image, text="")
            
            # Update photo index label
            self.photo_index_label.config(text=f"Photo {self.current_photo_index + 1} of {len(photos)}")
            
            # Update context label
            context = photo_data.get("context", "")
            self.photo_context_label.config(text=f"Context: {context}" if context else "No context")
            
            # If the photo has API results, display them
            if photo_data.get("api_result") and "response" in photo_data["api_result"]:
                response = photo_data["api_result"]["response"]
                
                # Update the description text if it's not overridden by the item description
                if not item.get("description", ""):
                    self.description_text.config(state=tk.NORMAL)
                    self.description_text.delete(1.0, tk.END)
                    self.description_text.insert(tk.END, response)
                    self.description_text.config(state=tk.DISABLED)
            
        except Exception as e:
            logger.error(f"Error displaying photo: {str(e)}")
            self.photo_label.config(image="", text=f"Error loading image: {str(e)}")
            self.current_photo_image = None
        
        # Update navigation buttons
        self.update_navigation_buttons()
    
    def clear_item_display(self):
        """Clear all item display fields."""
        # Clear title and SKU
        self.title_label.config(text="No item selected")
        self.sku_label.config(text="")
        
        # Clear basic info
        self.category_value.config(text="")
        self.condition_value.config(text="")
        self.price_value.config(text="")
        self.quantity_value.config(text="")
        self.format_value.config(text="")
        self.duration_value.config(text="")
        self.created_value.config(text="")
        self.processed_value.config(text="")
        
        # Clear condition description
        self.condition_desc_text.config(state=tk.NORMAL)
        self.condition_desc_text.delete(1.0, tk.END)
        self.condition_desc_text.config(state=tk.DISABLED)
        
        # Clear item specifics
        self.specifics_tree.delete(*self.specifics_tree.get_children())
        
        # Clear API results
        self.api_text.config(state=tk.NORMAL)
        self.api_text.delete(1.0, tk.END)
        self.api_text.config(state=tk.DISABLED)
        
        # Clear photo
        self.photo_label.config(image="", text="No photos available")
        self.current_photo_image = None
        self.photo_context_label.config(text="")
        self.photo_index_label.config(text="No photos")
        
        # Clear description
        self.description_text.config(state=tk.NORMAL)
        self.description_text.delete(1.0, tk.END)
        self.description_text.config(state=tk.DISABLED)
        
        # Update navigation buttons
        self.update_navigation_buttons()
    
    def update_navigation_buttons(self):
        """Update the enabled/disabled state of navigation buttons."""
        # Item navigation
        if not self.items or self.current_index <= 0:
            self.prev_item_btn.config(state=tk.DISABLED)
        else:
            self.prev_item_btn.config(state=tk.NORMAL)
        
        if not self.items or self.current_index >= len(self.items) - 1:
            self.next_item_btn.config(state=tk.DISABLED)
        else:
            self.next_item_btn.config(state=tk.NORMAL)
        
        # Photo navigation
        if not self.items or self.current_index < 0 or self.current_index >= len(self.items):
            self.prev_photo_btn.config(state=tk.DISABLED)
            self.next_photo_btn.config(state=tk.DISABLED)
            self.open_photo_btn.config(state=tk.DISABLED)
            return
        
        item = self.items[self.current_index]
        photos = item.get("photos", [])
        
        if not photos or self.current_photo_index <= 0:
            self.prev_photo_btn.config(state=tk.DISABLED)
        else:
            self.prev_photo_btn.config(state=tk.NORMAL)
        
        if not photos or self.current_photo_index >= len(photos) - 1:
            self.next_photo_btn.config(state=tk.DISABLED)
        else:
            self.next_photo_btn.config(state=tk.NORMAL)
        
        if not photos or self.current_photo_index < 0 or self.current_photo_index >= len(photos):
            self.open_photo_btn.config(state=tk.DISABLED)
        else:
            photo_path = photos[self.current_photo_index].get("path", "")
            if photo_path and os.path.exists(photo_path):
                self.open_photo_btn.config(state=tk.NORMAL)
            else:
                self.open_photo_btn.config(state=tk.DISABLED)
    
    def open_current_photo(self):
        """Open the current photo in the default image viewer."""
        if not self.items or self.current_index < 0 or self.current_index >= len(self.items):
            return
        
        item = self.items[self.current_index]
        photos = item.get("photos", [])
        
        if not photos or self.current_photo_index < 0 or self.current_photo_index >= len(photos):
            return
        
        photo_path = photos[self.current_photo_index].get("path", "")
        
        if not photo_path or not os.path.exists(photo_path):
            messagebox.showerror("Error", f"Photo file not found: {photo_path}")
            return
        
        # Open the photo in the default application
        try:
            if sys.platform == 'win32':
                os.startfile(photo_path)
            elif sys.platform == 'darwin':  # macOS
                subprocess.run(['open', photo_path])
            else:  # Linux
                subprocess.run(['xdg-open', photo_path])
        except Exception as e:
            logger.error(f"Error opening photo: {str(e)}")
            messagebox.showerror("Error", f"Failed to open photo: {str(e)}")
    
    def copy_description(self):
        """Copy the current description to the clipboard."""
        if not self.items or self.current_index < 0 or self.current_index >= len(self.items):
            return
        
        try:
            # Get the description text
            description = self.description_text.get(1.0, tk.END).strip()
            
            # Copy to clipboard
            self.root.clipboard_clear()
            self.root.clipboard_append(description)
            
            # Show confirmation
            self.status_bar.update("Description copied to clipboard")
        except Exception as e:
            logger.error(f"Error copying description: {str(e)}")
            messagebox.showerror("Error", f"Failed to copy description: {str(e)}")
    
    def export_description(self):
        """Export the current description to a text file."""
        if not self.items or self.current_index < 0 or self.current_index >= len(self.items):
            return
        
        item = self.items[self.current_index]
        title = item.get("title", "") or item.get("temp_title", "Untitled")
        sku = item.get("sku", "")
        
        # Generate a default filename
        filename = f"{sku}_{title}" if sku else title
        filename = ''.join(c if c.isalnum() or c in '._- ' else '_' for c in filename)
        filename = filename[:50]  # Limit length
        
        # Show save dialog
        file_path = filedialog.asksaveasfilename(
            title="Export Description",
            defaultextension=".txt",
            filetypes=[("Text Files", "*.txt"), ("All Files", "*.*")],
            initialfile=filename
        )
        
        if not file_path:
            return
        
        try:
            # Get the description text
            description = self.description_text.get(1.0, tk.END).strip()
            
            # Write to file
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(description)
            
            # Show confirmation
            self.status_bar.update(f"Description exported to {os.path.basename(file_path)}")
        except Exception as e:
            logger.error(f"Error exporting description: {str(e)}")
            messagebox.showerror("Error", f"Failed to export description: {str(e)}")
    
    def export_all_descriptions(self):
        """Export all item descriptions to a directory."""
        if not self.items:
            messagebox.showinfo("Info", "No items to export.")
            return
        
        # Ask for directory
        directory = filedialog.askdirectory(
            title="Select Directory for Descriptions",
            mustexist=True
        )
        
        if not directory:
            return
        
        try:
            # Count successful exports
            success_count = 0
            
            # Export each item's description
            for item in self.items:
                # Skip items without a description
                if not item.get("description", ""):
                    continue
                
                # Generate filename
                title = item.get("title", "") or item.get("temp_title", "Untitled")
                sku = item.get("sku", "")
                
                filename = f"{sku}_{title}" if sku else title
                filename = ''.join(c if c.isalnum() or c in '._- ' else '_' for c in filename)
                filename = filename[:50]  # Limit length
                filename = os.path.join(directory, f"{filename}.txt")
                
                # Write the description
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(item.get("description", ""))
                
                success_count += 1
            
            # Show confirmation
            self.status_bar.update(f"Exported {success_count} descriptions to {directory}")
            messagebox.showinfo("Export Complete", f"Successfully exported {success_count} descriptions.")
            
        except Exception as e:
            logger.error(f"Error exporting descriptions: {str(e)}")
            messagebox.showerror("Error", f"Failed to export descriptions: {str(e)}")
    
    def export_item_as_csv(self):
        """Export the current item as a CSV row for eBay bulk upload."""
        if not self.items or self.current_index < 0 or self.current_index >= len(self.items):
            return
        
        item = self.items[self.current_index]
        
        # Generate a default filename
        sku = item.get("sku", "")
        title = item.get("title", "") or item.get("temp_title", "Untitled")
        filename = f"{sku}_{title}" if sku else title
        filename = ''.join(c if c.isalnum() or c in '._- ' else '_' for c in filename)
        filename = filename[:50]  # Limit length
        
        # Show save dialog
        file_path = filedialog.asksaveasfilename(
            title="Export as CSV",
            defaultextension=".csv",
            filetypes=[("CSV Files", "*.csv"), ("All Files", "*.*")],
            initialfile=filename
        )
        
        if not file_path:
            return
        
        try:
            import csv
            
            # Convert item to CSV row format
            row = EbayItemSchema.to_csv_row(item)
            
            # Add photo URLs if available
            photos = item.get("photos", [])
            if photos:
                pic_urls = []
                for photo in photos:
                    path = photo.get("path", "")
                    if path:
                        pic_urls.append(path)
                
                if pic_urls:
                    row["PicURL"] = "|".join(pic_urls)
            
            # Get all field names
            fieldnames = sorted(row.keys())
            
            # Write CSV file
            with open(file_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerow(row)
            
            # Show confirmation
            self.status_bar.update(f"Item exported to {os.path.basename(file_path)}")
            messagebox.showinfo("Export Complete", "Item successfully exported as CSV.")
            
        except Exception as e:
            logger.error(f"Error exporting CSV: {str(e)}")
            messagebox.showerror("Error", f"Failed to export CSV: {str(e)}")
    
    def show_about(self):
        """Show the about dialog."""
        show_about_dialog(
            self.root,
            "eBay JSON Viewer",
            "View and explore eBay listing data from JSON files",
            VIEWER_FEATURES
        )
    
    def launch_processor(self):
        """Launch the LLM Processor with current queue file."""
        if self.json_file_path and os.path.exists(self.json_file_path):
            ToolLauncher.launch_processor(self.json_file_path)
        else:
            ToolLauncher.launch_processor()
    
    def launch_price_analyzer(self):
        """Launch the Price Analyzer with current queue file."""
        if self.json_file_path and os.path.exists(self.json_file_path):
            ToolLauncher.launch_price_analyzer(self.json_file_path)
        else:
            ToolLauncher.launch_price_analyzer()
    
    def launch_gallery(self):
        """Launch the Gallery Creator with current queue file."""
        if self.json_file_path and os.path.exists(self.json_file_path):
            ToolLauncher.launch_gallery(self.json_file_path)
        else:
            ToolLauncher.launch_gallery()
    
    def launch_csv_export(self):
        """Launch the CSV Export tool with current queue file."""
        if self.json_file_path and os.path.exists(self.json_file_path):
            ToolLauncher.launch_csv_export(self.json_file_path)
        else:
            ToolLauncher.launch_csv_export()


def main():
    """Main function to start the application."""
    root = tk.Tk()
    
    # Get file path from command line argument if provided
    file_path = None
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            file_path = None
    
    # Create and run the application
    app = EbayJsonViewer(root, file_path)
    
    # Center the window on screen
    center_window(root, 1200, 800)
    
    # Start the main loop
    root.mainloop()


if __name__ == "__main__":
    main()
