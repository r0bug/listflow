"""
ui_utils.py - Standardized UI utilities for eBay listing tools

This module provides reusable UI components and helpers including:
- Standard dialog boxes
- Navigation controls
- Status bar management
- Common widgets like photo frames
- UI-related utility functions
"""

import os
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import logging
from typing import Dict, List, Any, Optional, Union, Callable, Tuple
from datetime import datetime

# Configure logging
logger = logging.getLogger(__name__)

# ===== Status Bar Functions =====

class StatusBar:
    """
    Status bar component with timestamp and logging integration.
    """
    
    def __init__(self, parent: tk.Widget, initial_text: str = "Ready"):
        """
        Initialize the status bar.
        
        Args:
            parent: Parent widget
            initial_text: Initial status text
        """
        self.status_var = tk.StringVar(value=initial_text)
        self.status_bar = ttk.Label(
            parent, 
            textvariable=self.status_var, 
            relief=tk.SUNKEN, 
            anchor=tk.W,
            padding=(5, 2)
        )
        self.status_bar.pack(side=tk.BOTTOM, fill=tk.X)
    
    def update(self, message: str, log_level: int = logging.INFO):
        """
        Update the status bar with a message and log it.
        
        Args:
            message: Status message
            log_level: Logging level to use
        """
        # Add timestamp
        timestamp = datetime.now().strftime("%H:%M:%S")
        status_text = f"[{timestamp}] {message}"
        
        # Update status bar
        self.status_var.set(status_text)
        
        # Log the message
        logger.log(log_level, message)
        
        # Force update
        self.status_bar.update_idletasks()

# ===== Dialog Box Functions =====

def show_error(title: str, message: str, parent: Optional[tk.Widget] = None) -> None:
    """
    Show a standardized error message box.
    
    Args:
        title: Dialog title
        message: Error message
        parent: Parent widget (None for main window)
    """
    logger.error(f"ERROR - {title}: {message}")
    messagebox.showerror(title, message, parent=parent)

def show_warning(title: str, message: str, parent: Optional[tk.Widget] = None) -> None:
    """
    Show a standardized warning message box.
    
    Args:
        title: Dialog title
        message: Warning message
        parent: Parent widget (None for main window)
    """
    logger.warning(f"WARNING - {title}: {message}")
    messagebox.showwarning(title, message, parent=parent)

def show_info(title: str, message: str, parent: Optional[tk.Widget] = None) -> None:
    """
    Show a standardized info message box.
    
    Args:
        title: Dialog title
        message: Info message
        parent: Parent widget (None for main window)
    """
    logger.info(f"INFO - {title}: {message}")
    messagebox.showinfo(title, message, parent=parent)

def ask_yes_no(title: str, message: str, parent: Optional[tk.Widget] = None) -> bool:
    """
    Show a yes/no dialog box.
    
    Args:
        title: Dialog title
        message: Question message
        parent: Parent widget (None for main window)
        
    Returns:
        True if Yes was selected, False otherwise
    """
    return messagebox.askyesno(title, message, parent=parent)

def ask_yes_no_cancel(title: str, message: str, parent: Optional[tk.Widget] = None) -> Optional[bool]:
    """
    Show a yes/no/cancel dialog box.
    
    Args:
        title: Dialog title
        message: Question message
        parent: Parent widget (None for main window)
        
    Returns:
        True if Yes was selected, False if No, None if Cancel
    """
    return messagebox.askyesnocancel(title, message, parent=parent)

def ask_save_file(
    title: str = "Save File", 
    filetypes: List[Tuple[str, str]] = None,
    initial_dir: str = None,
    initial_file: str = None,
    default_ext: str = None
) -> Optional[str]:
    """
    Show a save file dialog.
    
    Args:
        title: Dialog title
        filetypes: List of (label, pattern) tuples for file types
        initial_dir: Initial directory
        initial_file: Initial filename
        default_ext: Default extension
        
    Returns:
        Selected file path or None if canceled
    """
    if filetypes is None:
        filetypes = [("All files", "*.*")]
        
    return filedialog.asksaveasfilename(
        title=title,
        filetypes=filetypes,
        initialdir=initial_dir,
        initialfile=initial_file,
        defaultextension=default_ext
    )

def ask_open_file(
    title: str = "Open File", 
    filetypes: List[Tuple[str, str]] = None,
    initial_dir: str = None,
    multiple: bool = False
) -> Union[str, List[str], None]:
    """
    Show an open file dialog.
    
    Args:
        title: Dialog title
        filetypes: List of (label, pattern) tuples for file types
        initial_dir: Initial directory
        multiple: Whether to allow multiple file selection
        
    Returns:
        Selected file path, list of paths if multiple=True, or None if canceled
    """
    if filetypes is None:
        filetypes = [("All files", "*.*")]
    
    if multiple:
        return filedialog.askopenfilenames(
            title=title,
            filetypes=filetypes,
            initialdir=initial_dir
        )
    else:
        return filedialog.askopenfilename(
            title=title,
            filetypes=filetypes,
            initialdir=initial_dir
        )

# ===== Navigation Controls =====

class ItemNavigator:
    """
    Standardized navigation controls for items in a list.
    """
    
    def __init__(self, 
                parent: tk.Widget,
                on_prev: Callable[[], None], 
                on_next: Callable[[], None],
                status_callback: Optional[Callable[[str, int], None]] = None):
        """
        Initialize the navigator.
        
        Args:
            parent: Parent widget
            on_prev: Callback for previous button
            on_next: Callback for next button
            status_callback: Optional callback for status updates
        """
        self.parent = parent
        self.on_prev = on_prev
        self.on_next = on_next
        self.status_callback = status_callback
        
        self.frame = ttk.Frame(parent)
        self.frame.pack(fill=tk.X, pady=5)
        
        self.prev_btn = ttk.Button(self.frame, text="← Previous", command=self._on_prev_clicked)
        self.prev_btn.pack(side=tk.LEFT, padx=5)
        
        self.next_btn = ttk.Button(self.frame, text="Next →", command=self._on_next_clicked)
        self.next_btn.pack(side=tk.LEFT, padx=5)
        
        self.info_label = ttk.Label(self.frame, text="Item 0 of 0")
        self.info_label.pack(side=tk.RIGHT, padx=10)
    
    def _on_prev_clicked(self):
        """Handle previous button click."""
        self.on_prev()
        if self.status_callback:
            self.status_callback("Navigated to previous item", logging.INFO)
    
    def _on_next_clicked(self):
        """Handle next button click."""
        self.on_next()
        if self.status_callback:
            self.status_callback("Navigated to next item", logging.INFO)
    
    def update_info(self, current: int, total: int):
        """
        Update the navigation info display.
        
        Args:
            current: Current item index (1-based)
            total: Total number of items
        """
        self.info_label.config(text=f"Item {current} of {total}")
    
    def update_state(self, has_prev: bool, has_next: bool):
        """
        Update the enabled state of navigation buttons.
        
        Args:
            has_prev: Whether previous navigation is possible
            has_next: Whether next navigation is possible
        """
        self.prev_btn.config(state=tk.NORMAL if has_prev else tk.DISABLED)
        self.next_btn.config(state=tk.NORMAL if has_next else tk.DISABLED)

# ===== Photo Frame Component =====

class PhotoFrame:
    """
    Reusable component for displaying and managing a photo.
    """
    
    def __init__(self, 
                parent: tk.Widget, 
                title: str = "Photo",
                on_remove: Optional[Callable[[], None]] = None,
                on_rotate: Optional[Callable[[], None]] = None,
                show_context: bool = True,
                thumbnail_size: Tuple[int, int] = (150, 150)):
        """
        Initialize the photo frame.
        
        Args:
            parent: Parent widget
            title: Frame title
            on_remove: Callback for remove button
            on_rotate: Callback for rotate button
            show_context: Whether to show context entry
            thumbnail_size: Size for the photo thumbnail
        """
        self.parent = parent
        self.on_remove = on_remove
        self.on_rotate = on_rotate
        self.thumbnail_size = thumbnail_size
        
        # Photo reference to prevent garbage collection
        self.photo_image = None
        
        # Create frame
        self.frame = ttk.LabelFrame(parent, text=title, padding=10)
        
        # Photo display
        self.photo_label = ttk.Label(self.frame, text="No photo selected")
        self.photo_label.pack(padx=5, pady=5)
        
        # Context entry
        self.context_var = tk.StringVar()
        
        if show_context:
            context_frame = ttk.Frame(self.frame)
            context_frame.pack(fill=tk.X, pady=2)
            
            ttk.Label(context_frame, text="Context:").pack(anchor=tk.W)
            self.context_entry = ttk.Entry(context_frame, textvariable=self.context_var)
            self.context_entry.pack(fill=tk.X, pady=3)
        
        # Buttons
        button_frame = ttk.Frame(self.frame)
        button_frame.pack(fill=tk.X, pady=5)
        
        if on_remove:
            self.remove_btn = ttk.Button(button_frame, text="Remove", command=on_remove)
            self.remove_btn.pack(side=tk.LEFT, padx=2)
        
        if on_rotate:
            self.rotate_btn = ttk.Button(button_frame, text="Rotate", command=on_rotate)
            self.rotate_btn.pack(side=tk.LEFT, padx=2)
    
    def set_image(self, image):
        """
        Set the displayed image.
        
        Args:
            image: PIL Image object
        """
        if image:
            # Create thumbnail
            thumb = image.copy()
            thumb.thumbnail(self.thumbnail_size)
            
            # Convert to PhotoImage
            photo = ImageTk.PhotoImage(thumb)
            
            # Store reference and update label
            self.photo_image = photo
            self.photo_label.config(image=photo, text="")
        else:
            # Clear image
            self.photo_image = None
            self.photo_label.config(image="", text="No photo")
    
    def set_context(self, context: str):
        """
        Set the context text.
        
        Args:
            context: Context text
        """
        self.context_var.set(context)
    
    def get_context(self) -> str:
        """
        Get the current context text.
        
        Returns:
            Context text
        """
        return self.context_var.get()
    
    def clear(self):
        """Clear the photo frame."""
        self.photo_image = None
        self.photo_label.config(image="", text="No photo selected")
        self.context_var.set("")

# ===== Form Validation =====

def validate_nonempty(value: str, field_name: str = "Field") -> Tuple[bool, str]:
    """
    Validate that a value is not empty.
    
    Args:
        value: Value to validate
        field_name: Name of the field for error message
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not value.strip():
        return False, f"{field_name} cannot be empty"
    return True, ""

def validate_numeric(value: str, field_name: str = "Field", 
                    allow_empty: bool = False, 
                    min_value: Optional[float] = None,
                    max_value: Optional[float] = None) -> Tuple[bool, str]:
    """
    Validate that a value is numeric.
    
    Args:
        value: Value to validate
        field_name: Name of the field for error message
        allow_empty: Whether empty values are allowed
        min_value: Minimum allowed value
        max_value: Maximum allowed value
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not value.strip():
        if allow_empty:
            return True, ""
        else:
            return False, f"{field_name} cannot be empty"
    
    try:
        num_value = float(value)
        
        if min_value is not None and num_value < min_value:
            return False, f"{field_name} must be at least {min_value}"
            
        if max_value is not None and num_value > max_value:
            return False, f"{field_name} must be at most {max_value}"
            
        return True, ""
    except ValueError:
        return False, f"{field_name} must be a valid number"

def validate_integer(value: str, field_name: str = "Field", 
                    allow_empty: bool = False,
                    min_value: Optional[int] = None,
                    max_value: Optional[int] = None) -> Tuple[bool, str]:
    """
    Validate that a value is an integer.
    
    Args:
        value: Value to validate
        field_name: Name of the field for error message
        allow_empty: Whether empty values are allowed
        min_value: Minimum allowed value
        max_value: Maximum allowed value
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not value.strip():
        if allow_empty:
            return True, ""
        else:
            return False, f"{field_name} cannot be empty"
    
    try:
        num_value = int(value)
        
        if min_value is not None and num_value < min_value:
            return False, f"{field_name} must be at least {min_value}"
            
        if max_value is not None and num_value > max_value:
            return False, f"{field_name} must be at most {max_value}"
            
        return True, ""
    except ValueError:
        return False, f"{field_name} must be a valid integer"

def validate_form(validations: List[Tuple[bool, str]]) -> Tuple[bool, str]:
    """
    Validate a form using multiple validation results.
    
    Args:
        validations: List of (is_valid, error_message) tuples
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    for is_valid, error in validations:
        if not is_valid:
            return False, error
    return True, ""

# ===== Center Window =====

def center_window(window: tk.Toplevel, width: int, height: int) -> None:
    """
    Center a window on the screen.
    
    Args:
        window: Window to center
        width: Window width
        height: Window height
    """
    # Get screen dimensions
    screen_width = window.winfo_screenwidth()
    screen_height = window.winfo_screenheight()
    
    # Calculate position
    x = (screen_width - width) // 2
    y = (screen_height - height) // 2
    
    # Set window size and position
    window.geometry(f"{width}x{height}+{x}+{y}")

def center_on_parent(window: tk.Toplevel, parent: tk.Widget, width: int, height: int) -> None:
    """
    Center a window on its parent.
    
    Args:
        window: Window to center
        parent: Parent widget
        width: Window width
        height: Window height
    """
    # Get parent position and dimensions
    parent_x = parent.winfo_rootx()
    parent_y = parent.winfo_rooty()
    parent_width = parent.winfo_width()
    parent_height = parent.winfo_height()
    
    # Calculate position
    x = parent_x + (parent_width - width) // 2
    y = parent_y + (parent_height - height) // 2
    
    # Set window size and position
    window.geometry(f"{width}x{height}+{x}+{y}")

# ===== Progress Handling =====

class ProgressIndicator:
    """
    Progress indicator with percentage and time remaining estimates.
    """
    
    def __init__(self, parent: tk.Widget):
        """
        Initialize the progress indicator.
        
        Args:
            parent: Parent widget
        """
        self.frame = ttk.Frame(parent)
        self.frame.pack(fill=tk.X, pady=5)
        
        self.label = ttk.Label(self.frame, text="Progress:")
        self.label.pack(side=tk.LEFT, padx=5)
        
        self.progress = ttk.Progressbar(self.frame, orient=tk.HORIZONTAL, length=300, mode='determinate')
        self.progress.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=5)
        
        self.percent_label = ttk.Label(self.frame, text="0%")
        self.percent_label.pack(side=tk.LEFT, padx=5)
        
        self.time_label = ttk.Label(self.frame, text="")
        self.time_label.pack(side=tk.LEFT, padx=5)
        
        # Track start time and total items
        self.start_time = None
        self.total_items = 0
        self.completed_items = 0
    
    def start(self, total_items: int):
        """
        Start tracking progress.
        
        Args:
            total_items: Total number of items to process
        """
        self.start_time = datetime.now()
        self.total_items = total_items
        self.completed_items = 0
        self.progress["value"] = 0
        self.percent_label.config(text="0%")
        self.time_label.config(text="")
    
    def update(self, completed_items: int):
        """
        Update the progress indicator.
        
        Args:
            completed_items: Number of completed items
        """
        self.completed_items = completed_items
        
        # Calculate percentage
        if self.total_items > 0:
            percent = (completed_items / self.total_items) * 100
            self.progress["value"] = percent
            self.percent_label.config(text=f"{percent:.1f}%")
            
            # Estimate time remaining
            if self.start_time and completed_items > 0:
                elapsed = (datetime.now() - self.start_time).total_seconds()
                items_per_second = completed_items / elapsed
                
                if items_per_second > 0:
                    remaining_items = self.total_items - completed_items
                    seconds_remaining = remaining_items / items_per_second
                    
                    # Format time remaining
                    if seconds_remaining < 60:
                        time_str = f"{seconds_remaining:.0f} sec remaining"
                    elif seconds_remaining < 3600:
                        time_str = f"{seconds_remaining/60:.1f} min remaining"
                    else:
                        time_str = f"{seconds_remaining/3600:.1f} hours remaining"
                        
                    self.time_label.config(text=time_str)
    
    def complete(self):
        """Mark the progress as complete."""
        self.progress["value"] = 100
        self.percent_label.config(text="100%")
        
        if self.start_time:
            elapsed = (datetime.now() - self.start_time).total_seconds()
            if elapsed < 60:
                time_str = f"Completed in {elapsed:.1f} sec"
            elif elapsed < 3600:
                time_str = f"Completed in {elapsed/60:.1f} min"
            else:
                time_str = f"Completed in {elapsed/3600:.1f} hours"
                
            self.time_label.config(text=time_str)

# Import necessary components for PhotoFrame
try:
    from PIL import Image, ImageTk
except ImportError:
    logger.warning("PIL/Pillow not available - PhotoFrame will have limited functionality")