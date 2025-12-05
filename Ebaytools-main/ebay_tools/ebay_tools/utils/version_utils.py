"""
Version utilities for eBay Tools applications.
Provides standardized version detection and About dialog functionality.
"""

import os
import tkinter as tk
from tkinter import messagebox


def get_version():
    """
    Get the current version of eBay Tools with robust fallback methods.
    
    Returns:
        str: Version string (e.g., "3.0.0") or "Unknown" if detection fails
    """
    version = "Unknown"
    
    # Method 1: Try importing from package
    try:
        from ebay_tools import __version__
        version = __version__
        return version
    except ImportError:
        pass
    
    # Method 2: Try reading from __init__.py file directly
    try:
        # Get the path to the ebay_tools package
        current_dir = os.path.dirname(__file__)
        package_dir = os.path.dirname(current_dir)
        init_file = os.path.join(package_dir, "__init__.py")
        
        with open(init_file, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip().startswith('__version__'):
                    # Extract version from line like: __version__ = "3.0.0"
                    version = line.split('=')[1].strip().strip('"\'')
                    return version
    except Exception:
        pass
    
    # Method 3: Try alternative path (for standalone scripts)
    try:
        # For scripts in root directory, look for ebay_tools/__init__.py
        current_dir = os.path.dirname(__file__)
        alt_init_file = os.path.join(current_dir, "..", "..", "__init__.py")
        alt_init_file = os.path.normpath(alt_init_file)
        
        if os.path.exists(alt_init_file):
            with open(alt_init_file, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.strip().startswith('__version__'):
                        version = line.split('=')[1].strip().strip('"\'')
                        return version
    except Exception:
        pass
    
    # Method 4: Fallback to known current version
    return "3.0.0"


def show_about_dialog(parent, app_name, app_description="", features=None):
    """
    Show a standardized About dialog for eBay Tools applications.
    
    Args:
        parent: Parent window for the dialog
        app_name (str): Name of the application (e.g., "eBay Processor")
        app_description (str): Optional description of the application
        features (list): Optional list of key features to display
    """
    version = get_version()
    
    # Build the about text
    about_text = f"{app_name}\nVersion: {version}\nPart of eBay Tools Suite"
    
    if app_description:
        about_text += f"\n\n{app_description}"
    
    if features:
        about_text += "\n\nKey Features:"
        for feature in features:
            about_text += f"\n• {feature}"
    
    # Add common information
    about_text += f"\n\neBay Tools v{version} - Complete listing automation suite"
    about_text += "\nFor support and documentation, check the User Manual."
    
    messagebox.showinfo(f"About {app_name}", about_text)


def create_help_menu(menubar, parent, app_name, app_description="", features=None, additional_help_items=None):
    """
    Create a standardized Help menu for eBay Tools applications.
    
    Args:
        menubar: The tkinter menubar to add the Help menu to
        parent: Parent window for dialogs
        app_name (str): Name of the application
        app_description (str): Optional description
        features (list): Optional list of features
        additional_help_items (list): Optional list of (label, callback) tuples for additional help items
    
    Returns:
        tk.Menu: The created Help menu (in case app wants to add more items)
    """
    help_menu = tk.Menu(menubar, tearoff=0)
    
    # Add any additional help items first
    if additional_help_items:
        for label, callback in additional_help_items:
            help_menu.add_command(label=label, command=callback)
        help_menu.add_separator()
    
    # Add standard About menu item
    help_menu.add_command(
        label="About",
        command=lambda: show_about_dialog(parent, app_name, app_description, features)
    )
    
    menubar.add_cascade(label="Help", menu=help_menu)
    return help_menu


# Pre-defined feature lists for common applications
PROCESSOR_FEATURES = [
    "AI-powered photo description generation",
    "Processing tags reset functionality", 
    "Interactive pricing system",
    "Batch processing capabilities",
    "Multiple LLM API support",
    "Auto-save and queue management"
]

SETUP_FEATURES = [
    "Work queue creation and management",
    "Photo import and organization",
    "Batch item setup",
    "Queue validation and verification", 
    "Item metadata management"
]

VIEWER_FEATURES = [
    "Review processed items and descriptions",
    "Photo gallery display",
    "Export to multiple formats",
    "Queue status overview",
    "Item editing and updates"
]

PRICE_ANALYZER_FEATURES = [
    "eBay sold listings research",
    "Interactive pricing with user approval",
    "Market analysis and statistics",
    "Manual pricing for unique items",
    "Comprehensive pricing metadata"
]

GALLERY_FEATURES = [
    "HTML gallery generation",
    "Classified ad-style layouts", 
    "Multiple photo display formats",
    "Custom styling options",
    "Export ready galleries"
]