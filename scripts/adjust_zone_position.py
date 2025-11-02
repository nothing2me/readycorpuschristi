#!/usr/bin/env python3
"""
Adjust flood zone positions by shifting them south and/or east
"""

import json
import os
import sys

def adjust_zone_positions(lat_shift=0.0, lng_shift=0.0):
    """
    Shift all zone bounds by specified amounts
    
    Args:
        lat_shift: Amount to shift south (negative) or north (positive) in degrees
        lng_shift: Amount to shift west (negative) or east (positive) in degrees
    """
    
    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    json_path = os.path.join(project_root, 'flood_zones.json')
    
    # Load zones
    print(f"Loading zones from {json_path}...")
    with open(json_path, 'r') as f:
        zones = json.load(f)
    
    print(f"\nFound {len(zones)} zones to adjust\n")
    print(f"Shift amount: Lat {lat_shift:+.6f}, Lng {lng_shift:+.6f}")
    print("=" * 70)
    
    updated_count = 0
    
    # Adjust each zone
    for zone in zones:
        zone_id = zone.get('id')
        zone_name = zone.get('name', 'unknown')
        bounds = zone.get('bounds', [])
        
        if not bounds or len(bounds) != 2:
            print(f"Zone {zone_id} ({zone_name}): Invalid bounds, skipping")
            continue
        
        # Get current bounds
        [[south, west], [north, east]] = bounds
        
        # Calculate new bounds (shift south = decrease lat, shift east = increase lng)
        new_south = south - lat_shift  # Moving south means decreasing latitude
        new_north = north - lat_shift
        new_west = west + lng_shift   # Moving east means increasing longitude
        new_east = east + lng_shift
        
        new_bounds = [[new_south, new_west], [new_north, new_east]]
        
        print(f"\nZone {zone_id} ({zone_name}):")
        print(f"  Old: [[{south:.6f}, {west:.6f}], [{north:.6f}, {east:.6f}]]")
        print(f"  New: [[{new_south:.6f}, {new_west:.6f}], [{new_north:.6f}, {new_east:.6f}]]")
        
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
        print(f"\nNew position: Shifted {abs(lat_shift):.6f}° {'south' if lat_shift > 0 else 'north'} and {abs(lng_shift):.6f}° {'east' if lng_shift > 0 else 'west'}")
    else:
        print("No zones were updated.")

if __name__ == '__main__':
    # Default adjustments: move down (south) and right (east)
    # User said "too far up and to the left", so we need to:
    # - Move down (south): decrease latitude (positive shift value means moving south)
    # - Move right (east): increase longitude (positive shift value means moving east)
    
    # Small adjustment: about 0.05 degrees south and 0.02 degrees east
    # This is roughly 5.5 km south and 2.2 km east
    lat_shift = 0.05  # Move 0.05 degrees south (about 5.5 km)
    lng_shift = 0.02  # Move 0.02 degrees east (about 2.2 km)
    
    # Allow command-line overrides
    if len(sys.argv) > 1:
        try:
            lat_shift = float(sys.argv[1])
        except ValueError:
            print(f"Invalid lat_shift: {sys.argv[1]}")
            sys.exit(1)
    
    if len(sys.argv) > 2:
        try:
            lng_shift = float(sys.argv[2])
        except ValueError:
            print(f"Invalid lng_shift: {sys.argv[2]}")
            sys.exit(1)
    
    adjust_zone_positions(lat_shift, lng_shift)

