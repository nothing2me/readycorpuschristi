"""
Warning Service
Handles warning storage and retrieval using JSON file
"""

import json
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

class WarningService:
    def __init__(self, db_file: str = 'warnings.json'):
        self.db_file = db_file
        self._in_memory = False
        self._memory_storage = []  # Fallback in-memory storage
        self._ensure_db_file()
    
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
    
    def _load_warnings(self) -> List[Dict[str, Any]]:
        """Load all warnings from JSON file"""
        if self._in_memory:
            return self._memory_storage
        try:
            with open(self.db_file, 'r') as f:
                warnings = json.load(f)
                return warnings if isinstance(warnings, list) else []
        except (json.JSONDecodeError, FileNotFoundError, IOError, PermissionError):
            return []
    
    def _save_warnings(self, warnings: List[Dict[str, Any]]):
        """Save warnings to JSON file"""
        if self._in_memory:
            self._memory_storage = warnings
            return
        try:
            with open(self.db_file, 'w') as f:
                json.dump(warnings, f, indent=2)
        except (IOError, PermissionError, OSError) as e:
            # In serverless environments, file writes may fail - use in-memory storage
            print(f"Warning: Could not save to {self.db_file}: {e}. Using in-memory storage.")
            self._in_memory = True
            self._memory_storage = warnings
    
    def is_expired(self, warning: Dict[str, Any], hours: int = 24) -> bool:
        """Check if a warning is expired (default 24 hours or uses expiry_time if set)"""
        try:
            # Check if warning has a specific expiry_time
            expiry_time_str = warning.get('expiry_time')
            if expiry_time_str:
                # Parse expiry_time
                expiry_time = datetime.fromisoformat(expiry_time_str.replace('Z', '+00:00'))
                if expiry_time.tzinfo:
                    expiry_time = expiry_time.replace(tzinfo=None)
                return datetime.now() > expiry_time
            
            # Fall back to default 24 hours from timestamp
            timestamp_str = warning.get('timestamp')
            if not timestamp_str:
                return True
            
            # Parse timestamp
            created_time = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            if created_time.tzinfo:
                created_time = created_time.replace(tzinfo=None)
            
            # Check if expired
            expiration_time = created_time + timedelta(hours=hours)
            return datetime.now() > expiration_time
        except (ValueError, KeyError):
            return True
    
    def create_warning(self, warning_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new warning
        
        Args:
            warning_data: Dictionary containing:
                - title: str
                - types: List[str]
                - location: Dict with lat, lng, name
                - timestamp: str (ISO format)
        
        Returns:
            Created warning dictionary with id
        """
        warnings = self._load_warnings()
        
        # Clean expired warnings first
        warnings = [w for w in warnings if not self.is_expired(w)]
        
        # Generate ID
        max_id = max([w.get('id', 0) for w in warnings], default=0)
        warning_id = max_id + 1
        
        # Add ID to warning data
        warning_data['id'] = warning_id
        warning_data['created_at'] = datetime.now().isoformat()
        
        # Add to warnings list
        warnings.append(warning_data)
        
        # Save to file
        self._save_warnings(warnings)
        
        return warning_data
    
    def get_all_warnings(self, include_expired: bool = False) -> List[Dict[str, Any]]:
        """
        Get all warnings, optionally including expired ones
        
        Args:
            include_expired: If True, include expired warnings
        
        Returns:
            List of warning dictionaries
        """
        warnings = self._load_warnings()
        
        if include_expired:
            return warnings
        
        # Filter out expired warnings
        active_warnings = [w for w in warnings if not self.is_expired(w)]
        
        # Save cleaned list (remove expired warnings from file)
        if len(active_warnings) < len(warnings):
            self._save_warnings(active_warnings)
        
        return active_warnings
    
    def get_warning_by_id(self, warning_id: int) -> Optional[Dict[str, Any]]:
        """Get a specific warning by ID"""
        warnings = self.get_all_warnings(include_expired=False)
        for warning in warnings:
            if warning.get('id') == warning_id:
                return warning
        return None
    
    def delete_warning(self, warning_id: int) -> bool:
        """
        Delete a warning by ID
        
        Returns:
            True if deleted, False if not found
        """
        warnings = self._load_warnings()
        initial_count = len(warnings)
        
        warnings = [w for w in warnings if w.get('id') != warning_id]
        
        if len(warnings) < initial_count:
            self._save_warnings(warnings)
            return True
        
        return False
    
    def cleanup_expired(self) -> int:
        """
        Remove all expired warnings from the database
        
        Returns:
            Number of warnings removed
        """
        warnings = self._load_warnings()
        initial_count = len(warnings)
        
        active_warnings = [w for w in warnings if not self.is_expired(w)]
        
        if len(active_warnings) < initial_count:
            self._save_warnings(active_warnings)
        
        return initial_count - len(active_warnings)
    
    def get_warnings_in_area(self, lat: float, lng: float, radius_km: float = 10.0) -> List[Dict[str, Any]]:
        """
        Get warnings within a certain radius of a location
        
        Args:
            lat: Latitude of center point
            lng: Longitude of center point
            radius_km: Radius in kilometers (default 10km)
        
        Returns:
            List of warnings within the radius
        """
        import math
        
        warnings = self.get_all_warnings(include_expired=False)
        
        def distance_km(lat1, lng1, lat2, lng2):
            """Calculate distance between two points in kilometers"""
            R = 6371  # Earth's radius in km
            dlat = math.radians(lat2 - lat1)
            dlng = math.radians(lng2 - lng1)
            a = (math.sin(dlat / 2) ** 2 +
                 math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
                 math.sin(dlng / 2) ** 2)
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            return R * c
        
        nearby_warnings = []
        for warning in warnings:
            warning_lat = warning.get('location', {}).get('lat')
            warning_lng = warning.get('location', {}).get('lng')
            
            if warning_lat is not None and warning_lng is not None:
                dist = distance_km(lat, lng, warning_lat, warning_lng)
                if dist <= radius_km:
                    nearby_warnings.append(warning)
        
        return nearby_warnings

