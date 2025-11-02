#!/usr/bin/env python3
"""
Process flood zone images to detect colored pixel bounds and update flood_zones.json
This script analyzes each zone image and adjusts the bounds to only cover colored pixels,
excluding transparent borders.
"""

import json
import os
from PIL import Image

def detect_content_bounds(image_path):
    """
    Detect the bounding box of non-transparent pixels in an image.
    
    Returns:
        dict with normalized bounds (0-1): {minX, minY, maxX, maxY}
        or None if detection fails
    """
    try:
        img = Image.open(image_path)
        
        # Convert to RGBA if needed
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        width, height = img.size
        pixels = img.load()
        
        # Find bounding box of non-transparent pixels
        min_x = width
        min_y = height
        max_x = 0
        max_y = 0
        found_colored = False
        
        # Scan all pixels to find the bounding box
        for y in range(height):
            for x in range(width):
                r, g, b, a = pixels[x, y]
                
                # Check if pixel is not transparent (alpha >= 10)
                if a >= 10:
                    found_colored = True
                    if x < min_x:
                        min_x = x
                    if x > max_x:
                        max_x = x
                    if y < min_y:
                        min_y = y
                    if y > max_y:
                        max_y = y
        
        if not found_colored:
            print(f"  WARNING: No colored pixels found in {image_path}")
            return None
        
        # Normalize to 0-1 range
        bounds = {
            'minX': min_x / width,
            'minY': min_y / height,
            'maxX': (max_x + 1) / width,  # +1 to include the pixel
            'maxY': (max_y + 1) / height,  # +1 to include the pixel
            'pixelBounds': {
                'minX': min_x,
                'minY': min_y,
                'maxX': max_x,
                'maxY': max_y
            },
            'imageSize': {'width': width, 'height': height}
        }
        
        content_width = bounds['maxX'] - bounds['minX']
        content_height = bounds['maxY'] - bounds['minY']
        
        print(f"  Content bounds: {content_width*100:.2f}% width, {content_height*100:.2f}% height")
        
        return bounds
        
    except Exception as e:
        print(f"  ERROR processing {image_path}: {e}")
        return None

def adjust_bounds_to_content(content_bounds, original_bounds):
    """
    Adjust geographic bounds to only cover the colored pixel area.
    
    Args:
        content_bounds: dict with normalized bounds {minX, minY, maxX, maxY}
        original_bounds: [[south, west], [north, east]]
    
    Returns:
        [[south, west], [north, east]] - adjusted bounds
    """
    [[south, west], [north, east]] = original_bounds
    lat_range = north - south
    lng_range = east - west
    
    # Calculate new bounds that map ONLY the colored pixel area to geography
    # For longitude (X axis):
    new_west = west + (lng_range * content_bounds['minX'])
    new_east = west + (lng_range * content_bounds['maxX'])
    
    # For latitude (Y axis is flipped - image y=0 is top/north):
    new_north = north - (lat_range * content_bounds['minY'])
    new_south = north - (lat_range * content_bounds['maxY'])
    
    return [[new_south, new_west], [new_north, new_east]]

def process_zones():
    """Process all zones in flood_zones.json and update bounds"""
    
    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    json_path = os.path.join(project_root, 'flood_zones.json')
    mapzone_dir = os.path.join(project_root, 'mapzone')
    
    # Load zones
    print(f"Loading zones from {json_path}...")
    with open(json_path, 'r') as f:
        zones = json.load(f)
    
    print(f"Found {len(zones)} zones to process\n")
    
    # Process each zone
    for zone in zones:
        zone_name = zone.get('name', 'unknown')
        image_path = zone.get('image_path', '')
        original_bounds = zone.get('bounds')
        
        print(f"Processing {zone_name} zone...")
        
        if not image_path:
            print(f"  ERROR: No image_path for {zone_name} zone")
            continue
        
        if not original_bounds:
            print(f"  ERROR: No bounds for {zone_name} zone")
            continue
        
        # Convert image_path to full path
        # Remove leading slash if present
        if image_path.startswith('/'):
            image_path = image_path[1:]
        
        full_image_path = os.path.join(project_root, image_path)
        
        if not os.path.exists(full_image_path):
            print(f"  ERROR: Image not found at {full_image_path}")
            continue
        
        print(f"  Image: {full_image_path}")
        print(f"  Original bounds: {original_bounds}")
        
        # Detect content bounds
        content_bounds = detect_content_bounds(full_image_path)
        
        if content_bounds:
            # Calculate adjusted bounds
            adjusted_bounds = adjust_bounds_to_content(content_bounds, original_bounds)
            
            print(f"  Adjusted bounds: {adjusted_bounds}")
            
            # Update zone
            zone['bounds'] = adjusted_bounds
            
            # Store original bounds as backup (optional)
            if 'original_bounds' not in zone:
                zone['original_bounds'] = original_bounds
        
        print()
    
    # Save updated zones
    print(f"Saving updated zones to {json_path}...")
    with open(json_path, 'w') as f:
        json.dump(zones, f, indent=2)
    
    print("Done! Bounds have been updated to only cover colored pixels.")

if __name__ == '__main__':
    process_zones()

