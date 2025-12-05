"""
Launcher utilities for cross-application navigation in eBay Tools.
Provides a consistent way to launch different tools from any other tool.
"""

import os
import sys
import subprocess
import logging
from typing import Optional, List
from tkinter import messagebox

logger = logging.getLogger(__name__)


class ToolLauncher:
    """Manages launching of eBay Tools applications."""
    
    # Define available tools and their entry points
    TOOLS = {
        "setup": {
            "file": "setup.py",
            "name": "Queue Setup",
            "description": "Create and manage work queues"
        },
        "processor": {
            "file": "processor.py", 
            "name": "LLM Processor",
            "description": "Process items with AI"
        },
        "viewer": {
            "file": "viewer.py",
            "name": "JSON Viewer", 
            "description": "View and explore data"
        },
        "price_analyzer": {
            "file": "price_analyzer.py",
            "name": "Price Analyzer",
            "description": "Analyze pricing data"
        },
        "direct_listing": {
            "file": "direct_listing.py",
            "name": "Direct Listing",
            "description": "Create eBay listings"
        },
        "gallery": {
            "file": "gallery_creator.py",
            "name": "Gallery Creator",
            "description": "Create HTML galleries"
        },
        "mobile": {
            "file": "mobile_import.py",
            "name": "Mobile Import",
            "description": "Import from mobile devices"
        },
        "csv_export": {
            "file": "csv_export.py",
            "name": "CSV Export",
            "description": "Export data to CSV"
        }
    }
    
    @classmethod
    def get_tool_path(cls, tool_key: str) -> Optional[str]:
        """Get the full path to a tool's entry point."""
        if tool_key not in cls.TOOLS:
            return None
            
        # Get the directory where this file is located
        utils_dir = os.path.dirname(os.path.abspath(__file__))
        # Go up one level to ebay_tools, then to apps
        apps_dir = os.path.join(os.path.dirname(utils_dir), "apps")
        
        tool_file = cls.TOOLS[tool_key]["file"]
        tool_path = os.path.join(apps_dir, tool_file)
        
        if os.path.exists(tool_path):
            return tool_path
        return None
    
    @classmethod
    def launch_tool(cls, tool_key: str, args: Optional[List[str]] = None, 
                   show_error: bool = True) -> bool:
        """
        Launch a tool by its key.
        
        Args:
            tool_key: Key identifying the tool (e.g., 'viewer', 'processor')
            args: Optional command line arguments to pass to the tool
            show_error: Whether to show error dialog on failure
            
        Returns:
            True if launch was successful, False otherwise
        """
        if tool_key not in cls.TOOLS:
            if show_error:
                messagebox.showerror("Error", f"Unknown tool: {tool_key}")
            return False
            
        tool_path = cls.get_tool_path(tool_key)
        if not tool_path:
            if show_error:
                messagebox.showerror("Error", 
                    f"{cls.TOOLS[tool_key]['name']} not found at expected location")
            return False
            
        try:
            # Build command
            python_exe = sys.executable
            cmd = [python_exe, tool_path]
            if args:
                cmd.extend(args)
                
            # Launch the tool
            logger.info(f"Launching {cls.TOOLS[tool_key]['name']}: {' '.join(cmd)}")
            subprocess.Popen(cmd)
            
            return True
            
        except Exception as e:
            logger.error(f"Error launching {tool_key}: {str(e)}")
            if show_error:
                messagebox.showerror("Launch Error", 
                    f"Failed to launch {cls.TOOLS[tool_key]['name']}: {str(e)}")
            return False
    
    @classmethod
    def launch_viewer(cls, json_file: Optional[str] = None) -> bool:
        """Launch the JSON Viewer, optionally with a file to open."""
        args = [json_file] if json_file else None
        return cls.launch_tool("viewer", args)
    
    @classmethod
    def launch_processor(cls, queue_file: Optional[str] = None) -> bool:
        """Launch the LLM Processor, optionally with a queue file."""
        args = [queue_file] if queue_file else None
        return cls.launch_tool("processor", args)
    
    @classmethod
    def launch_setup(cls) -> bool:
        """Launch the Queue Setup tool."""
        return cls.launch_tool("setup")
    
    @classmethod
    def launch_price_analyzer(cls, json_file: Optional[str] = None) -> bool:
        """Launch the Price Analyzer, optionally with a file."""
        args = [json_file] if json_file else None
        return cls.launch_tool("price_analyzer", args)
    
    @classmethod
    def launch_gallery(cls, json_file: Optional[str] = None) -> bool:
        """Launch the Gallery Creator, optionally with a file."""
        args = [json_file] if json_file else None
        return cls.launch_tool("gallery", args)
    
    @classmethod
    def launch_csv_export(cls, json_file: Optional[str] = None) -> bool:
        """Launch the CSV Export tool, optionally with a file."""
        args = [json_file] if json_file else None
        return cls.launch_tool("csv_export", args)
    
    @classmethod
    def launch_mobile_import(cls) -> bool:
        """Launch the Mobile Import tool."""
        return cls.launch_tool("mobile")
    
    @classmethod
    def launch_direct_listing(cls) -> bool:
        """Launch the Direct Listing tool."""
        return cls.launch_tool("direct_listing")
    
    @classmethod
    def get_available_tools(cls) -> dict:
        """Get information about all available tools."""
        available = {}
        for key, info in cls.TOOLS.items():
            if cls.get_tool_path(key):
                available[key] = info
        return available


def create_tools_menu(parent_menu, parent_window=None, current_tool=None):
    """
    Create a standard "Tools" menu for any eBay Tools application.
    
    Args:
        parent_menu: The menu to add items to (e.g., a Menu widget)
        parent_window: The parent window (for positioning dialogs)
        current_tool: Key of the current tool (to disable self-launch)
    """
    tools = ToolLauncher.get_available_tools()
    
    for key, info in tools.items():
        if key == current_tool:
            # Add disabled entry for current tool
            parent_menu.add_command(
                label=f"{info['name']} (Current)",
                state="disabled"
            )
        else:
            # Add enabled entry for other tools
            parent_menu.add_command(
                label=info['name'],
                command=lambda k=key: ToolLauncher.launch_tool(k)
            )
    
    return parent_menu


def create_launch_buttons_frame(parent_frame, current_tool=None, 
                               pack_side="left", show_descriptions=False):
    """
    Create a frame with launch buttons for all tools.
    
    Args:
        parent_frame: The tkinter frame to add buttons to
        current_tool: Key of the current tool (to disable self-launch)
        pack_side: Side to pack buttons ('left', 'right', 'top', 'bottom')
        show_descriptions: Whether to show tool descriptions
    
    Returns:
        Dict of button widgets keyed by tool name
    """
    import tkinter as tk
    from tkinter import ttk
    
    buttons = {}
    tools = ToolLauncher.get_available_tools()
    
    for key, info in tools.items():
        if key == current_tool:
            continue  # Skip current tool
            
        if show_descriptions:
            # Create a frame for button and description
            tool_frame = ttk.Frame(parent_frame)
            tool_frame.pack(side=pack_side, padx=5, pady=2)
            
            btn = ttk.Button(
                tool_frame,
                text=info['name'],
                command=lambda k=key: ToolLauncher.launch_tool(k)
            )
            btn.pack(side="top")
            
            desc_label = ttk.Label(
                tool_frame,
                text=info['description'],
                font=('TkDefaultFont', 8)
            )
            desc_label.pack(side="top")
            
            buttons[key] = btn
        else:
            # Just create button
            btn = ttk.Button(
                parent_frame,
                text=info['name'],
                command=lambda k=key: ToolLauncher.launch_tool(k)
            )
            btn.pack(side=pack_side, padx=5)
            buttons[key] = btn
    
    return buttons