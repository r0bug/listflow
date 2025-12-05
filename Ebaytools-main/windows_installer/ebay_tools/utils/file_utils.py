"""
file_utils.py - Standardized file operation utilities for eBay listing tools

This module provides consistent functions for file operations including:
- Loading and saving JSON data
- Path handling and validation
- File existence checks with proper error handling
"""

import os
import json
import logging
import traceback
from typing import Dict, List, Any, Optional, Union, Callable

# Configure logging
logger = logging.getLogger(__name__)

def ensure_directory_exists(directory_path: str) -> bool:
    """
    Ensure a directory exists, creating it if necessary.
    
    Args:
        directory_path: Path to the directory
        
    Returns:
        True if directory exists or was created, False on failure
    """
    if os.path.exists(directory_path):
        if os.path.isdir(directory_path):
            return True
        else:
            logger.error(f"Path exists but is not a directory: {directory_path}")
            return False
    
    try:
        os.makedirs(directory_path, exist_ok=True)
        logger.info(f"Created directory: {directory_path}")
        return True
    except Exception as e:
        logger.error(f"Error creating directory {directory_path}: {str(e)}")
        return False

def safe_load_json(file_path: str, default_value: Any = None) -> Any:
    """
    Safely load JSON data from a file with error handling.
    
    Args:
        file_path: Path to the JSON file
        default_value: Value to return if loading fails
        
    Returns:
        Loaded JSON data or default value on failure
    """
    if not os.path.exists(file_path):
        logger.warning(f"JSON file not found: {file_path}")
        return default_value
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON format in {file_path}: {str(e)}")
        return default_value
    except Exception as e:
        logger.error(f"Error loading JSON from {file_path}: {str(e)}")
        logger.debug(traceback.format_exc())
        return default_value

def safe_save_json(data: Any, file_path: str, indent: int = 2) -> bool:
    """
    Safely save data to a JSON file with error handling.
    
    Args:
        data: Data to save (must be JSON serializable)
        file_path: Path to save the JSON file
        indent: Indentation level for the JSON file
        
    Returns:
        True on success, False on failure
    """
    # Ensure the directory exists
    directory = os.path.dirname(file_path)
    if directory and not ensure_directory_exists(directory):
        return False
    
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=indent)
        logger.info(f"Successfully saved JSON to {file_path}")
        return True
    except Exception as e:
        logger.error(f"Error saving JSON to {file_path}: {str(e)}")
        logger.debug(traceback.format_exc())
        return False

def load_queue(file_path: str, validation_func: Optional[Callable] = None) -> List[Dict[str, Any]]:
    """
    Load a queue of items from a JSON file with validation.
    
    Args:
        file_path: Path to the JSON file
        validation_func: Optional function to validate and normalize each item
        
    Returns:
        List of item dictionaries
    
    Raises:
        FileNotFoundError: If the file doesn't exist
        json.JSONDecodeError: If the file contains invalid JSON
        ValueError: If the data is not in the expected format
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Queue file not found: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            queue = json.load(f)
        
        if not isinstance(queue, list):
            raise ValueError(f"Invalid queue format: expected list, got {type(queue)}")
        
        # Apply validation/normalization if provided
        if validation_func:
            processed_queue = []
            for i, item in enumerate(queue):
                try:
                    processed_item = validation_func(item)
                    processed_queue.append(processed_item)
                except Exception as e:
                    logger.warning(f"Item {i} failed validation: {str(e)}. Using original item.")
                    processed_queue.append(item)
            return processed_queue
        
        return queue
        
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON format in queue file {file_path}: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Error loading queue from {file_path}: {str(e)}")
        logger.debug(traceback.format_exc())
        raise

def save_queue(queue: List[Dict[str, Any]], file_path: str, 
              create_backup: bool = True) -> bool:
    """
    Save a queue of items to a JSON file with backup creation.
    
    Args:
        queue: List of item dictionaries
        file_path: Path to save the JSON file
        create_backup: Whether to create a backup of the existing file
        
    Returns:
        True on success, False on failure
    """
    # Create backup if requested and file exists
    if create_backup and os.path.exists(file_path):
        backup_path = f"{file_path}.bak"
        try:
            import shutil
            shutil.copy2(file_path, backup_path)
            logger.info(f"Created backup at {backup_path}")
        except Exception as e:
            logger.warning(f"Failed to create backup: {str(e)}")
    
    return safe_save_json(queue, file_path)

def get_unique_filename(base_path: str, extension: str = "") -> str:
    """
    Generate a unique filename based on the base path.
    
    Args:
        base_path: Base path for the file
        extension: Optional file extension (with or without dot)
        
    Returns:
        Unique filename that doesn't already exist
    """
    if extension and not extension.startswith('.'):
        extension = f".{extension}"
    
    if not os.path.exists(f"{base_path}{extension}"):
        return f"{base_path}{extension}"
    
    counter = 1
    while os.path.exists(f"{base_path}_{counter}{extension}"):
        counter += 1
    
    return f"{base_path}_{counter}{extension}"

def sanitize_filename(filename: str) -> str:
    """
    Sanitize a filename to remove invalid characters.
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename
    """
    # Replace invalid characters with underscores
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        filename = filename.replace(char, '_')
    
    # Remove leading/trailing whitespace and periods
    filename = filename.strip().strip('.')
    
    # Ensure the filename is not empty
    if not filename:
        filename = "unnamed"
        
    return filename

def get_relative_path(path: str, base_dir: Optional[str] = None) -> str:
    """
    Convert an absolute path to a relative path from base_dir.
    If paths are on different drives, returns the original path.
    
    Args:
        path: Path to convert
        base_dir: Base directory (defaults to current working directory)
        
    Returns:
        Relative path or the original path if conversion isn't possible
    """
    if not base_dir:
        base_dir = os.getcwd()
    
    # Ensure paths are absolute
    abs_path = os.path.abspath(path)
    abs_base = os.path.abspath(base_dir)
    
    # Check if on same drive (Windows)
    if os.path.splitdrive(abs_path)[0] != os.path.splitdrive(abs_base)[0]:
        return path
    
    # Create relative path
    try:
        rel_path = os.path.relpath(abs_path, abs_base)
        return rel_path
    except ValueError:
        # This can happen if paths are on different drives
        return path