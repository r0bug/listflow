"""
LLM API Client for eBay listing tools.
Handles API authentication, requests, retrying, rate limiting, and caching.
"""

import os
import json
import time
import requests
import logging
from typing import Dict, Any, List, Optional, Union, Callable
from dataclasses import dataclass
import base64

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@dataclass
class ApiConfig:
    """Configuration for API credentials and settings."""
    api_key: str
    api_url: str
    delay: float = 2.0  # Delay between requests in seconds
    max_retries: int = 3
    timeout: int = 60
    
    @classmethod
    def load_from_file(cls, file_path: str) -> "ApiConfig":
        """Load API configuration from a JSON file."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"API config file not found: {file_path}")
        
        with open(file_path, 'r') as f:
            config = json.load(f)
        
        return cls(
            api_key=config.get("api_key", ""),
            api_url=config.get("api_url", ""),
            delay=float(config.get("delay", 2.0)),
            max_retries=int(config.get("max_retries", 3)),
            timeout=int(config.get("timeout", 60))
        )
    
    def save_to_file(self, file_path: str) -> None:
        """Save API configuration to a JSON file."""
        config_dict = {
            "api_key": self.api_key,
            "api_url": self.api_url,
            "delay": self.delay,
            "max_retries": self.max_retries,
            "timeout": self.timeout
        }
        
        with open(file_path, 'w') as f:
            json.dump(config_dict, f, indent=2)


class ApiError(Exception):
    """Exception raised for API errors."""
    def __init__(self, message: str, status_code: Optional[int] = None, response_text: Optional[str] = None):
        self.message = message
        self.status_code = status_code
        self.response_text = response_text
        super().__init__(self.message)


class LLMApiClient:
    """
    Client for interacting with various LLM APIs (Claude, LLaVA, etc.)
    with retrying, rate limiting, and caching.
    """
    
    def __init__(self, config: ApiConfig):
        """
        Initialize the API client.
        
        Args:
            config: API configuration
        """
        self.config = config
        self.cache = {}  # Simple memory cache
        self.last_request_time = 0  # Time of last request for rate limiting
    
    def _enforce_rate_limit(self) -> None:
        """Enforce rate limiting by delaying if needed."""
        current_time = time.time()
        elapsed = current_time - self.last_request_time
        
        if elapsed < self.config.delay and self.last_request_time > 0:
            # Need to wait
            sleep_time = self.config.delay - elapsed
            logger.debug(f"Rate limiting: Sleeping for {sleep_time:.2f} seconds")
            time.sleep(sleep_time)
        
        # Update last request time
        self.last_request_time = time.time()
    
    def _get_cache_key(self, endpoint: str, data: Dict[str, Any]) -> str:
        """Generate a cache key for a request."""
        # Simple string representation of the request
        return f"{endpoint}:{hash(json.dumps(data, sort_keys=True))}"
    
    def _detect_api_type(self) -> str:
        """Detect the API type from the URL."""
        url = self.config.api_url.lower()
        if "claude" in url:
            return "claude"
        elif "llava" in url:
            return "llava"
        elif "gpt" in url or "openai" in url:
            return "openai"
        else:
            return "unknown"
    
    def create_request_payload(self, prompt: str, image_data: Optional[str] = None) -> Dict[str, Any]:
        """
        Create a request payload based on the API type.
        
        Args:
            prompt: Text prompt for the LLM
            image_data: Base64-encoded image data (optional)
            
        Returns:
            Request payload dictionary
        """
        api_type = self._detect_api_type()
        
        if api_type == "claude" and image_data:
            # Claude multimodal API format
            return {
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            },
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": "image/jpeg",
                                    "data": image_data
                                }
                            }
                        ]
                    }
                ],
                "max_tokens": 1000,
                "temperature": 0.7
            }
        elif api_type == "claude" and not image_data:
            # Claude text-only API format
            return {
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": 2000,
                "temperature": 0.7
            }
        elif api_type == "llava" and image_data:
            # LLaVA multimodal API format
            return {
                "images": image_data,
                "prompt": prompt
            }
        elif api_type == "llava" and not image_data:
            # LLaVA text-only API format
            return {
                "prompt": prompt
            }
        elif api_type == "openai" and image_data:
            # OpenAI GPT-4 Vision format
            return {
                "model": "gpt-4-vision-preview",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_data}"
                                }
                            }
                        ]
                    }
                ],
                "max_tokens": 1000
            }
        elif api_type == "openai" and not image_data:
            # OpenAI GPT text-only format
            return {
                "model": "gpt-4",
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": 1000
            }
        else:
            # Default to LLaVA-like format
            if image_data:
                return {
                    "images": image_data,
                    "prompt": prompt
                }
            else:
                return {
                    "prompt": prompt
                }
    
    def extract_response_text(self, response_data: Dict[str, Any]) -> str:
        """
        Extract the response text from the API response data.
        
        Args:
            response_data: API response data
            
        Returns:
            Extracted text response
        """
        api_type = self._detect_api_type()
        
        if api_type == "claude":
            # Claude format: extract from content array
            if "content" in response_data:
                content_arr = response_data.get("content", [])
                if content_arr and isinstance(content_arr, list) and len(content_arr) > 0:
                    first_content = content_arr[0]
                    if isinstance(first_content, dict) and "text" in first_content:
                        return first_content["text"]
        elif api_type == "llava":
            # LLaVA format
            if "response" in response_data:
                return response_data["response"]
        elif api_type == "openai":
            # OpenAI format
            if "choices" in response_data and len(response_data["choices"]) > 0:
                choice = response_data["choices"][0]
                if "message" in choice and "content" in choice["message"]:
                    return choice["message"]["content"]
        
        # Fallback: return the whole response as a string
        return str(response_data)
    
    def make_request(
        self, 
        prompt: str, 
        image_path: Optional[str] = None,
        use_cache: bool = True
    ) -> str:
        """
        Make an API request with retrying and caching.
        
        Args:
            prompt: Text prompt for the LLM
            image_path: Path to an image file (optional)
            use_cache: Whether to use cache for this request
            
        Returns:
            Text response from the API
        """
        # Check API key
        if not self.config.api_key:
            raise ApiError("API key is missing")
        
        # Prepare image data if provided
        image_data = None
        if image_path:
            if not os.path.exists(image_path):
                raise FileNotFoundError(f"Image file not found: {image_path}")
            
            try:
                with open(image_path, "rb") as f:
                    image_bytes = f.read()
                    image_data = base64.b64encode(image_bytes).decode("utf-8")
            except Exception as e:
                raise ApiError(f"Failed to read image file: {str(e)}")
        
        # Create request payload
        payload = self.create_request_payload(prompt, image_data)
        
        # Check cache
        if use_cache:
            cache_key = self._get_cache_key(self.config.api_url, payload)
            if cache_key in self.cache:
                logger.info(f"Using cached response for: {image_path if image_path else 'text prompt'}")
                return self.cache[cache_key]
        
        # Prepare headers
        headers = {
            "x-api-key": self.config.api_key,
            "Content-Type": "application/json"
        }
        
        # Set API-specific headers
        api_type = self._detect_api_type()
        if api_type == "openai":
            headers = {
                "Authorization": f"Bearer {self.config.api_key}",
                "Content-Type": "application/json"
            }
        
        # Make the request with retrying
        for attempt in range(self.config.max_retries):
            try:
                # Enforce rate limiting
                self._enforce_rate_limit()
                
                # Log the request
                logger.info(f"Sending request to {self.config.api_url}")
                if image_path:
                    logger.info(f"With image: {os.path.basename(image_path)}")
                logger.info(f"Prompt: {prompt[:100]}...")
                
                # Make the request
                response = requests.post(
                    self.config.api_url,
                    headers=headers,
                    json=payload,
                    timeout=self.config.timeout
                )
                
                # Handle response
                if response.status_code == 200:
                    # Parse response
                    result = response.json()
                    
                    # Extract text
                    response_text = self.extract_response_text(result)
                    
                    # Cache the response
                    if use_cache:
                        cache_key = self._get_cache_key(self.config.api_url, payload)
                        self.cache[cache_key] = response_text
                    
                    # Return the response
                    return response_text
                else:
                    error_msg = f"API Error: {response.status_code} - {response.text}"
                    logger.error(error_msg)
                    
                    # Some status codes are worth retrying, others not
                    if response.status_code in [429, 500, 502, 503, 504]:
                        # Exponential backoff
                        if attempt < self.config.max_retries - 1:
                            wait_time = (2 ** attempt) * 1.5
                            logger.info(f"Retrying in {wait_time:.1f} seconds... (Attempt {attempt+1}/{self.config.max_retries})")
                            time.sleep(wait_time)
                            continue
                    
                    # If we get here, either it's not a retriable error or we've exhausted retries
                    raise ApiError(error_msg, response.status_code, response.text)
            
            except requests.RequestException as e:
                # Network-level errors
                logger.error(f"Request error: {str(e)}")
                
                if attempt < self.config.max_retries - 1:
                    wait_time = (2 ** attempt) * 1.5
                    logger.info(f"Retrying in {wait_time:.1f} seconds... (Attempt {attempt+1}/{self.config.max_retries})")
                    time.sleep(wait_time)
                else:
                    raise ApiError(f"Max retries exceeded: {str(e)}")
        
        # This should never be reached due to the exception in the loop
        raise ApiError("Max retries exceeded")
    
    def process_photo(
        self, 
        photo_path: str, 
        prompt: str,
        callback: Optional[Callable[[str], None]] = None
    ) -> str:
        """
        Process a photo with the LLM.
        
        Args:
            photo_path: Path to the photo
            prompt: Text prompt for the LLM
            callback: Optional callback to receive the response
            
        Returns:
            Text response from the API
        """
        try:
            logger.info(f"Processing photo: {os.path.basename(photo_path)}")
            response = self.make_request(prompt, photo_path)
            
            if callback:
                callback(response)
            
            return response
            
        except Exception as e:
            logger.error(f"Error processing photo: {str(e)}")
            raise
    
    def generate_text(
        self, 
        prompt: str,
        callback: Optional[Callable[[str], None]] = None
    ) -> str:
        """
        Generate text with the LLM (no image).
        
        Args:
            prompt: Text prompt for the LLM
            callback: Optional callback to receive the response
            
        Returns:
            Text response from the API
        """
        try:
            logger.info(f"Generating text response for prompt: {prompt[:50]}...")
            response = self.make_request(prompt)
            
            if callback:
                callback(response)
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating text: {str(e)}")
            raise
    
    def process_photo_batch(
        self,
        photos: List[Dict[str, str]],
        prompt_template: str,
        callback: Optional[Callable[[int, int, str, str], None]] = None
    ) -> List[Dict[str, Any]]:
        """
        Process a batch of photos, with progress reporting.
        
        Args:
            photos: List of photo dictionaries with at least a 'path' key
            prompt_template: Template string for prompts, can include {photo_path} and other keys from photo dict
            callback: Optional callback function that receives (index, total, photo_path, response)
            
        Returns:
            List of dictionaries with original photo data plus 'response' and 'error' keys
        """
        results = []
        total = len(photos)
        
        for i, photo in enumerate(photos):
            photo_path = photo.get("path", "")
            if not photo_path or not os.path.exists(photo_path):
                logger.warning(f"Photo {i+1}/{total}: Invalid path - {photo_path}")
                result = photo.copy()
                result["error"] = "Invalid or missing photo path"
                result["response"] = None
                results.append(result)
                
                if callback:
                    callback(i, total, photo_path, None)
                
                continue
                
            # Format the prompt with photo data
            try:
                prompt = prompt_template.format(photo_path=photo_path, **photo)
            except KeyError as e:
                logger.warning(f"Photo {i+1}/{total}: Missing key in prompt template - {e}")
                prompt = prompt_template.replace("{" + str(e).strip("'") + "}", "")
            
            # Process the photo
            try:
                logger.info(f"Processing photo {i+1}/{total}: {os.path.basename(photo_path)}")
                response = self.make_request(prompt, photo_path)
                
                result = photo.copy()
                result["response"] = response
                results.append(result)
                
                if callback:
                    callback(i, total, photo_path, response)
                
            except Exception as e:
                logger.error(f"Error processing photo {i+1}/{total}: {str(e)}")
                
                result = photo.copy()
                result["error"] = str(e)
                result["response"] = None
                results.append(result)
                
                if callback:
                    callback(i, total, photo_path, None)
            
            # Add a small delay between requests even with rate limiting
            # to avoid overwhelming the API service
            if i < total - 1:
                time.sleep(0.5)
        
        return results
    
    def clear_cache(self):
        """Clear the response cache."""
        self.cache = {}
        logger.info("Cache cleared")


# Example usage
if __name__ == "__main__":
    # Example configuration
    config = ApiConfig(
        api_key="your_api_key",
        api_url="https://api.segmind.com/v1/claude-3.7-sonnet",
        delay=2.0,
        max_retries=3,
        timeout=60
    )
    
    # Create client
    client = LLMApiClient(config)
    
    # Example text generation
    try:
        response = client.generate_text("What is the capital of France?")
        print(f"Response: {response}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Example image processing
    try:
        response = client.process_photo(
            "example.jpg", 
            "Describe this image in detail."
        )
        print(f"Response: {response}")
    except Exception as e:
        print(f"Error: {e}")