#!/usr/bin/env python3
"""
Scale flood zones up or down while maintaining their aspect ratio and center point
"""

import json
import os
import sys

def scale_zones(scale_factor=1.0):
    """
    Scale all zone bounds by a factor while maintaining center point
    
    Args:
        scale_factor: Factor to scale by (e.g., 1.5 = 50% larger, 2.0 = 100% larger)
    """
    
    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    json_path = os.path.join(project_root, 'flood_zones.json')
    
    # Load zones
    print(f"Loading zones from {json_path}...")
    with open(json_path, 'r') as f:
        zones = json.load(f)
    
    print(f"\nFound {len(zones)} zones to scale\n")
    print(f"Scale factor: {scale_factor}x ({scale_factor * 100:.0f}% of original size)")
    print("=" * 70)
    
    updated_count = 0
    
    # Scale each zone
    for zone in zones:
        zone_id = zone.get('id')
        zone_name = zone.get('name', 'unknown')
        bounds = zone.get('bounds', [])
        
        if not bounds or len(bounds) != 2:
            print(f"Zone {zone_id} ({zone_name}): Invalid bounds, skipping")
            continue
        
        # Get current bounds
        [[south, west], [north, east]] = bounds
        
        # Calculate center point
        center_lat = (south + north) / 2
        center_lng = (west + east) / 2
        
        # Calculate current size
        lat_range = north - south
        lng_range = east - west
        
        # Calculate new size (scale both dimensions by the same factor)
        new_lat_range = lat_range * scale_factor
        new_lng_range = lng_range * scale_factor
        
        # Calculate new bounds centered on the same center point
        new_south = center_lat - new_lat_range / 2
        new_north = center_lat + new_lat_range / 2
        new_west = center_lng - new_lng_range / 2
        new_east = center_lng + new_lng_range / 2
        
        new_bounds = [[new_south, new_west], [new_north, new_east]]
        
        print(f"\nZone {zone_id} ({zone_name}):")
        print(f"  Center: [{center_lat:.6f}, {center_lng:.6f}]")
        print(f"  Old size: Lat {lat_range:.6f}°, Lng {lng_range:.6f}°")
        print(f"  New size: Lat {new_lat_range:.6f}°, Lng {new_lng_range:.6f}°")
        print(f"  Old bounds: [[{south:.6f}, {west:.6f}], [{north:.6f}, {east:.6f}]]")
        print(f"  New bounds: [[{new_south:.6f}, {new_west:.6f}], [{new_north:.6f}, {new_east:.6f}]]")
        
        # Update zone bounds
        zone['bounds'] = new_bounds
        updated_count += 1
    
    # Save updated zones
    if updated_count > 0:
        print("\n" + "=" * 70)
        print(f"\nSaving updated zones to {json_path}...")
        with open(json_path, 'w') as f:
            json.dump(zones, f, indent=2)
        
        print(f"✓ Updated {updated_count} zone(s)")
        print(f"\nZones scaled to {scale_factor}x ({scale_factor * 100:.0f}% of original size)")
    else:
        print("No zones were updated.")

if __name__ == '__main__':
    # Default scale: 1.5x (50% larger)
    scale_factor = 1.5
    
    # Allow command-line override
    if len(sys.argv) > 1:
        try:
            scale_factor = float(sys.argv[1])
            if scale_factor <= 0:
                print("Scale factor must be positive")
                sys.exit(1)
        except ValueError:
            print(f"Invalid scale_factor: {sys.argv[1]}")
            print("Usage: python scripts/scale_zones.py [scale_factor]")
            print("  Example: python scripts/scale_zones.py 1.5  (makes zones 50% larger)")
            print("  Example: python scripts/scale_zones.py 2.0  (makes zones 100% larger)")
            sys.exit(1)
    
    scale_zones(scale_factor)

