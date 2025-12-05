"""
image_utils.py - Utilities for image handling in eBay listing tools

This module provides standardized functions for image operations including:
- Loading images with EXIF orientation correction
- Creating thumbnails
- Image rotation
- Display in tkinter UI
- Calculating dimensions
- Image enhancements and transformations
- Batch processing
- Watermarking
- Format conversion
"""

import os
import logging
import io
import base64
from typing import Tuple, Optional, Any, Dict, List, Callable, Union
import tkinter as tk
from tkinter import ttk
from PIL import Image, ImageTk, ExifTags, ImageEnhance, ImageDraw, ImageFont, UnidentifiedImageError

# Configure logging
logger = logging.getLogger(__name__)

def open_image_with_orientation(path: str) -> Image.Image:
    """
    Open an image and rotate it according to EXIF orientation tag.
    
    Args:
        path: Path to the image file
        
    Returns:
        PIL Image object with correct orientation
        
    Raises:
        FileNotFoundError: If the image file doesn't exist
        UnidentifiedImageError: If the file is not a valid image
        IOError: If there's an error reading the file
    """
    if not os.path.exists(path):
        raise FileNotFoundError(f"Image file not found: {path}")
        
    try:
        image = Image.open(path)
        
        # Only try to auto-rotate JPEGs (other formats typically don't have EXIF)
        if path.lower().endswith(('.jpg', '.jpeg')):
            try:
                # Get EXIF data
                exif = image._getexif()
                
                if exif is not None:
                    # Find orientation tag
                    orientation_key = None
                    for key, value in ExifTags.TAGS.items():
                        if value == 'Orientation':
                            orientation_key = key
                            break
                    
                    if orientation_key and orientation_key in exif:
                        orientation = exif[orientation_key]
                        
                        # Rotate according to orientation value
                        if orientation == 2:
                            image = image.transpose(Image.FLIP_LEFT_RIGHT)
                        elif orientation == 3:
                            image = image.rotate(180)
                        elif orientation == 4:
                            image = image.rotate(180).transpose(Image.FLIP_LEFT_RIGHT)
                        elif orientation == 5:
                            image = image.rotate(-90).transpose(Image.FLIP_LEFT_RIGHT)
                        elif orientation == 6:
                            image = image.rotate(-90)
                        elif orientation == 7:
                            image = image.rotate(90).transpose(Image.FLIP_LEFT_RIGHT)
                        elif orientation == 8:
                            image = image.rotate(90)
            except Exception as e:
                # Log but continue if EXIF processing fails
                logger.warning(f"EXIF processing error for {path}: {str(e)}")
        
        return image
        
    except UnidentifiedImageError:
        logger.error(f"Not a valid image format: {path}")
        raise
    except Exception as e:
        logger.error(f"Error opening image {path}: {str(e)}")
        raise IOError(f"Error opening image: {str(e)}")

def create_thumbnail(image: Image.Image, size: Tuple[int, int]) -> Image.Image:
    """
    Create a thumbnail from an image, preserving aspect ratio.
    
    Args:
        image: PIL Image object
        size: Tuple of (width, height) for the thumbnail
        
    Returns:
        PIL Image object resized as a thumbnail
    """
    # Create a copy to avoid modifying the original
    thumbnail = image.copy()
    thumbnail.thumbnail(size, Image.LANCZOS)
    return thumbnail

def rotate_image(image: Image.Image, degrees: float = 90) -> Image.Image:
    """
    Rotate an image by the specified degrees.
    
    Args:
        image: PIL Image object
        degrees: Rotation angle in degrees (default 90)
        
    Returns:
        Rotated PIL Image object
    """
    # Using expand=True ensures the entire rotated image is visible
    return image.rotate(-degrees, expand=True)

def create_photo_image(image: Image.Image) -> ImageTk.PhotoImage:
    """
    Convert a PIL Image to a Tkinter PhotoImage.
    
    Args:
        image: PIL Image object
        
    Returns:
        Tkinter PhotoImage object
    """
    return ImageTk.PhotoImage(image)

def fit_image_to_frame(image: Image.Image, frame_width: int, frame_height: int) -> Image.Image:
    """
    Resize an image to fit within the specified frame dimensions while maintaining aspect ratio.
    
    Args:
        image: PIL Image object
        frame_width: Width of the frame to fit in
        frame_height: Height of the frame to fit in
        
    Returns:
        Resized PIL Image object
    """
    img_width, img_height = image.size
    
    # Calculate the scaling ratio
    ratio = min(frame_width/img_width, frame_height/img_height)
    
    new_width = int(img_width * ratio)
    new_height = int(img_height * ratio)
    
    # Resize image
    return image.resize((new_width, new_height), Image.LANCZOS)

def display_image_in_label(label: ttk.Label, image: Image.Image, 
                          frame_width: int, frame_height: int) -> ImageTk.PhotoImage:
    """
    Display an image in a ttk.Label, resized to fit the frame.
    
    Args:
        label: ttk.Label widget to display the image in
        image: PIL Image object
        frame_width: Width of the frame to fit in
        frame_height: Height of the frame to fit in
        
    Returns:
        Tkinter PhotoImage object (store this reference to prevent garbage collection)
    """
    # Resize image to fit the frame
    resized_img = fit_image_to_frame(image, frame_width, frame_height)
    
    # Convert to PhotoImage
    photo_image = ImageTk.PhotoImage(resized_img)
    
    # Update the label
    label.config(image=photo_image, text="")
    
    # Return the PhotoImage object so it can be stored as a reference
    return photo_image

def get_image_info(path: str) -> Dict[str, Any]:
    """
    Get information about an image file.
    
    Args:
        path: Path to the image file
        
    Returns:
        Dictionary with image information:
        - exists: Whether the file exists
        - size: File size in bytes
        - dimensions: Tuple of (width, height)
        - format: Image format (JPEG, PNG, etc.)
    """
    info = {
        "exists": False,
        "size": 0,
        "dimensions": (0, 0),
        "format": None
    }
    
    if not os.path.exists(path):
        return info
    
    info["exists"] = True
    info["size"] = os.path.getsize(path)
    
    try:
        with Image.open(path) as img:
            info["dimensions"] = img.size
            info["format"] = img.format
    except Exception as e:
        logger.warning(f"Could not get image dimensions for {path}: {str(e)}")
    
    return info

def format_file_size(size_bytes: int) -> str:
    """
    Format file size in bytes to a human-readable format.
    
    Args:
        size_bytes: Size in bytes
        
    Returns:
        Formatted string (e.g., "2.5 MB")
    """
    if size_bytes < 1024:
        return f"{size_bytes} bytes"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"

# New functions added below

def resize_image(image: Image.Image, width: int, height: int, maintain_aspect: bool = True) -> Image.Image:
    """
    Resize an image to specific dimensions.
    
    Args:
        image: PIL Image object
        width: Target width
        height: Target height
        maintain_aspect: Whether to maintain aspect ratio (True) or force exact dimensions (False)
        
    Returns:
        Resized PIL Image object
    """
    if maintain_aspect:
        # Calculate dimensions that preserve aspect ratio
        img_width, img_height = image.size
        aspect = img_width / img_height
        
        if width / height > aspect:
            # Width is the constraining factor
            new_width = int(height * aspect)
            new_height = height
        else:
            # Height is the constraining factor
            new_width = width
            new_height = int(width / aspect)
        
        return image.resize((new_width, new_height), Image.LANCZOS)
    else:
        # Force the exact dimensions
        return image.resize((width, height), Image.LANCZOS)

def crop_image(image: Image.Image, left: int, top: int, right: int, bottom: int) -> Image.Image:
    """
    Crop an image to a specific region.
    
    Args:
        image: PIL Image object
        left: Left coordinate
        top: Top coordinate
        right: Right coordinate
        bottom: Bottom coordinate
        
    Returns:
        Cropped PIL Image object
    """
    # Ensure coordinates are within image bounds
    img_width, img_height = image.size
    left = max(0, left)
    top = max(0, top)
    right = min(img_width, right)
    bottom = min(img_height, bottom)
    
    # Crop and return
    return image.crop((left, top, right, bottom))

def auto_enhance_image(image: Image.Image, 
                      contrast_factor: float = 1.2, 
                      sharpness_factor: float = 1.3, 
                      brightness_factor: float = 1.1) -> Image.Image:
    """
    Automatically enhance an image by adjusting contrast, sharpness, and brightness.
    
    Args:
        image: PIL Image object
        contrast_factor: Factor to enhance contrast (1.0 means no change)
        sharpness_factor: Factor to enhance sharpness (1.0 means no change)
        brightness_factor: Factor to enhance brightness (1.0 means no change)
        
    Returns:
        Enhanced PIL Image object
    """
    # Make a copy to avoid modifying the original
    enhanced = image.copy()
    
    # Apply enhancements
    enhanced = ImageEnhance.Contrast(enhanced).enhance(contrast_factor)
    enhanced = ImageEnhance.Sharpness(enhanced).enhance(sharpness_factor)
    enhanced = ImageEnhance.Brightness(enhanced).enhance(brightness_factor)
    
    return enhanced

def apply_watermark(image: Image.Image, 
                   text: str, 
                   position: str = 'bottom-right', 
                   opacity: int = 128,
                   font_size: int = 20,
                   color: Tuple[int, int, int] = (255, 255, 255)) -> Image.Image:
    """
    Apply a text watermark to an image.
    
    Args:
        image: PIL Image object
        text: Watermark text
        position: Position of watermark ('top-left', 'top-right', 'bottom-left', 'bottom-right', 'center')
        opacity: Opacity of watermark (0-255)
        font_size: Font size for watermark
        color: RGB color tuple for the watermark text
        
    Returns:
        Watermarked PIL Image object
    """
    # Create a copy to avoid modifying the original
    result = image.copy().convert('RGBA')
    
    # Create a transparent overlay for the watermark
    txt = Image.new('RGBA', result.size, (255, 255, 255, 0))
    
    # Get a drawing context
    draw = ImageDraw.Draw(txt)
    
    # Try to load a font, or use default
    try:
        font = ImageFont.truetype("arial.ttf", font_size)
    except IOError:
        font = ImageFont.load_default()
    
    # Calculate text size
    text_width, text_height = draw.textsize(text, font=font)
    
    # Calculate position
    width, height = result.size
    padding = 10  # Padding from the edge
    
    if position == 'top-left':
        pos = (padding, padding)
    elif position == 'top-right':
        pos = (width - text_width - padding, padding)
    elif position == 'bottom-left':
        pos = (padding, height - text_height - padding)
    elif position == 'bottom-right':
        pos = (width - text_width - padding, height - text_height - padding)
    else:  # center
        pos = ((width - text_width) // 2, (height - text_height) // 2)
    
    # Create the watermark with the specified opacity
    color_with_opacity = color + (opacity,)
    draw.text(pos, text, fill=color_with_opacity, font=font)
    
    # Composite the watermark with the image
    watermarked = Image.alpha_composite(result, txt)
    
    # Convert back to RGB if needed
    if image.mode == 'RGB':
        watermarked = watermarked.convert('RGB')
    
    return watermarked

def convert_image_format(image: Image.Image, format: str) -> Image.Image:
    """
    Convert an image to a different format.
    
    Args:
        image: PIL Image object
        format: Target format (e.g., 'JPEG', 'PNG', 'GIF', 'BMP')
        
    Returns:
        PIL Image object in the new format
    """
    # Create a temporary in-memory file
    with io.BytesIO() as output:
        # Save image to the in-memory file in the target format
        image.save(output, format=format)
        
        # Move pointer to the beginning of the buffer
        output.seek(0)
        
        # Open the image from the buffer
        converted = Image.open(output)
        
        # Clone the image to ensure it's not tied to the buffer
        converted = converted.copy()
    
    return converted

def save_image_with_quality(image: Image.Image, path: str, quality: int = 90, 
                           optimize: bool = True) -> bool:
    """
    Save an image with specific quality settings.
    
    Args:
        image: PIL Image object
        path: Path to save the image
        quality: JPEG quality (0-100, higher is better)
        optimize: Whether to optimize the image
        
    Returns:
        True on success, False on failure
    """
    try:
        # Get the file extension
        _, ext = os.path.splitext(path)
        ext = ext.lower()
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        
        # For JPEG/JPG images, use quality parameter
        if ext in ['.jpg', '.jpeg']:
            image.save(path, quality=quality, optimize=optimize)
        elif ext == '.png':
            # For PNG, optimize and set compression level
            image.save(path, optimize=optimize, compress_level=9)
        else:
            # For other formats, just save normally
            image.save(path)
        
        logger.info(f"Saved image to {path}")
        return True
    except Exception as e:
        logger.error(f"Error saving image to {path}: {str(e)}")
        return False

def get_exif_data(image: Union[Image.Image, str]) -> Dict[str, Any]:
    """
    Extract all EXIF data from an image.
    
    Args:
        image: PIL Image object or path to image file
        
    Returns:
        Dictionary of EXIF data with human-readable tags
    """
    # Load the image if a path was provided
    if isinstance(image, str):
        if not os.path.exists(image):
            raise FileNotFoundError(f"Image file not found: {image}")
        image = Image.open(image)
    
    exif_data = {}
    
    try:
        # Get raw EXIF data
        exif_info = image._getexif()
        
        if exif_info is None:
            return exif_data
        
        # Convert EXIF tags to human-readable form
        for tag, value in exif_info.items():
            decoded = ExifTags.TAGS.get(tag, tag)
            
            # Special handling for GPS tags
            if decoded == 'GPSInfo':
                gps_data = {}
                for gps_tag, gps_value in value.items():
                    gps_decoded = ExifTags.GPSTAGS.get(gps_tag, gps_tag)
                    gps_data[gps_decoded] = gps_value
                exif_data[decoded] = gps_data
            else:
                # Handle binary data
                if isinstance(value, bytes):
                    value = f"Binary data ({len(value)} bytes)"
                
                exif_data[decoded] = value
    except Exception as e:
        logger.warning(f"Error extracting EXIF data: {str(e)}")
    
    return exif_data

def batch_process_images(image_paths: List[str], processor_func: Callable, 
                        output_dir: Optional[str] = None, **kwargs) -> List[Tuple[str, bool]]:
    """
    Apply a processing function to multiple images.
    
    Args:
        image_paths: List of paths to images
        processor_func: Function to apply to each image (must accept an Image object and return an Image object)
        output_dir: Directory to save processed images (if None, original files are overwritten)
        **kwargs: Additional arguments to pass to the processor function
        
    Returns:
        List of tuples (path, success) indicating processing success/failure for each image
    """
    results = []
    
    # Create output directory if needed
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
    
    # Process each image
    for path in image_paths:
        try:
            # Skip non-existent files
            if not os.path.exists(path):
                logger.warning(f"File not found: {path}")
                results.append((path, False))
                continue
            
            # Skip non-image files
            if not path.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif')):
                logger.warning(f"Not an image file: {path}")
                results.append((path, False))
                continue
            
            # Open the image
            image = open_image_with_orientation(path)
            
            # Process the image
            processed = processor_func(image, **kwargs)
            
            # Determine output path
            if output_dir:
                # Save to new location
                filename = os.path.basename(path)
                output_path = os.path.join(output_dir, filename)
            else:
                # Overwrite original
                output_path = path
            
            # Save the processed image
            processed.save(output_path)
            results.append((path, True))
            logger.info(f"Processed {path} -> {output_path}")
            
        except Exception as e:
            logger.error(f"Error processing {path}: {str(e)}")
            results.append((path, False))
    
    return results

def create_image_grid(images: List[Image.Image], rows: int, cols: int, 
                     spacing: int = 10, bg_color: Tuple[int, int, int] = (255, 255, 255)) -> Image.Image:
    """
    Create a grid of images.
    
    Args:
        images: List of PIL Image objects
        rows: Number of rows in the grid
        cols: Number of columns in the grid
        spacing: Spacing between images in pixels
        bg_color: Background color as RGB tuple
        
    Returns:
        PIL Image object containing the grid
    """
    # Verify we have enough images
    num_images = len(images)
    if num_images == 0:
        raise ValueError("No images provided")
    
    if num_images > rows * cols:
        logger.warning(f"Too many images provided ({num_images}). Only using the first {rows * cols}.")
        images = images[:rows * cols]
    
    # Find the maximum dimensions
    max_width = max(img.width for img in images)
    max_height = max(img.height for img in images)
    
    # Calculate the grid dimensions
    grid_width = cols * max_width + (cols - 1) * spacing
    grid_height = rows * max_height + (rows - 1) * spacing
    
    # Create a new image for the grid
    grid = Image.new('RGB', (grid_width, grid_height), bg_color)
    
    # Paste images into the grid
    for i, img in enumerate(images):
        if i >= rows * cols:
            break
            
        row = i // cols
        col = i % cols
        
        x = col * (max_width + spacing)
        y = row * (max_height + spacing)
        
        # Center the image in its cell
        x_offset = (max_width - img.width) // 2
        y_offset = (max_height - img.height) // 2
        
        grid.paste(img, (x + x_offset, y + y_offset))
    
    return grid

def image_to_base64(image: Image.Image, format: str = 'JPEG', quality: int = 90) -> str:
    """
    Convert a PIL Image to a base64-encoded string.
    
    Args:
        image: PIL Image object
        format: Image format to use (JPEG, PNG, etc.)
        quality: Quality for JPEG compression (0-100)
        
    Returns:
        Base64-encoded string of the image
    """
    buffered = io.BytesIO()
    
    # Save image to buffer
    if format.upper() == 'JPEG':
        image.save(buffered, format=format, quality=quality)
    else:
        image.save(buffered, format=format)
    
    # Encode as base64
    img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
    
    return img_str

def base64_to_image(base64_str: str) -> Image.Image:
    """
    Convert a base64-encoded string to a PIL Image.
    
    Args:
        base64_str: Base64-encoded string of an image
        
    Returns:
        PIL Image object
    """
    # Decode base64 string
    img_data = base64.b64decode(base64_str)
    
    # Create a BytesIO object from the decoded data
    buffered = io.BytesIO(img_data)
    
    # Open the image from the BytesIO object
    image = Image.open(buffered)
    
    return image

def add_border(image: Image.Image, width: int = 5, color: Tuple[int, int, int] = (0, 0, 0)) -> Image.Image:
    """
    Add a border to an image.
    
    Args:
        image: PIL Image object
        width: Border width in pixels
        color: Border color as RGB tuple
        
    Returns:
        PIL Image with border
    """
    # Get original size
    img_width, img_height = image.size
    
    # Create new image with border
    bordered = Image.new(
        'RGB',
        (img_width + 2 * width, img_height + 2 * width),
        color
    )
    
    # Paste original image in the center
    bordered.paste(image, (width, width))
    
    return bordered

def calculate_aspect_ratio(width: int, height: int) -> float:
    """
    Calculate aspect ratio from dimensions.
    
    Args:
        width: Width in pixels
        height: Height in pixels
        
    Returns:
        Aspect ratio as a float (width/height)
    """
    return width / height if height != 0 else 0

def detect_image_orientation(image: Image.Image) -> str:
    """
    Detect if an image is portrait, landscape, or square.
    
    Args:
        image: PIL Image object
        
    Returns:
        String indicating orientation: 'portrait', 'landscape', or 'square'
    """
    width, height = image.size
    
    if width > height:
        return 'landscape'
    elif height > width:
        return 'portrait'
    else:
        return 'square'
