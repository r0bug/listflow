#!/usr/bin/env python3
"""
ebay_export_gui.py - GUI for exporting eBay listing data from JSON to CSV format

This script provides a graphical interface to export eBay listing data from JSON
format to CSV format suitable for eBay bulk upload.
"""

import os
import json
import tkinter as tk
from tkinter import filedialog, messagebox, ttk
import sys
from typing import Dict, List, Any, Optional

# Add parent directory to path to allow direct script execution
if __name__ == "__main__":
    sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Import from project
try:
    from ebay_tools.utils.ui_utils import StatusBar, center_window
except ImportError:
    # Create a simple StatusBar class if not available
    class StatusBar(tk.Label):
        def __init__(self, master, initial_text=""):
            super().__init__(master, text=initial_text, bd=1, relief=tk.SUNKEN, anchor=tk.W)
            self.pack(side=tk.BOTTOM, fill=tk.X)
        
        def update(self, text):
            self.config(text=text)
            self.update_idletasks()
    
    # Create a center_window function if not available
    def center_window(window, width=None, height=None):
        if width and height:
            window.geometry(f"{width}x{height}")
        window.update_idletasks()
        width = window.winfo_width()
        height = window.winfo_height()
        x = (window.winfo_screenwidth() // 2) - (width // 2)
        y = (window.winfo_screenheight() // 2) - (height // 2)
        window.geometry(f'+{x}+{y}')

# Import CSV and Excel export functionality
from ebay_csv_export import export_items_to_csv, export_items_to_excel, load_json_queue

class EbayExportGUI:
    """GUI for exporting eBay listing data from JSON to CSV and Excel formats."""
    def __init__(self, root):
        self.root = root
        self.root.title("eBay Export Tool - CSV & Excel")
        self.root.geometry("650x450")
        
        # Set application icon if available
        try:
            self.root.iconbitmap("resources/icon.ico")
        except:
            pass  # Continue without icon if it's missing
        
        # Variables
        self.input_file_var = tk.StringVar()
        self.output_file_var = tk.StringVar()
        self.desc_dir_var = tk.StringVar()
        self.default_values_var = tk.StringVar()
        self.create_desc_var = tk.BooleanVar(value=False)
        self.use_defaults_var = tk.BooleanVar(value=False)
        self.export_format_var = tk.StringVar(value="csv")
        
        # Create UI
        self.create_widgets()
        
        # Create status bar
        self.status_bar = StatusBar(self.root, "Ready")
        
        # Center the window
        try:
            # Try with parameters first (newer version)
            center_window(self.root, 650, 450)
        except TypeError:
            # Fall back to no parameters (compatibility)
            try:
                center_window(self.root)
            except:
                # If all else fails, just position manually
                self.root.update_idletasks()
                width = self.root.winfo_width()
                height = self.root.winfo_height()
                x = (self.root.winfo_screenwidth() // 2) - (width // 2)
                y = (self.root.winfo_screenheight() // 2) - (height // 2)
                self.root.geometry(f'+{x}+{y}')
    
    def create_widgets(self):
        """Create the GUI widgets."""
        main_frame = ttk.Frame(self.root, padding=10)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Input file selection
        input_frame = ttk.LabelFrame(main_frame, text="Input JSON File", padding=10)
        input_frame.pack(fill=tk.X, pady=5)
        
        ttk.Entry(input_frame, textvariable=self.input_file_var, width=50).pack(side=tk.LEFT, fill=tk.X, expand=True, padx=5)
        ttk.Button(input_frame, text="Browse...", command=self.browse_input_file).pack(side=tk.LEFT, padx=5)
        
        # Export format selection
        format_frame = ttk.LabelFrame(main_frame, text="Export Format", padding=10)
        format_frame.pack(fill=tk.X, pady=5)
        
        ttk.Radiobutton(format_frame, text="CSV Format", variable=self.export_format_var, 
                       value="csv", command=self.on_format_change).pack(side=tk.LEFT, padx=10)
        ttk.Radiobutton(format_frame, text="Excel Format (eBay Bulk Upload)", variable=self.export_format_var, 
                       value="excel", command=self.on_format_change).pack(side=tk.LEFT, padx=10)
        
        # Output file selection
        output_frame = ttk.LabelFrame(main_frame, text="Output File", padding=10)
        output_frame.pack(fill=tk.X, pady=5)
        
        ttk.Entry(output_frame, textvariable=self.output_file_var, width=50).pack(side=tk.LEFT, fill=tk.X, expand=True, padx=5)
        ttk.Button(output_frame, text="Browse...", command=self.browse_output_file).pack(side=tk.LEFT, padx=5)
        
        # Options frame
        options_frame = ttk.LabelFrame(main_frame, text="Options", padding=10)
        options_frame.pack(fill=tk.X, pady=5)
        
        # HTML Descriptions checkbox
        desc_check = ttk.Checkbutton(options_frame, text="Create HTML description files", variable=self.create_desc_var,
                                    command=self.toggle_desc_dir)
        desc_check.grid(row=0, column=0, sticky=tk.W, padx=5, pady=2, columnspan=3)
        
        # Description directory selection
        ttk.Label(options_frame, text="Description Directory:").grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        self.desc_dir_entry = ttk.Entry(options_frame, textvariable=self.desc_dir_var, width=40, state=tk.DISABLED)
        self.desc_dir_entry.grid(row=1, column=1, sticky=tk.EW, padx=5, pady=2)
        self.desc_dir_btn = ttk.Button(options_frame, text="Browse...", command=self.browse_desc_dir, state=tk.DISABLED)
        self.desc_dir_btn.grid(row=1, column=2, padx=5, pady=2)
        
        # Default values checkbox
        defaults_check = ttk.Checkbutton(options_frame, text="Use default values from file", variable=self.use_defaults_var,
                                        command=self.toggle_default_values)
        defaults_check.grid(row=2, column=0, sticky=tk.W, padx=5, pady=2, columnspan=3)
        
        # Default values file selection
        ttk.Label(options_frame, text="Default Values File:").grid(row=3, column=0, sticky=tk.W, padx=5, pady=2)
        self.defaults_entry = ttk.Entry(options_frame, textvariable=self.default_values_var, width=40, state=tk.DISABLED)
        self.defaults_entry.grid(row=3, column=1, sticky=tk.EW, padx=5, pady=2)
        self.defaults_btn = ttk.Button(options_frame, text="Browse...", command=self.browse_default_values, state=tk.DISABLED)
        self.defaults_btn.grid(row=3, column=2, padx=5, pady=2)
        
        # Configure grid weights
        options_frame.columnconfigure(1, weight=1)
        
        # Information display
        info_frame = ttk.LabelFrame(main_frame, text="Information", padding=10)
        info_frame.pack(fill=tk.BOTH, expand=True, pady=5)
        
        self.info_text = tk.Text(info_frame, wrap=tk.WORD, height=5, state=tk.DISABLED)
        self.info_text.pack(fill=tk.BOTH, expand=True, side=tk.LEFT)
        
        scrollbar = ttk.Scrollbar(info_frame, orient=tk.VERTICAL, command=self.info_text.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.info_text.config(yscrollcommand=scrollbar.set)
        
        # Buttons
        button_frame = ttk.Frame(main_frame, padding=10)
        button_frame.pack(fill=tk.X, pady=5)
        
        ttk.Button(button_frame, text="Export", command=self.export_data, width=15).pack(side=tk.RIGHT, padx=5)
        ttk.Button(button_frame, text="Exit", command=self.root.quit, width=15).pack(side=tk.RIGHT, padx=5)
    
    def browse_input_file(self):
        """Browse for input JSON file."""
        file_path = filedialog.askopenfilename(
            title="Select Input JSON File",
            filetypes=[("JSON Files", "*.json"), ("All Files", "*.*")]
        )
        if file_path:
            self.input_file_var.set(file_path)
            
            # Try to load and display info about the file
            try:
                items = load_json_queue(file_path)
                
                # Update information display
                self.update_info_text(f"Loaded {len(items)} items from {os.path.basename(file_path)}\n\n")
                
                # Add information about items
                processed_count = sum(1 for item in items if item.get("processed", False))
                unprocessed_count = len(items) - processed_count
                self.append_info_text(f"Processed items: {processed_count}\n")
                self.append_info_text(f"Unprocessed items: {unprocessed_count}\n")
                
                # Suggest output filename
                if not self.output_file_var.get():
                    base_name = os.path.splitext(file_path)[0]
                    extension = ".xlsx" if self.export_format_var.get() == "excel" else ".csv"
                    self.output_file_var.set(f"{base_name}_export{extension}")
                
            except Exception as e:
                self.update_info_text(f"Error loading file: {str(e)}")
                messagebox.showerror("Error", f"Failed to load file: {str(e)}")
    
    def browse_output_file(self):
        """Browse for output file."""
        if self.export_format_var.get() == "excel":
            file_path = filedialog.asksaveasfilename(
                title="Save Excel File",
                defaultextension=".xlsx",
                filetypes=[("Excel Files", "*.xlsx"), ("All Files", "*.*")]
            )
        else:
            file_path = filedialog.asksaveasfilename(
                title="Save CSV File",
                defaultextension=".csv",
                filetypes=[("CSV Files", "*.csv"), ("All Files", "*.*")]
            )
        if file_path:
            self.output_file_var.set(file_path)
    
    def browse_desc_dir(self):
        """Browse for description directory."""
        directory = filedialog.askdirectory(
            title="Select Directory for HTML Descriptions"
        )
        if directory:
            self.desc_dir_var.set(directory)
    
    def browse_default_values(self):
        """Browse for default values JSON file."""
        file_path = filedialog.askopenfilename(
            title="Select Default Values JSON File",
            filetypes=[("JSON Files", "*.json"), ("All Files", "*.*")]
        )
        if file_path:
            self.default_values_var.set(file_path)
            
            # Try to load and display info about the file
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    defaults = json.load(f)
                
                if isinstance(defaults, dict):
                    self.append_info_text(f"\nLoaded {len(defaults)} default values from {os.path.basename(file_path)}\n")
                else:
                    self.append_info_text(f"\nWarning: Default values file does not contain a dictionary.\n")
                
            except Exception as e:
                self.append_info_text(f"\nError loading default values: {str(e)}\n")
    
    def toggle_desc_dir(self):
        """Enable or disable description directory options."""
        state = tk.NORMAL if self.create_desc_var.get() else tk.DISABLED
        self.desc_dir_entry.config(state=state)
        self.desc_dir_btn.config(state=state)
    
    def toggle_default_values(self):
        """Enable or disable default values options."""
        state = tk.NORMAL if self.use_defaults_var.get() else tk.DISABLED
        self.defaults_entry.config(state=state)
        self.defaults_btn.config(state=state)
    
    def on_format_change(self):
        """Handle format change - update file extension if needed."""
        current_file = self.output_file_var.get()
        if current_file:
            base_name = os.path.splitext(current_file)[0]
            if self.export_format_var.get() == "excel":
                if not current_file.endswith('.xlsx'):
                    self.output_file_var.set(f"{base_name}.xlsx")
            else:
                if not current_file.endswith('.csv'):
                    self.output_file_var.set(f"{base_name}.csv")
    
    def update_info_text(self, text):
        """Update the information text widget."""
        self.info_text.config(state=tk.NORMAL)
        self.info_text.delete(1.0, tk.END)
        self.info_text.insert(tk.END, text)
        self.info_text.config(state=tk.DISABLED)
    
    def append_info_text(self, text):
        """Append to the information text widget."""
        self.info_text.config(state=tk.NORMAL)
        self.info_text.insert(tk.END, text)
        self.info_text.config(state=tk.DISABLED)
    
    def export_data(self):
        """Export data from JSON to CSV."""
        input_file = self.input_file_var.get()
        output_file = self.output_file_var.get()
        
        if not input_file:
            messagebox.showerror("Error", "No input file selected.")
            return
        
        if not output_file:
            messagebox.showerror("Error", "No output file specified.")
            return
        
        # Get options
        desc_dir = None
        if self.create_desc_var.get():
            desc_dir = self.desc_dir_var.get()
            if not desc_dir:
                if not messagebox.askyesno("Warning", "No description directory selected. Continue without creating HTML files?"):
                    return
        
        default_values = {}
        if self.use_defaults_var.get():
            default_values_file = self.default_values_var.get()
            if default_values_file:
                try:
                    with open(default_values_file, 'r', encoding='utf-8') as f:
                        default_values = json.load(f)
                        
                    if not isinstance(default_values, dict):
                        messagebox.showerror("Error", "Default values file does not contain a dictionary.")
                        return
                        
                except Exception as e:
                    messagebox.showerror("Error", f"Failed to load default values: {str(e)}")
                    return
        
        try:
            # Load the items
            items = load_json_queue(input_file)
            
            # Show a progress indicator
            export_format = self.export_format_var.get()
            format_name = "Excel" if export_format == "excel" else "CSV"
            self.status_bar.update(f"Exporting {len(items)} items to {format_name}...")
            self.root.update_idletasks()
            
            # Export based on selected format
            if export_format == "excel":
                success, message = export_items_to_excel(
                    items,
                    output_file,
                    default_values=default_values,
                    description_dir=desc_dir
                )
            else:
                success, message = export_items_to_csv(
                    items,
                    output_file,
                    default_values=default_values,
                    description_dir=desc_dir
                )
            
            if success:
                self.status_bar.update(message)
                self.append_info_text(f"\n{message}\n")
                messagebox.showinfo("Export Complete", message)
            else:
                self.status_bar.update(f"Error: {message}")
                self.append_info_text(f"\nError: {message}\n")
                messagebox.showerror("Error", message)
                
        except Exception as e:
            error_message = f"Error exporting data: {str(e)}"
            self.status_bar.update(f"Error: {str(e)}")
            self.append_info_text(f"\n{error_message}\n")
            messagebox.showerror("Error", error_message)


def main():
    """Main function to start the application."""
    root = tk.Tk()
    app = EbayExportGUI(root)
    
    # Parse command line args
    if len(sys.argv) > 1:
        # If input file is provided, set it
        input_file = sys.argv[1]
        if os.path.exists(input_file):
            app.input_file_var.set(input_file)
            # Try to load file info
            try:
                items = load_json_queue(input_file)
                app.update_info_text(f"Loaded {len(items)} items from {os.path.basename(input_file)}\n\n")
                processed_count = sum(1 for item in items if item.get("processed", False))
                unprocessed_count = len(items) - processed_count
                app.append_info_text(f"Processed items: {processed_count}\n")
                app.append_info_text(f"Unprocessed items: {unprocessed_count}\n")
            except Exception:
                pass
    
    root.mainloop()


if __name__ == "__main__":
    main()