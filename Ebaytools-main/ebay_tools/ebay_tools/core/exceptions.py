"""
Exception hierarchy for eBay tools.
This module provides consistent error handling and exceptions.
"""

import os
import sys
import logging
import traceback
import time
from typing import Any, Callable, Dict, List, Optional, Type, TypeVar, Union, Tuple
from functools import wraps

# Configure logging
logger = logging.getLogger(__name__)

# Define a custom exception hierarchy
class EbayToolsError(Exception):
    """Base exception for all eBay tools errors."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.details = details or {}
        super().__init__(message)

class FileError(EbayToolsError):
    """Exception raised for file operation errors."""
    pass

class NetworkError(EbayToolsError):
    """Exception raised for network-related errors."""
    pass

class ApiError(EbayToolsError):
    """Exception raised for API-related errors."""
    def __init__(self, message: str, status_code: Optional[int] = None, 
                response_text: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        self.status_code = status_code
        self.response_text = response_text
        super().__init__(message, details)

class ValidationError(EbayToolsError):
    """Exception raised for data validation errors."""
    def __init__(self, message: str, field: Optional[str] = None, 
                value: Optional[Any] = None, details: Optional[Dict[str, Any]] = None):
        self.field = field
        self.value = value
        super().__init__(message, details)

class ConfigError(EbayToolsError):
    """Exception raised for configuration errors."""
    pass

# Function decorator for retrying operations
def retry(max_attempts: int = 3, delay: float = 1.0, 
          backoff_factor: float = 2.0,
          exceptions: Union[Type[Exception], Tuple[Type[Exception], ...]] = Exception,
          logger: Optional[logging.Logger] = None):
    """
    Decorator for retrying a function if it raises specified exceptions.
    
    Args:
        max_attempts: Maximum number of attempts
        delay: Initial delay between attempts in seconds
        backoff_factor: Factor by which the delay increases after each attempt
        exceptions: Exception types to catch and retry on
        logger: Logger to use (defaults to module logger)
    
    Example:
        @retry(max_attempts=3, exceptions=ConnectionError)
        def fetch_data(url):
            return requests.get(url).json()
    """
    log = logger or logging.getLogger(__name__)
    
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            current_delay = delay
            
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    if attempt < max_attempts:
                        log.warning(f"Attempt {attempt} failed: {str(e)}. Retrying in {current_delay:.1f} seconds...")
                        time.sleep(current_delay)
                        current_delay *= backoff_factor
                    else:
                        log.error(f"All {max_attempts} attempts failed. Last error: {str(e)}")
            
            # If we get here, all attempts failed
            if last_exception:
                raise last_exception
        
        return wrapper
    
    return decorator

# Context manager for handling errors
class ErrorHandler:
    """
    Context manager for handling errors uniformly.
    
    Example:
        with ErrorHandler("Loading file", show_dialog=True, parent=self.root) as handler:
            data = handler.run(load_file, file_path)
    """
    
    def __init__(self, 
                 operation_name: str,
                 show_dialog: bool = False,
                 parent: Optional[Any] = None,
                 logger: Optional[logging.Logger] = None,
                 raise_exception: bool = True):
        """
        Initialize the error handler.
        
        Args:
            operation_name: Name of the operation being performed
            show_dialog: Whether to show an error dialog
            parent: Parent widget for the dialog
            logger: Logger to use (defaults to module logger)
            raise_exception: Whether to re-raise the exception after logging
        """
        self.operation_name = operation_name
        self.show_dialog = show_dialog
        self.parent = parent
        self.logger = logger or logging.getLogger(__name__)
        self.raise_exception = raise_exception
        self.exception = None
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.exception = exc_val
            
            # Log the error
            self.logger.error(f"{self.operation_name} failed: {str(exc_val)}")
            self.logger.debug(traceback.format_exc())
            
            # Show dialog if requested
            if self.show_dialog:
                try:
                    import tkinter.messagebox as messagebox
                    messagebox.showerror(
                        f"Error: {self.operation_name}",
                        f"{str(exc_val)}",
                        parent=self.parent
                    )
                except ImportError:
                    self.logger.warning("Could not show error dialog - tkinter not available")
            
            # Return True to suppress the exception, or False to re-raise it
            return not self.raise_exception
        
        return True
    
    def run(self, func: Callable, *args, **kwargs) -> Any:
        """
        Run a function and handle any errors.
        
        Args:
            func: Function to run
            *args: Arguments to pass to the function
            **kwargs: Keyword arguments to pass to the function
            
        Returns:
            Result of the function call, or None if it failed
            
        Raises:
            Exception: Re-raised exception if raise_exception is True
        """
        result = None
        try:
            result = func(*args, **kwargs)
        except Exception as e:
            self.exception = e
            
            # Log the error
            self.logger.error(f"{self.operation_name} failed: {str(e)}")
            self.logger.debug(traceback.format_exc())
            
            # Show dialog if requested
            if self.show_dialog:
                try:
                    import tkinter.messagebox as messagebox
                    messagebox.showerror(
                        f"Error: {self.operation_name}",
                        f"{str(e)}",
                        parent=self.parent
                    )
                except ImportError:
                    self.logger.warning("Could not show error dialog - tkinter not available")
            
            # Re-raise if requested
            if self.raise_exception:
                raise
        
        return result

# Function to format an exception for display
def format_exception(e: Exception, include_traceback: bool = False) -> str:
    """
    Format an exception as a user-friendly string.
    
    Args:
        e: Exception to format
        include_traceback: Whether to include the traceback
        
    Returns:
        Formatted exception string
    """
    # Get exception type and message
    exc_type = type(e).__name__
    message = str(e)
    
    # Format based on exception type
    if isinstance(e, EbayToolsError):
        # Handle custom exceptions
        if isinstance(e, ApiError) and e.status_code:
            formatted = f"API Error ({e.status_code}): {message}"
        elif isinstance(e, ValidationError) and e.field:
            formatted = f"Validation Error in {e.field}: {message}"
        else:
            formatted = f"{exc_type}: {message}"
        
        # Add details if available
        if hasattr(e, 'details') and e.details:
            formatted += "\nDetails:"
            for key, value in e.details.items():
                formatted += f"\n  {key}: {value}"
    else:
        # Generic exception formatting
        formatted = f"{exc_type}: {message}"
    
    # Add traceback if requested
    if include_traceback:
        tb = traceback.format_exception(type(e), e, e.__traceback__)
        formatted += "\n\nTraceback:\n" + "".join(tb)
    
    return formatted

# Function to convert common exceptions to custom exceptions
def convert_exception(e: Exception) -> Exception:
    """
    Convert common exceptions to custom exception types.
    
    Args:
        e: Exception to convert
        
    Returns:
        Converted exception
    """
    import urllib.error
    import socket
    import json
    import requests
    
    # File-related errors
    if isinstance(e, (IOError, OSError, FileNotFoundError, PermissionError)):
        return FileError(str(e), {"original_exception": str(type(e).__name__)})
    
    # Network-related errors
    elif isinstance(e, (urllib.error.URLError, urllib.error.HTTPError, 
                      socket.error, ConnectionError, TimeoutError,
                      requests.RequestException)):
        return NetworkError(str(e), {"original_exception": str(type(e).__name__)})
    
    # JSON-related errors
    elif isinstance(e, json.JSONDecodeError):
        return ValidationError(f"Invalid JSON: {str(e)}", details={"original_exception": "JSONDecodeError"})
    
    # Return the original exception if no conversion is needed
    return e

# Setup exception handling for the entire application
def setup_global_exception_handler(log_file: str = "error.log"):
    """
    Set up a global exception handler to log uncaught exceptions.
    
    Args:
        log_file: Path to the log file
    """
    # Configure logging
    logging.basicConfig(
        level=logging.DEBUG,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        filename=log_file,
        filemode="a"
    )
    
    # Define the handler for uncaught exceptions
    def handle_exception(exc_type, exc_value, exc_traceback):
        # Log the exception
        logger.critical("Uncaught exception", exc_info=(exc_type, exc_value, exc_traceback))
        
        # Print to stderr
        print(f"ERROR: {exc_type.__name__}: {exc_value}", file=sys.stderr)
        print("See error log for details.", file=sys.stderr)
    
    # Set the exception handler
    sys.excepthook = handle_exception
    
    logger.info("Global exception handler configured")

# Validation helper function
def validate_required_fields(data: Dict[str, Any], required_fields: List[str]) -> List[str]:
    """
    Validate that required fields are present in the data.
    
    Args:
        data: Data dictionary to validate
        required_fields: List of required field names
        
    Returns:
        List of missing field names
    """
    missing = []
    
    for field in required_fields:
        if field not in data or data[field] is None:
            missing.append(field)
        elif isinstance(data[field], str) and not data[field].strip():
            missing.append(field)
    
    return missing
