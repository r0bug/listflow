"""
config_utils.py - Configuration management utilities for eBay listing tools

This module provides consistent configuration handling including:
- Loading and saving configuration
- Default configuration generation
- Configuration validation
- Secure credential storage
"""

import os
import json
import logging
from typing import Dict, Any, Optional, List, Tuple, Union
import base64
import hashlib
from pathlib import Path
import getpass

# Configure logging
logger = logging.getLogger(__name__)

# Default config directory
DEFAULT_CONFIG_DIR = os.path.join(os.path.expanduser("~"), ".ebay_tools")
DEFAULT_CONFIG_FILE = "config.json"

class ConfigManager:
    """
    Manager class for application configuration.
    """
    
    def __init__(self, config_dir: Optional[str] = None, config_file: Optional[str] = None):
        """
        Initialize the configuration manager.
        
        Args:
            config_dir: Configuration directory (defaults to ~/.ebay_tools)
            config_file: Configuration file name (defaults to config.json)
        """
        self.config_dir = config_dir or DEFAULT_CONFIG_DIR
        self.config_file = config_file or DEFAULT_CONFIG_FILE
        self.config_path = os.path.join(self.config_dir, self.config_file)
        
        # Initialize with default configuration
        self.config = self.get_default_config()
        
        # Create config directory if it doesn't exist
        self._ensure_config_dir()
    
    def _ensure_config_dir(self) -> bool:
        """
        Ensure the configuration directory exists.
        
        Returns:
            True if successful, False on failure
        """
        try:
            if not os.path.exists(self.config_dir):
                os.makedirs(self.config_dir, exist_ok=True)
                logger.info(f"Created configuration directory: {self.config_dir}")
            return True
        except Exception as e:
            logger.error(f"Failed to create configuration directory {self.config_dir}: {str(e)}")
            return False
    
    def get_default_config(self) -> Dict[str, Any]:
        """
        Get the default configuration.
        
        Returns:
            Default configuration dictionary
        """
        return {
            "api": {
                "type": "LLaVA v1.6",
                "url": "https://api.segmind.com/v1/llava-v1.6",
                "key": "",
                "delay": 2.0,
                "max_retries": 3,
                "timeout": 60
            },
            "app": {
                "theme": "default",
                "thumbnail_size": [150, 150],
                "auto_save": True,
                "auto_save_interval": 300,  # seconds
                "default_save_dir": os.path.expanduser("~/Documents")
            },
            "paths": {
                "last_queue_file": "",
                "last_photo_dir": ""
            },
            "ui": {
                "window_width": 1100,
                "window_height": 800,
                "font_size": 10,
                "show_tooltips": True
            }
        }
    
    def load(self) -> bool:
        """
        Load configuration from the config file.
        
        Returns:
            True if successful, False on failure
        """
        if not os.path.exists(self.config_path):
            logger.info(f"Configuration file {self.config_path} not found, using defaults")
            return False
        
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                loaded_config = json.load(f)
            
            # Merge with defaults to ensure missing keys are filled
            self._merge_configs(self.config, loaded_config)
            
            logger.info(f"Loaded configuration from {self.config_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to load configuration from {self.config_path}: {str(e)}")
            return False
    
    def _merge_configs(self, base: Dict[str, Any], override: Dict[str, Any]) -> None:
        """
        Merge override configuration into base configuration.
        
        Args:
            base: Base configuration to update
            override: Configuration to merge in
        """
        for key, value in override.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                # Recursively merge nested dictionaries
                self._merge_configs(base[key], value)
            else:
                # Override or add value
                base[key] = value
    
    def save(self) -> bool:
        """
        Save the current configuration to the config file.
        
        Returns:
            True if successful, False on failure
        """
        if not self._ensure_config_dir():
            return False
        
        try:
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=2)
            
            logger.info(f"Saved configuration to {self.config_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to save configuration to {self.config_path}: {str(e)}")
            return False
    
    def get(self, key: str, default: Any = None) -> Any:
        """
        Get a configuration value by key path.
        
        Args:
            key: Configuration key path (e.g., "api.url")
            default: Default value if key not found
            
        Returns:
            Configuration value or default
        """
        parts = key.split('.')
        value = self.config
        
        try:
            for part in parts:
                value = value[part]
            return value
        except (KeyError, TypeError):
            return default
    
    def set(self, key: str, value: Any) -> None:
        """
        Set a configuration value by key path.
        
        Args:
            key: Configuration key path (e.g., "api.url")
            value: Value to set
        """
        parts = key.split('.')
        config = self.config
        
        # Navigate to the nested dictionary
        for part in parts[:-1]:
            if part not in config or not isinstance(config[part], dict):
                config[part] = {}
            config = config[part]
        
        # Set the value
        config[parts[-1]] = value
    
    def get_api_config(self) -> Dict[str, Any]:
        """
        Get the API configuration.
        
        Returns:
            API configuration dictionary
        """
        return self.config.get("api", {})
    
    def set_api_config(self, api_type: str, api_url: str, api_key: str, 
                     delay: float = 2.0, max_retries: int = 3, timeout: int = 60) -> None:
        """
        Set the API configuration.
        
        Args:
            api_type: API type name
            api_url: API URL
            api_key: API key
            delay: Delay between requests in seconds
            max_retries: Maximum number of retries
            timeout: Request timeout in seconds
        """
        self.config["api"] = {
            "type": api_type,
            "url": api_url,
            "key": api_key,
            "delay": delay,
            "max_retries": max_retries,
            "timeout": timeout
        }
    
    def update_recent_path(self, path_type: str, path: str) -> None:
        """
        Update a recent path in the configuration.
        
        Args:
            path_type: Path type (e.g., "last_queue_file")
            path: Path to store
        """
        if "paths" not in self.config:
            self.config["paths"] = {}
        
        self.config["paths"][path_type] = path
    
    def get_recent_path(self, path_type: str, default: str = "") -> str:
        """
        Get a recent path from the configuration.
        
        Args:
            path_type: Path type (e.g., "last_queue_file")
            default: Default value if path not found
            
        Returns:
            Path or default value
        """
        if "paths" not in self.config:
            return default
        
        return self.config["paths"].get(path_type, default)
    
    def reset_to_defaults(self) -> None:
        """Reset configuration to defaults."""
        self.config = self.get_default_config()
        logger.info("Reset configuration to defaults")


class CredentialManager:
    """
    Manager class for secure credential storage.
    """
    
    def __init__(self, config_dir: Optional[str] = None):
        """
        Initialize the credential manager.
        
        Args:
            config_dir: Configuration directory (defaults to ~/.ebay_tools)
        """
        self.config_dir = config_dir or DEFAULT_CONFIG_DIR
        self.creds_file = os.path.join(self.config_dir, "credentials.enc")
        
        # Ensure the config directory exists
        if not os.path.exists(self.config_dir):
            os.makedirs(self.config_dir, exist_ok=True)
            logger.info(f"Created configuration directory: {self.config_dir}")
    
    def _get_encryption_key(self, password: str) -> bytes:
        """
        Derive an encryption key from a password.
        
        Args:
            password: Password to derive key from
            
        Returns:
            32-byte encryption key
        """
        # Get a unique machine identifier
        machine_id = self._get_machine_id()
        
        # Combine password and machine ID
        key_material = f"{password}{machine_id}".encode()
        
        # Use SHA-256 to derive a 32-byte key
        return hashlib.sha256(key_material).digest()
    
    def _get_machine_id(self) -> str:
        """
        Get a unique identifier for the current machine.
        
        Returns:
            Machine identifier string
        """
        # Try to get a unique machine identifier
        machine_id = ""
        
        # Try platform-specific approaches
        try:
            if os.name == 'nt':  # Windows
                import winreg
                reg = winreg.ConnectRegistry(None, winreg.HKEY_LOCAL_MACHINE)
                key = winreg.OpenKey(reg, r"SOFTWARE\Microsoft\Cryptography")
                machine_id, _ = winreg.QueryValueEx(key, "MachineGuid")
            elif os.name == 'posix':  # Linux/Mac
                if os.path.isfile('/etc/machine-id'):
                    with open('/etc/machine-id', 'r') as f:
                        machine_id = f.read().strip()
                elif os.path.isfile('/var/lib/dbus/machine-id'):
                    with open('/var/lib/dbus/machine-id', 'r') as f:
                        machine_id = f.read().strip()
        except Exception as e:
            logger.warning(f"Could not get machine ID: {str(e)}")
        
        # Fall back to hostname if no machine ID found
        if not machine_id:
            import socket
            machine_id = socket.gethostname()
        
        return machine_id
    
    def _encrypt(self, data: str, key: bytes) -> bytes:
        """
        Encrypt data with the given key.
        
        Args:
            data: String data to encrypt
            key: Encryption key
            
        Returns:
            Encrypted data
        """
        # Simple XOR-based encryption (not for high-security use)
        data_bytes = data.encode('utf-8')
        key_len = len(key)
        encrypted = bytearray(len(data_bytes))
        
        for i, byte in enumerate(data_bytes):
            encrypted[i] = byte ^ key[i % key_len]
        
        # Base64 encode for storage
        return base64.b64encode(encrypted)
    
    def _decrypt(self, encrypted_data: bytes, key: bytes) -> str:
        """
        Decrypt data with the given key.
        
        Args:
            encrypted_data: Encrypted data
            key: Encryption key
            
        Returns:
            Decrypted string
        """
        # Decode from base64
        encrypted = base64.b64decode(encrypted_data)
        
        # Simple XOR-based decryption
        key_len = len(key)
        decrypted = bytearray(len(encrypted))
        
        for i, byte in enumerate(encrypted):
            decrypted[i] = byte ^ key[i % key_len]
        
        return decrypted.decode('utf-8')
    
    def save_credentials(self, credentials: Dict[str, str], password: Optional[str] = None) -> bool:
        """
        Save credentials to the encrypted storage.
        
        Args:
            credentials: Dictionary of credentials to save
            password: Optional password for encryption (will prompt if None)
            
        Returns:
            True if successful, False on failure
        """
        try:
            # Get password if not provided
            if password is None:
                password = getpass.getpass("Enter password to encrypt credentials: ")
            
            # Convert credentials to JSON
            creds_json = json.dumps(credentials)
            
            # Encrypt the credentials
            key = self._get_encryption_key(password)
            encrypted_data = self._encrypt(creds_json, key)
            
            # Save to file
            with open(self.creds_file, 'wb') as f:
                f.write(encrypted_data)
            
            logger.info(f"Saved encrypted credentials to {self.creds_file}")
            return True
        except Exception as e:
            logger.error(f"Failed to save credentials: {str(e)}")
            return False
    
    def load_credentials(self, password: Optional[str] = None) -> Optional[Dict[str, str]]:
        """
        Load credentials from the encrypted storage.
        
        Args:
            password: Optional password for decryption (will prompt if None)
            
        Returns:
            Dictionary of credentials, or None on failure
        """
        if not os.path.exists(self.creds_file):
            logger.warning(f"Credentials file {self.creds_file} not found")
            return None
        
        try:
            # Get password if not provided
            if password is None:
                password = getpass.getpass("Enter password to decrypt credentials: ")
            
            # Read encrypted data
            with open(self.creds_file, 'rb') as f:
                encrypted_data = f.read()
            
            # Decrypt the credentials
            key = self._get_encryption_key(password)
            creds_json = self._decrypt(encrypted_data, key)
            
            # Parse JSON
            credentials = json.loads(creds_json)
            
            logger.info(f"Loaded credentials from {self.creds_file}")
            return credentials
        except Exception as e:
            logger.error(f"Failed to load credentials: {str(e)}")
            return None
    
    def add_credential(self, name: str, value: str, password: Optional[str] = None) -> bool:
        """
        Add or update a credential in the storage.
        
        Args:
            name: Credential name
            value: Credential value
            password: Optional password for encryption (will prompt if None)
            
        Returns:
            True if successful, False on failure
        """
        # Load existing credentials
        credentials = self.load_credentials(password) or {}
        
        # Add or update the credential
        credentials[name] = value
        
        # Save the updated credentials
        return self.save_credentials(credentials, password)
    
    def get_credential(self, name: str, password: Optional[str] = None) -> Optional[str]:
        """
        Get a credential from the storage.
        
        Args:
            name: Credential name
            password: Optional password for decryption (will prompt if None)
            
        Returns:
            Credential value, or None if not found
        """
        # Load credentials
        credentials = self.load_credentials(password)
        
        if credentials is None:
            return None
        
        # Return the requested credential
        return credentials.get(name)
    
    def delete_credential(self, name: str, password: Optional[str] = None) -> bool:
        """
        Delete a credential from the storage.
        
        Args:
            name: Credential name
            password: Optional password for encryption (will prompt if None)
            
        Returns:
            True if successful, False on failure
        """
        # Load existing credentials
        credentials = self.load_credentials(password)
        
        if credentials is None:
            return False
        
        # Remove the credential if it exists
        if name in credentials:
            del credentials[name]
            
            # Save the updated credentials
            return self.save_credentials(credentials, password)
        
        return True  # Already doesn't exist