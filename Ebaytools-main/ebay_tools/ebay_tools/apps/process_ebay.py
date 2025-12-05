"""
eBay Item Processor - Processes a queue of eBay items using LLM APIs.

This module represents a refactored version of ProcessWorkQueueV3.py,
utilizing the new package structure and modular components.
"""

import os
import sys
import json
import base64
import time
import logging
import tkinter as tk
from tkinter import filedialog, messagebox, ttk
import requests
from PIL import Image, ImageTk
from datetime import datetime
import uuid
import subprocess
import threading
from typing import Dict, List, Any, Optional, Callable, Union

# Import core modules
from ebay_tools.core.schema import EbayItemSchema, load_queue, save_queue
from ebay_tools.core.api import LLMApiClient, ApiConfig, ApiError
from ebay_tools.core.config import ConfigManager
from ebay_tools.core.exceptions import EbayToolsError

# Import utility modules
from ebay_tools.utils.image_utils import open_image_with_orientation, create_thumbnail
from ebay_tools.utils.file_utils import ensure_directory_exists, safe_load_json, safe_save_json
from ebay_tools.utils.ui_utils import StatusBar
from ebay_tools.utils.background_utils import BackgroundTask, BackgroundTaskManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("ebay_processor.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class EbayLLMProcessor:
    """
    Main class for processing eBay items with LLM API.
    """
    def __init__(self, root):
        """Initialize the application."""
        self.root = root
        self.root.title("eBay LLM Photo Processor")
        self.root.geometry("950x750")
        
        # Set application icon if available
        try:
            self.root.iconbitmap("resources/icon.ico")
        except:
            pass  # Continue without icon if it's missing
        
        # Initialize variables
        self.queue_file_path = None
        self.work_queue = []
        self.current_item_index = -1
        self.current_photo_index = -1
        self.api_client = None  # Will be initialized with configuration
        self.processing = False
        self.processing_thread = None  # For background processing
        self.thread_stop_flag = False  # Flag to stop background thread
        
        # Store the current photo image reference to prevent garbage collection
        self.current_photo_image = None
        
        # Define available API options
        self.available_apis = {
            "LLaVA v1.6": "https://api.segmind.com/v1/llava-v1.6",
            "Claude 3.7 Sonnet": "https://api.segmind.com/v1/claude-3.7-sonnet",
            "Claude 3 Opus": "https://api.segmind.com/v1/claude-3-opus",
            "GPT-4 Vision": "https://api.openai.com/v1/chat/completions"
        }
        
        # Create the UI
        self.create_frames()
        self.create_widgets()
        
        # Try to load API config
        try:
            self.load_api_config()
            self.init_api_client()
        except Exception as e:
            self.log(f"Error during initialization: {str(e)}")
            logger.error(f"Error during initialization: {str(e)}")

        # Initialize task manager for background processing
        self.task_manager = BackgroundTaskManager(root)
    
    def log(self, message):
        """Add a message to the log with timestamp."""
        if hasattr(self, 'log_text') and self.log_text:
            timestamp = datetime.now().strftime("%H:%M:%S")
            
            # Add to UI log
            self.log_text.configure(state="normal")
            self.log_text.insert(tk.END, f"[{timestamp}] {message}\n")
            self.log_text.see(tk.END)  # Scroll to bottom
            self.log_text.configure(state="disabled")
            
            # Also log to file via logger
            logger.info(message)
        else:
            # If log_text not yet created, just log to file
            logger.info(message)
    
    def create_frames(self):
        """Create all the frames for the UI."""
        # Top frame for queue operations
        self.top_frame = ttk.Frame(self.root, padding=10)
        
        # API settings frame
        self.api_frame = ttk.LabelFrame(self.root, text="API Settings", padding=10)
        
        # Middle frame for current item display
        self.item_frame = ttk.LabelFrame(self.root, text="Current Item", padding=10)
        
        # Photo display frame
        self.photo_frame = ttk.Frame(self.root, padding=10)
        
        # Progress frame
        self.progress_frame = ttk.Frame(self.root, padding=10)
        
        # Log frame
        self.log_frame = ttk.LabelFrame(self.root, text="Processing Log", padding=10)
        
        # Layout main frames
        self.top_frame.pack(fill=tk.X, pady=5)
        self.api_frame.pack(fill=tk.X, pady=5, padx=10)
        self.item_frame.pack(fill=tk.X, pady=5, padx=10)
        self.photo_frame.pack(fill=tk.BOTH, expand=True, pady=5, padx=10)
        self.progress_frame.pack(fill=tk.X, pady=5, padx=10)
        self.log_frame.pack(fill=tk.BOTH, expand=True, pady=5, padx=10)
        
        # Log widgets - create early so we can log from the beginning
        self.log_text = tk.Text(self.log_frame, height=10, width=80, wrap=tk.WORD)
        self.log_text.pack(fill=tk.BOTH, expand=True)
        
        # Add scrollbar to log
        log_scrollbar = ttk.Scrollbar(self.log_frame, command=self.log_text.yview)
        log_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.log_text.config(yscrollcommand=log_scrollbar.set)
        
        # Set log to read-only
        self.log_text.configure(state="disabled")
    
    def create_widgets(self):
        """Create all the widgets for the UI."""
        # Queue operation widgets
        self.load_queue_btn = ttk.Button(self.top_frame, text="Load Queue", command=self.load_queue)
        self.load_queue_btn.pack(side=tk.LEFT, padx=5)
        
        self.save_queue_btn = ttk.Button(self.top_frame, text="Save Queue", command=self.save_queue)
        self.save_queue_btn.pack(side=tk.LEFT, padx=5)
        
        # Add a button to reload the current queue file
        self.reload_queue_btn = ttk.Button(self.top_frame, text="Reload Queue", command=self.reload_queue)
        self.reload_queue_btn.pack(side=tk.LEFT, padx=5)
        
        self.queue_status_label = ttk.Label(self.top_frame, text="Queue: 0 items (0 processed)")
        self.queue_status_label.pack(side=tk.RIGHT, padx=5)
        
        # API settings widgets
        ttk.Label(self.api_frame, text="API Type:").grid(row=0, column=0, sticky=tk.W, padx=5, pady=5)
        self.api_type_var = tk.StringVar(value="LLaVA v1.6")
        self.api_type_combobox = ttk.Combobox(self.api_frame, textvariable=self.api_type_var, values=list(self.available_apis.keys()), state="readonly")
        self.api_type_combobox.grid(row=0, column=1, sticky=tk.W, padx=5, pady=5)
        self.api_type_combobox.bind("<<ComboboxSelected>>", self.on_api_type_changed)
        
        ttk.Label(self.api_frame, text="API Key:").grid(row=1, column=0, sticky=tk.W, padx=5, pady=5)
        self.api_key_entry = ttk.Entry(self.api_frame, width=40, show="•")  # Hide API key
        self.api_key_entry.grid(row=1, column=1, sticky=tk.W, padx=5, pady=5)
        
        # Toggle button to show/hide API key
        self.show_key_var = tk.BooleanVar(value=False)
        self.show_key_btn = ttk.Checkbutton(self.api_frame, text="Show", variable=self.show_key_var, command=self.toggle_api_key_visibility)
        self.show_key_btn.grid(row=1, column=2, sticky=tk.W, padx=5, pady=5)
        
        ttk.Label(self.api_frame, text="API URL:").grid(row=2, column=0, sticky=tk.W, padx=5, pady=5)
        self.api_url_entry = ttk.Entry(self.api_frame, width=60)
        self.api_url_entry.grid(row=2, column=1, columnspan=2, sticky=tk.W, padx=5, pady=5)
        
        ttk.Label(self.api_frame, text="Delay (seconds):").grid(row=3, column=0, sticky=tk.W, padx=5, pady=5)
        self.delay_var = tk.DoubleVar(value=2.0)
        self.delay_entry = ttk.Spinbox(self.api_frame, from_=0.5, to=10.0, increment=0.5, textvariable=self.delay_var, width=5)
        self.delay_entry.grid(row=3, column=1, sticky=tk.W, padx=5, pady=5)
        
        # Add a test API button
        self.test_api_btn = ttk.Button(self.api_frame, text="Test API", command=self.test_api_connection)
        self.test_api_btn.grid(row=3, column=2, sticky=tk.W, padx=5, pady=5)
        
        self.save_api_config_btn = ttk.Button(self.api_frame, text="Save Config", command=self.save_api_config)
        self.save_api_config_btn.grid(row=4, column=0, columnspan=3, pady=10)
        
        # Current item widgets
        self.item_info_label = ttk.Label(self.item_frame, text="No item selected")
        self.item_info_label.pack(fill=tk.X, pady=5)
        
        # Add navigation buttons for items
        item_nav_frame = ttk.Frame(self.item_frame)
        item_nav_frame.pack(fill=tk.X, pady=5)
        
        self.prev_item_btn = ttk.Button(item_nav_frame, text="← Previous Item", command=self.prev_item)
        self.prev_item_btn.pack(side=tk.LEFT, padx=5)
        
        self.next_item_btn = ttk.Button(item_nav_frame, text="Next Item →", command=self.next_item)
        self.next_item_btn.pack(side=tk.LEFT, padx=5)
        
        # Add button to find next unprocessed item
        self.find_next_unprocessed_btn = ttk.Button(item_nav_frame, text="Find Next Unprocessed", command=self.find_next_unprocessed)
        self.find_next_unprocessed_btn.pack(side=tk.LEFT, padx=20)
        
        # Photo navigation
        photo_nav_frame = ttk.Frame(self.item_frame)
        photo_nav_frame.pack(fill=tk.X, pady=5)
        
        self.prev_photo_btn = ttk.Button(photo_nav_frame, text="← Previous Photo", command=self.prev_photo)
        self.prev_photo_btn.pack(side=tk.LEFT, padx=5)
        
        self.next_photo_btn = ttk.Button(photo_nav_frame, text="Next Photo →", command=self.next_photo)
        self.next_photo_btn.pack(side=tk.LEFT, padx=5)
        
        # Photo description editable field
        self.show_description_btn = ttk.Button(photo_nav_frame, text="Edit Description", command=self.show_description_editor)
        self.show_description_btn.pack(side=tk.RIGHT, padx=5)
        
        # Item specifics button
        self.edit_specifics_btn = ttk.Button(photo_nav_frame, text="Edit Item Specifics", command=self.edit_item_specifics)
        self.edit_specifics_btn.pack(side=tk.RIGHT, padx=5)
        
        # Photo display widgets
        self.photo_frame.update()  # Force update to get correct dimensions
        self.photo_label = ttk.Label(self.photo_frame, text="No photo selected")
        self.photo_label.pack(expand=True, fill=tk.BOTH)
        
        self.photo_info_label = ttk.Label(self.photo_frame, text="")
        self.photo_info_label.pack(fill=tk.X, pady=5)
        
        # Progress widgets
        self.progress_label = ttk.Label(self.progress_frame, text="Ready")
        self.progress_label.pack(side=tk.LEFT, padx=5)
        
        self.progress_bar = ttk.Progressbar(self.progress_frame, orient=tk.HORIZONTAL, length=300, mode='determinate')
        self.progress_bar.pack(side=tk.LEFT, padx=5, fill=tk.X, expand=True)
        
        # Add estimated time remaining label
        self.time_remaining_label = ttk.Label(self.progress_frame, text="")
        self.time_remaining_label.pack(side=tk.LEFT, padx=5)
        
        self.start_btn = ttk.Button(self.progress_frame, text="Start Processing", command=self.start_processing)
        self.start_btn.pack(side=tk.LEFT, padx=5)
        
        self.stop_btn = ttk.Button(self.progress_frame, text="Stop", command=self.stop_processing, state=tk.DISABLED)
        self.stop_btn.pack(side=tk.LEFT, padx=5)
        
        # Add a reprocess button
        self.reprocess_btn = ttk.Button(
            self.progress_frame,
            text="Reprocess Current",
            command=self.reprocess_current
        )
        self.reprocess_btn.pack(side=tk.LEFT, padx=5)
        
        # Add button to launch viewer
        self.launch_viewer_btn = ttk.Button(
            self.progress_frame,
            text="Launch Viewer",
            command=self.launch_viewer
        )
        self.launch_viewer_btn.pack(side=tk.LEFT, padx=5)
        
        # Generate final descriptions checkbox
        self.generate_final_var = tk.BooleanVar(value=True)
        self.generate_final_check = ttk.Checkbutton(
            self.progress_frame, 
            text="Generate Final Descriptions", 
            variable=self.generate_final_var
        )
        self.generate_final_check.pack(side=tk.LEFT, padx=5)
        
        # Initialize navigation buttons state
        self.update_navigation_buttons()
    
    def toggle_api_key_visibility(self):
        """Toggle the visibility of the API key."""
        if self.show_key_var.get():
            self.api_key_entry.configure(show="")
        else:
            self.api_key_entry.configure(show="•")
    
    def on_api_type_changed(self, event):
        """Handle API type change and update the URL accordingly."""
        selected_api = self.api_type_var.get()
        if selected_api in self.available_apis:
            self.api_url_entry.delete(0, tk.END)
            self.api_url_entry.insert(0, self.available_apis[selected_api])
    
    def init_api_client(self):
        """Initialize the API client with current settings."""
        api_key = self.api_key_entry.get().strip()
        api_url = self.api_url_entry.get().strip()
        delay = self.delay_var.get()
        
        if not api_key or not api_url:
            self.log("API key or URL is missing. Cannot initialize API client.")
            return
        
        try:
            config = ApiConfig(
                api_key=api_key,
                api_url=api_url,
                delay=delay,
                max_retries=3,
                timeout=60
            )
            self.api_client = LLMApiClient(config)
            self.log("API client initialized")
        except Exception as e:
            self.log(f"Error initializing API client: {str(e)}")
    
    def test_api_connection(self):
        """Test the API connection with a simple request."""
        if not self.api_client:
            self.init_api_client()
            if not self.api_client:
                messagebox.showerror("Error", "Could not initialize API client. Please check your settings.")
                return
        
        self.log("Testing API connection...")
        try:
            # Simple test prompt
            test_prompt = "Respond with 'API connection successful' if you can read this message."
            response = self.api_client.generate_text(test_prompt)
            
            if response and "successful" in response.lower():
                self.log("API test successful!")
                messagebox.showinfo("Success", "API connection test successful!")
            else:
                self.log(f"API test returned unexpected response: {response[:100]}...")
                messagebox.showwarning("Warning", "API connection test returned unexpected response. Please check logs.")
        except Exception as e:
            self.log(f"API test failed: {str(e)}")
            messagebox.showerror("Error", f"API test failed: {str(e)}")
    
    def load_api_config(self):
        """Load API configuration from a local file."""
        config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "api_config.json")
        
        if os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    config = json.load(f)
                
                if "api_key" in config:
                    self.api_key_entry.delete(0, tk.END)
                    self.api_key_entry.insert(0, config["api_key"])
                
                if "api_url" in config:
                    self.api_url_entry.delete(0, tk.END)
                    self.api_url_entry.insert(0, config["api_url"])
                    
                    # Try to select the correct API type based on the URL
                    for api_name, api_url in self.available_apis.items():
                        if api_url == config["api_url"]:
                            self.api_type_var.set(api_name)
                            break
                
                if "delay" in config:
                    self.delay_var.set(float(config["delay"]))
                
                self.log("API configuration loaded")
            except Exception as e:
                self.log(f"Error loading API config: {str(e)}")
    
    def save_api_config(self):
        """Save API configuration to a local file."""
        try:
            # Get values from entries
            api_key = self.api_key_entry.get().strip()
            api_url = self.api_url_entry.get().strip()
            delay = self.delay_var.get()
            
            # Create config dict
            config = {
                "api_key": api_key,
                "api_url": api_url,
                "delay": delay
            }
            
            # Save to file
            config_dir = os.path.dirname(os.path.abspath(__file__))
            config_path = os.path.join(config_dir, "api_config.json")
            
            # Ensure directory exists
            os.makedirs(os.path.dirname(config_path), exist_ok=True)
            
            with open(config_path, 'w') as f:
                json.dump(config, f, indent=2)
            
            # Reinitialize the API client with new settings
            self.init_api_client()
            
            self.log("API configuration saved")
            messagebox.showinfo("Success", "API configuration saved.")
        except Exception as e:
            self.log(f"Error saving API config: {str(e)}")
            messagebox.showerror("Error", f"Failed to save API configuration: {str(e)}")
    
    def load_queue(self):
        """Load a work queue from a JSON file."""
        try:
            # Ask for file
            file_path = filedialog.askopenfilename(
                title="Load Work Queue",
                filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
            )
            
            if not file_path:
                return
            
            self._load_queue_from_path(file_path)
            
        except Exception as e:
            self.log(f"Error loading queue: {str(e)}")
            messagebox.showerror("Error", f"Failed to load queue: {str(e)}")
    
    def _load_queue_from_path(self, file_path):
        """Internal method to load queue from a specified path."""
        try:
            # Load and validate the queue
            self.work_queue = load_queue(file_path)
            self.queue_file_path = file_path
            
            # Save to recent paths in configuration
            self.config_manager = ConfigManager()
            self.config_manager.set("paths.last_queue_file", file_path)
            self.config_manager.save()
            
            # Update UI
            self.update_queue_status()
            self.log(f"Loaded queue with {len(self.work_queue)} items")
            
            # Set current indices to first item, first photo if queue not empty
            if self.work_queue:
                self.current_item_index = 0
                self.current_photo_index = 0
                self.display_current_item()
            else:
                self.current_item_index = -1
                self.current_photo_index = -1
            
            # Find first unprocessed item if needed
            if self.find_next_unprocessed():
                self.log("Found unprocessed item, navigation moved to it.")
            
            # Update navigation buttons
            self.update_navigation_buttons()
            
            # Show success message
            messagebox.showinfo("Success", f"Loaded {len(self.work_queue)} items from queue.")
            return True
        
        except Exception as e:
            self.log(f"Error loading queue from {file_path}: {str(e)}")
            messagebox.showerror("Error", f"Failed to load queue: {str(e)}")
            return False
    
    def reload_queue(self):
        """Reload the current queue file."""
        if not self.queue_file_path:
            messagebox.showinfo("Info", "No queue file loaded yet.")
            return
        
        # Save the current position
        current_item = self.current_item_index
        current_photo = self.current_photo_index
        
        # Reload the file
        if self._load_queue_from_path(self.queue_file_path):
            # Try to restore position
            if 0 <= current_item < len(self.work_queue):
                self.current_item_index = current_item
                
                # Check photo index validity
                item = self.work_queue[self.current_item_index]
                photos = item.get("photos", [])
                if 0 <= current_photo < len(photos):
                    self.current_photo_index = current_photo
                else:
                    self.current_photo_index = 0
                
                self.display_current_item()
                self.update_navigation_buttons()
    
    def save_queue(self):
        """Save the current work queue to a JSON file."""
        if not self.work_queue:
            messagebox.showwarning("Warning", "Queue is empty. Nothing to save.")
            return
        
        try:
            # If we already have a file path, use it
            if self.queue_file_path:
                file_path = self.queue_file_path
            else:
                # Ask for save location
                file_path = filedialog.asksaveasfilename(
                    title="Save Work Queue",
                    defaultextension=".json",
                    filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
                )
            
            if not file_path:
                return
            
            # Use the save_queue function from the core module
            save_queue(self.work_queue, file_path)
            
            self.queue_file_path = file_path
            self.log(f"Saved queue with {len(self.work_queue)} items")
            
            # Update config
            self.config_manager = ConfigManager()
            self.config_manager.set("paths.last_queue_file", file_path)
            self.config_manager.save()
            
            messagebox.showinfo("Success", f"Saved {len(self.work_queue)} items to queue.")
        
        except Exception as e:
            self.log(f"Error saving queue: {str(e)}")
            messagebox.showerror("Error", f"Failed to save queue: {str(e)}")
    
    def update_queue_status(self):
        """Update the queue status display."""
        if not self.work_queue:
            self.queue_status_label.config(text="Queue: 0 items (0 processed)")
            self.progress_bar["value"] = 0
            return
        
        # Count processed items
        processed_items = sum(1 for item in self.work_queue if item.get("processed", False))
        
        # Count photos to process
        total_photos_to_process = 0
        processed_photos = 0
        
        for item in self.work_queue:
            process_photos = item.get("process_photos", [])
            total_photos_to_process += len(process_photos)
            
            photos = item.get("photos", [])
            for idx in process_photos:
                if idx < len(photos) and photos[idx].get("processed", False):
                    processed_photos += 1
        
        status_text = f"Queue: {len(self.work_queue)} items ({processed_items} processed), "
        status_text += f"{processed_photos}/{total_photos_to_process} photos processed"
        
        # Add file name if available
        if self.queue_file_path:
            status_text += f" - {os.path.basename(self.queue_file_path)}"
        
        self.queue_status_label.config(text=status_text)
        
        # Update progress bar
        if total_photos_to_process > 0:
            progress_pct = (processed_photos / total_photos_to_process) * 100
            self.progress_bar["value"] = progress_pct
        else:
            self.progress_bar["value"] = 0
    
    def prev_item(self):
        """Navigate to the previous item in the queue."""
        if not self.work_queue or self.current_item_index <= 0:
            return
            
        self.current_item_index -= 1
        self.current_photo_index = 0  # Reset to first photo
        self.display_current_item()
        self.update_navigation_buttons()
        
    def next_item(self):
        """Navigate to the next item in the queue."""
        if not self.work_queue or self.current_item_index >= len(self.work_queue) - 1:
            return
            
        self.current_item_index += 1
        self.current_photo_index = 0  # Reset to first photo
        self.display_current_item()
        self.update_navigation_buttons()
        
    def prev_photo(self):
        """Navigate to the previous photo of the current item."""
        if self.current_item_index < 0 or self.current_item_index >= len(self.work_queue):
            return
            
        item = self.work_queue[self.current_item_index]
        photos = item.get("photos", [])
        
        if self.current_photo_index <= 0 or not photos:
            return
            
        self.current_photo_index -= 1
        self.display_current_item()
        self.update_navigation_buttons()
        
    def next_photo(self):
        """Navigate to the next photo of the current item."""
        if self.current_item_index < 0 or self.current_item_index >= len(self.work_queue):
            return
            
        item = self.work_queue[self.current_item_index]
        photos = item.get("photos", [])
        
        if self.current_photo_index >= len(photos) - 1 or not photos:
            return
            
        self.current_photo_index += 1
        self.display_current_item()
        self.update_navigation_buttons()
    
    def update_navigation_buttons(self):
        """Update the state of navigation buttons based on current position."""
        # Default to disabled
        self.prev_item_btn.config(state=tk.DISABLED)
        self.next_item_btn.config(state=tk.DISABLED)
        self.prev_photo_btn.config(state=tk.DISABLED)
        self.next_photo_btn.config(state=tk.DISABLED)
        self.show_description_btn.config(state=tk.DISABLED)
        self.edit_specifics_btn.config(state=tk.DISABLED)
        
        if not self.work_queue:
            return
            
        # Update item navigation buttons
        if self.current_item_index > 0:
            self.prev_item_btn.config(state=tk.NORMAL)
            
        if self.current_item_index < len(self.work_queue) - 1:
            self.next_item_btn.config(state=tk.NORMAL)
        
        # Enable item specifics button if we have a valid item
        if 0 <= self.current_item_index < len(self.work_queue):
            self.edit_specifics_btn.config(state=tk.NORMAL)
            
        # Update photo navigation buttons
        if self.current_item_index >= 0 and self.current_item_index < len(self.work_queue):
            item = self.work_queue[self.current_item_index]
            photos = item.get("photos", [])
            
            if self.current_photo_index > 0:
                self.prev_photo_btn.config(state=tk.NORMAL)
                
            if self.current_photo_index < len(photos) - 1:
                self.next_photo_btn.config(state=tk.NORMAL)
            
            # Enable description editor button if we have a valid photo
            if photos and 0 <= self.current_photo_index < len(photos):
                self.show_description_btn.config(state=tk.NORMAL)
    
    def display_current_item(self):
        """Display information about the current item."""
        if self.current_item_index < 0 or self.current_item_index >= len(self.work_queue):
            self.item_info_label.config(text="No item selected")
            
            # Clear photo display
            self.photo_label.config(image="", text="No photo selected")
            self.current_photo_image = None  # Clear the reference
            
            self.photo_info_label.config(text="")
            return
        
        # Get current item
        item = self.work_queue[self.current_item_index]
        
        # Display item info
        item_title = item.get('temp_title', item.get('title', 'Untitled'))
        item_sku = item.get('sku', 'No SKU')
        
        item_info = f"Item {self.current_item_index + 1}/{len(self.work_queue)}: {item_title}"
        item_info += f" (SKU: {item_sku})"
        
        # Add category if available
        if item.get('category'):
            item_info += f" - Category: {item.get('category')}"
            
        # Add condition if available
        if item.get('condition'):
            condition_code = item.get('condition')
            condition_desc = EbayItemSchema.CONDITION_MAP.get(condition_code, condition_code)
            item_info += f" - Condition: {condition_desc}"
            
        # Add photo count info
        photos = item.get("photos", [])
        if photos:
            item_info += f" - Photo {self.current_photo_index + 1}/{len(photos)}"
            if 'process_photos' in item:
                item_info += f" (Selected for processing: {len(item['process_photos'])})"
        
        self.item_info_label.config(text=item_info)
        
        # Display current photo if available
        if (self.current_photo_index >= 0 and 
            self.current_photo_index < len(photos) and 
            photos):
            
            photo_data = photos[self.current_photo_index]
            photo_path = photo_data.get("path", "")
            
            if photo_path and os.path.exists(photo_path):
                self.display_photo(photo_path)
                
                # Display photo info
                context = photo_data.get("context", "No context")
                processed = "Yes" if photo_data.get("processed", False) else "No"
                in_process_list = "Yes" if self.current_photo_index in item.get("process_photos", []) else "No"
                
                photo_info = f"File: {os.path.basename(photo_path)}\nContext: {context}\nProcessed: {processed}\nSelected for processing: {in_process_list}"
                
                # If processed, show the result
                if photo_data.get("processed", False) and photo_data.get("api_result"):
                    api_result = photo_data.get("api_result", {})
                    if isinstance(api_result, dict) and "response" in api_result:
                        photo_info += f"\n\nDescription: {api_result['response'][:150]}..."
                
                self.photo_info_label.config(text=photo_info)
            else:
                # Clear photo display
                self.photo_label.config(image="", text="Photo file not found")
                self.current_photo_image = None  # Clear the reference
                
                self.photo_info_label.config(text=f"Path: {photo_path} (not found)")
        else:
            # Clear photo display
            self.photo_label.config(image="", text="No photo selected")
            self.current_photo_image = None  # Clear the reference
            
            self.photo_info_label.config(text="")
            
        # Update navigation buttons
        self.update_navigation_buttons()
    
    def display_photo(self, photo_path):
        """Display a photo in the UI."""
        try:
            # First clear any previous image reference to prevent memory leaks
            self.photo_label.config(image="")
            self.current_photo_image = None
            
            # Open the image 
            image = open_image_with_orientation(photo_path)
            
            # Update the UI to get current dimensions
            self.photo_frame.update()
            
            # Calculate size to fit in the frame
            frame_width = self.photo_frame.winfo_width() - 20
            frame_height = self.photo_frame.winfo_height() - 60  # Account for info label
            
            # Default if frame not yet sized
            if frame_width < 100:
                frame_width = 400
            if frame_height < 100:
                frame_height = 300
            
            # Maintain aspect ratio
            img_width, img_height = image.size
            ratio = min(frame_width/img_width, frame_height/img_height)
            
            new_width = int(img_width * ratio)
            new_height = int(img_height * ratio)
            
            # Resize image
            image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Convert to PhotoImage and store the reference
            photo = ImageTk.PhotoImage(image)
            self.current_photo_image = photo  # Store reference at class level
            
            # Update the photo label
            self.photo_label.config(image=self.current_photo_image, text="")
            
        except Exception as e:
            self.log(f"Error displaying photo: {str(e)}")
            self.photo_label.config(image="", text=f"Error loading image: {str(e)}")
            self.current_photo_image = None
    
    def show_description_editor(self):
        """Show a dialog to edit the current photo's description."""
        if (self.current_item_index < 0 or 
            self.current_photo_index < 0 or 
            self.current_item_index >= len(self.work_queue)):
            return
        
        item = self.work_queue[self.current_item_index]
        photos = item.get("photos", [])
        
        if not photos or self.current_photo_index >= len(photos):
            return
        
        photo_data = photos[self.current_photo_index]
        description = ""
        
        if photo_data.get("api_result") and "response" in photo_data["api_result"]:
            description = photo_data["api_result"]["response"]
        
        # Create a dialog window
        dialog = tk.Toplevel(self.root)
        dialog.title(f"Edit Description - {os.path.basename(photo_data.get('path', 'Photo'))}")
        dialog.geometry("600x400")
        dialog.transient(self.root)
        dialog.grab_set()
        
        # Add a text editor
        text_frame = ttk.Frame(dialog, padding=5)
        text_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        ttk.Label(text_frame, text="Description:").pack(anchor=tk.W)
        
        description_text = tk.Text(text_frame, wrap=tk.WORD, height=15)
        description_text.pack(fill=tk.BOTH, expand=True, pady=5)
        description_text.insert("1.0", description)
        
        # Add scrollbar
        text_scrollbar = ttk.Scrollbar(description_text, command=description_text.yview)
        text_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        description_text.config(yscrollcommand=text_scrollbar.set)
        
        # Button frame
        button_frame = ttk.Frame(dialog, padding=5)
        button_frame.pack(fill=tk.X, padx=10, pady=10)
        
        # Function to save changes
        def save_description():
            new_description = description_text.get("1.0", tk.END).strip()
            
            # Update the description in the photo data
            if "api_result" not in photo_data:
                photo_data["api_result"] = {}
            
            photo_data["api_result"]["response"] = new_description
            
            # If not already marked as processed, mark it now
            photo_data["processed"] = True
            photo_data["processed_at"] = datetime.now().isoformat()
            
            # Update display
            self.display_current_item()
            
            # Auto-save the queue
            if self.queue_file_path:
                save_queue(self.work_queue, self.queue_file_path)
                self.log("Queue auto-saved with edited description")
            
            # Close the dialog
            dialog.destroy()
            
            # Update queue status
            self.update_queue_status()
        
        # Add save and cancel buttons
        ttk.Button(button_frame, text="Save", command=save_description).pack(side=tk.RIGHT, padx=5)
        ttk.Button(button_frame, text="Cancel", command=dialog.destroy).pack(side=tk.RIGHT, padx=5)
        
        # Set focus to the text editor
        description_text.focus_set()
    
    def edit_item_specifics(self):
        """Show a dialog to edit the current item's specifics."""
        if self.current_item_index < 0 or self.current_item_index >= len(self.work_queue):
            return
        
        item = self.work_queue[self.current_item_index]
        
        # Extract item specifics
        item_specifics = EbayItemSchema.extract_item_specifics(item)
        
        # Create a dialog window
        dialog = tk.Toplevel(self.root)
        dialog.title(f"Edit Item Specifics - {item.get('temp_title', item.get('title', 'Item'))}")
        dialog.geometry("600x500")
        dialog.transient(self.root)
        dialog.grab_set()
        
        # Main frame
        main_frame = ttk.Frame(dialog, padding=10)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Create a treeview for the item specifics
        ttk.Label(main_frame, text="Item Specifics:").pack(anchor=tk.W, pady=(0, 5))
        
        tree_frame = ttk.Frame(main_frame)
        tree_frame.pack(fill=tk.BOTH, expand=True, pady=5)
        
        columns = ("Name", "Value")
        tree = ttk.Treeview(tree_frame, columns=columns, show="headings")
        tree.heading("Name", text="Name")
        tree.heading("Value", text="Value")
        
        tree.column("Name", width=200)
        tree.column("Value", width=350)
        
        tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        # Add scrollbar
        scrollbar = ttk.Scrollbar(tree_frame, orient=tk.VERTICAL, command=tree.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        tree.configure(yscrollcommand=scrollbar.set)
        
        # Populate the tree
        for name, value in sorted(item_specifics.items()):
            tree.insert("", tk.END, values=(name, value))
        
        # Button frame for add/edit/delete
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(fill=tk.X, pady=10)
        
        # Function to add a new item specific
        def add_item_specific():
            # Create a dialog
            add_dialog = tk.Toplevel(dialog)
            add_dialog.title("Add Item Specific")
            add_dialog.geometry("400x150")
            add_dialog.transient(dialog)
            add_dialog.grab_set()
            
            # Add fields
            ttk.Label(add_dialog, text="Name:").grid(row=0, column=0, padx=10, pady=10, sticky=tk.W)
            name_entry = ttk.Entry(add_dialog, width=30)
            name_entry.grid(row=0, column=1, padx=10, pady=10, sticky=tk.W)
            
            ttk.Label(add_dialog, text="Value:").grid(row=1, column=0, padx=10, pady=10, sticky=tk.W)
            value_entry = ttk.Entry(add_dialog, width=30)
            value_entry.grid(row=1, column=1, padx=10, pady=10, sticky=tk.W)
            
            # Button frame
            add_button_frame = ttk.Frame(add_dialog)
            add_button_frame.grid(row=2, column=0, columnspan=2, padx=10, pady=10)
            
            # Function to add the specific
            def do_add():
                name = name_entry.get().strip()
                value = value_entry.get().strip()
                
                if not name:
                    messagebox.showerror("Error", "Name is required", parent=add_dialog)
                    return
                
                if not value:
                    messagebox.showerror("Error", "Value is required", parent=add_dialog)
                    return
                
                # Add to the tree
                tree.insert("", tk.END, values=(name, value))
                
                # Close the dialog
                add_dialog.destroy()
            
            # Add buttons
            ttk.Button(add_button_frame, text="Add", command=do_add).pack(side=tk.LEFT, padx=5)
            ttk.Button(add_button_frame, text="Cancel", command=add_dialog.destroy).pack(side=tk.LEFT, padx=5)
            
            # Set focus to the name entry
            name_entry.focus_set()
        
        # Function to edit the selected item specific
        def edit_item_specific():
            selected = tree.selection()
            if not selected:
                messagebox.showinfo("Info", "Please select an item specific to edit", parent=dialog)
                return
            
            # Get the current values
            item_id = selected[0]
            name, value = tree.item(item_id, "values")
            
            # Create a dialog
            edit_dialog = tk.Toplevel(dialog)
            edit_dialog.title("Edit Item Specific")
            edit_dialog.geometry("400x150")
            edit_dialog.transient(dialog)
            edit_dialog.grab_set()
            
            # Add fields
            ttk.Label(edit_dialog, text="Name:").grid(row=0, column=0, padx=10, pady=10, sticky=tk.W)
            name_entry = ttk.Entry(edit_dialog, width=30)
            name_entry.grid(row=0, column=1, padx=10, pady=10, sticky=tk.W)
            name_entry.insert(0, name)
            
            ttk.Label(edit_dialog, text="Value:").grid(row=1, column=0, padx=10, pady=10, sticky=tk.W)
            value_entry = ttk.Entry(edit_dialog, width=30)
            value_entry.grid(row=1, column=1, padx=10, pady=10, sticky=tk.W)
            value_entry.insert(0, value)
            
            # Button frame
            edit_button_frame = ttk.Frame(edit_dialog)
            edit_button_frame.grid(row=2, column=0, columnspan=2, padx=10, pady=10)
            
            # Function to update the specific
            def do_update():
                new_name = name_entry.get().strip()
                new_value = value_entry.get().strip()
                
                if not new_name:
                    messagebox.showerror("Error", "Name is required", parent=edit_dialog)
                    return
                
                if not new_value:
                    messagebox.showerror("Error", "Value is required", parent=edit_dialog)
                    return
                
                # Update the tree
                tree.item(item_id, values=(new_name, new_value))
                
                # Close the dialog
                edit_dialog.destroy()
            
            # Add buttons
            ttk.Button(edit_button_frame, text="Update", command=do_update).pack(side=tk.LEFT, padx=5)
            ttk.Button(edit_button_frame, text="Cancel", command=edit_dialog.destroy).pack(side=tk.LEFT, padx=5)
            
            # Set focus to the value entry
            value_entry.focus_set()
        
        # Function to delete the selected item specific
        def delete_item_specific():
            selected = tree.selection()
            if not selected:
                messagebox.showinfo("Info", "Please select an item specific to delete", parent=dialog)
                return
            
            # Confirm
            if messagebox.askyesno("Confirm", "Are you sure you want to delete this item specific?", parent=dialog):
                # Delete from the tree
                tree.delete(selected[0])
        
        # Add buttons
        ttk.Button(button_frame, text="Add", command=add_item_specific).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="Edit", command=edit_item_specific).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="Delete", command=delete_item_specific).pack(side=tk.LEFT, padx=5)
        
        # Bottom button frame
        bottom_frame = ttk.Frame(main_frame)
        bottom_frame.pack(fill=tk.X, pady=10)
        
        # Function to save all changes
        def save_changes():
            # Get all item specifics from the tree
            new_specifics = {}
            
            for item_id in tree.get_children():
                name, value = tree.item(item_id, "values")
                new_specifics[name] = value
            
            # Update the item in the work queue
            if "item_specifics" not in item:
                item["item_specifics"] = {}
            
            # Replace the item specifics
            item["item_specifics"] = new_specifics
            
            # Auto-save the queue
            if self.queue_file_path:
                save_queue(self.work_queue, self.queue_file_path)
                self.log("Queue auto-saved with updated item specifics")
            
            # Close the dialog
            dialog.destroy()
            
            # Update display
            self.display_current_item()
        
        # Add save and cancel buttons
        ttk.Button(bottom_frame, text="Save Changes", command=save_changes).pack(side=tk.RIGHT, padx=5)
        ttk.Button(bottom_frame, text="Cancel", command=dialog.destroy).pack(side=tk.RIGHT, padx=5)
    
    def find_next_unprocessed(self):
        """Find the next unprocessed photo in the queue."""
        if not self.work_queue:
            return False
        
        # Start from current position or beginning
        start_item = self.current_item_index if self.current_item_index >= 0 else 0
        
        # Look through items
        for i in range(start_item, len(self.work_queue)):
            item = self.work_queue[i]
            
            # Skip if already processed
            if item.get("processed", False):
                continue
                
            photos = item.get("photos", [])
            process_photos = item.get("process_photos", [])
            
            # Find the first unprocessed photo in process_photos
            for photo_idx in process_photos:
                if photo_idx < len(photos) and not photos[photo_idx].get("processed", False):
                    self.current_item_index = i
                    self.current_photo_index = photo_idx
                    self.display_current_item()
                    return True
        
        # If we get here, no unprocessed photos found
        self.log("No more unprocessed photos in the queue.")
        return False
    
    def build_photo_prompt(self, item, photo_data):
        """Build an enhanced prompt for photo processing."""
        # Extract item details
        item_title = item.get('temp_title', '')
        item_sku = item.get('sku', '')
        item_notes = item.get('notes', '')
        item_category = item.get('category', '')
        
        # Start with comprehensive base prompt
        base_prompt = f"Describe this eBay item in detail: {item_title} (SKU: {item_sku})."
        
        # Add item category if available
        if item_category:
            base_prompt += f" Category: {item_category}."
            
        # Add condition if available
        if item.get('condition'):
            condition_code = item.get('condition')
            condition_desc = EbayItemSchema.CONDITION_MAP.get(condition_code, condition_code)
            base_prompt += f" Condition: {condition_desc}."
        
        # Add condition description if available
        if item.get('conditionDescription'):
            base_prompt += f" Condition details: {item.get('conditionDescription')}."
            
        # Add item notes if available
        if item_notes and item_notes != "Optional notes about this item":
            base_prompt += f" Additional notes: {item_notes}."
        
        # Add photo context if available
        if photo_data.get("context"):
            base_prompt += f" This specific photo shows: {photo_data.get('context')}"
        
        # Make it eBay specific with detailed instructions
        prompt = base_prompt + """

This will be used for an eBay listing. Please provide:
1. A detailed description of what you see in this specific photo
2. Item condition details visible in this photo
3. Any important measurements, features, or specifications visible
4. Any defects, wear, or issues visible in this photo
5. Brand information if visible
6. Model information if visible

Format your response as a cohesive paragraph that would be useful for a buyer. 
Focus on facts visible in this image, not speculation.
"""
        
        return prompt
    
    def process_current_photo(self):
        """Process the current photo using the API client."""
        if (self.current_item_index < 0 or 
            self.current_photo_index < 0 or 
            self.current_item_index >= len(self.work_queue)):
            self.log("No photo selected for processing")
            return False
        
        item = self.work_queue[self.current_item_index]
        photos = item.get("photos", [])
        process_photos = item.get("process_photos", [])
        
        # Skip if current photo not in process_photos
        if self.current_photo_index not in process_photos:
            self.log(f"Photo {self.current_photo_index} not selected for processing")
            return True
        
        if (self.current_photo_index >= len(photos) or
            not photos):
            self.log("Invalid photo index")
            return False
        
        photo_data = photos[self.current_photo_index]
        photo_path = photo_data.get("path", "")
        
        # Skip if already processed
        if photo_data.get("processed", False):
            self.log(f"Photo already processed: {os.path.basename(photo_path)}")
            return True
        
        if not photo_path or not os.path.exists(photo_path):
            self.log(f"Photo file not found: {photo_path}")
            return False
        
        # Check API client
        if not self.api_client:
            self.init_api_client()
            if not self.api_client:
                self.log("API client initialization failed")
                messagebox.showerror("Error", "API client initialization failed. Please check your settings.")
                return False
        
        try:
            # Build enhanced prompt
            prompt = self.build_photo_prompt(item, photo_data)
            
            # Log the request
            self.log(f"Processing photo: {os.path.basename(photo_path)}")
            
            # Process the photo using the API client
            response = self.api_client.process_photo(photo_path, prompt)
            
            # Update photo data with result
            photo_data["processed"] = True
            photo_data["processed_at"] = datetime.now().isoformat()
            photo_data["api_result"] = {"response": response}
            
            # Log success
            self.log(f"Successfully processed {os.path.basename(photo_path)}")
            self.log(f"Description: {response[:100]}...")
            
            # Check if all selected photos in this item are processed
            all_processed = True
            for idx in process_photos:
                if idx < len(photos) and not photos[idx].get("processed", False):
                    all_processed = False
                    break
            
            if all_processed:
                self.log(f"All selected photos processed for item {self.current_item_index + 1}")
                
                # Generate final description if requested
                if self.generate_final_var.get():
                    self.generate_final_description(item)
                else:
                    item["processed"] = True
                    item["processed_at"] = datetime.now().isoformat()
            
            # Update display
            self.display_current_item()
            self.update_queue_status()
            
            # Auto-save queue after each successful processing
            if self.queue_file_path:
                save_queue(self.work_queue, self.queue_file_path)
                self.log("Queue auto-saved")
            
            return True
        
        except Exception as e:
            self.log(f"Error processing photo: {str(e)}")
            
            # Mark as failed
            photo_data["last_error"] = str(e)
            photo_data["last_attempt"] = datetime.now().isoformat()
            
            return False
    
    def build_final_description_prompt(self, item, descriptions):
        """Build a prompt for generating the final item description."""
        item_sku = item.get("sku", "")
        item_notes = item.get("notes", "")
        item_category = item.get("category", "")
        
        # Create a prompt that includes all descriptions
        prompt = f"I need to create an eBay listing for this item (SKU: {item_sku}).\n\n"
        
        if item_notes:
            prompt += f"Seller notes: {item_notes}\n\n"
            
        if item_category:
            prompt += f"Category: {item_category}\n\n"
            
        prompt += "I have descriptions of the item from different angles:\n\n"
        
        for idx, (context, desc) in enumerate(descriptions):
            prompt += f"View {idx+1} ({context}):\n{desc}\n\n"
        
        prompt += """Based on all these descriptions, please provide:

1. A concise, SEO-friendly title that would be good for an eBay listing (80 characters max)
2. A comprehensive description that combines all the information
3. Suggested primary category for the item
4. Item condition (New, New Other, New with defects, Certified Refurbished, Seller Refurbished, Used, Very Good, Good, Acceptable, For parts)
5. Item specifics in a structured format with the following fields (where applicable):
   - Brand
   - Model
   - Type
   - Size
   - Color
   - Material
   - Style
   - Features
   - UPC/EAN/ISBN/MPN (if visible)
   - Dimensions
   - Weight
   - Country/Region of Manufacture
   - Condition details

Format the response with clear sections like "Title:", "Description:", "Category:", "Condition:", and "Item specifics:". 
For item specifics, use a format like "Brand: Apple" with each item specific on a new line.
"""
        
        return prompt
    
    def generate_final_description(self, item):
        """Generate a final comprehensive description and extract item specifics."""
        try:
            photos = item.get("photos", [])
            process_photos = item.get("process_photos", [])
            
            # Collect all descriptions
            descriptions = []
            for idx in process_photos:
                if idx < len(photos) and photos[idx].get("processed", False):
                    photo = photos[idx]
                    if photo.get("api_result") and "response" in photo["api_result"]:
                        desc = photo["api_result"]["response"]
                        context = photo.get("context", f"Photo {idx+1}")
                        descriptions.append((context, desc))
            
            if not descriptions:
                self.log("No descriptions available to generate final description")
                return False
            
            # Build the prompt
            prompt = self.build_final_description_prompt(item, descriptions)
            
            # Check API client
            if not self.api_client:
                self.init_api_client()
                if not self.api_client:
                    self.log("API client initialization failed")
                    messagebox.showerror("Error", "API client initialization failed. Please check your settings.")
                    return False
            
            # Generate the final description
            self.log("Generating final description...")
            final_description = self.api_client.generate_text(prompt)
            
            # Extract title from the final description
            title = item.get("temp_title", "")
            
            # Try to extract a better title from the response
            if "Title:" in final_description:
                title_parts = final_description.split("Title:", 1)
                if len(title_parts) > 1:
                    title_line = title_parts[1].strip().split("\n")[0].strip()
                    if title_line:
                        title = title_line
            
            # Extract item specifics
            item_specifics = {}
            if "Item specifics:" in final_description or "Item Specifics:" in final_description:
                # Find the item specifics section
                spec_marker = "Item specifics:" if "Item specifics:" in final_description else "Item Specifics:"
                spec_parts = final_description.split(spec_marker, 1)
                
                if len(spec_parts) > 1:
                    spec_text = spec_parts[1]
                    
                    # Find the end of the section (next section heading or end of text)
                    end_markers = ["Description:", "Category:", "Condition:"]
                    end_pos = len(spec_text)
                    
                    for marker in end_markers:
                        marker_pos = spec_text.find(marker)
                        if marker_pos > 0 and marker_pos < end_pos:
                            end_pos = marker_pos
                    
                    # Extract the item specifics section
                    spec_section = spec_text[:end_pos].strip()
                    
                    # Parse each line for item specifics
                    for line in spec_section.split('\n'):
                        line = line.strip()
                        if not line or line.startswith('-'):
                            continue
                            
                        # Look for "Key: Value" pattern
                        if ':' in line:
                            key, value = line.split(':', 1)
                            key = key.strip()
                            value = value.strip()
                            
                            # Skip bullet points or empty values
                            if key and value and not key.startswith('-'):
                                item_specifics[key] = value
            
            # Extract condition
            condition_code = "1000"  # Default to New
            condition_text = ""
            
            if "Condition:" in final_description:
                condition_parts = final_description.split("Condition:", 1)
                if len(condition_parts) > 1:
                    condition_line = condition_parts[1].strip().split('\n')[0].strip()
                    condition_text = condition_line
                    
                    # Map condition text to eBay condition codes
                    for code, desc in EbayItemSchema.CONDITION_MAP.items():
                        if desc.lower() in condition_text.lower():
                            condition_code = code
                            break
            
            # Extract category
            category = ""
            if "Category:" in final_description:
                category_parts = final_description.split("Category:", 1)
                if len(category_parts) > 1:
                    category_line = category_parts[1].strip().split('\n')[0].strip()
                    category = category_line
            
            # Update the item with the final results
            item["processed"] = True
            item["processed_at"] = datetime.now().isoformat()
            item["title"] = title  # Use the extracted title
            
            if category:
                item["category"] = category
                
            item["condition"] = condition_code
            item["conditionDescription"] = condition_text
            
            # Save item specifics
            item["item_specifics"] = item_specifics
            
            # Save full description
            item["description"] = final_description
            
            if "api_results" not in item:
                item["api_results"] = []
            
            item["api_results"].append({
                "processed_at": datetime.now().isoformat(),
                "final_description": final_description,
                "item_specifics": item_specifics
            })
            
            self.log(f"Generated final description for item {self.current_item_index + 1}")
            self.log(f"Title: {title}")
            self.log(f"Extracted {len(item_specifics)} item specifics")
            
            # Auto-save queue
            if self.queue_file_path:
                save_queue(self.work_queue, self.queue_file_path)
                self.log("Queue auto-saved with final description")
            
            return True
        
        except Exception as e:
            error_msg = f"Error generating final description: {str(e)}"
            self.log(error_msg)
            
            # Mark the item as processed even if final description fails
            item["processed"] = True
            item["processed_at"] = datetime.now().isoformat()
            
            if "api_results" not in item:
                item["api_results"] = []
            
            item["api_results"].append({
                "processed_at": datetime.now().isoformat(),
                "error": error_msg
            })
            
            return False
    
    def start_processing(self):
        """Start processing all unprocessed photos in the queue."""
        if not self.work_queue:
            messagebox.showinfo("Info", "No queue loaded. Please load a queue first.")
            return
        
        if self.processing:
            messagebox.showinfo("Info", "Processing already in progress.")
            return
        
        # Check API client
        if not self.api_client:
            self.init_api_client()
            if not self.api_client:
                messagebox.showerror("Error", "API client initialization failed. Please check your settings.")
                return
        
        # Find unprocessed photos in the queue
        unprocessed_photos = []
        for i, item in enumerate(self.work_queue):
            photos = item.get("photos", [])
            process_photos = item.get("process_photos", [])
            
            for photo_idx in process_photos:
                if photo_idx < len(photos) and not photos[photo_idx].get("processed", False):
                    unprocessed_photos.append((i, photo_idx))
        
        if not unprocessed_photos:
            messagebox.showinfo("Info", "No unprocessed photos found in the queue.")
            return
        
        # Start processing in background thread
        self.processing = True
        self.thread_stop_flag = False
        
        # Update UI
        self.start_btn.config(state=tk.DISABLED)
        self.stop_btn.config(state=tk.NORMAL)
        self.progress_label.config(text=f"Processing 0/{len(unprocessed_photos)} photos")
        self.progress_bar["value"] = 0
        
        # Create background task for processing
        self.task_manager.create_and_start_task(
            name="Process Photos",
            target_function=self._process_photos_task,
            kwargs={
                'unprocessed_photos': unprocessed_photos
            },
            on_progress=self._update_processing_progress,
            on_complete=self._on_processing_complete,
            on_error=self._on_processing_error
        )
    
    def _process_photos_task(self, unprocessed_photos, report_progress, check_cancelled):
        """Background task to process all unprocessed photos."""
        total_photos = len(unprocessed_photos)
        processed_count = 0
        start_time = time.time()
        
        for i, (item_idx, photo_idx) in enumerate(unprocessed_photos):
            # Check if processing was cancelled
            if check_cancelled():
                break
            
            # Process photo
            try:
                # Navigate to the photo
                self.current_item_index = item_idx
                self.current_photo_index = photo_idx
                
                # Use the main thread to update UI
                self.root.after(0, self.display_current_item)
                
                # Get item and photo data
                item = self.work_queue[item_idx]
                photos = item.get("photos", [])
                photo_data = photos[photo_idx]
                photo_path = photo_data.get("path", "")
                
                # Report progress
                elapsed = time.time() - start_time
                if i > 0:
                    avg_time_per_photo = elapsed / i
                    remaining_photos = total_photos - i
                    estimated_time = remaining_photos * avg_time_per_photo
                    time_str = f"EST: {int(estimated_time // 60)}m {int(estimated_time % 60)}s"
                else:
                    time_str = "Estimating time..."
                
                report_progress(i, total_photos, f"Processing {os.path.basename(photo_path)}... {time_str}")
                
                # Build prompt
                prompt = self.build_photo_prompt(item, photo_data)
                
                # Process the photo
                response = self.api_client.process_photo(photo_path, prompt)
                
                # Update photo data
                photo_data["processed"] = True
                photo_data["processed_at"] = datetime.now().isoformat()
                photo_data["api_result"] = {"response": response}
                
                # Check if all selected photos in this item are processed
                process_photos = item.get("process_photos", [])
                all_processed = True
                for idx in process_photos:
                    if idx < len(photos) and not photos[idx].get("processed", False):
                        all_processed = False
                        break
                
                if all_processed:
                    # Generate final description if requested
                    if self.generate_final_var.get():
                        self.generate_final_description(item)
                    else:
                        item["processed"] = True
                        item["processed_at"] = datetime.now().isoformat()
                
                # Auto-save queue after each successful processing
                if self.queue_file_path:
                    save_queue(self.work_queue, self.queue_file_path)
                
                processed_count += 1
                
            except Exception as e:
                # Log error and continue with next photo
                self.log(f"Error processing photo: {str(e)}")
                
                # Mark as failed if we have valid indices
                try:
                    item = self.work_queue[item_idx]
                    photos = item.get("photos", [])
                    photo_data = photos[photo_idx]
                    photo_data["last_error"] = str(e)
                    photo_data["last_attempt"] = datetime.now().isoformat()
                except:
                    pass
            
            # Delay between photos to avoid rate limiting
            time.sleep(self.delay_var.get())
        
        # Return results
        return {
            "total": total_photos,
            "processed": processed_count,
            "elapsed_time": time.time() - start_time
        }
    
    def _update_processing_progress(self, current, total, message):
        """Update progress UI during processing."""
        progress_pct = (current / total) * 100 if total > 0 else 0
        
        # Update progress bar and labels
        self.progress_bar["value"] = progress_pct
        self.progress_label.config(text=f"Processing {current}/{total} photos")
        self.time_remaining_label.config(text=message)
        
        # Update the queue status
        self.update_queue_status()
    
    def _on_processing_complete(self, result):
        """Handle completion of processing task."""
        self.processing = False
        
        # Update UI
        self.start_btn.config(state=tk.NORMAL)
        self.stop_btn.config(state=tk.DISABLED)
        
        elapsed = result["elapsed_time"]
        if elapsed > 60:
            time_str = f"{int(elapsed // 60)}m {int(elapsed % 60)}s"
        else:
            time_str = f"{int(elapsed)}s"
        
        final_message = f"Processing completed: {result['processed']}/{result['total']} photos processed in {time_str}"
        self.progress_label.config(text=final_message)
        self.time_remaining_label.config(text="")
        
        # Update the current item display
        self.display_current_item()
        
        # Log completion
        self.log(final_message)
        
        # Show completion message
        messagebox.showinfo("Processing Complete", final_message)
    
    def _on_processing_error(self, error):
        """Handle error in processing task."""
        self.processing = False
        
        # Update UI
        self.start_btn.config(state=tk.NORMAL)
        self.stop_btn.config(state=tk.DISABLED)
        self.progress_label.config(text=f"Error: {str(error)}")
        self.time_remaining_label.config(text="")
        
        # Log error
        self.log(f"Processing error: {str(error)}")
        
        # Show error message
        messagebox.showerror("Processing Error", f"An error occurred during processing: {str(error)}")
    
    def stop_processing(self):
        """Stop the current processing task."""
        if not self.processing:
            return
        
        # Ask for confirmation
        if not messagebox.askyesno("Confirm", "Are you sure you want to stop the current processing job?"):
            return
        
        # Set stop flag
        self.thread_stop_flag = True
        
        # Update UI
        self.stop_btn.config(state=tk.DISABLED)
        self.progress_label.config(text="Stopping processing...")
        
        # Log
        self.log("Stopping processing...")
    
    def reprocess_current(self):
        """Reprocess the current photo."""
        if (self.current_item_index < 0 or 
            self.current_photo_index < 0 or 
            self.current_item_index >= len(self.work_queue)):
            messagebox.showinfo("Info", "No photo selected.")
            return
        
        item = self.work_queue[self.current_item_index]
        photos = item.get("photos", [])
        
        if (self.current_photo_index >= len(photos) or
            not photos):
            messagebox.showinfo("Info", "No photo selected.")
            return
        
        # Make sure the photo is selected for processing
        process_photos = item.get("process_photos", [])
        if self.current_photo_index not in process_photos:
            if messagebox.askyesno("Confirm", "This photo is not selected for processing. Add it to the processing list?"):
                if "process_photos" not in item:
                    item["process_photos"] = []
                item["process_photos"].append(self.current_photo_index)
                process_photos = item["process_photos"]
            else:
                return
        
        # Force reprocessing even if already processed
        photo_data = photos[self.current_photo_index]
        
        # Clear previous processing result
        if "processed" in photo_data:
            del photo_data["processed"]
        if "processed_at" in photo_data:
            del photo_data["processed_at"]
        if "api_result" in photo_data:
            del photo_data["api_result"]
        
        # Process the photo
        if self.process_current_photo():
            messagebox.showinfo("Success", "Photo processed successfully.")
        else:
            messagebox.showerror("Error", "Failed to process photo.")
    
    def launch_viewer(self):
        """Launch the eBay JSON Viewer application."""
        try:
            # Check if we have a saved queue
            if not self.queue_file_path:
                messagebox.showinfo("Info", "Please save the queue first.")
                self.save_queue()
                if not self.queue_file_path:
                    return
            
            # Create the viewer import path
            viewer_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "viewer.py")
            
            # Check if viewer exists
            if not os.path.exists(viewer_path):
                messagebox.showerror("Error", "Viewer application not found.")
                return
            
            # Launch the viewer with the current file
            python_exe = sys.executable
            subprocess.Popen([python_exe, viewer_path, self.queue_file_path])
            
            self.log(f"Launched viewer with {self.queue_file_path}")
            
        except Exception as e:
            self.log(f"Error launching viewer: {str(e)}")
            messagebox.showerror("Error", f"Failed to launch viewer: {str(e)}")


def main():
    """Main function to start the application."""
    root = tk.Tk()
    app = EbayLLMProcessor(root)
    root.mainloop()


if __name__ == "__main__":
    main()