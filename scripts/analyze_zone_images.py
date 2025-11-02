#!/usr/bin/env python3
"""
Analyze flood zone images to get their dimensions and suggest bounds adjustments
"""

import json
import os
from PIL import Image

def analyze_zones():
    """Analyze all flood zone images"""
    
    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    json_path = os.path.join(project_root, 'flood_zones.json')
    
    # Load zones
    print(f"Loading zones from {json_path}...")
    with open(json_path, 'r') as f:
        zones = json.load(f)
    
    print(f"\nFound {len(zones)} zones to analyze\n")
    print("=" * 70)
    
    # Analyze each zone
    for zone in zones:
        zone_id = zone.get('id')
        zone_name = zone.get('name', 'unknown')
        image_path = zone.get('image_path', '')
        bounds = zone.get('bounds', [])
        
        print(f"\nZone {zone_id}: {zone_name}")
        print("-" * 70)
        
        if not image_path:
            print("  ERROR: No image_path")
            continue
        
        # Get full image path
        if image_path.startswith('/'):
            image_path = image_path[1:]
        
        full_image_path = os.path.join(project_root, image_path)
        
        if not os.path.exists(full_image_path):
            print(f"  ERROR: Image not found at {full_image_path}")
            continue
        
        # Get image dimensions
        try:
            img = Image.open(full_image_path)
            width, height = img.size
            aspect_ratio = width / height
            
            print(f"  Image: {image_path}")
            print(f"  Dimensions: {width} x {height} pixels")
            print(f"  Aspect Ratio: {aspect_ratio:.3f}")
            
            # Check if image has alpha channel
            if img.mode == 'RGBA':
                print(f"  Format: RGBA (has transparency)")
            else:
                print(f"  Format: {img.mode}")
            
            # Analyze bounds
            if bounds and len(bounds) == 2:
                [[south, west], [north, east]] = bounds
                lat_range = north - south
                lng_range = east - west
                geo_aspect_ratio = lng_range / lat_range
                
                print(f"\n  Current Bounds:")
                print(f"    South: {south:.6f}, West: {west:.6f}")
                print(f"    North: {north:.6f}, East: {east:.6f}")
                print(f"    Lat Range: {lat_range:.6f}")
                print(f"    Lng Range: {lng_range:.6f}")
                print(f"    Geographic Aspect Ratio: {geo_aspect_ratio:.3f}")
                
                # Check if aspect ratios match
                aspect_diff = abs(aspect_ratio - geo_aspect_ratio)
                print(f"\n  Aspect Ratio Comparison:")
                print(f"    Image: {aspect_ratio:.3f}")
                print(f"    Geographic: {geo_aspect_ratio:.3f}")
                print(f"    Difference: {aspect_diff:.3f}")
                
                if aspect_diff > 0.1:
                    print(f"    ⚠️  WARNING: Aspect ratios don't match! This will cause skewing.")
                    print(f"    Suggested adjustment:")
                    
                    # Suggest maintaining one dimension and adjusting the other
                    if aspect_ratio > geo_aspect_ratio:
                        # Image is wider than geographic bounds
                        # Keep lat range, adjust lng range
                        suggested_lng_range = lat_range * aspect_ratio
                        center_lng = (west + east) / 2
                        suggested_west = center_lng - suggested_lng_range / 2
                        suggested_east = center_lng + suggested_lng_range / 2
                        print(f"      Keep latitude range, adjust longitude:")
                        print(f"      New bounds: [[{south:.6f}, {suggested_west:.6f}], [{north:.6f}, {suggested_east:.6f}]]")
                    else:
                        # Image is taller than geographic bounds
                        # Keep lng range, adjust lat range
                        suggested_lat_range = lng_range / aspect_ratio
                        center_lat = (south + north) / 2
                        suggested_south = center_lat - suggested_lat_range / 2
                        suggested_north = center_lat + suggested_lat_range / 2
                        print(f"      Keep longitude range, adjust latitude:")
                        print(f"      New bounds: [[{suggested_south:.6f}, {west:.6f}], [{suggested_north:.6f}, {east:.6f}]]")
                else:
                    print(f"    ✓ Aspect ratios match well")
                
            else:
                print(f"  ERROR: Invalid bounds format")
                
        except Exception as e:
            print(f"  ERROR: Could not analyze image: {e}")
        
        print()
    
    print("=" * 70)
    print("\nNote: If aspect ratios don't match, the images will appear skewed.")
    print("You may need to adjust the bounds for each zone to match their actual geographic extent.")

if __name__ == '__main__':
    analyze_zones()

