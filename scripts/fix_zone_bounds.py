#!/usr/bin/env python3
"""
Fix flood zone bounds to match image aspect ratios
"""

import json
import os
from PIL import Image

def fix_zone_bounds():
    """Fix all zone bounds to match their image aspect ratios"""
    
    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    json_path = os.path.join(project_root, 'flood_zones.json')
    
    # Load zones
    print(f"Loading zones from {json_path}...")
    with open(json_path, 'r') as f:
        zones = json.load(f)
    
    print(f"\nFound {len(zones)} zones to fix\n")
    print("=" * 70)
    
    updated_count = 0
    
    # Fix each zone
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
        
        if not bounds or len(bounds) != 2:
            print("  ERROR: Invalid bounds")
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
            
            # Get current bounds
            [[south, west], [north, east]] = bounds
            lat_range = north - south
            lng_range = east - west
            geo_aspect_ratio = lng_range / lat_range
            
            print(f"  Current bounds: [[{south:.6f}, {west:.6f}], [{north:.6f}, {east:.6f}]]")
            print(f"  Current geo aspect ratio: {geo_aspect_ratio:.3f}")
            
            # Check if aspect ratios match
            aspect_diff = abs(aspect_ratio - geo_aspect_ratio)
            
            if aspect_diff > 0.01:  # Only fix if difference is significant
                print(f"  ⚠️  Aspect ratios don't match (diff: {aspect_diff:.3f})")
                print(f"  Fixing bounds...")
                
                # Keep latitude range, adjust longitude range to match image aspect ratio
                center_lat = (south + north) / 2
                center_lng = (west + east) / 2
                
                # Calculate new longitude range based on image aspect ratio
                new_lng_range = lat_range * aspect_ratio
                
                # Calculate new bounds centered on the same center point
                new_west = center_lng - new_lng_range / 2
                new_east = center_lng + new_lng_range / 2
                
                new_bounds = [[south, new_west], [north, new_east]]
                
                print(f"  New bounds: [[{south:.6f}, {new_west:.6f}], [{north:.6f}, {new_east:.6f}]]")
                print(f"  New geo aspect ratio: {new_lng_range/lat_range:.3f}")
                
                # Update zone bounds
                zone['bounds'] = new_bounds
                updated_count += 1
                
                print(f"  ✓ Bounds updated")
            else:
                print(f"  ✓ Aspect ratios already match (diff: {aspect_diff:.6f})")
                
        except Exception as e:
            print(f"  ERROR: Could not process image: {e}")
        
        print()
    
    # Save updated zones
    if updated_count > 0:
        print("=" * 70)
        print(f"\nSaving updated zones to {json_path}...")
        with open(json_path, 'w') as f:
            json.dump(zones, f, indent=2)
        
        print(f"✓ Updated {updated_count} zone(s)")
    else:
        print("=" * 70)
        print("\nNo zones needed updating.")

if __name__ == '__main__':
    fix_zone_bounds()

