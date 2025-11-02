#!/usr/bin/env python3
"""
Initialize flood zones with default Corpus Christi bounds if flood_zones.json is empty.
"""

import json
import os

def init_flood_zones():
    """Initialize flood zones with default bounds for Corpus Christi"""
    
    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    json_path = os.path.join(project_root, 'flood_zones.json')
    
    # Check if file exists and has zones
    if os.path.exists(json_path):
        with open(json_path, 'r') as f:
            zones = json.load(f)
            if zones and len(zones) > 0:
                print(f"Flood zones already exist ({len(zones)} zones). Skipping initialization.")
                return
    
    # Corpus Christi approximate bounds
    # Images are 2550x1815 (aspect ratio 1.405), so adjust longitude range
    # to match image aspect ratio to prevent skewing
    # Lat range: 0.2 (27.7 to 27.9), so lng range should be 0.2 * 1.405 = 0.281
    # Center around -97.4, so west = -97.4 - 0.1405 = -97.5405, east = -97.4 + 0.1405 = -97.2595
    corpus_christi_bounds = [[27.7, -97.540496], [27.9, -97.259504]]
    
    # Zone definitions matching the HTML checkboxes
    zones = [
        {
            "id": 1,
            "name": "green",
            "image_path": "mapzone/greenzone.png",
            "bounds": corpus_christi_bounds,
            "opacity": 0.6,
            "scale": 1.0,
            "rotation": 0
        },
        {
            "id": 2,
            "name": "orange",
            "image_path": "mapzone/orangezone.png",
            "bounds": corpus_christi_bounds,
            "opacity": 0.6,
            "scale": 1.0,
            "rotation": 0
        },
        {
            "id": 3,
            "name": "pink",
            "image_path": "mapzone/pinkzone.png",
            "bounds": corpus_christi_bounds,
            "opacity": 0.6,
            "scale": 1.0,
            "rotation": 0
        },
        {
            "id": 4,
            "name": "purple",
            "image_path": "mapzone/purplezone.png",
            "bounds": corpus_christi_bounds,
            "opacity": 0.6,
            "scale": 1.0,
            "rotation": 0
        },
        {
            "id": 5,
            "name": "yellow",
            "image_path": "mapzone/yellowzone.png",
            "bounds": corpus_christi_bounds,
            "opacity": 0.6,
            "scale": 1.0,
            "rotation": 0
        }
    ]
    
    # Save zones
    print(f"Initializing flood zones in {json_path}...")
    with open(json_path, 'w') as f:
        json.dump(zones, f, indent=2)
    
    print(f"Created {len(zones)} flood zones:")
    for zone in zones:
        print(f"  - Zone {zone['id']}: {zone['name']} ({zone['image_path']})")
    
    print("\nInitialization complete!")
    print("Note: These are default bounds covering the Corpus Christi area.")
    print("You may need to adjust the bounds for each zone based on your actual flood zone data.")

if __name__ == '__main__':
    init_flood_zones()

