"""
Mobile Data Import Module for eBay Tools
Imports photo collections and metadata from mobile devices
"""

import os
import json
import shutil
import tkinter as tk
from tkinter import filedialog, messagebox, ttk
from datetime import datetime
from typing import Dict, List, Any, Optional
import zipfile
from pathlib import Path
import sys

from ebay_tools.core.schema import EbayItemSchema
from ebay_tools.utils.file_utils import ensure_directory_exists, safe_load_json, safe_save_json
from ebay_tools.utils.ui_utils import StatusBar


class MobileDataImporter:
    """Import data collected from mobile devices"""
    
    def __init__(self, root):
        self.root = root
        self.root.title("eBay Tools - Mobile Data Import")
        self.root.geometry("800x600")
        
        # Variables
        self.import_data = None
        self.selected_items = []
        
        # Create UI
        self.create_widgets()
        
        # Status bar
        self.status_bar = StatusBar(self.root)
        self.status_bar.set_status("Ready to import mobile data")
        
    def create_widgets(self):
        """Create UI widgets"""
        # Main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(0, weight=1)
        main_frame.rowconfigure(1, weight=1)
        
        # Top toolbar
        toolbar = ttk.Frame(main_frame)
        toolbar.grid(row=0, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        
        ttk.Button(toolbar, text="Import ZIP", command=self.import_zip).pack(side=tk.LEFT, padx=5)
        ttk.Button(toolbar, text="Import Folder", command=self.import_folder).pack(side=tk.LEFT, padx=5)
        ttk.Button(toolbar, text="Import JSON", command=self.import_json).pack(side=tk.LEFT, padx=5)
        ttk.Separator(toolbar, orient=tk.VERTICAL).pack(side=tk.LEFT, fill=tk.Y, padx=10)
        ttk.Button(toolbar, text="Select All", command=self.select_all).pack(side=tk.LEFT, padx=5)
        ttk.Button(toolbar, text="Select None", command=self.select_none).pack(side=tk.LEFT, padx=5)
        
        # Item tree
        tree_frame = ttk.Frame(main_frame)
        tree_frame.grid(row=1, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Create treeview with checkboxes
        self.tree = ttk.Treeview(tree_frame, columns=('photos', 'title', 'category', 'notes'), 
                                selectmode='extended')
        self.tree.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Configure columns
        self.tree.heading('#0', text='Import')
        self.tree.heading('photos', text='Photos')
        self.tree.heading('title', text='Title')
        self.tree.heading('category', text='Category')
        self.tree.heading('notes', text='Notes')
        
        self.tree.column('#0', width=80)
        self.tree.column('photos', width=80)
        self.tree.column('title', width=200)
        self.tree.column('category', width=150)
        self.tree.column('notes', width=300)
        
        # Scrollbars
        vsb = ttk.Scrollbar(tree_frame, orient="vertical", command=self.tree.yview)
        vsb.grid(row=0, column=1, sticky=(tk.N, tk.S))
        self.tree.configure(yscrollcommand=vsb.set)
        
        hsb = ttk.Scrollbar(tree_frame, orient="horizontal", command=self.tree.xview)
        hsb.grid(row=1, column=0, sticky=(tk.W, tk.E))
        self.tree.configure(xscrollcommand=hsb.set)
        
        tree_frame.columnconfigure(0, weight=1)
        tree_frame.rowconfigure(0, weight=1)
        
        # Bottom buttons
        button_frame = ttk.Frame(main_frame)
        button_frame.grid(row=2, column=0, sticky=(tk.W, tk.E), pady=(10, 0))
        
        ttk.Button(button_frame, text="Export to Setup Queue", 
                  command=self.export_to_setup).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="Export to Gallery", 
                  command=self.export_to_gallery).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="Export Selected", 
                  command=self.export_selected).pack(side=tk.LEFT, padx=5)
        
        # Bind checkbox behavior
        self.tree.bind('<Button-1>', self.on_click)
        
    def on_click(self, event):
        """Handle clicks on tree items"""
        region = self.tree.identify_region(event.x, event.y)
        if region == "tree":
            item = self.tree.identify_row(event.y)
            if item:
                # Toggle checkbox
                current = self.tree.set(item, '#0')
                new_value = '☐' if current == '☑' else '☑'
                self.tree.set(item, '#0', new_value)
                
    def import_zip(self):
        """Import data from ZIP file"""
        filename = filedialog.askopenfilename(
            title="Select Mobile Export ZIP",
            filetypes=[("ZIP files", "*.zip"), ("All files", "*.*")]
        )
        
        if filename:
            try:
                # Extract to temp directory
                temp_dir = os.path.join(os.path.dirname(filename), 'temp_import')
                ensure_directory_exists(temp_dir)
                
                with zipfile.ZipFile(filename, 'r') as zip_ref:
                    zip_ref.extractall(temp_dir)
                
                # Look for manifest.json
                manifest_path = os.path.join(temp_dir, 'manifest.json')
                if os.path.exists(manifest_path):
                    self.import_data = safe_load_json(manifest_path)
                    self.import_data['base_path'] = temp_dir
                    self.populate_tree()
                    self.status_bar.set_status(f"Imported {len(self.import_data.get('items', []))} items from ZIP")
                else:
                    messagebox.showerror("Import Error", "No manifest.json found in ZIP file")
                    
            except Exception as e:
                messagebox.showerror("Import Error", f"Failed to import ZIP: {str(e)}")
                
    def import_folder(self):
        """Import data from folder"""
        folder = filedialog.askdirectory(title="Select Mobile Export Folder")
        
        if folder:
            manifest_path = os.path.join(folder, 'manifest.json')
            if os.path.exists(manifest_path):
                try:
                    self.import_data = safe_load_json(manifest_path)
                    self.import_data['base_path'] = folder
                    self.populate_tree()
                    self.status_bar.set_status(f"Imported {len(self.import_data.get('items', []))} items from folder")
                except Exception as e:
                    messagebox.showerror("Import Error", f"Failed to import folder: {str(e)}")
            else:
                messagebox.showerror("Import Error", "No manifest.json found in folder")
                
    def import_json(self):
        """Import data from JSON file"""
        filename = filedialog.askopenfilename(
            title="Select Mobile Export JSON",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )
        
        if filename:
            try:
                data = safe_load_json(filename)
                
                # Check if this is new Android app format with queues
                if 'queues' in data:
                    self.import_android_format(data, os.path.dirname(filename))
                else:
                    # Legacy format
                    self.import_data = data
                    self.import_data['base_path'] = os.path.dirname(filename)
                    self.populate_tree()
                    self.status_bar.set_status(f"Imported {len(self.import_data.get('items', []))} items from JSON")
            except Exception as e:
                messagebox.showerror("Import Error", f"Failed to import JSON: {str(e)}")
                
    def populate_tree(self):
        """Populate tree with imported items"""
        # Clear existing items
        for item in self.tree.get_children():
            self.tree.delete(item)
            
        if not self.import_data:
            return
            
        # Add items to tree
        for idx, item in enumerate(self.import_data.get('items', [])):
            photos = item.get('photos', [])
            photo_count = len(photos)
            title = item.get('title', f"Item {idx + 1}")
            category = item.get('category', '')
            notes = item.get('notes', '')
            
            # Add to tree with checkbox
            tree_item = self.tree.insert('', 'end', 
                                       values=(f"{photo_count} photos", title, category, notes))
            self.tree.set(tree_item, '#0', '☑')  # Checked by default
            
            # Store item data
            self.tree.set(tree_item, 'item_data', json.dumps(item))
            
    def import_android_format(self, data, base_path):
        """Import data from Android app queue format"""
        # Convert Android format to standard format
        items = []
        
        for queue in data.get('queues', []):
            queue_name = queue.get('name', 'Unnamed Queue')
            
            for item in queue.get('items', []):
                # Convert item format
                converted_item = {
                    'title': item.get('name', 'Untitled Item'),
                    'notes': item.get('description', ''),
                    'category': queue_name,  # Use queue name as category
                    'photos': [],
                    'metadata': {
                        'queue_id': queue.get('id'),
                        'queue_name': queue_name,
                        'item_id': item.get('id'),
                        'created_at': item.get('createdAt'),
                        'updated_at': item.get('updatedAt'),
                        'synced': queue.get('isSynced', False)
                    }
                }
                
                # Add photo paths
                for image in item.get('images', []):
                    photo_path = image.get('imagePath', '')
                    if photo_path:
                        # Handle relative or absolute paths
                        if not os.path.isabs(photo_path):
                            photo_path = os.path.join(base_path, photo_path)
                        converted_item['photos'].append(photo_path)
                
                items.append(converted_item)
        
        # Update import data
        self.import_data = {
            'version': '2.0',
            'source': 'eBay Tools Companion App',
            'items': items,
            'base_path': base_path
        }
        
        self.populate_tree()
        total_items = len(items)
        total_queues = len(data.get('queues', []))
        self.status_bar.set_status(f"Imported {total_items} items from {total_queues} queues")
            
    def select_all(self):
        """Select all items"""
        for item in self.tree.get_children():
            self.tree.set(item, '#0', '☑')
            
    def select_none(self):
        """Deselect all items"""
        for item in self.tree.get_children():
            self.tree.set(item, '#0', '☐')
            
    def get_selected_items(self):
        """Get list of selected items"""
        selected = []
        for item in self.tree.get_children():
            if self.tree.set(item, '#0') == '☑':
                item_data = json.loads(self.tree.set(item, 'item_data'))
                selected.append(item_data)
        return selected
        
    def export_to_setup(self):
        """Export selected items to Setup queue format"""
        selected = self.get_selected_items()
        if not selected:
            messagebox.showwarning("No Selection", "Please select items to export")
            return
            
        # Ask for output file
        filename = filedialog.asksaveasfilename(
            title="Save Setup Queue",
            defaultextension=".json",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )
        
        if filename:
            try:
                # Convert to queue format
                queue_data = {
                    "created_date": datetime.now().isoformat(),
                    "items": []
                }
                
                base_path = self.import_data.get('base_path', '')
                
                for item in selected:
                    # Create queue item
                    queue_item = EbayItemSchema.create_empty_item()
                    queue_item['temp_title'] = item.get('title', 'Imported Item')
                    queue_item['sku'] = item.get('sku', f"MOB_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
                    queue_item['category'] = item.get('category', '')
                    
                    # Add photos with full paths
                    photos = []
                    for photo in item.get('photos', []):
                        if os.path.isabs(photo):
                            photo_path = photo
                        else:
                            photo_path = os.path.join(base_path, photo)
                        if os.path.exists(photo_path):
                            photos.append(photo_path)
                            
                    queue_item['photos'] = photos
                    queue_item['process_photos'] = photos.copy()
                    
                    # Add notes to description if available
                    if item.get('notes'):
                        queue_item['temp_description'] = item['notes']
                        
                    # Add any mobile metadata
                    if item.get('metadata'):
                        queue_item['mobile_metadata'] = item['metadata']
                        
                    queue_data['items'].append(queue_item)
                    
                # Save queue file
                safe_save_json(filename, queue_data)
                self.status_bar.set_status(f"Exported {len(selected)} items to setup queue")
                
                if messagebox.askyesno("Export Complete", "Queue file created. Open in Setup tool?"):
                    # Launch setup tool with the queue
                    import subprocess
                    subprocess.Popen([sys.executable, '-m', 'ebay_tools.apps.setup', filename])
                    
            except Exception as e:
                messagebox.showerror("Export Error", f"Failed to export: {str(e)}")
                
    def export_to_gallery(self):
        """Export selected items to Gallery format"""
        selected = self.get_selected_items()
        if not selected:
            messagebox.showwarning("No Selection", "Please select items to export")
            return
            
        # Ask for output file
        filename = filedialog.asksaveasfilename(
            title="Save Gallery",
            defaultextension=".json",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )
        
        if filename:
            try:
                # Convert to gallery format
                gallery_data = {
                    "title": "Mobile Import Gallery",
                    "contact_info": {},
                    "items": []
                }
                
                base_path = self.import_data.get('base_path', '')
                
                for item in selected:
                    # Create gallery item
                    gallery_item = {
                        "id": f"mob_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{len(gallery_data['items'])}",
                        "title": item.get('title', 'Imported Item'),
                        "description": item.get('notes', ''),
                        "price": item.get('price', ''),
                        "location": item.get('location', ''),
                        "contact_info": "",
                        "status": "available",
                        "photos": [],
                        "thumbnail": "",
                        "created_date": datetime.now().isoformat(),
                        "updated_date": datetime.now().isoformat(),
                        "category": item.get('category', ''),
                        "condition": item.get('condition', '')
                    }
                    
                    # Add photos with full paths
                    for photo in item.get('photos', []):
                        if os.path.isabs(photo):
                            photo_path = photo
                        else:
                            photo_path = os.path.join(base_path, photo)
                        if os.path.exists(photo_path):
                            gallery_item['photos'].append(photo_path)
                            
                    # Set first photo as thumbnail
                    if gallery_item['photos']:
                        gallery_item['thumbnail'] = gallery_item['photos'][0]
                        
                    gallery_data['items'].append(gallery_item)
                    
                # Save gallery file
                safe_save_json(filename, gallery_data)
                self.status_bar.set_status(f"Exported {len(selected)} items to gallery")
                
                if messagebox.askyesno("Export Complete", "Gallery file created. Open in Gallery Creator?"):
                    # Launch gallery creator with the file
                    import subprocess
                    subprocess.Popen([sys.executable, '-m', 'ebay_tools.apps.gallery_creator', filename])
                    
            except Exception as e:
                messagebox.showerror("Export Error", f"Failed to export: {str(e)}")
                
    def export_selected(self):
        """Export selected items to a new mobile collection"""
        selected = self.get_selected_items()
        if not selected:
            messagebox.showwarning("No Selection", "Please select items to export")
            return
            
        # Ask for output directory
        output_dir = filedialog.askdirectory(title="Select Export Directory")
        
        if output_dir:
            try:
                # Create export directory
                export_name = f"mobile_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                export_path = os.path.join(output_dir, export_name)
                ensure_directory_exists(export_path)
                
                # Copy photos and update paths
                base_path = self.import_data.get('base_path', '')
                exported_items = []
                
                for item in selected:
                    exported_item = item.copy()
                    exported_photos = []
                    
                    # Copy photos
                    for photo in item.get('photos', []):
                        if os.path.isabs(photo):
                            src_path = photo
                        else:
                            src_path = os.path.join(base_path, photo)
                            
                        if os.path.exists(src_path):
                            # Copy to export directory
                            dest_name = os.path.basename(src_path)
                            dest_path = os.path.join(export_path, dest_name)
                            shutil.copy2(src_path, dest_path)
                            exported_photos.append(dest_name)
                            
                    exported_item['photos'] = exported_photos
                    exported_items.append(exported_item)
                    
                # Create manifest
                manifest = {
                    "version": "1.0",
                    "created_date": datetime.now().isoformat(),
                    "source": "eBay Tools Mobile Import",
                    "items": exported_items
                }
                
                # Save manifest
                manifest_path = os.path.join(export_path, 'manifest.json')
                safe_save_json(manifest_path, manifest)
                
                self.status_bar.set_status(f"Exported {len(selected)} items to {export_name}")
                
                if messagebox.askyesno("Export Complete", "Open export directory?"):
                    import webbrowser
                    webbrowser.open(f'file://{os.path.abspath(export_path)}')
                    
            except Exception as e:
                messagebox.showerror("Export Error", f"Failed to export: {str(e)}")


def main():
    """Main entry point"""
    root = tk.Tk()
    app = MobileDataImporter(root)
    root.mainloop()


if __name__ == "__main__":
    main()