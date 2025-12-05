#!/usr/bin/env python3
"""
eBay Tools Project Cleanup Script

This script removes redundant files, duplicates, temporary files, and 
organizes the project structure for optimal maintainability.
"""

import os
import shutil
import sys
from pathlib import Path
import hashlib
import json
from datetime import datetime

class ProjectCleanup:
    def __init__(self, dry_run=True):
        self.dry_run = dry_run
        self.removed_files = []
        self.removed_dirs = []
        self.duplicates_found = []
        self.total_space_saved = 0
        
    def log(self, message, level="INFO"):
        """Log cleanup actions."""
        timestamp = datetime.now().strftime("%H:%M:%S")
        prefix = "[DRY RUN] " if self.dry_run else "[CLEANUP] "
        print(f"{prefix}{timestamp} {level}: {message}")
    
    def get_file_hash(self, file_path):
        """Get MD5 hash of a file."""
        try:
            with open(file_path, 'rb') as f:
                return hashlib.md5(f.read()).hexdigest()
        except:
            return None
    
    def remove_file(self, file_path):
        """Remove a file (or log for dry run)."""
        try:
            size = os.path.getsize(file_path)
            self.total_space_saved += size
            
            if not self.dry_run:
                os.remove(file_path)
            
            self.removed_files.append(file_path)
            self.log(f"Removed file: {file_path} ({size} bytes)")
            return True
        except Exception as e:
            self.log(f"Error removing {file_path}: {e}", "ERROR")
            return False
    
    def remove_dir(self, dir_path):
        """Remove a directory (or log for dry run)."""
        try:
            if not self.dry_run:
                shutil.rmtree(dir_path)
            
            self.removed_dirs.append(dir_path)
            self.log(f"Removed directory: {dir_path}")
            return True
        except Exception as e:
            self.log(f"Error removing directory {dir_path}: {e}", "ERROR")
            return False
    
    def clean_zone_identifier_files(self, root_path):
        """Remove Windows Zone.Identifier files."""
        self.log("=== Cleaning Zone.Identifier files ===")
        count = 0
        
        for root, dirs, files in os.walk(root_path):
            for file in files:
                if ":Zone.Identifier" in file:
                    file_path = os.path.join(root, file)
                    if self.remove_file(file_path):
                        count += 1
        
        self.log(f"Zone.Identifier files removed: {count}")
    
    def clean_backup_files(self, root_path):
        """Remove backup files (.bak, .bak2, etc.)."""
        self.log("=== Cleaning backup files ===")
        count = 0
        
        backup_extensions = ['.bak', '.bak2', '.old', '.backup', '.orig']
        
        for root, dirs, files in os.walk(root_path):
            for file in files:
                file_path = os.path.join(root, file)
                if any(file.endswith(ext) for ext in backup_extensions):
                    if self.remove_file(file_path):
                        count += 1
        
        self.log(f"Backup files removed: {count}")
    
    def clean_cache_files(self, root_path):
        """Remove Python cache files and directories."""
        self.log("=== Cleaning cache files ===")
        count = 0
        
        for root, dirs, files in os.walk(root_path):
            # Remove __pycache__ directories
            if '__pycache__' in dirs:
                cache_dir = os.path.join(root, '__pycache__')
                if self.remove_dir(cache_dir):
                    count += 1
                dirs.remove('__pycache__')  # Don't walk into it
            
            # Remove .pyc files
            for file in files:
                if file.endswith('.pyc'):
                    file_path = os.path.join(root, file)
                    if self.remove_file(file_path):
                        count += 1
        
        self.log(f"Cache files/directories removed: {count}")
    
    def clean_log_files(self, root_path):
        """Remove old log files."""
        self.log("=== Cleaning old log files ===")
        count = 0
        
        for root, dirs, files in os.walk(root_path):
            for file in files:
                if file.endswith('.log') and not file.startswith('README'):
                    file_path = os.path.join(root, file)
                    # Keep recent logs but remove old ones
                    try:
                        age_days = (datetime.now().timestamp() - os.path.getmtime(file_path)) / 86400
                        if age_days > 7:  # Remove logs older than 7 days
                            if self.remove_file(file_path):
                                count += 1
                    except:
                        pass
        
        self.log(f"Old log files removed: {count}")
    
    def clean_patch_files(self, root_path):
        """Remove patch files."""
        self.log("=== Cleaning patch files ===")
        count = 0
        
        for root, dirs, files in os.walk(root_path):
            for file in files:
                if file.endswith('.patch'):
                    file_path = os.path.join(root, file)
                    if self.remove_file(file_path):
                        count += 1
        
        self.log(f"Patch files removed: {count}")
    
    def find_duplicate_files(self, root_path):
        """Find and remove duplicate files."""
        self.log("=== Finding duplicate files ===")
        
        file_hashes = {}
        duplicates = []
        
        for root, dirs, files in os.walk(root_path):
            for file in files:
                file_path = os.path.join(root, file)
                if os.path.isfile(file_path):
                    file_hash = self.get_file_hash(file_path)
                    if file_hash:
                        if file_hash in file_hashes:
                            # Found duplicate
                            original = file_hashes[file_hash]
                            duplicates.append((original, file_path))
                            self.duplicates_found.append(f"{original} == {file_path}")
                        else:
                            file_hashes[file_hash] = file_path
        
        # Remove duplicates (keep the one in the main project structure)
        removed_count = 0
        for original, duplicate in duplicates:
            # Prefer files in main structure over Projects/deprec
            if '/Projects/' in duplicate or '/deprec/' in duplicate:
                if self.remove_file(duplicate):
                    removed_count += 1
            elif '/Projects/' in original or '/deprec/' in original:
                if self.remove_file(original):
                    removed_count += 1
        
        self.log(f"Duplicate files found: {len(duplicates)}, removed: {removed_count}")
    
    def clean_deprecated_directories(self, root_path):
        """Remove deprecated directories."""
        self.log("=== Cleaning deprecated directories ===")
        
        deprecated_dirs = [
            '/home/robug/Projects/deprec',
            '/home/robug/Projects/ebay_tools_installer',
            '/home/robug/Projects/ebay_api_integration'
        ]
        
        count = 0
        for dep_dir in deprecated_dirs:
            if os.path.exists(dep_dir):
                if self.remove_dir(dep_dir):
                    count += 1
        
        self.log(f"Deprecated directories removed: {count}")
    
    def clean_redundant_files(self, root_path):
        """Remove redundant files that are no longer needed."""
        self.log("=== Cleaning redundant files ===")
        
        redundant_patterns = [
            'complete-setup.bat',
            'create_windows_installer_updated.bat',
            'ebay-package-structure.py',
            'ebay-viewer.py',
            'enhanced-image-utils.py',
            'exceptions_fixed.py',
            'fix-exceptions.BAT',
            'fix-parenthesis.py',
            'fix_imports.py',
            'manual-fix.py',
            'replace-script.py',
            'setup-ebay-tools.bat',
            'processor.py.txt',
            'setup.py.txt'
        ]
        
        count = 0
        for root, dirs, files in os.walk(root_path):
            for file in files:
                if any(pattern in file for pattern in redundant_patterns):
                    file_path = os.path.join(root, file)
                    if self.remove_file(file_path):
                        count += 1
        
        self.log(f"Redundant files removed: {count}")
    
    def consolidate_projects_directory(self):
        """Consolidate Projects and projects directories."""
        self.log("=== Consolidating project directories ===")
        
        projects_upper = '/home/robug/Projects'
        projects_lower = '/home/robug/projects'
        
        if os.path.exists(projects_upper) and os.path.exists(projects_lower):
            self.log("Both 'Projects' and 'projects' directories exist")
            
            # Move any unique files from Projects to projects, then remove Projects
            if not self.dry_run:
                # This would need careful implementation to avoid conflicts
                pass
            
            self.log("Would consolidate into /home/robug/projects")
            
            # For now, just recommend manual review
            return f"Manual review needed: {projects_upper} and {projects_lower} both exist"
        
        return "No consolidation needed"
    
    def clean_config_duplicates(self, root_path):
        """Remove duplicate config files."""
        self.log("=== Cleaning duplicate config files ===")
        
        config_files = []
        for root, dirs, files in os.walk(root_path):
            for file in files:
                if 'api_config.json' in file or 'ebay_api_config.json' in file:
                    config_files.append(os.path.join(root, file))
        
        # Keep only the main config file
        main_config = '/home/robug/projects/ebaytools/Ebaytools/api_config.json'
        count = 0
        
        for config_file in config_files:
            if config_file != main_config and os.path.exists(config_file):
                if self.remove_file(config_file):
                    count += 1
        
        self.log(f"Duplicate config files removed: {count}")
    
    def generate_report(self):
        """Generate cleanup report."""
        report = {
            "timestamp": datetime.now().isoformat(),
            "dry_run": self.dry_run,
            "summary": {
                "files_removed": len(self.removed_files),
                "directories_removed": len(self.removed_dirs),
                "duplicates_found": len(self.duplicates_found),
                "space_saved_bytes": self.total_space_saved,
                "space_saved_mb": round(self.total_space_saved / 1024 / 1024, 2)
            },
            "removed_files": self.removed_files,
            "removed_directories": self.removed_dirs,
            "duplicates": self.duplicates_found
        }
        
        return report
    
    def run_cleanup(self):
        """Run the complete cleanup process."""
        self.log("="*60)
        self.log("Starting eBay Tools Project Cleanup")
        self.log(f"Mode: {'DRY RUN' if self.dry_run else 'ACTUAL CLEANUP'}")
        self.log("="*60)
        
        # Define root paths to clean
        ebay_tools_path = '/home/robug/projects/ebaytools/Ebaytools'
        projects_path = '/home/robug/Projects'
        
        # Run cleanup tasks
        tasks = [
            (self.clean_zone_identifier_files, ebay_tools_path),
            (self.clean_backup_files, ebay_tools_path),
            (self.clean_cache_files, ebay_tools_path),
            (self.clean_log_files, ebay_tools_path),
            (self.clean_patch_files, ebay_tools_path),
            (self.clean_redundant_files, ebay_tools_path),
            (self.clean_config_duplicates, '/home/robug'),
            (self.find_duplicate_files, '/home/robug'),
            (self.clean_deprecated_directories, '/home/robug'),
        ]
        
        for task_func, path in tasks:
            try:
                if os.path.exists(path):
                    task_func(path)
                else:
                    self.log(f"Path does not exist: {path}", "WARNING")
            except Exception as e:
                self.log(f"Error in {task_func.__name__}: {e}", "ERROR")
        
        # Consolidation check
        consolidation_result = self.consolidate_projects_directory()
        self.log(f"Directory consolidation: {consolidation_result}")
        
        self.log("="*60)
        self.log("Cleanup completed!")
        self.log("="*60)
        
        return self.generate_report()

def main():
    """Main function."""
    # Check if we should run in dry-run mode
    dry_run = '--execute' not in sys.argv
    
    if dry_run:
        print("="*60)
        print("RUNNING IN DRY-RUN MODE")
        print("No files will be actually deleted.")
        print("Run with --execute flag to perform actual cleanup.")
        print("="*60)
    else:
        print("="*60)
        print("WARNING: ACTUAL CLEANUP MODE")
        print("Files will be permanently deleted!")
        response = input("Are you sure you want to continue? (yes/no): ")
        if response.lower() != 'yes':
            print("Cleanup cancelled.")
            return
        print("="*60)
    
    # Run cleanup
    cleanup = ProjectCleanup(dry_run=dry_run)
    report = cleanup.run_cleanup()
    
    # Save report
    report_file = f"cleanup_report_{'dry_run' if dry_run else 'actual'}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\nCleanup report saved to: {report_file}")
    print(f"Files that would be removed: {report['summary']['files_removed']}")
    print(f"Directories that would be removed: {report['summary']['directories_removed']}")
    print(f"Space that would be saved: {report['summary']['space_saved_mb']} MB")
    
    if dry_run:
        print(f"\nTo actually perform the cleanup, run:")
        print(f"python3 {__file__} --execute")

if __name__ == "__main__":
    main()