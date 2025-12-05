"""
eBay Tools - HTML Gallery Creator
Creates classified ad-style HTML galleries from items with AI-generated descriptions
"""

import os
import sys
import json
import tkinter as tk
from tkinter import filedialog, messagebox, ttk, scrolledtext
import shutil
from datetime import datetime
from typing import Dict, List, Optional, Any
import webbrowser
import threading
from pathlib import Path

# Import core modules
from ebay_tools.core.schema import EbayItemSchema
from ebay_tools.core.api import LLMApiClient, ApiConfig
from ebay_tools.core.config import ConfigManager
from ebay_tools.core.exceptions import EbayToolsError

# Import utility modules
from ebay_tools.utils.image_utils import open_image_with_orientation, create_thumbnail
from ebay_tools.utils.file_utils import ensure_directory_exists, safe_load_json, safe_save_json
from ebay_tools.utils.ui_utils import StatusBar
from ebay_tools.utils.launcher_utils import ToolLauncher, create_tools_menu

class GalleryItem:
    """Data structure for gallery items"""
    def __init__(self):
        self.id = ""
        self.title = ""
        self.description = ""
        self.price = ""
        self.location = ""
        self.contact_info = ""
        self.status = "available"  # available, pending, sold
        self.photos = []  # List of photo paths
        self.thumbnail = ""
        self.created_date = datetime.now().isoformat()
        self.updated_date = datetime.now().isoformat()
        self.category = ""
        self.condition = ""
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "price": self.price,
            "location": self.location,
            "contact_info": self.contact_info,
            "status": self.status,
            "photos": self.photos,
            "thumbnail": self.thumbnail,
            "created_date": self.created_date,
            "updated_date": self.updated_date,
            "category": self.category,
            "condition": self.condition
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'GalleryItem':
        """Create from dictionary"""
        item = cls()
        for key, value in data.items():
            if hasattr(item, key):
                setattr(item, key, value)
        return item


class GalleryCreator:
    """Main application for creating HTML galleries"""
    
    def __init__(self, root):
        self.root = root
        self.root.title("eBay Tools - Gallery Creator")
        self.root.geometry("1200x800")
        
        # Initialize variables
        self.gallery_file = None
        self.gallery_data = {
            "title": "Items for Sale",
            "contact_info": {},
            "items": []
        }
        self.current_item = None
        self.api_client = None
        self.processing = False
        
        # Load configuration
        self.config_manager = ConfigManager()
        self.config_manager.load()
        
        # Initialize API client
        self.init_api_client()
        
        # Create UI
        self.create_menu()
        self.create_widgets()
        
        # Status bar
        self.status_bar = StatusBar(self.root)
        self.status_bar.set_status("Ready to create gallery")
        
    def create_menu(self):
        """Create application menu"""
        menubar = tk.Menu(self.root)
        self.root.config(menu=menubar)
        
        # File menu
        file_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="File", menu=file_menu)
        file_menu.add_command(label="New Gallery", command=self.new_gallery)
        file_menu.add_command(label="Open Gallery", command=self.open_gallery)
        file_menu.add_command(label="Save Gallery", command=self.save_gallery)
        file_menu.add_separator()
        file_menu.add_command(label="Export HTML", command=self.export_html)
        file_menu.add_separator()
        file_menu.add_command(label="Exit", command=self.root.quit)
        
        # Tools menu
        tools_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Tools", menu=tools_menu)
        
        # Add launch options for other tools
        tools_menu.add_command(label="Launch Setup", command=lambda: ToolLauncher.launch_setup())
        tools_menu.add_command(label="Launch Processor", command=lambda: ToolLauncher.launch_processor())
        tools_menu.add_command(label="Launch Viewer", command=lambda: ToolLauncher.launch_viewer())
        tools_menu.add_command(label="Launch Price Analyzer", command=lambda: ToolLauncher.launch_price_analyzer())
        tools_menu.add_separator()
        tools_menu.add_command(label="Launch CSV Export", command=lambda: ToolLauncher.launch_csv_export())
        tools_menu.add_command(label="Launch Mobile Import", command=lambda: ToolLauncher.launch_mobile_import())
        tools_menu.add_command(label="Launch Direct Listing", command=lambda: ToolLauncher.launch_direct_listing())
        
        # Edit menu
        edit_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Edit", menu=edit_menu)
        edit_menu.add_command(label="Gallery Settings", command=self.edit_gallery_settings)
        edit_menu.add_command(label="Default Contact Info", command=self.edit_contact_info)
        
        # View menu
        view_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="View", menu=view_menu)
        view_menu.add_command(label="Preview Gallery", command=self.preview_gallery)
        view_menu.add_command(label="Refresh", command=self.refresh_display)
        
    def create_widgets(self):
        """Create main UI widgets"""
        # Main container
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Configure grid weights
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        main_frame.rowconfigure(1, weight=1)
        
        # Left panel - Item list
        left_frame = ttk.LabelFrame(main_frame, text="Gallery Items", padding="5")
        left_frame.grid(row=0, column=0, rowspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), padx=(0, 5))
        
        # Item list toolbar
        list_toolbar = ttk.Frame(left_frame)
        list_toolbar.pack(fill=tk.X, pady=(0, 5))
        
        ttk.Button(list_toolbar, text="Add Item", command=self.add_item).pack(side=tk.LEFT, padx=2)
        ttk.Button(list_toolbar, text="Remove", command=self.remove_item).pack(side=tk.LEFT, padx=2)
        ttk.Button(list_toolbar, text="Move Up", command=self.move_item_up).pack(side=tk.LEFT, padx=2)
        ttk.Button(list_toolbar, text="Move Down", command=self.move_item_down).pack(side=tk.LEFT, padx=2)
        
        # Item listbox with scrollbar
        list_scroll = ttk.Scrollbar(left_frame)
        list_scroll.pack(side=tk.RIGHT, fill=tk.Y)
        
        self.item_listbox = tk.Listbox(left_frame, yscrollcommand=list_scroll.set, width=30)
        self.item_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        list_scroll.config(command=self.item_listbox.yview)
        
        self.item_listbox.bind('<<ListboxSelect>>', self.on_item_select)
        
        # Right panel - Item details
        right_frame = ttk.Frame(main_frame)
        right_frame.grid(row=0, column=1, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Item info section
        info_frame = ttk.LabelFrame(right_frame, text="Item Information", padding="10")
        info_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Title
        ttk.Label(info_frame, text="Title:").grid(row=0, column=0, sticky=tk.W, pady=2)
        self.title_var = tk.StringVar()
        self.title_entry = ttk.Entry(info_frame, textvariable=self.title_var, width=50)
        self.title_entry.grid(row=0, column=1, sticky=(tk.W, tk.E), pady=2)
        
        # Price
        ttk.Label(info_frame, text="Price:").grid(row=1, column=0, sticky=tk.W, pady=2)
        self.price_var = tk.StringVar()
        ttk.Entry(info_frame, textvariable=self.price_var, width=20).grid(row=1, column=1, sticky=tk.W, pady=2)
        
        # Status
        ttk.Label(info_frame, text="Status:").grid(row=2, column=0, sticky=tk.W, pady=2)
        self.status_var = tk.StringVar(value="available")
        status_combo = ttk.Combobox(info_frame, textvariable=self.status_var, width=18, state="readonly")
        status_combo['values'] = ('available', 'pending', 'sold')
        status_combo.grid(row=2, column=1, sticky=tk.W, pady=2)
        
        # Location
        ttk.Label(info_frame, text="Location:").grid(row=3, column=0, sticky=tk.W, pady=2)
        self.location_var = tk.StringVar()
        ttk.Entry(info_frame, textvariable=self.location_var, width=50).grid(row=3, column=1, sticky=(tk.W, tk.E), pady=2)
        
        # Contact
        ttk.Label(info_frame, text="Contact:").grid(row=4, column=0, sticky=tk.W, pady=2)
        self.contact_var = tk.StringVar()
        ttk.Entry(info_frame, textvariable=self.contact_var, width=50).grid(row=4, column=1, sticky=(tk.W, tk.E), pady=2)
        
        info_frame.columnconfigure(1, weight=1)
        
        # Photos section
        photo_frame = ttk.LabelFrame(right_frame, text="Photos", padding="10")
        photo_frame.pack(fill=tk.X, pady=(0, 10))
        
        photo_toolbar = ttk.Frame(photo_frame)
        photo_toolbar.pack(fill=tk.X, pady=(0, 5))
        
        ttk.Button(photo_toolbar, text="Add Photos", command=self.add_photos).pack(side=tk.LEFT, padx=2)
        ttk.Button(photo_toolbar, text="Remove Photo", command=self.remove_photo).pack(side=tk.LEFT, padx=2)
        ttk.Button(photo_toolbar, text="Set as Thumbnail", command=self.set_thumbnail).pack(side=tk.LEFT, padx=2)
        
        # Photo list
        self.photo_listbox = tk.Listbox(photo_frame, height=5)
        self.photo_listbox.pack(fill=tk.BOTH, expand=True)
        
        # Description section
        desc_frame = ttk.LabelFrame(right_frame, text="Description", padding="10")
        desc_frame.pack(fill=tk.BOTH, expand=True)
        
        desc_toolbar = ttk.Frame(desc_frame)
        desc_toolbar.pack(fill=tk.X, pady=(0, 5))
        
        ttk.Button(desc_toolbar, text="Generate with AI", command=self.generate_description).pack(side=tk.LEFT, padx=2)
        ttk.Button(desc_toolbar, text="Clear", command=self.clear_description).pack(side=tk.LEFT, padx=2)
        
        # AI processing checkbox
        self.auto_generate_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(desc_toolbar, text="Auto-generate on photo add", 
                       variable=self.auto_generate_var).pack(side=tk.LEFT, padx=10)
        
        # Description text
        self.description_text = scrolledtext.ScrolledText(desc_frame, height=10, wrap=tk.WORD)
        self.description_text.pack(fill=tk.BOTH, expand=True)
        
        # Bottom toolbar
        bottom_frame = ttk.Frame(main_frame)
        bottom_frame.grid(row=1, column=1, sticky=(tk.W, tk.E), pady=(10, 0))
        
        ttk.Button(bottom_frame, text="Save Item", command=self.save_current_item).pack(side=tk.LEFT, padx=5)
        ttk.Button(bottom_frame, text="Preview Gallery", command=self.preview_gallery).pack(side=tk.LEFT, padx=5)
        ttk.Button(bottom_frame, text="Export HTML", command=self.export_html).pack(side=tk.LEFT, padx=5)
        
        # Progress bar for processing
        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Progressbar(bottom_frame, variable=self.progress_var, mode='indeterminate')
        
    def init_api_client(self):
        """Initialize the API client from configuration"""
        try:
            api_config = self.config_manager.get_api_config()
            if api_config and api_config.get("key"):
                self.api_client = LLMApiClient(ApiConfig(
                    api_key=api_config["key"],
                    api_url=api_config["url"],
                    delay=api_config.get("delay", 2.0),
                    max_retries=api_config.get("max_retries", 3),
                    timeout=api_config.get("timeout", 60)
                ))
                self.status_bar.set_status(f"API configured: {api_config.get('type', 'Unknown')}")
            else:
                self.status_bar.set_status("No API configured - descriptions must be entered manually")
        except Exception as e:
            self.status_bar.set_status(f"API initialization failed: {str(e)}")
            
    def new_gallery(self):
        """Create a new gallery"""
        if self.gallery_file and messagebox.askyesno("New Gallery", "Save current gallery before creating new?"):
            self.save_gallery()
            
        self.gallery_file = None
        self.gallery_data = {
            "title": "Items for Sale",
            "contact_info": {
                "name": "",
                "phone": "",
                "email": "",
                "location": ""
            },
            "items": []
        }
        self.item_listbox.delete(0, tk.END)
        self.clear_item_form()
        self.status_bar.set_status("New gallery created")
        
    def open_gallery(self):
        """Open an existing gallery file"""
        filename = filedialog.askopenfilename(
            title="Open Gallery",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )
        
        if filename:
            try:
                self.gallery_data = safe_load_json(filename)
                self.gallery_file = filename
                self.refresh_item_list()
                self.status_bar.set_status(f"Loaded gallery: {os.path.basename(filename)}")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to load gallery: {str(e)}")
                
    def save_gallery(self):
        """Save the current gallery"""
        if not self.gallery_file:
            self.gallery_file = filedialog.asksaveasfilename(
                title="Save Gallery",
                defaultextension=".json",
                filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
            )
            
        if self.gallery_file:
            try:
                # Save current item if editing
                if self.current_item is not None:
                    self.save_current_item()
                    
                safe_save_json(self.gallery_file, self.gallery_data)
                self.status_bar.set_status(f"Gallery saved: {os.path.basename(self.gallery_file)}")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to save gallery: {str(e)}")
                
    def add_item(self):
        """Add a new item to the gallery"""
        # Save current item if editing
        if self.current_item is not None:
            self.save_current_item()
            
        # Create new item
        new_item = GalleryItem()
        new_item.id = f"item_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{len(self.gallery_data['items'])}"
        new_item.title = "New Item"
        
        # Add to gallery
        self.gallery_data['items'].append(new_item.to_dict())
        
        # Update list and select new item
        self.refresh_item_list()
        self.item_listbox.selection_clear(0, tk.END)
        self.item_listbox.selection_set(tk.END)
        self.on_item_select(None)
        
        self.status_bar.set_status("New item added")
        
    def remove_item(self):
        """Remove the selected item"""
        selection = self.item_listbox.curselection()
        if not selection:
            return
            
        if messagebox.askyesno("Remove Item", "Are you sure you want to remove this item?"):
            index = selection[0]
            del self.gallery_data['items'][index]
            self.refresh_item_list()
            self.clear_item_form()
            self.current_item = None
            self.status_bar.set_status("Item removed")
            
    def move_item_up(self):
        """Move selected item up in the list"""
        selection = self.item_listbox.curselection()
        if not selection or selection[0] == 0:
            return
            
        index = selection[0]
        # Swap items
        self.gallery_data['items'][index-1], self.gallery_data['items'][index] = \
            self.gallery_data['items'][index], self.gallery_data['items'][index-1]
        
        self.refresh_item_list()
        self.item_listbox.selection_set(index-1)
        
    def move_item_down(self):
        """Move selected item down in the list"""
        selection = self.item_listbox.curselection()
        if not selection or selection[0] >= len(self.gallery_data['items']) - 1:
            return
            
        index = selection[0]
        # Swap items
        self.gallery_data['items'][index], self.gallery_data['items'][index+1] = \
            self.gallery_data['items'][index+1], self.gallery_data['items'][index]
        
        self.refresh_item_list()
        self.item_listbox.selection_set(index+1)
        
    def on_item_select(self, event):
        """Handle item selection"""
        selection = self.item_listbox.curselection()
        if not selection:
            return
            
        # Save current item if changed
        if self.current_item is not None:
            self.save_current_item()
            
        # Load selected item
        index = selection[0]
        item_data = self.gallery_data['items'][index]
        self.current_item = index
        
        # Update form
        self.title_var.set(item_data.get('title', ''))
        self.price_var.set(item_data.get('price', ''))
        self.status_var.set(item_data.get('status', 'available'))
        self.location_var.set(item_data.get('location', ''))
        self.contact_var.set(item_data.get('contact_info', ''))
        
        # Update photo list
        self.photo_listbox.delete(0, tk.END)
        for photo in item_data.get('photos', []):
            self.photo_listbox.insert(tk.END, os.path.basename(photo))
            
        # Update description
        self.description_text.delete(1.0, tk.END)
        self.description_text.insert(1.0, item_data.get('description', ''))
        
    def save_current_item(self):
        """Save the current item being edited"""
        if self.current_item is None:
            return
            
        item_data = self.gallery_data['items'][self.current_item]
        
        # Update data
        item_data['title'] = self.title_var.get()
        item_data['price'] = self.price_var.get()
        item_data['status'] = self.status_var.get()
        item_data['location'] = self.location_var.get()
        item_data['contact_info'] = self.contact_var.get()
        item_data['description'] = self.description_text.get(1.0, tk.END).strip()
        item_data['updated_date'] = datetime.now().isoformat()
        
        # Update list display
        self.item_listbox.delete(self.current_item)
        display_text = f"{item_data['title']} - {item_data['price']}"
        if item_data['status'] != 'available':
            display_text += f" ({item_data['status']})"
        self.item_listbox.insert(self.current_item, display_text)
        self.item_listbox.selection_set(self.current_item)
        
    def add_photos(self):
        """Add photos to the current item"""
        if self.current_item is None:
            messagebox.showwarning("No Item", "Please select or create an item first")
            return
            
        filenames = filedialog.askopenfilenames(
            title="Select Photos",
            filetypes=[("Image files", "*.jpg *.jpeg *.png *.gif *.webp"), ("All files", "*.*")]
        )
        
        if filenames:
            item_data = self.gallery_data['items'][self.current_item]
            
            for filename in filenames:
                if filename not in item_data.get('photos', []):
                    item_data.setdefault('photos', []).append(filename)
                    self.photo_listbox.insert(tk.END, os.path.basename(filename))
                    
            # Set first photo as thumbnail if none set
            if not item_data.get('thumbnail') and item_data.get('photos'):
                item_data['thumbnail'] = item_data['photos'][0]
                
            # Auto-generate description if enabled
            if self.auto_generate_var.get() and self.api_client:
                self.generate_description()
                
            self.status_bar.set_status(f"Added {len(filenames)} photos")
            
    def remove_photo(self):
        """Remove selected photo"""
        selection = self.photo_listbox.curselection()
        if not selection or self.current_item is None:
            return
            
        index = selection[0]
        item_data = self.gallery_data['items'][self.current_item]
        
        if 'photos' in item_data and index < len(item_data['photos']):
            removed_photo = item_data['photos'].pop(index)
            self.photo_listbox.delete(index)
            
            # Update thumbnail if it was removed
            if item_data.get('thumbnail') == removed_photo:
                item_data['thumbnail'] = item_data['photos'][0] if item_data['photos'] else ""
                
            self.status_bar.set_status("Photo removed")
            
    def set_thumbnail(self):
        """Set selected photo as thumbnail"""
        selection = self.photo_listbox.curselection()
        if not selection or self.current_item is None:
            return
            
        index = selection[0]
        item_data = self.gallery_data['items'][self.current_item]
        
        if 'photos' in item_data and index < len(item_data['photos']):
            item_data['thumbnail'] = item_data['photos'][index]
            self.status_bar.set_status("Thumbnail set")
            
    def generate_description(self):
        """Generate description using AI"""
        if self.current_item is None:
            messagebox.showwarning("No Item", "Please select an item first")
            return
            
        if not self.api_client:
            messagebox.showwarning("No API", "Please configure an API in settings")
            return
            
        item_data = self.gallery_data['items'][self.current_item]
        photos = item_data.get('photos', [])
        
        if not photos:
            messagebox.showwarning("No Photos", "Please add photos before generating description")
            return
            
        # Start processing in background
        self.processing = True
        self.progress_bar.pack(side=tk.RIGHT, padx=5)
        self.progress_bar.start()
        
        thread = threading.Thread(target=self._generate_description_thread, args=(photos, item_data))
        thread.daemon = True
        thread.start()
        
    def _generate_description_thread(self, photos, item_data):
        """Background thread for generating description"""
        try:
            # Build prompt
            prompt = f"""Create a compelling classified ad description for this item.
Title: {item_data.get('title', 'Item for Sale')}
Category: {item_data.get('category', 'General')}
Condition: {item_data.get('condition', 'Used')}

Please create a description that:
1. Highlights key features and benefits
2. Is honest about condition
3. Creates interest without being pushy
4. Is suitable for a classified ad listing
5. Is 2-3 paragraphs long

Format the response as plain text suitable for a classified ad."""

            # Process photos and get description
            # Here we would normally call the API with the photos
            # For now, using a placeholder
            description = f"""[AI-generated description based on {len(photos)} photos]

This {item_data.get('title', 'item')} is available for sale. Based on the provided images, it appears to be in {item_data.get('condition', 'good')} condition.

[Additional details would be generated from actual photo analysis]

Serious inquiries only. {item_data.get('contact_info', 'Contact for more information')}."""

            # Update UI in main thread
            self.root.after(0, self._update_description, description)
            
        except Exception as e:
            self.root.after(0, self._show_error, f"Failed to generate description: {str(e)}")
        finally:
            self.root.after(0, self._stop_progress)
            
    def _update_description(self, description):
        """Update description in UI (main thread)"""
        self.description_text.delete(1.0, tk.END)
        self.description_text.insert(1.0, description)
        self.status_bar.set_status("Description generated")
        
    def _show_error(self, message):
        """Show error message (main thread)"""
        messagebox.showerror("Error", message)
        
    def _stop_progress(self):
        """Stop progress bar (main thread)"""
        self.progress_bar.stop()
        self.progress_bar.pack_forget()
        self.processing = False
        
    def clear_description(self):
        """Clear the description text"""
        self.description_text.delete(1.0, tk.END)
        
    def clear_item_form(self):
        """Clear all item form fields"""
        self.title_var.set("")
        self.price_var.set("")
        self.status_var.set("available")
        self.location_var.set("")
        self.contact_var.set("")
        self.photo_listbox.delete(0, tk.END)
        self.description_text.delete(1.0, tk.END)
        
    def refresh_item_list(self):
        """Refresh the item list display"""
        self.item_listbox.delete(0, tk.END)
        for item in self.gallery_data.get('items', []):
            display_text = f"{item.get('title', 'Untitled')} - {item.get('price', 'No price')}"
            if item.get('status') != 'available':
                display_text += f" ({item.get('status')})"
            self.item_listbox.insert(tk.END, display_text)
            
    def refresh_display(self):
        """Refresh the entire display"""
        self.refresh_item_list()
        if self.current_item is not None:
            self.item_listbox.selection_set(self.current_item)
            self.on_item_select(None)
            
    def edit_gallery_settings(self):
        """Edit gallery-wide settings"""
        dialog = tk.Toplevel(self.root)
        dialog.title("Gallery Settings")
        dialog.geometry("400x200")
        
        # Title
        ttk.Label(dialog, text="Gallery Title:").grid(row=0, column=0, sticky=tk.W, padx=10, pady=5)
        title_var = tk.StringVar(value=self.gallery_data.get('title', ''))
        ttk.Entry(dialog, textvariable=title_var, width=40).grid(row=0, column=1, padx=10, pady=5)
        
        # Buttons
        button_frame = ttk.Frame(dialog)
        button_frame.grid(row=10, column=0, columnspan=2, pady=20)
        
        def save_settings():
            self.gallery_data['title'] = title_var.get()
            dialog.destroy()
            self.status_bar.set_status("Gallery settings updated")
            
        ttk.Button(button_frame, text="Save", command=save_settings).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="Cancel", command=dialog.destroy).pack(side=tk.LEFT, padx=5)
        
    def edit_contact_info(self):
        """Edit default contact information"""
        dialog = tk.Toplevel(self.root)
        dialog.title("Default Contact Information")
        dialog.geometry("400x300")
        
        contact_info = self.gallery_data.get('contact_info', {})
        
        # Fields
        fields = [
            ("Name:", "name"),
            ("Phone:", "phone"),
            ("Email:", "email"),
            ("Location:", "location")
        ]
        
        vars = {}
        for i, (label, key) in enumerate(fields):
            ttk.Label(dialog, text=label).grid(row=i, column=0, sticky=tk.W, padx=10, pady=5)
            vars[key] = tk.StringVar(value=contact_info.get(key, ''))
            ttk.Entry(dialog, textvariable=vars[key], width=30).grid(row=i, column=1, padx=10, pady=5)
            
        # Buttons
        button_frame = ttk.Frame(dialog)
        button_frame.grid(row=10, column=0, columnspan=2, pady=20)
        
        def save_contact():
            self.gallery_data['contact_info'] = {key: var.get() for key, var in vars.items()}
            dialog.destroy()
            self.status_bar.set_status("Contact information updated")
            
        ttk.Button(button_frame, text="Save", command=save_contact).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="Cancel", command=dialog.destroy).pack(side=tk.LEFT, padx=5)
        
    def preview_gallery(self):
        """Preview the gallery in browser"""
        # Save current item
        if self.current_item is not None:
            self.save_current_item()
            
        # Generate HTML
        html_content = self.generate_html()
        
        # Save to temp file
        preview_file = os.path.join(os.path.dirname(self.gallery_file or '.'), 'gallery_preview.html')
        with open(preview_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
            
        # Open in browser
        webbrowser.open(f'file://{os.path.abspath(preview_file)}')
        self.status_bar.set_status("Gallery preview opened in browser")
        
    def export_html(self):
        """Export gallery as HTML file"""
        # Save current item
        if self.current_item is not None:
            self.save_current_item()
            
        filename = filedialog.asksaveasfilename(
            title="Export HTML Gallery",
            defaultextension=".html",
            filetypes=[("HTML files", "*.html"), ("All files", "*.*")]
        )
        
        if filename:
            try:
                # Generate HTML
                html_content = self.generate_html()
                
                # Save HTML file
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(html_content)
                    
                # Copy photos to gallery folder
                gallery_dir = os.path.dirname(filename)
                photos_dir = os.path.join(gallery_dir, 'photos')
                ensure_directory_exists(photos_dir)
                
                # Copy all photos
                for item in self.gallery_data.get('items', []):
                    for photo in item.get('photos', []):
                        if os.path.exists(photo):
                            dest = os.path.join(photos_dir, os.path.basename(photo))
                            if not os.path.exists(dest):
                                shutil.copy2(photo, dest)
                                
                self.status_bar.set_status(f"Gallery exported to {os.path.basename(filename)}")
                
                # Ask if user wants to open it
                if messagebox.askyesno("Export Complete", "Gallery exported successfully. Open in browser?"):
                    webbrowser.open(f'file://{os.path.abspath(filename)}')
                    
            except Exception as e:
                messagebox.showerror("Export Error", f"Failed to export gallery: {str(e)}")
                
    def generate_html(self):
        """Generate the HTML content for the gallery"""
        # This will be implemented in the next part
        return self._create_html_template()
        
    def _create_html_template(self):
        """Create the HTML template for the gallery"""
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{self.gallery_data.get('title', 'Items for Sale')}</title>
    <style>
        {self._get_css_styles()}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>{self.gallery_data.get('title', 'Items for Sale')}</h1>
        </header>
        
        <div class="filters">
            <button class="filter-btn active" data-filter="all">All Items</button>
            <button class="filter-btn" data-filter="available">Available</button>
            <button class="filter-btn" data-filter="pending">Pending</button>
            <button class="filter-btn" data-filter="sold">Sold</button>
        </div>
        
        <div class="gallery">
            {self._generate_items_html()}
        </div>
        
        <footer>
            <p>Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</p>
        </footer>
    </div>
    
    <script>
        {self._get_javascript()}
    </script>
</body>
</html>"""
        return html
        
    def _get_css_styles(self):
        """Get CSS styles for the gallery"""
        return """
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        h1 {
            color: #2c3e50;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .filters {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .filter-btn {
            background-color: #ecf0f1;
            border: none;
            padding: 10px 20px;
            margin: 0 5px;
            cursor: pointer;
            border-radius: 5px;
            transition: all 0.3s;
        }
        
        .filter-btn:hover {
            background-color: #bdc3c7;
        }
        
        .filter-btn.active {
            background-color: #3498db;
            color: white;
        }
        
        .gallery {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .item {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
            transition: transform 0.3s;
            cursor: pointer;
        }
        
        .item:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 20px rgba(0,0,0,0.15);
        }
        
        .item.sold {
            opacity: 0.7;
        }
        
        .item-image {
            width: 100%;
            height: 200px;
            object-fit: cover;
        }
        
        .item-content {
            padding: 20px;
        }
        
        .item-title {
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 10px;
            color: #2c3e50;
        }
        
        .item-price {
            font-size: 1.5em;
            color: #27ae60;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .item-status {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.8em;
            margin-bottom: 10px;
        }
        
        .status-available {
            background-color: #27ae60;
            color: white;
        }
        
        .status-pending {
            background-color: #f39c12;
            color: white;
        }
        
        .status-sold {
            background-color: #e74c3c;
            color: white;
        }
        
        .item-description {
            color: #666;
            margin-bottom: 15px;
            line-height: 1.5;
        }
        
        .item-details {
            font-size: 0.9em;
            color: #777;
        }
        
        .item-location {
            margin-bottom: 5px;
        }
        
        .item-contact {
            color: #3498db;
        }
        
        /* Modal styles */
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.8);
        }
        
        .modal-content {
            position: relative;
            background-color: white;
            margin: 5% auto;
            padding: 20px;
            width: 80%;
            max-width: 800px;
            border-radius: 10px;
            max-height: 80vh;
            overflow-y: auto;
        }
        
        .close {
            position: absolute;
            right: 20px;
            top: 20px;
            font-size: 30px;
            cursor: pointer;
            color: #999;
        }
        
        .close:hover {
            color: #333;
        }
        
        .modal-images {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            overflow-x: auto;
        }
        
        .modal-image {
            width: 100px;
            height: 100px;
            object-fit: cover;
            cursor: pointer;
            border: 2px solid transparent;
            border-radius: 5px;
        }
        
        .modal-image.active {
            border-color: #3498db;
        }
        
        .main-image {
            width: 100%;
            max-height: 400px;
            object-fit: contain;
            margin-bottom: 20px;
        }
        
        footer {
            text-align: center;
            margin-top: 50px;
            color: #777;
            font-size: 0.9em;
        }
        
        @media (max-width: 768px) {
            .gallery {
                grid-template-columns: 1fr;
            }
        }
        """
        
    def _get_javascript(self):
        """Get JavaScript for the gallery"""
        return """
        // Filter functionality
        const filterButtons = document.querySelectorAll('.filter-btn');
        const items = document.querySelectorAll('.item');
        
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.getAttribute('data-filter');
                
                // Update active button
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Filter items
                items.forEach(item => {
                    if (filter === 'all' || item.classList.contains(filter)) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
        
        // Modal functionality
        function openModal(itemId) {
            const modal = document.getElementById('modal-' + itemId);
            if (modal) {
                modal.style.display = 'block';
            }
        }
        
        function closeModal(itemId) {
            const modal = document.getElementById('modal-' + itemId);
            if (modal) {
                modal.style.display = 'none';
            }
        }
        
        // Close modal when clicking outside
        window.onclick = function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        }
        
        // Image gallery in modal
        function changeImage(itemId, imageSrc, element) {
            const mainImage = document.getElementById('main-image-' + itemId);
            mainImage.src = imageSrc;
            
            // Update active thumbnail
            const thumbnails = element.parentElement.querySelectorAll('.modal-image');
            thumbnails.forEach(thumb => thumb.classList.remove('active'));
            element.classList.add('active');
        }
        """
        
    def _generate_items_html(self):
        """Generate HTML for all items"""
        html_parts = []
        
        for item in self.gallery_data.get('items', []):
            item_id = item.get('id', '')
            status = item.get('status', 'available')
            photos = item.get('photos', [])
            thumbnail = item.get('thumbnail', photos[0] if photos else '')
            
            # Create thumbnail path
            if thumbnail:
                thumbnail_path = f"photos/{os.path.basename(thumbnail)}"
            else:
                thumbnail_path = "https://via.placeholder.com/300x200?text=No+Image"
                
            # Create item HTML
            item_html = f"""
            <div class="item {status}" onclick="openModal('{item_id}')">
                <img src="{thumbnail_path}" alt="{item.get('title', '')}" class="item-image">
                <div class="item-content">
                    <div class="item-title">{item.get('title', 'Untitled')}</div>
                    <div class="item-price">{item.get('price', 'Contact for price')}</div>
                    <div class="item-status status-{status}">{status.title()}</div>
                    <div class="item-description">{item.get('description', '')[:100]}...</div>
                    <div class="item-details">
                        <div class="item-location">📍 {item.get('location', 'Location not specified')}</div>
                        <div class="item-contact">📞 {item.get('contact_info', 'Contact for details')}</div>
                    </div>
                </div>
            </div>
            
            <!-- Modal for item -->
            <div id="modal-{item_id}" class="modal">
                <div class="modal-content">
                    <span class="close" onclick="closeModal('{item_id}')">&times;</span>
                    <h2>{item.get('title', 'Untitled')}</h2>
                    
                    {self._generate_modal_images_html(item)}
                    
                    <div class="item-price">{item.get('price', 'Contact for price')}</div>
                    <div class="item-status status-{status}">{status.title()}</div>
                    
                    <h3>Description</h3>
                    <div class="item-description">{item.get('description', 'No description available')}</div>
                    
                    <h3>Contact Information</h3>
                    <div class="item-details">
                        <div class="item-location">📍 Location: {item.get('location', 'Not specified')}</div>
                        <div class="item-contact">📞 Contact: {item.get('contact_info', 'Not provided')}</div>
                    </div>
                    
                    <p style="color: #666; font-size: 0.9em; margin-top: 20px;">
                        Listed on {datetime.fromisoformat(item.get('created_date', datetime.now().isoformat())).strftime('%B %d, %Y')}
                    </p>
                </div>
            </div>
            """
            
            html_parts.append(item_html)
            
        return '\n'.join(html_parts)
        
    def _generate_modal_images_html(self, item):
        """Generate HTML for modal image gallery"""
        photos = item.get('photos', [])
        if not photos:
            return '<img src="https://via.placeholder.com/600x400?text=No+Image" class="main-image">'
            
        item_id = item.get('id', '')
        first_photo = f"photos/{os.path.basename(photos[0])}"
        
        html = f'<img id="main-image-{item_id}" src="{first_photo}" class="main-image">'
        
        if len(photos) > 1:
            html += '<div class="modal-images">'
            for i, photo in enumerate(photos):
                photo_path = f"photos/{os.path.basename(photo)}"
                active_class = 'active' if i == 0 else ''
                html += f'<img src="{photo_path}" class="modal-image {active_class}" onclick="changeImage(\'{item_id}\', \'{photo_path}\', this)">'
            html += '</div>'
            
        return html


def main():
    """Main entry point"""
    root = tk.Tk()
    app = GalleryCreator(root)
    root.mainloop()


if __name__ == "__main__":
    main()