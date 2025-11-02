#!/usr/bin/env python3
"""
Detect zone perimeters from PNG images and save as lat/lng coordinates.

This script:
1. Loads each zone PNG image from /mapzone/
2. Uses OpenCV to detect the exact contour/perimeter of colored (non-transparent) pixels
3. Extracts the perimeter as arrays of [x, y] pixel coordinates
4. Converts those pixel coordinates to [lat, lng] geographic coordinates based on zone bounds
5. Saves the perimeter coordinates to flood_zones.json as a "perimeter" field for each zone

Requirements:
    pip install opencv-python numpy pillow
"""

import json
import os
import sys
import numpy as np
from PIL import Image

try:
    import cv2
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False
    print("WARNING: OpenCV not found. Using PIL-based edge detection (less accurate).")
    print("Install OpenCV for better results: pip install opencv-python")

def detect_perimeter_opencv(image_path):
    """
    Detect perimeter using OpenCV findContours (preferred method).
    
    Returns:
        List of [x, y] pixel coordinates representing the perimeter contour
    """
    # Load image
    img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        print(f"  ERROR: Could not load image {image_path}")
        return None
    
    # Extract alpha channel if present, otherwise use grayscale
    if img.shape[2] == 4:
        # RGBA image - use alpha channel
        alpha = img[:, :, 3]
        # Create binary mask: 1 for colored pixels (alpha >= 10), 0 for transparent
        mask = (alpha >= 10).astype(np.uint8) * 255
    else:
        # No alpha channel - assume all pixels are colored
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        mask = (gray > 0).astype(np.uint8) * 255
    
    # Find contours
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        print(f"  WARNING: No contours found in {image_path}")
        return None
    
    # Get the largest contour (should be the main zone shape)
    largest_contour = max(contours, key=cv2.contourArea)
    
    # Simplify the contour to reduce point count (Douglas-Peucker algorithm)
    epsilon = 0.5  # Approximation accuracy (adjust as needed)
    simplified = cv2.approxPolyDP(largest_contour, epsilon, True)
    
    # Convert to list of [x, y] coordinates
    perimeter = [[int(point[0][0]), int(point[0][1])] for point in simplified]
    
    # Ensure the perimeter is closed (first point == last point)
    if len(perimeter) > 0 and perimeter[0] != perimeter[-1]:
        perimeter.append(perimeter[0])
    
    print(f"  Detected {len(perimeter)} perimeter points using OpenCV")
    
    return perimeter

def detect_perimeter_pil(image_path):
    """
    Detect perimeter using PIL and numpy (fallback method if OpenCV is not available).
    
    Returns:
        List of [x, y] pixel coordinates representing the perimeter contour
    """
    try:
        img = Image.open(image_path)
        
        # Convert to RGBA if needed
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        width, height = img.size
        pixels = np.array(img)
        
        # Create binary mask: 1 for colored pixels (alpha >= 10), 0 for transparent
        alpha = pixels[:, :, 3]
        mask = (alpha >= 10).astype(np.uint8)
        
        # Find edge pixels (colored pixels with at least one transparent neighbor)
        edge_pixels = []
        
        for y in range(height):
            for x in range(width):
                if mask[y, x] == 0:
                    continue  # Skip transparent pixels
                
                # Check if it's on image edge
                if x == 0 or x == width - 1 or y == 0 or y == height - 1:
                    edge_pixels.append([x, y])
                    continue
                
                # Check 4-connected neighbors (up, right, down, left)
                neighbors = [(0, -1), (1, 0), (0, 1), (-1, 0)]
                is_edge = False
                for dx, dy in neighbors:
                    nx, ny = x + dx, y + dy
                    if nx < 0 or nx >= width or ny < 0 or ny >= height:
                        is_edge = True
                        break
                    if mask[ny, nx] == 0:
                        is_edge = True
                        break
                
                if is_edge:
                    edge_pixels.append([x, y])
        
        if not edge_pixels:
            print(f"  WARNING: No edge pixels found in {image_path}")
            return None
        
        # Simplify: keep only points that are far enough apart
        simplified = []
        threshold = 2  # Minimum distance between points
        
        for point in edge_pixels:
            too_close = False
            for existing in simplified:
                dist = np.sqrt((point[0] - existing[0])**2 + (point[1] - existing[1])**2)
                if dist < threshold:
                    too_close = True
                    break
            if not too_close:
                simplified.append(point)
        
        # Sort points to create a connected path (nearest neighbor)
        if len(simplified) == 0:
            return None
        
        path = []
        remaining = simplified.copy()
        current = remaining.pop(0)
        path.append(current)
        
        while remaining:
            # Find nearest neighbor
            nearest_idx = 0
            nearest_dist = float('inf')
            
            for i, point in enumerate(remaining):
                dist = np.sqrt((current[0] - point[0])**2 + (current[1] - point[1])**2)
                if dist < nearest_dist:
                    nearest_dist = dist
                    nearest_idx = i
            
            # If nearest is too far, start new segment
            if nearest_dist > 50 and len(path) > 10:
                current = remaining.pop(0)
                path.append(current)
            else:
                current = remaining.pop(nearest_idx)
                path.append(current)
        
        # Ensure the perimeter is closed
        if len(path) > 0 and path[0] != path[-1]:
            path.append(path[0])
        
        print(f"  Detected {len(path)} perimeter points using PIL-based method")
        
        return path
        
    except Exception as e:
        print(f"  ERROR in PIL detection: {e}")
        return None

def pixels_to_latlng(pixels, image_width, image_height, bounds):
    """
    Convert pixel coordinates to lat/lng coordinates.
    
    Args:
        pixels: List of [x, y] pixel coordinates
        image_width: Width of the image in pixels
        image_height: Height of the image in pixels
        bounds: [[south, west], [north, east]]
    
    Returns:
        List of [lat, lng] coordinates
    """
    [[south, west], [north, east]] = bounds
    lat_range = north - south
    lng_range = east - west
    
    latlngs = []
    for x, y in pixels:
        # Normalize pixel coordinates (0-1)
        norm_x = x / image_width
        norm_y = y / image_height
        
        # Convert to lat/lng (Y is flipped: image y=0 is top/north)
        lng = west + (lng_range * norm_x)
        lat = north - (lat_range * norm_y)  # Y axis is flipped
        
        latlngs.append([lat, lng])
    
    return latlngs

def process_zones():
    """Process all zones in flood_zones.json and add perimeter data"""
    
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
        bounds = zone.get('bounds')
        
        print(f"Processing {zone_name} zone...")
        
        if not image_path:
            print(f"  ERROR: No image_path for {zone_name} zone")
            continue
        
        if not bounds:
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
        
        # Get image dimensions
        try:
            img = Image.open(full_image_path)
            img_width, img_height = img.size
            print(f"  Image size: {img_width}x{img_height}")
        except Exception as e:
            print(f"  ERROR: Could not read image dimensions: {e}")
            continue
        
        # Detect perimeter
        if HAS_OPENCV:
            perimeter_pixels = detect_perimeter_opencv(full_image_path)
        else:
            perimeter_pixels = detect_perimeter_pil(full_image_path)
        
        if not perimeter_pixels:
            print(f"  WARNING: Could not detect perimeter for {zone_name} zone")
            continue
        
        # Convert pixel coordinates to lat/lng
        perimeter_latlng = pixels_to_latlng(perimeter_pixels, img_width, img_height, bounds)
        
        print(f"  Converted to {len(perimeter_latlng)} lat/lng points")
        
        # Save perimeter to zone data
        zone['perimeter'] = perimeter_latlng
        
        # Also save pixel coordinates for reference (optional)
        zone['perimeter_pixels'] = perimeter_pixels
        
        print(f"  ✓ Perimeter saved for {zone_name} zone\n")
    
    # Save updated zones
    print(f"Saving updated zones to {json_path}...")
    with open(json_path, 'w') as f:
        json.dump(zones, f, indent=2)
    
    print("Done! Perimeters have been added to all zones.")
    print("\nYou can now use these pre-computed perimeters in your JavaScript code.")

if __name__ == '__main__':
    process_zones()

