#!/usr/bin/env python3
"""
Quick cleanup script for obvious redundant files in eBay Tools project
"""

import os
import shutil
import sys

def remove_zone_identifier_files():
    """Remove Windows Zone.Identifier files."""
    print("Removing Zone.Identifier files...")
    count = 0
    
    for root, dirs, files in os.walk('/home/robug'):
        for file in files:
            if ':Zone.Identifier' in file:
                file_path = os.path.join(root, file)
                try:
                    os.remove(file_path)
                    print(f"  Removed: {file_path}")
                    count += 1
                except Exception as e:
                    print(f"  Error removing {file_path}: {e}")
    
    print(f"Removed {count} Zone.Identifier files")

def remove_backup_files():
    """Remove obvious backup files."""
    print("Removing backup files...")
    count = 0
    
    backup_patterns = ['.bak', '.bak2', '.backup', '.orig']
    
    for root, dirs, files in os.walk('/home/robug'):
        for file in files:
            if any(file.endswith(pattern) for pattern in backup_patterns):
                file_path = os.path.join(root, file)
                try:
                    os.remove(file_path)
                    print(f"  Removed: {file_path}")
                    count += 1
                except Exception as e:
                    print(f"  Error removing {file_path}: {e}")
    
    print(f"Removed {count} backup files")

def remove_python_cache():
    """Remove Python cache files and directories."""
    print("Removing Python cache files...")
    count = 0
    
    for root, dirs, files in os.walk('/home/robug'):
        # Remove __pycache__ directories
        if '__pycache__' in dirs:
            cache_dir = os.path.join(root, '__pycache__')
            try:
                shutil.rmtree(cache_dir)
                print(f"  Removed directory: {cache_dir}")
                dirs.remove('__pycache__')
                count += 1
            except Exception as e:
                print(f"  Error removing {cache_dir}: {e}")
        
        # Remove .pyc files
        for file in files:
            if file.endswith('.pyc'):
                file_path = os.path.join(root, file)
                try:
                    os.remove(file_path)
                    print(f"  Removed: {file_path}")
                    count += 1
                except Exception as e:
                    print(f"  Error removing {file_path}: {e}")
    
    print(f"Removed {count} cache files/directories")

def remove_specific_redundant_files():
    """Remove specific files we know are redundant."""
    print("Removing specific redundant files...")
    count = 0
    
    redundant_files = [
        '/home/robug/projects/ebaytools/Ebaytools/ebay_tools_updates.patch',
        '/home/robug/projects/ebaytools/Ebaytools/processor_marking_fix.patch',
        '/home/robug/projects/ebaytools/Ebaytools/push_after_key_setup.sh',
        '/home/robug/projects/ebaytools/Ebaytools/push_to_github.sh',
        '/home/robug/projects/ebaytools/Ebaytools/simple_processor.py',
        '/home/robug/projects/ebaytools/Ebaytools/test_price_analyzer.py',
        '/home/robug/projects/ebaytools/Ebaytools/simple_price_analyzer.py',
        '/home/robug/projects/ebaytools/Ebaytools/api_test_20250528_114614.log',
        '/home/robug/projects/ebaytools/Ebaytools/ebay_api_debug.log',
        '/home/robug/projects/ebaytools/Ebaytools/ebay_tools/ebay_api_debug.log',
    ]
    
    for file_path in redundant_files:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                print(f"  Removed: {file_path}")
                count += 1
            except Exception as e:
                print(f"  Error removing {file_path}: {e}")
    
    print(f"Removed {count} specific redundant files")

def remove_deprecated_directory():
    """Remove the deprecated Projects directory structure."""
    print("Checking for deprecated directories...")
    
    deprecated_dir = '/home/robug/Projects/deprec'
    if os.path.exists(deprecated_dir):
        try:
            shutil.rmtree(deprecated_dir)
            print(f"  Removed deprecated directory: {deprecated_dir}")
        except Exception as e:
            print(f"  Error removing {deprecated_dir}: {e}")
    
    # Also remove some specific redundant directories
    redundant_dirs = [
        '/home/robug/Projects/ebay_tools_installer',
        '/home/robug/Projects/ebay_api_integration'
    ]
    
    for dir_path in redundant_dirs:
        if os.path.exists(dir_path):
            try:
                shutil.rmtree(dir_path)
                print(f"  Removed redundant directory: {dir_path}")
            except Exception as e:
                print(f"  Error removing {dir_path}: {e}")

def main():
    """Main cleanup function."""
    if len(sys.argv) > 1 and sys.argv[1] == '--execute':
        print("=" * 60)
        print("EXECUTING QUICK CLEANUP")
        print("=" * 60)
        
        remove_zone_identifier_files()
        print()
        
        remove_backup_files()
        print()
        
        remove_python_cache()
        print()
        
        remove_specific_redundant_files()
        print()
        
        remove_deprecated_directory()
        print()
        
        print("=" * 60)
        print("Quick cleanup completed!")
        print("=" * 60)
        
    else:
        print("=" * 60)
        print("QUICK CLEANUP SCRIPT")
        print("=" * 60)
        print("This will remove:")
        print("- Windows Zone.Identifier files")
        print("- Backup files (.bak, .bak2, etc.)")
        print("- Python cache files (__pycache__, .pyc)")
        print("- Patch files and development artifacts")
        print("- Deprecated directory structures")
        print()
        print("Run with --execute to perform cleanup:")
        print(f"python3 {__file__} --execute")

if __name__ == "__main__":
    main()