"""
eBay Tools Suite Launcher - Central hub for launching all eBay tools.

This application provides a unified interface to launch all the different
tools in the eBay Tools Suite.
"""

import os
import sys
import tkinter as tk
from tkinter import ttk, messagebox
import logging
from datetime import datetime

# Add parent directory to path
if __name__ == "__main__":
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from ebay_tools.utils.launcher_utils import ToolLauncher
from ebay_tools.core.config import ConfigManager
from ebay_tools.utils.version_utils import create_help_menu

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class EbayToolsLauncher:
    """Main launcher application for eBay Tools Suite."""
    
    def __init__(self, root):
        """Initialize the launcher."""
        self.root = root
        self.root.title("eBay Tools Suite")
        self.root.geometry("800x600")
        
        # Center the window
        self.center_window()
        
        # Create the UI
        self.create_ui()
        
        # Load config
        self.config_manager = ConfigManager()
        self.config_manager.load()
    
    def center_window(self):
        """Center the window on screen."""
        self.root.update_idletasks()
        width = self.root.winfo_width()
        height = self.root.winfo_height()
        x = (self.root.winfo_screenwidth() // 2) - (width // 2)
        y = (self.root.winfo_screenheight() // 2) - (height // 2)
        self.root.geometry(f"{width}x{height}+{x}+{y}")
    
    def create_menu(self):
        """Create the application menu."""
        menubar = tk.Menu(self.root)
        
        # Help menu with version info
        features = [
            "Central hub for all eBay Tools",
            "Organized workflow tabs",
            "One-click tool launching",
            "Status monitoring",
            "Tool availability checking"
        ]
        
        create_help_menu(
            menubar, 
            self.root, 
            "eBay Tools Launcher",
            "Central hub for launching all eBay Tools applications",
            features
        )
        
        self.root.config(menu=menubar)
    
    def create_ui(self):
        """Create the launcher UI."""
        # Create menu bar
        self.create_menu()
        
        # Main frame
        main_frame = ttk.Frame(self.root, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Title
        title_label = ttk.Label(
            main_frame, 
            text="eBay Tools Suite", 
            font=("Helvetica", 24, "bold")
        )
        title_label.pack(pady=(0, 10))
        
        subtitle_label = ttk.Label(
            main_frame,
            text="Complete solution for eBay listing automation",
            font=("Helvetica", 12)
        )
        subtitle_label.pack(pady=(0, 30))
        
        # Create notebook for categorized tools
        notebook = ttk.Notebook(main_frame)
        notebook.pack(fill=tk.BOTH, expand=True)
        
        # Workflow tools tab
        workflow_frame = ttk.Frame(notebook, padding="20")
        notebook.add(workflow_frame, text="Main Workflow")
        self.create_workflow_tools(workflow_frame)
        
        # Processing tools tab
        processing_frame = ttk.Frame(notebook, padding="20")
        notebook.add(processing_frame, text="Processing & Analysis")
        self.create_processing_tools(processing_frame)
        
        # Export/Import tools tab
        io_frame = ttk.Frame(notebook, padding="20")
        notebook.add(io_frame, text="Import/Export")
        self.create_io_tools(io_frame)
        
        # Status bar
        status_frame = ttk.Frame(self.root)
        status_frame.pack(fill=tk.X, side=tk.BOTTOM)
        
        self.status_label = ttk.Label(
            status_frame,
            text="Ready to launch tools",
            relief=tk.SUNKEN
        )
        self.status_label.pack(fill=tk.X, padx=2, pady=2)
    
    def create_tool_button(self, parent, tool_key, row, column, description=None):
        """Create a button for launching a tool."""
        tool_info = ToolLauncher.TOOLS.get(tool_key, {})
        
        # Create frame for button and description
        button_frame = ttk.Frame(parent)
        button_frame.grid(row=row, column=column, padx=10, pady=10, sticky="nsew")
        
        # Configure grid weight
        parent.grid_columnconfigure(column, weight=1)
        parent.grid_rowconfigure(row, weight=1)
        
        # Create button
        btn = ttk.Button(
            button_frame,
            text=tool_info.get("name", tool_key),
            command=lambda: self.launch_tool(tool_key),
            width=20
        )
        btn.pack(pady=(0, 5))
        
        # Add description
        desc_text = description or tool_info.get("description", "")
        if desc_text:
            desc_label = ttk.Label(
                button_frame,
                text=desc_text,
                font=("Helvetica", 9),
                wraplength=180
            )
            desc_label.pack()
        
        return btn
    
    def create_workflow_tools(self, parent):
        """Create buttons for main workflow tools."""
        # Add header
        header = ttk.Label(
            parent,
            text="Main workflow for creating and processing eBay listings",
            font=("Helvetica", 11)
        )
        header.grid(row=0, column=0, columnspan=3, pady=(0, 20))
        
        # Step indicators
        steps = [
            ("1. Setup", "Create work queue\nand add items"),
            ("2. Process", "Process photos\nwith AI"),
            ("3. View", "Review and edit\nresults")
        ]
        
        for i, (step, desc) in enumerate(steps):
            step_frame = ttk.LabelFrame(parent, text=step, padding="10")
            step_frame.grid(row=1, column=i, padx=10, pady=10, sticky="nsew")
            
            # Configure grid
            parent.grid_columnconfigure(i, weight=1)
            parent.grid_rowconfigure(1, weight=1)
            
            # Add description
            ttk.Label(
                step_frame,
                text=desc,
                font=("Helvetica", 10),
                justify=tk.CENTER
            ).pack(pady=(0, 10))
            
            # Add button
            if i == 0:
                tool_key = "setup"
            elif i == 1:
                tool_key = "processor"
            else:
                tool_key = "viewer"
            
            btn = ttk.Button(
                step_frame,
                text=f"Launch {ToolLauncher.TOOLS[tool_key]['name']}",
                command=lambda k=tool_key: self.launch_tool(k),
                width=20
            )
            btn.pack()
    
    def create_processing_tools(self, parent):
        """Create buttons for processing and analysis tools."""
        # Price Analyzer
        self.create_tool_button(
            parent, "price_analyzer", 0, 0,
            "Analyze pricing based on\nsold listings"
        )
        
        # Gallery Creator
        self.create_tool_button(
            parent, "gallery", 0, 1,
            "Create HTML galleries\nfor classified ads"
        )
        
        # Direct Listing
        self.create_tool_button(
            parent, "direct_listing", 1, 0,
            "Create listings directly\non eBay (Demo)"
        )
    
    def create_io_tools(self, parent):
        """Create buttons for import/export tools."""
        # CSV Export
        self.create_tool_button(
            parent, "csv_export", 0, 0,
            "Export listings to CSV\nfor bulk upload"
        )
        
        # Mobile Import
        self.create_tool_button(
            parent, "mobile", 0, 1,
            "Import photos from\nmobile devices"
        )
    
    def launch_tool(self, tool_key):
        """Launch a tool and update status."""
        tool_info = ToolLauncher.TOOLS.get(tool_key, {})
        tool_name = tool_info.get("name", tool_key)
        
        self.status_label.config(text=f"Launching {tool_name}...")
        self.root.update()
        
        success = ToolLauncher.launch_tool(tool_key)
        
        if success:
            self.status_label.config(text=f"Successfully launched {tool_name}")
        else:
            self.status_label.config(text=f"Failed to launch {tool_name}")
        
        # Reset status after 3 seconds
        self.root.after(3000, lambda: self.status_label.config(text="Ready to launch tools"))


def main():
    """Main function to start the launcher."""
    root = tk.Tk()
    app = EbayToolsLauncher(root)
    root.mainloop()


if __name__ == "__main__":
    main()