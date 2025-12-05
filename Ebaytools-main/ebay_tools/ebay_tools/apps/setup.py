"""
eBay Work Queue Setup - Create and manage work queues for eBay listing automation.

This module represents a refactored version of WorkQueueSetupV3.py,
utilizing the new package structure and modular components.
"""

import os
import sys
import json
import tkinter as tk
from tkinter import filedialog, messagebox, ttk
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
import uuid

# Import core modules
from ebay_tools.core.schema import EbayItemSchema, load_queue, save_queue
from ebay_tools.core.config import ConfigManager
from ebay_tools.core.exceptions import EbayToolsError, FileError, ValidationError

# Import utility modules
from ebay_tools.utils.image_utils import open_image_with_orientation, create_thumbnail, create_photo_image
from ebay_tools.utils.file_utils import ensure_directory_exists, safe_load_json, safe_save_json
from ebay_tools.utils.ui_utils import StatusBar, PhotoFrame, ProgressIndicator, show_error, show_info, ask_yes_no
from ebay_tools.utils.background_utils import BackgroundTask, BackgroundTaskManager
from ebay_tools.utils.launcher_utils import ToolLauncher, create_tools_menu
from ebay_tools.utils.version_utils import create_help_menu, SETUP_FEATURES

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("ebay_setup.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class EbayWorkQueueSetup:
    """
    Main class for creating and managing eBay work queues.
    """
    def __init__(self, root):
        """Initialize the application."""
        self.root = root
        self.root.title("eBay Listing Setup")
        self.root.geometry("1200x800")
        
        # Initialize variables
        self.queue_file_path = None
        self.work_queue = []
        self.current_item_index = -1
        self.photo_directory = None
        self.current_photos = []
        self.current_photo_images = []  # Store image references
        
        # Initialize config manager
        self.config_manager = ConfigManager()
        self.config_manager.load()
        
        # Initialize background task manager
        self.task_manager = BackgroundTaskManager(root)
        
        # Create the UI
        self.create_menu()
        self.create_frames()
        self.create_widgets()
        
        # Try to load the last used queue file
        last_queue = self.config_manager.get("paths.last_queue_file")
        if last_queue and os.path.exists(last_queue):
            self._load_queue_from_path(last_queue)
        
        # Load last photo directory
        self.photo_directory = self.config_manager.get("paths.last_photo_dir", os.path.expanduser("~"))
        
    def create_menu(self):
        """Create the application menu."""
        menubar = tk.Menu(self.root)
        
        # File menu
        file_menu = tk.Menu(menubar, tearoff=0)
        file_menu.add_command(label="New Queue", command=self.new_queue)
        file_menu.add_command(label="Load Queue", command=self.load_queue)
        file_menu.add_command(label="Save Queue", command=self.save_queue)
        file_menu.add_command(label="Save Queue As...", command=self.save_queue_as)
        file_menu.add_separator()
        file_menu.add_command(label="Exit", command=self.root.quit)
        menubar.add_cascade(label="File", menu=file_menu)
        
        # Edit menu
        edit_menu = tk.Menu(menubar, tearoff=0)
        edit_menu.add_command(label="Add New Item", command=self.add_new_item)
        edit_menu.add_command(label="Delete Current Item", command=self.delete_current_item)
        edit_menu.add_separator()
        edit_menu.add_command(label="Add Photos to Item", command=self.add_photos)
        edit_menu.add_command(label="Remove Selected Photo", command=self.remove_selected_photo)
        menubar.add_cascade(label="Edit", menu=edit_menu)
        
        # Tools menu
        tools_menu = tk.Menu(menubar, tearoff=0)
        tools_menu.add_command(label="Validate All Items", command=self.validate_all_items)
        tools_menu.add_command(label="Export to CSV", command=self.export_to_csv)
        tools_menu.add_separator()
        
        # Add launch options for other tools
        tools_menu.add_command(label="Launch Processor", command=self.launch_processor)
        tools_menu.add_command(label="Launch Viewer", command=self.launch_viewer)
        tools_menu.add_command(label="Launch Price Analyzer", command=self.launch_price_analyzer)
        tools_menu.add_command(label="Launch Gallery Creator", command=self.launch_gallery)
        tools_menu.add_separator()
        tools_menu.add_command(label="Launch CSV Export", command=self.launch_csv_export)
        tools_menu.add_command(label="Launch Mobile Import", command=lambda: ToolLauncher.launch_mobile_import())
        tools_menu.add_command(label="Launch Direct Listing", command=lambda: ToolLauncher.launch_direct_listing())
        
        menubar.add_cascade(label="Tools", menu=tools_menu)
        
        # Help menu with version info
        create_help_menu(
            menubar, 
            self.root, 
            "eBay Work Queue Setup",
            "Create and manage work queues for eBay listing automation",
            SETUP_FEATURES
        )
        
        self.root.config(menu=menubar)

    def create_frames(self):
        """Create the main UI frames."""
        # Main container with left (navigation) and right (details) panes
        self.main_container = ttk.PanedWindow(self.root, orient=tk.HORIZONTAL)
        self.main_container.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Left frame for item list and navigation
        self.left_frame = ttk.Frame(self.main_container, width=300)
        self.main_container.add(self.left_frame, weight=1)
        
        # Right frame for item details
        self.right_frame = ttk.Frame(self.main_container)
        self.main_container.add(self.right_frame, weight=3)
        
        # Within right frame, create a top frame for item details and bottom frame for photos
        self.right_top_frame = ttk.Frame(self.right_frame)
        self.right_top_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        self.right_bottom_frame = ttk.LabelFrame(self.right_frame, text="Photos")
        self.right_bottom_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Status bar at the bottom
        self.status_bar = StatusBar(self.root, "Ready")

    def create_widgets(self):
        """Create the UI widgets."""
        # Left frame widgets - Item list
        self.create_item_list_widgets()
        
        # Right frame widgets - Item details
        self.create_item_details_widgets()
        
        # Photo display widgets
        self.create_photo_widgets()

    def create_item_list_widgets(self):
        """Create widgets for the item list in the left frame."""
        # Search and filter
        filter_frame = ttk.Frame(self.left_frame)
        filter_frame.pack(fill=tk.X, padx=5, pady=5)
        
        ttk.Label(filter_frame, text="Filter:").pack(side=tk.LEFT)
        self.filter_var = tk.StringVar()
        self.filter_entry = ttk.Entry(filter_frame, textvariable=self.filter_var)
        self.filter_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=5)
        self.filter_entry.bind("<KeyRelease>", self.apply_filter)
        
        # Item list with scrollbar
        list_frame = ttk.Frame(self.left_frame)
        list_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        self.item_listbox = tk.Listbox(list_frame, selectmode=tk.SINGLE, exportselection=0)
        self.item_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self.item_listbox.bind("<<ListboxSelect>>", self.on_item_select)
        
        scrollbar = ttk.Scrollbar(list_frame, orient=tk.VERTICAL, command=self.item_listbox.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.item_listbox.config(yscrollcommand=scrollbar.set)
        
        # Navigation buttons
        nav_frame = ttk.Frame(self.left_frame)
        nav_frame.pack(fill=tk.X, padx=5, pady=5)
        
        self.add_btn = ttk.Button(nav_frame, text="Add Item", command=self.add_new_item)
        self.add_btn.pack(side=tk.LEFT, padx=2)
        
        self.delete_btn = ttk.Button(nav_frame, text="Delete", command=self.delete_current_item)
        self.delete_btn.pack(side=tk.LEFT, padx=2)
        
        self.prev_btn = ttk.Button(nav_frame, text="← Prev", command=self.prev_item)
        self.prev_btn.pack(side=tk.LEFT, padx=2)
        
        self.next_btn = ttk.Button(nav_frame, text="Next →", command=self.next_item)
        self.next_btn.pack(side=tk.LEFT, padx=2)
        
        # Item count label
        self.count_label = ttk.Label(self.left_frame, text="0 items in queue")
        self.count_label.pack(pady=5)

    def create_item_details_widgets(self):
        """Create widgets for item details in the right frame."""
        # Create a notebook with tabs for different sections
        self.notebook = ttk.Notebook(self.right_top_frame)
        self.notebook.pack(fill=tk.BOTH, expand=True)
        
        # Basic information tab
        self.basic_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.basic_frame, text="Basic Info")
        
        # Item specifics tab
        self.specifics_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.specifics_frame, text="Item Specifics")
        
        # Description tab
        self.description_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.description_frame, text="Description")
        
        # Create basic info fields
        basic_inner = ttk.Frame(self.basic_frame)
        basic_inner.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # SKU field
        ttk.Label(basic_inner, text="SKU:").grid(row=0, column=0, sticky=tk.W, pady=2)
        self.sku_var = tk.StringVar()
        ttk.Entry(basic_inner, textvariable=self.sku_var).grid(row=0, column=1, sticky=tk.EW, pady=2)
        
        # Title field
        ttk.Label(basic_inner, text="Title:").grid(row=1, column=0, sticky=tk.W, pady=2)
        self.title_var = tk.StringVar()
        ttk.Entry(basic_inner, textvariable=self.title_var).grid(row=1, column=1, sticky=tk.EW, pady=2)
        
        # Temporary title field
        ttk.Label(basic_inner, text="Temp Title:").grid(row=2, column=0, sticky=tk.W, pady=2)
        self.temp_title_var = tk.StringVar()
        ttk.Entry(basic_inner, textvariable=self.temp_title_var).grid(row=2, column=1, sticky=tk.EW, pady=2)
        
        # Category field
        ttk.Label(basic_inner, text="Category:").grid(row=3, column=0, sticky=tk.W, pady=2)
        self.category_var = tk.StringVar()
        ttk.Entry(basic_inner, textvariable=self.category_var).grid(row=3, column=1, sticky=tk.EW, pady=2)
        
        # Condition dropdown
        ttk.Label(basic_inner, text="Condition:").grid(row=4, column=0, sticky=tk.W, pady=2)
        self.condition_var = tk.StringVar()
        condition_combobox = ttk.Combobox(basic_inner, textvariable=self.condition_var)
        condition_combobox.grid(row=4, column=1, sticky=tk.EW, pady=2)
        condition_combobox['values'] = list(EbayItemSchema.CONDITION_MAP.values())
        condition_combobox.bind("<<ComboboxSelected>>", self.on_condition_select)
        
        # Condition description field
        ttk.Label(basic_inner, text="Condition Description:").grid(row=5, column=0, sticky=tk.W, pady=2)
        self.condition_desc_var = tk.StringVar()
        ttk.Entry(basic_inner, textvariable=self.condition_desc_var).grid(row=5, column=1, sticky=tk.EW, pady=2)
        
        # Price field
        ttk.Label(basic_inner, text="Price:").grid(row=6, column=0, sticky=tk.W, pady=2)
        self.price_var = tk.StringVar()
        ttk.Entry(basic_inner, textvariable=self.price_var).grid(row=6, column=1, sticky=tk.EW, pady=2)
        
        # Quantity field
        ttk.Label(basic_inner, text="Quantity:").grid(row=7, column=0, sticky=tk.W, pady=2)
        self.quantity_var = tk.StringVar(value="1")
        ttk.Entry(basic_inner, textvariable=self.quantity_var).grid(row=7, column=1, sticky=tk.EW, pady=2)
        
        # Format dropdown
        ttk.Label(basic_inner, text="Format:").grid(row=8, column=0, sticky=tk.W, pady=2)
        self.format_var = tk.StringVar(value="FixedPrice")
        format_combobox = ttk.Combobox(basic_inner, textvariable=self.format_var)
        format_combobox.grid(row=8, column=1, sticky=tk.EW, pady=2)
        format_combobox['values'] = ["FixedPrice", "Auction"]
        
        # Duration dropdown
        ttk.Label(basic_inner, text="Duration:").grid(row=9, column=0, sticky=tk.W, pady=2)
        self.duration_var = tk.StringVar(value="GTC")
        duration_combobox = ttk.Combobox(basic_inner, textvariable=self.duration_var)
        duration_combobox.grid(row=9, column=1, sticky=tk.EW, pady=2)
        duration_combobox['values'] = ["GTC", "Days_3", "Days_5", "Days_7", "Days_10", "Days_30"]
        
        # Set weight for column 1 to expand
        basic_inner.columnconfigure(1, weight=1)
        
        # Create save button at the bottom
        save_frame = ttk.Frame(basic_inner)
        save_frame.grid(row=10, column=0, columnspan=2, sticky=tk.EW, pady=10)
        
        self.save_item_btn = ttk.Button(save_frame, text="Save Item", command=self.save_current_item)
        self.save_item_btn.pack(side=tk.RIGHT)
        
        # Create item specifics widgets
        specifics_inner = ttk.Frame(self.specifics_frame)
        specifics_inner.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Item specifics treeview
        spec_frame = ttk.Frame(specifics_inner)
        spec_frame.pack(fill=tk.BOTH, expand=True)
        
        self.specifics_tree = ttk.Treeview(spec_frame, columns=('Name', 'Value'), show='headings')
        self.specifics_tree.heading('Name', text='Name')
        self.specifics_tree.heading('Value', text='Value')
        self.specifics_tree.column('Name', width=150)
        self.specifics_tree.column('Value', width=350)
        self.specifics_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        tree_scrollbar = ttk.Scrollbar(spec_frame, orient=tk.VERTICAL, command=self.specifics_tree.yview)
        tree_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.specifics_tree.config(yscrollcommand=tree_scrollbar.set)
        
        # Add/edit/remove specifics buttons
        btn_frame = ttk.Frame(specifics_inner)
        btn_frame.pack(fill=tk.X, pady=5)
        
        self.add_spec_btn = ttk.Button(btn_frame, text="Add Specific", command=self.add_item_specific)
        self.add_spec_btn.pack(side=tk.LEFT, padx=2)
        
        self.edit_spec_btn = ttk.Button(btn_frame, text="Edit Specific", command=self.edit_item_specific)
        self.edit_spec_btn.pack(side=tk.LEFT, padx=2)
        
        self.remove_spec_btn = ttk.Button(btn_frame, text="Remove Specific", command=self.remove_item_specific)
        self.remove_spec_btn.pack(side=tk.LEFT, padx=2)
        
        # Create description widgets
        desc_inner = ttk.Frame(self.description_frame)
        desc_inner.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        ttk.Label(desc_inner, text="Description:").pack(anchor=tk.W)
        
        desc_frame = ttk.Frame(desc_inner)
        desc_frame.pack(fill=tk.BOTH, expand=True, pady=5)
        
        self.description_text = tk.Text(desc_frame, wrap=tk.WORD, height=15)
        self.description_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        desc_scrollbar = ttk.Scrollbar(desc_frame, orient=tk.VERTICAL, command=self.description_text.yview)
        desc_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.description_text.config(yscrollcommand=desc_scrollbar.set)

    def create_photo_widgets(self):
        """Create widgets for photo display and management."""
        # Photo frame with scrollable canvas
        self.photo_canvas = tk.Canvas(self.right_bottom_frame)
        self.photo_canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        # Scrollbar for photos
        photo_scrollbar = ttk.Scrollbar(self.right_bottom_frame, orient=tk.HORIZONTAL, command=self.photo_canvas.xview)
        photo_scrollbar.pack(side=tk.BOTTOM, fill=tk.X)
        self.photo_canvas.configure(xscrollcommand=photo_scrollbar.set)
        
        # Frame within canvas to hold photos
        self.photo_frame = ttk.Frame(self.photo_canvas)
        self.photo_canvas_window = self.photo_canvas.create_window((0, 0), window=self.photo_frame, anchor=tk.NW)
        
        # Bind configure event to resize the canvas window
        self.photo_frame.bind("<Configure>", self.on_photo_frame_configure)
        self.photo_canvas.bind("<Configure>", self.on_photo_canvas_configure)
        
        # Photo control buttons
        photo_btn_frame = ttk.Frame(self.right_bottom_frame)
        photo_btn_frame.pack(side=tk.TOP, fill=tk.X, padx=5, pady=5)
        
        self.add_photos_btn = ttk.Button(photo_btn_frame, text="Add Photos", command=self.add_photos)
        self.add_photos_btn.pack(side=tk.LEFT, padx=2)
        
        self.remove_photo_btn = ttk.Button(photo_btn_frame, text="Remove Selected", command=self.remove_selected_photo)
        self.remove_photo_btn.pack(side=tk.LEFT, padx=2)

    def on_photo_frame_configure(self, event):
        """Handle photo frame resize to update scrollregion."""
        self.photo_canvas.configure(scrollregion=self.photo_canvas.bbox("all"))

    def on_photo_canvas_configure(self, event):
        """Handle canvas resize to update the inner frame width."""
        # Update the width of the inner frame to match the canvas
        self.photo_canvas.itemconfig(self.photo_canvas_window, width=event.width)

    def toggle_process_photo(self, idx, var):
        """Toggle whether a photo should be processed."""
        if self.current_item_index < 0 or self.current_item_index >= len(self.work_queue):
            return
            
        item = self.work_queue[self.current_item_index]
        
        # Create process_photos list if it doesn't exist
        if "process_photos" not in item:
            item["process_photos"] = []
        
        # Get current state
        checked = var.get()
        
        # Add or remove the photo index from the process list
        if checked and idx not in item["process_photos"]:
            item["process_photos"].append(idx)
        elif not checked and idx in item["process_photos"]:
            item["process_photos"].remove(idx)
        
        # Auto-save if we have a queue file
        if self.queue_file_path:
            try:
                save_queue(self.work_queue, self.queue_file_path)
                self.status_bar.update(f"Updated processing selection")
            except Exception as e:
                self.status_bar.update(f"Error saving queue: {str(e)}", logging.ERROR)

    def update_item_listbox(self):
        """Update the item listbox with current queue items."""
        self.item_listbox.delete(0, tk.END)
        
        for item in self.work_queue:
            # Display title or temp_title
            display_title = item.get("title", "") or item.get("temp_title", "Untitled Item")
            sku = item.get("sku", "")
            display_text = f"{sku}: {display_title}" if sku else display_title
            
            self.item_listbox.insert(tk.END, display_text)
        
        # Update count label
        self.count_label.config(text=f"{len(self.work_queue)} items in queue")
        
        # Update navigation buttons
        self.update_navigation_buttons()

    def apply_filter(self, event=None):
        """Filter items based on the filter text."""
        filter_text = self.filter_var.get().lower()
        
        self.item_listbox.delete(0, tk.END)
        
        for item in self.work_queue:
            # Get display text elements
            title = item.get("title", "").lower()
            temp_title = item.get("temp_title", "").lower() 
            sku = item.get("sku", "").lower()
            
            # Check if filter matches any field
            if (filter_text in title or 
                filter_text in temp_title or 
                filter_text in sku):
                # Display title or temp_title
                display_title = item.get("title", "") or item.get("temp_title", "Untitled Item")
                display_text = f"{sku}: {display_title}" if sku else display_title
                
                self.item_listbox.insert(tk.END, display_text)

    def on_item_select(self, event):
        """Handle item selection in listbox."""
        selection = self.item_listbox.curselection()
        if selection:
            index = selection[0]
            self.current_item_index = index
            self.display_current_item()
            self.update_navigation_buttons()

    def display_current_item(self):
        """Display the current item's details in the UI."""
        if self.current_item_index < 0 or self.current_item_index >= len(self.work_queue):
            # Clear fields
            self.clear_item_fields()
            return
        
        # Get the current item
        item = self.work_queue[self.current_item_index]
        
        # Update basic info fields
        self.sku_var.set(item.get("sku", ""))
        self.title_var.set(item.get("title", ""))
        self.temp_title_var.set(item.get("temp_title", ""))
        self.category_var.set(item.get("category", ""))
        
        # Set condition
        condition_code = item.get("condition", "1000")
        condition_text = EbayItemSchema.CONDITION_MAP.get(condition_code, condition_code)
        self.condition_var.set(condition_text)
        
        self.condition_desc_var.set(item.get("conditionDescription", ""))
        self.price_var.set(item.get("price", ""))
        self.quantity_var.set(item.get("quantity", "1"))
        self.format_var.set(item.get("format", "FixedPrice"))
        self.duration_var.set(item.get("duration", "GTC"))
        
        # Update item specifics
        self.update_item_specifics_tree(item)
        
        # Update description
        self.description_text.delete(1.0, tk.END)
        if "description" in item:
            self.description_text.insert(tk.END, item["description"])
        
        # Display photos
        self.display_photos(item)

    def clear_item_fields(self):
        """Clear all item fields."""
        # Clear basic info fields
        self.sku_var.set("")
        self.title_var.set("")
        self.temp_title_var.set("")
        self.category_var.set("")
        self.condition_var.set("")
        self.condition_desc_var.set("")
        self.price_var.set("")
        self.quantity_var.set("1")
        self.format_var.set("FixedPrice")
        self.duration_var.set("GTC")
        
        # Clear item specifics
        for i in self.specifics_tree.get_children():
            self.specifics_tree.delete(i)
        
        # Clear description
        self.description_text.delete(1.0, tk.END)
        
        # Clear photos
        for widget in self.photo_frame.winfo_children():
            widget.destroy()
        
        self.current_photos = []
        self.current_photo_images = []

    def update_item_specifics_tree(self, item):
        """Update the item specifics treeview with data from the item."""
        # Clear existing entries
        for i in self.specifics_tree.get_children():
            self.specifics_tree.delete(i)
        
        # Get item specifics
        item_specifics = item.get("item_specifics", {})
        
        # Add each item specific to the tree
        for name, value in item_specifics.items():
            self.specifics_tree.insert('', 'end', values=(name, value))

    def display_photos(self, item):
        """Display photos for the current item."""
        # Clear existing photos
        for widget in self.photo_frame.winfo_children():
            widget.destroy()
        
        # Clear photo references
        self.current_photos = []
        self.current_photo_images = []
        
        # Get photos from item
        photos = item.get("photos", [])
        
        if not photos:
            # Show empty message
            ttk.Label(self.photo_frame, text="No photos available").pack(padx=20, pady=20)
            return
        
        # Display each photo
        for i, photo in enumerate(photos):
            try:
                photo_path = photo.get("path", "")
                if not photo_path or not os.path.exists(photo_path):
                    continue
                
                # Create a frame for this photo
                photo_container = ttk.Frame(self.photo_frame)
                photo_container.pack(side=tk.LEFT, padx=5, pady=5)
                
                # Load and create thumbnail
                image = open_image_with_orientation(photo_path)
                thumbnail = create_thumbnail(image, (150, 150))
                photo_image = create_photo_image(thumbnail)
                
                # Store references to prevent garbage collection
                self.current_photos.append(photo)
                self.current_photo_images.append(photo_image)
                
                # Display photo
                photo_label = ttk.Label(photo_container, image=photo_image)
                photo_label.pack()
                
                # Add photo index label
                ttk.Label(photo_container, text=f"Photo {i+1}").pack()
                
                # Add select checkbox
                proc_var = tk.BooleanVar(value=i in item.get("process_photos", []))
                ttk.Checkbutton(photo_container, text="Process", variable=proc_var, 
                               command=lambda idx=i, var=proc_var: self.toggle_process_photo(idx, var)).pack()
                
                # Add context field
                context_frame = ttk.Frame(photo_container)
                context_frame.pack(fill=tk.X, pady=2)
                
                ttk.Label(context_frame, text="Context:").pack(anchor=tk.W)
                context_var = tk.StringVar(value=photo.get("context", ""))
                context_entry = ttk.Entry(context_frame, textvariable=context_var, width=20)
                context_entry.pack(fill=tk.X)
                
                # Bind context entry to update function
                context_entry.bind("<FocusOut>", 
                                   lambda e, idx=i, var=context_var: self.update_photo_context(idx, var.get()))
                context_entry.bind("<Return>", 
                                   lambda e, idx=i, var=context_var: self.update_photo_context(idx, var.get()))
                
            except Exception as e:
                logger.error(f"Error displaying photo {i}: {str(e)}")
                # Skip this photo and continue with the next one

    def update_photo_context(self, photo_idx, context):
        """Update the context for a photo."""
        if self.current_item_index < 0 or self.current_item_index >= len(self.work_queue):
            return
            
        item = self.work_queue[self.current_item_index]
        photos = item.get("photos", [])
        
        if photo_idx < 0 or photo_idx >= len(photos):
            return
            
        # Update the context
        photos[photo_idx]["context"] = context
        
        # Auto-save if we have a queue file
        if self.queue_file_path:
            try:
                save_queue(self.work_queue, self.queue_file_path)
                self.status_bar.update(f"Updated photo context")
            except Exception as e:
                self.status_bar.update(f"Error saving queue: {str(e)}", logging.ERROR)

    def update_navigation_buttons(self):
        """Update the enabled/disabled state of navigation buttons."""
        # Default state: disabled
        self.prev_btn.config(state=tk.DISABLED)
        self.next_btn.config(state=tk.DISABLED)
        self.delete_btn.config(state=tk.DISABLED)
        
        # Enable buttons based on current position
        if self.current_item_index > 0:
            self.prev_btn.config(state=tk.NORMAL)
        
        if self.current_item_index >= 0 and self.current_item_index < len(self.work_queue) - 1:
            self.next_btn.config(state=tk.NORMAL)
        
        if self.current_item_index >= 0 and self.current_item_index < len(self.work_queue):
            self.delete_btn.config(state=tk.NORMAL)

    def prev_item(self):
        """Navigate to the previous item."""
        if self.current_item_index <= 0:
            return
        
        # Save current item before navigating
        if self.current_item_index >= 0:
            self.save_current_item()
            
        self.current_item_index -= 1
        self.display_current_item()
        self.update_navigation_buttons()
        
        # Update selection in listbox
        self.item_listbox.selection_clear(0, tk.END)
        self.item_listbox.selection_set(self.current_item_index)
        self.item_listbox.see(self.current_item_index)

    def next_item(self):
        """Navigate to the next item."""
        if self.current_item_index >= len(self.work_queue) - 1:
            return
        
        # Save current item before navigating
        if self.current_item_index >= 0:
            self.save_current_item()
            
        self.current_item_index += 1
        self.display_current_item()
        self.update_navigation_buttons()
        
        # Update selection in listbox
        self.item_listbox.selection_clear(0, tk.END)
        self.item_listbox.selection_set(self.current_item_index)
        self.item_listbox.see(self.current_item_index)

    def save_current_item(self):
        """Save the current item data from UI to the queue."""
        if self.current_item_index < 0 or self.current_item_index >= len(self.work_queue):
            return
        
        item = self.work_queue[self.current_item_index]
        
        # Update basic info fields
        item["sku"] = self.sku_var.get()
        item["title"] = self.title_var.get()
        item["temp_title"] = self.temp_title_var.get()
        item["category"] = self.category_var.get()
        
        # Get condition code from condition text
        condition_text = self.condition_var.get()
        condition_code = None
        for code, text in EbayItemSchema.CONDITION_MAP.items():
            if text == condition_text:
                condition_code = code
                break
        
        if condition_code:
            item["condition"] = condition_code
            
        item["conditionDescription"] = self.condition_desc_var.get()
        item["price"] = self.price_var.get()
        item["quantity"] = self.quantity_var.get()
        item["format"] = self.format_var.get()
        item["duration"] = self.duration_var.get()
        
        # Update item specifics from tree
        item_specifics = {}
        for spec_id in self.specifics_tree.get_children():
            name, value = self.specifics_tree.item(spec_id, "values")
            item_specifics[name] = value
            
        item["item_specifics"] = item_specifics
        
        # Update description
        item["description"] = self.description_text.get(1.0, tk.END).strip()
        
        # Save the queue
        if self.queue_file_path:
            try:
                save_queue(self.work_queue, self.queue_file_path)
                self.status_bar.update(f"Saved item {self.current_item_index + 1}")
            except Exception as e:
                self.status_bar.update(f"Error saving queue: {str(e)}", logging.ERROR)
        else:
            self.save_queue_as()
        
        # Update the listbox in case title or SKU changed
        self.update_item_listbox()

    def new_queue(self):
        """Create a new empty queue."""
        # Ask to save current queue if modified
        if self.work_queue:
            if messagebox.askyesno("Confirm", "Do you want to save the current queue first?"):
                self.save_queue()
        
        # Clear everything
        self.work_queue = []
        self.current_item_index = -1
        self.queue_file_path = None
        
        # Update UI
        self.update_item_listbox()
        self.clear_item_fields()
        self.status_bar.update("New queue created")

    def load_queue(self):
        """Load a queue from a file."""
        # Ask to save current queue if modified
        if self.work_queue:
            if messagebox.askyesno("Confirm", "Do you want to save the current queue first?"):
                self.save_queue()
        
        # Show file dialog
        file_path = filedialog.askopenfilename(
            title="Load Queue",
            filetypes=[("JSON Files", "*.json"), ("All Files", "*.*")],
            initialdir=os.path.dirname(self.queue_file_path) if self.queue_file_path else None
        )
        
        if file_path:
            self._load_queue_from_path(file_path)

    def _load_queue_from_path(self, file_path):
        """Load a queue from the specified path."""
        try:
            # Load and validate the queue
            queue_data = load_queue(file_path)
            
            # Update app state
            self.work_queue = queue_data
            self.queue_file_path = file_path
            self.current_item_index = 0 if queue_data else -1
            
            # Update config
            self.config_manager.set("paths.last_queue_file", file_path)
            self.config_manager.save()
            
            # Update UI
            self.update_item_listbox()
            if self.current_item_index >= 0:
                self.display_current_item()
                
                # Select the first item in the listbox
                self.item_listbox.selection_clear(0, tk.END)
                self.item_listbox.selection_set(0)
            else:
                self.clear_item_fields()
            
            # Log success
            self.status_bar.update(f"Loaded {len(queue_data)} items from {os.path.basename(file_path)}")
            
        except Exception as e:
            logger.error(f"Error loading queue from {file_path}: {str(e)}")
            messagebox.showerror("Error", f"Failed to load queue: {str(e)}")

    def save_queue(self):
        """Save the queue to the current file or prompt for a new file name."""
        if not self.queue_file_path:
            return self.save_queue_as()
        
        try:
            # Save the queue to the current file
            save_queue(self.work_queue, self.queue_file_path)
            
            # Log success
            self.status_bar.update(f"Saved {len(self.work_queue)} items to {os.path.basename(self.queue_file_path)}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving queue to {self.queue_file_path}: {str(e)}")
            messagebox.showerror("Error", f"Failed to save queue: {str(e)}")
            return False

    def save_queue_as(self):
        """Prompt for a file name and save the queue."""
        if not self.work_queue:
            messagebox.showinfo("Info", "Queue is empty. Nothing to save.")
            return False
        
        # Show file dialog
        file_path = filedialog.asksaveasfilename(
            title="Save Queue As",
            defaultextension=".json",
            filetypes=[("JSON Files", "*.json"), ("All Files", "*.*")],
            initialdir=os.path.dirname(self.queue_file_path) if self.queue_file_path else None
        )
        
        if not file_path:
            return False
        
        # Update the file path and save
        self.queue_file_path = file_path
        
        # Update config
        self.config_manager.set("paths.last_queue_file", file_path)
        self.config_manager.save()
        
        return self.save_queue()

    def add_new_item(self):
        """Add a new empty item to the queue."""
        # Create a new item
        new_item = EbayItemSchema.create_empty_item()
        
        # Add it to the queue
        self.work_queue.append(new_item)
        
        # Update UI
        self.update_item_listbox()
        
        # Select the new item
        self.current_item_index = len(self.work_queue) - 1
        self.display_current_item()
        
        # Select in listbox
        self.item_listbox.selection_clear(0, tk.END)
        self.item_listbox.selection_set(self.current_item_index)
        self.item_listbox.see(self.current_item_index)
        
        # Update status
        self.status_bar.update("Added new item")
        
        # Auto-save if we have a queue file
        if self.queue_file_path:
            self.save_queue()

    def delete_current_item(self):
        """Delete the current item from the queue."""
        if self.current_item_index < 0 or self.current_item_index >= len(self.work_queue):
            return
        
        # Confirm deletion
        if not messagebox.askyesno("Confirm", "Are you sure you want to delete the current item?"):
            return
        
        # Remove the item
        del self.work_queue[self.current_item_index]
        
        # Update current index
        if self.current_item_index >= len(self.work_queue):
            self.current_item_index = len(self.work_queue) - 1
        
        # Update UI
        self.update_item_listbox()
        
        if self.current_item_index >= 0:
            self.display_current_item()
            
            # Select in listbox
            self.item_listbox.selection_clear(0, tk.END)
            self.item_listbox.selection_set(self.current_item_index)
            self.item_listbox.see(self.current_item_index)
        else:
            self.clear_item_fields()
        
        # Update status
        self.status_bar.update("Deleted item")
        
        # Auto-save if we have a queue file
        if self.queue_file_path:
            self.save_queue()

    def add_photos(self):
        """Add photos to the current item."""
        if self.current_item_index < 0 or self.current_item_index >= len(self.work_queue):
            messagebox.showinfo("Info", "No item selected")
            return
        
        # Show file dialog
        file_paths = filedialog.askopenfilenames(
            title="Select Photos",
            filetypes=[
                ("Image Files", "*.jpg *.jpeg *.png *.gif *.bmp *.tiff *.tif"),
                ("All Files", "*.*")
            ],
            initialdir=self.photo_directory
        )
        
        if not file_paths:
            return
        
        # Update the photo directory
        if file_paths:
            self.photo_directory = os.path.dirname(file_paths[0])
            self.config_manager.set("paths.last_photo_dir", self.photo_directory)
            self.config_manager.save()
        
        # Get current item
        item = self.work_queue[self.current_item_index]
        
        # Initialize photos list if it doesn't exist
        if "photos" not in item:
            item["photos"] = []
        
        # Add each photo
        added_count = 0
        for path in file_paths:
            try:
                # Check if this photo path already exists in the item
                duplicate = False
                for photo in item["photos"]:
                    if photo.get("path") == path:
                        duplicate = True
                        break
                
                if duplicate:
                    continue
                
                # Create a photo object
                photo = {
                    "path": path,
                    "added_at": datetime.now().isoformat(),
                    "context": ""
                }
                
                # Add to the item
                item["photos"].append(photo)
                added_count += 1
                
            except Exception as e:
                logger.error(f"Error adding photo {path}: {str(e)}")
                messagebox.showerror("Error", f"Failed to add photo {os.path.basename(path)}: {str(e)}")
        
        # Update UI
        self.display_photos(item)
        
        # Update status
        self.status_bar.update(f"Added {added_count} photos")
        
        # Auto-save if we have a queue file
        if self.queue_file_path:
            self.save_queue()

    def remove_selected_photo(self):
        """Remove the selected photo from the current item."""
        # This function would need a way to know which photo is selected
        # For simplicity, we'll show a dialog to input the photo index
        if self.current_item_index < 0 or self.current_item_index >= len(self.work_queue):
            messagebox.showinfo("Info", "No item selected")
            return
        
        item = self.work_queue[self.current_item_index]
        photos = item.get("photos", [])
        
        if not photos:
            messagebox.showinfo("Info", "No photos to remove")
            return
        
        # Ask for the photo index
        dialog = tk.Toplevel(self.root)
        dialog.title("Remove Photo")
        dialog.transient(self.root)
        dialog.grab_set()
        
        ttk.Label(dialog, text="Enter the photo number to remove:").pack(padx=20, pady=10)
        
        photo_var = tk.StringVar()
        entry = ttk.Entry(dialog, textvariable=photo_var)
        entry.pack(padx=20, pady=10)
        entry.focus_set()
        
        def do_remove():
            try:
                idx = int(photo_var.get()) - 1  # Convert to 0-based index
                
                if idx < 0 or idx >= len(photos):
                    messagebox.showerror("Error", f"Invalid photo number. Must be between 1 and {len(photos)}", parent=dialog)
                    return
                
                # Remove from process_photos list if present
                if "process_photos" in item:
                    # Update indices in process_photos list
                    new_process_photos = []
                    for proc_idx in item["process_photos"]:
                        if proc_idx < idx:
                            new_process_photos.append(proc_idx)
                        elif proc_idx > idx:
                            new_process_photos.append(proc_idx - 1)
                    
                    item["process_photos"] = new_process_photos
                
                # Remove the photo
                del photos[idx]
                
                # Update UI
                self.display_photos(item)
                
                # Update status
                self.status_bar.update(f"Removed photo {idx + 1}")
                
                # Auto-save if we have a queue file
                if self.queue_file_path:
                    self.save_queue()
                
                # Close the dialog
                dialog.destroy()
                
            except ValueError:
                messagebox.showerror("Error", "Please enter a valid number", parent=dialog)
        
        # Add buttons
        button_frame = ttk.Frame(dialog)
        button_frame.pack(fill=tk.X, padx=20, pady=10)
        
        ttk.Button(button_frame, text="Remove", command=do_remove).pack(side=tk.RIGHT, padx=5)
        ttk.Button(button_frame, text="Cancel", command=dialog.destroy).pack(side=tk.RIGHT, padx=5)
        
        # Center the dialog
        dialog.update_idletasks()
        width = dialog.winfo_width()
        height = dialog.winfo_height()
        x = (dialog.winfo_screenwidth() // 2) - (width // 2)
        y = (dialog.winfo_screenheight() // 2) - (height // 2)
        dialog.geometry(f'{width}x{height}+{x}+{y}')

    def on_condition_select(self, event):
        """Handle condition selection from dropdown."""
        condition_text = self.condition_var.get()
        
        # Find corresponding condition code
        condition_code = None
        for code, text in EbayItemSchema.CONDITION_MAP.items():
            if text == condition_text:
                condition_code = code
                break
        
        # If condition is "Used" or similar, focus on condition description field
        if condition_code in ["3000", "4000", "5000", "6000", "7000"]:
            condition_entry = event.widget.master.children.get(".!entry5")  # This is a bit of a hack to get the condition description entry
            if condition_entry:
                condition_entry.focus_set()

    def add_item_specific(self):
        """Add a new item specific."""
        # Show dialog
        dialog = tk.Toplevel(self.root)
        dialog.title("Add Item Specific")
        dialog.transient(self.root)
        dialog.grab_set()
        
        ttk.Label(dialog, text="Name:").grid(row=0, column=0, padx=10, pady=10, sticky=tk.W)
        name_var = tk.StringVar()
        ttk.Entry(dialog, textvariable=name_var, width=30).grid(row=0, column=1, padx=10, pady=10, sticky=tk.W)
        
        ttk.Label(dialog, text="Value:").grid(row=1, column=0, padx=10, pady=10, sticky=tk.W)
        value_var = tk.StringVar()
        ttk.Entry(dialog, textvariable=value_var, width=30).grid(row=1, column=1, padx=10, pady=10, sticky=tk.W)
        
        def do_add():
            name = name_var.get().strip()
            value = value_var.get().strip()
            
            if not name:
                messagebox.showerror("Error", "Name is required", parent=dialog)
                return
            
            if not value:
                messagebox.showerror("Error", "Value is required", parent=dialog)
                return
            
            # Add to treeview
            self.specifics_tree.insert("", "end", values=(name, value))
            
            # Close dialog
            dialog.destroy()
            
            # Update item (this will be properly saved when the item is saved)
            if self.current_item_index >= 0 and self.current_item_index < len(self.work_queue):
                item = self.work_queue[self.current_item_index]
                if "item_specifics" not in item:
                    item["item_specifics"] = {}
                    
                item["item_specifics"][name] = value
        
        # Add buttons
        button_frame = ttk.Frame(dialog)
        button_frame.grid(row=2, column=0, columnspan=2, padx=10, pady=10)
        
        ttk.Button(button_frame, text="Add", command=do_add).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="Cancel", command=dialog.destroy).pack(side=tk.LEFT, padx=5)
        
        # Center the dialog
        dialog.update_idletasks()
        width = dialog.winfo_width()
        height = dialog.winfo_height()
        x = (dialog.winfo_screenwidth() // 2) - (width // 2)
        y = (dialog.winfo_screenheight() // 2) - (height // 2)
        dialog.geometry(f'{width}x{height}+{x}+{y}')

    def edit_item_specific(self):
        """Edit the selected item specific."""
        selected = self.specifics_tree.selection()
        if not selected:
            messagebox.showinfo("Info", "No item specific selected")
            return
        
        # Get current values
        name, value = self.specifics_tree.item(selected, "values")
        
        # Show dialog
        dialog = tk.Toplevel(self.root)
        dialog.title("Edit Item Specific")
        dialog.transient(self.root)
        dialog.grab_set()
        
        ttk.Label(dialog, text="Name:").grid(row=0, column=0, padx=10, pady=10, sticky=tk.W)
        name_var = tk.StringVar(value=name)
        ttk.Entry(dialog, textvariable=name_var, width=30).grid(row=0, column=1, padx=10, pady=10, sticky=tk.W)
        
        ttk.Label(dialog, text="Value:").grid(row=1, column=0, padx=10, pady=10, sticky=tk.W)
        value_var = tk.StringVar(value=value)
        ttk.Entry(dialog, textvariable=value_var, width=30).grid(row=1, column=1, padx=10, pady=10, sticky=tk.W)
        
        def do_update():
            new_name = name_var.get().strip()
            new_value = value_var.get().strip()
            
            if not new_name:
                messagebox.showerror("Error", "Name is required", parent=dialog)
                return
            
            if not new_value:
                messagebox.showerror("Error", "Value is required", parent=dialog)
                return
            
            # Update treeview
            self.specifics_tree.item(selected, values=(new_name, new_value))
            
            # Close dialog
            dialog.destroy()
            
            # Update item (this will be properly saved when the item is saved)
            if self.current_item_index >= 0 and self.current_item_index < len(self.work_queue):
                item = self.work_queue[self.current_item_index]
                if "item_specifics" not in item:
                    item["item_specifics"] = {}
                
                # Remove old name if it changed
                if name != new_name and name in item["item_specifics"]:
                    del item["item_specifics"][name]
                
                # Add/update with new name and value
                item["item_specifics"][new_name] = new_value
        
        # Add buttons
        button_frame = ttk.Frame(dialog)
        button_frame.grid(row=2, column=0, columnspan=2, padx=10, pady=10)
        
        ttk.Button(button_frame, text="Update", command=do_update).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="Cancel", command=dialog.destroy).pack(side=tk.LEFT, padx=5)
        
        # Center the dialog
        dialog.update_idletasks()
        width = dialog.winfo_width()
        height = dialog.winfo_height()
        x = (dialog.winfo_screenwidth() // 2) - (width // 2)
        y = (dialog.winfo_screenheight() // 2) - (height // 2)
        dialog.geometry(f'{width}x{height}+{x}+{y}')

    def remove_item_specific(self):
        """Remove the selected item specific."""
        selected = self.specifics_tree.selection()
        if not selected:
            messagebox.showinfo("Info", "No item specific selected")
            return
        
        # Confirm deletion
        if not messagebox.askyesno("Confirm", "Are you sure you want to remove this item specific?"):
            return
        
        # Get name before deletion (for updating the item)
        name = self.specifics_tree.item(selected, "values")[0]
        
        # Remove from treeview
        self.specifics_tree.delete(selected)
        
        # Update item (this will be properly saved when the item is saved)
        if self.current_item_index >= 0 and self.current_item_index < len(self.work_queue):
            item = self.work_queue[self.current_item_index]
            if "item_specifics" in item and name in item["item_specifics"]:
                del item["item_specifics"][name]

    def validate_all_items(self):
        """Validate all items in the queue."""
        if not self.work_queue:
            messagebox.showinfo("Info", "Queue is empty. Nothing to validate.")
            return
        
        # Save current item first
        self.save_current_item()
        
        # Validate all items
        errors = []
        for i, item in enumerate(self.work_queue):
            item_errors = EbayItemSchema.validate_item(item)
            if item_errors:
                errors.append((i, item_errors))
        
        if not errors:
            messagebox.showinfo("Validation", "All items are valid!")
            return
        
        # Show validation errors
        dialog = tk.Toplevel(self.root)
        dialog.title("Validation Errors")
        dialog.transient(self.root)
        dialog.grab_set()
        dialog.geometry("600x400")
        
        ttk.Label(dialog, text="The following items have validation errors:").pack(padx=10, pady=10, anchor=tk.W)
        
        # Create a text widget for the errors
        text = tk.Text(dialog, height=15, width=80, wrap=tk.WORD)
        text.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Add scrollbar
        scrollbar = ttk.Scrollbar(text, command=text.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        text.config(yscrollcommand=scrollbar.set)
        
        # Add errors to text
        for i, item_errors in errors:
            item = self.work_queue[i]
            title = item.get("title", "") or item.get("temp_title", f"Item {i+1}")
            text.insert(tk.END, f"Item {i+1}: {title}\n")
            
            for error in item_errors:
                text.insert(tk.END, f"  - {error}\n")
            
            text.insert(tk.END, "\n")
        
        # Button to close
        ttk.Button(dialog, text="Close", command=dialog.destroy).pack(pady=10)
        
        # Button to go to first item with errors
        if errors:
            def goto_first_error():
                self.current_item_index = errors[0][0]
                self.display_current_item()
                
                # Select in listbox
                self.item_listbox.selection_clear(0, tk.END)
                self.item_listbox.selection_set(self.current_item_index)
                self.item_listbox.see(self.current_item_index)
                
                dialog.destroy()
            
            ttk.Button(dialog, text="Go to First Error", command=goto_first_error).pack(pady=10)

    def export_to_csv(self):
        """Export the queue to a CSV file compatible with eBay bulk listing tool."""
        if not self.work_queue:
            messagebox.showinfo("Info", "Queue is empty. Nothing to export.")
            return
        
        # Save current item first
        self.save_current_item()
        
        # Show file dialog
        file_path = filedialog.asksaveasfilename(
            title="Export to CSV",
            defaultextension=".csv",
            filetypes=[("CSV Files", "*.csv"), ("All Files", "*.*")],
            initialdir=os.path.dirname(self.queue_file_path) if self.queue_file_path else None
        )
        
        if not file_path:
            return
        
        try:
            import csv
            
            # Get all field names
            fieldnames = set(["CustomLabel", "Title", "PicURL", "Category", 
                              "ConditionID", "ConditionDescription", 
                              "Format", "Duration", "StartPrice", "Quantity"])
            
            # Add all item specifics fields
            for item in self.work_queue:
                if "item_specifics" in item:
                    for name in item["item_specifics"].keys():
                        fieldnames.add(f"C:{name}")
            
            # Sort fieldnames
            fieldnames = sorted(list(fieldnames))
            
            # Write CSV
            with open(file_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                
                for item in self.work_queue:
                    # Convert item to CSV format
                    row = EbayItemSchema.to_csv_row(item)
                    
                    # Add photo URLs
                    photos = item.get("photos", [])
                    if photos:
                        pic_urls = []
                        for photo in photos:
                            path = photo.get("path", "")
                            if path:
                                # Just use local path for now - would need to be replaced with actual URLs
                                pic_urls.append(path)
                        
                        if pic_urls:
                            row["PicURL"] = "|".join(pic_urls)
                    
                    # Write row
                    writer.writerow(row)
            
            # Show success message
            messagebox.showinfo("Export", f"Successfully exported {len(self.work_queue)} items to CSV.")
            
        except Exception as e:
            logger.error(f"Error exporting to CSV: {str(e)}")
            messagebox.showerror("Error", f"Failed to export to CSV: {str(e)}")
    
    def launch_processor(self):
        """Launch the LLM Processor with current queue file."""
        if self.queue_file_path and os.path.exists(self.queue_file_path):
            ToolLauncher.launch_processor(self.queue_file_path)
        else:
            ToolLauncher.launch_processor()
    
    def launch_viewer(self):
        """Launch the JSON Viewer with current queue file."""
        if self.queue_file_path and os.path.exists(self.queue_file_path):
            ToolLauncher.launch_viewer(self.queue_file_path)
        else:
            ToolLauncher.launch_viewer()
    
    def launch_price_analyzer(self):
        """Launch the Price Analyzer with current queue file."""
        if self.queue_file_path and os.path.exists(self.queue_file_path):
            ToolLauncher.launch_price_analyzer(self.queue_file_path)
        else:
            ToolLauncher.launch_price_analyzer()
    
    def launch_gallery(self):
        """Launch the Gallery Creator with current queue file."""
        if self.queue_file_path and os.path.exists(self.queue_file_path):
            ToolLauncher.launch_gallery(self.queue_file_path)
        else:
            ToolLauncher.launch_gallery()
    
    def launch_csv_export(self):
        """Launch the CSV Export tool with current queue file."""
        if self.queue_file_path and os.path.exists(self.queue_file_path):
            ToolLauncher.launch_csv_export(self.queue_file_path)
        else:
            ToolLauncher.launch_csv_export()


def main():
    """Main function to start the application."""
    root = tk.Tk()
    app = EbayWorkQueueSetup(root)
    root.mainloop()


if __name__ == "__main__":
    main()