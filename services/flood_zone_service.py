"""
Flood Zone Service
Handles flood zone overlay storage and retrieval using JSON file
"""

import json
import os
from typing import List, Dict, Any, Optional

class FloodZoneService:
    def __init__(self, db_file: str = 'flood_zones.json'):
        self.db_file = db_file
        self._in_memory = False
        self._memory_storage = []  # Fallback in-memory storage
        self._ensure_db_file()
        self._initialize_default_zones_if_empty()
    
    def _ensure_db_file(self):
        """Create the JSON database file if it doesn't exist"""
        try:
            if not os.path.exists(self.db_file):
                with open(self.db_file, 'w') as f:
                    json.dump([], f)
        except (IOError, PermissionError, OSError) as e:
            # In serverless environments (like Vercel), file writes may not be allowed
            # This is okay - we'll work with in-memory data instead
            print(f"Warning: Could not create {self.db_file}: {e}. Using in-memory storage.")
            self._in_memory = True
    
    def _initialize_default_zones_if_empty(self):
        """Initialize default flood zones if the database is empty"""
        zones = self._load_zones()
        
        if len(zones) == 0:
            # Default bounds for Corpus Christi area
            # Images are 2550x1815 (aspect ratio 1.405), so adjust longitude range
            # to match image aspect ratio
            # Lat range: 0.2 (27.7 to 27.9), so lng range should be 0.2 * 1.405 = 0.281
            # Center around -97.4, so west = -97.4 - 0.1405 = -97.5405, east = -97.4 + 0.1405 = -97.2595
            corpus_christi_bounds = [[27.7, -97.540496], [27.9, -97.259504]]
            
            # Default zone definitions matching the HTML checkboxes
            default_zones = [
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
            
            self._save_zones(default_zones)
            print(f"Initialized {len(default_zones)} default flood zones")
    
    def _load_zones(self) -> List[Dict[str, Any]]:
        """Load all flood zones from JSON file"""
        if self._in_memory:
            return self._memory_storage
        try:
            with open(self.db_file, 'r') as f:
                zones = json.load(f)
                return zones if isinstance(zones, list) else []
        except (json.JSONDecodeError, FileNotFoundError, IOError, PermissionError):
            return []
    
    def _save_zones(self, zones: List[Dict[str, Any]]):
        """Save flood zones to JSON file"""
        if self._in_memory:
            self._memory_storage = zones
            return
        try:
            with open(self.db_file, 'w') as f:
                json.dump(zones, f, indent=2)
        except (IOError, PermissionError, OSError) as e:
            # In serverless environments, file writes may fail - use in-memory storage
            print(f"Warning: Could not save to {self.db_file}: {e}. Using in-memory storage.")
            self._in_memory = True
            self._memory_storage = zones
    
    def create_zone(self, zone_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new flood zone
        
        Args:
            zone_data: Dictionary containing:
                - name: str (zone name/color)
                - image_path: str
                - bounds: [[south, west], [north, east]]
                - opacity: float (0.0 to 1.0)
        
        Returns:
            Created zone dictionary with id
        """
        zones = self._load_zones()
        
        # Generate ID
        max_id = max([z.get('id', 0) for z in zones], default=0)
        zone_id = max_id + 1
        
        # Add ID to zone data
        zone_data['id'] = zone_id
        
        # Add to zones list
        zones.append(zone_data)
        
        # Save to file
        self._save_zones(zones)
        
        return zone_data
    
    def get_all_zones(self) -> List[Dict[str, Any]]:
        """Get all flood zones"""
        return self._load_zones()
    
    def get_zone_by_id(self, zone_id: int) -> Optional[Dict[str, Any]]:
        """Get a specific zone by ID"""
        zones = self._load_zones()
        for zone in zones:
            if zone.get('id') == zone_id:
                return zone
        return None
    
    def update_zone(self, zone_id: int, zone_data: Dict[str, Any]) -> bool:
        """
        Update a flood zone by ID
        
        Returns:
            True if updated, False if not found
        """
        zones = self._load_zones()
        
        for i, zone in enumerate(zones):
            if zone.get('id') == zone_id:
                # Update zone data but keep the ID
                zone_data['id'] = zone_id
                zones[i] = zone_data
                self._save_zones(zones)
                return True
        
        return False
    
    def delete_zone(self, zone_id: int) -> bool:
        """
        Delete a zone by ID
        
        Returns:
            True if deleted, False if not found
        """
        zones = self._load_zones()
        initial_count = len(zones)
        
        zones = [z for z in zones if z.get('id') != zone_id]
        
        if len(zones) < initial_count:
            self._save_zones(zones)
            return True
        
        return False

