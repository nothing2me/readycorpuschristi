"""
Camera Service
Manages camera locations with dummy data
Simple node-based system with coordinates
"""

import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path


class CameraService:
    """Service for managing camera locations with dummy data"""
    
    def __init__(self, data_file: str = None):
        """
        Initialize camera service
        
        Args:
            data_file: JSON file to store camera data (defaults to cameras_data.json in project root)
        """
        import os
        if data_file is None:
            # Get the correct path to cameras_data.json (in project root)
            project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            data_file = os.path.join(project_root, 'cameras_data.json')
        self.data_file = Path(data_file)
        self._ensure_data_file()
        
    def _ensure_data_file(self):
        """Create the data file with default dummy cameras if it doesn't exist"""
        import os
        if not self.data_file.exists():
            # Get available placeholder images from camera_snapshots directory
            project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            snapshot_dir = Path(project_root) / 'camera_snapshots'
            placeholder_images = []
            
            # Look for the three images: CRP-SH358.jpg, sh286@hawthorne.jpg, sh358@ayers.jpg
            available_images = [
                'CRP-SH358.jpg',
                'sh286@hawthorne.jpg',
                'sh358@ayers.jpg'
            ]
            
            # Check which images actually exist
            for img_name in available_images:
                img_path = snapshot_dir / img_name
                if img_path.exists():
                    placeholder_images.append(f'/api/cameras/image/{img_name}')
            
            # Default Corpus Christi camera locations with placeholder images
            default_cameras = [
                {
                    'id': 1,
                    'location': {
                        'name': 'IH-37 at SH-359',
                        'lat': 27.7564,
                        'lng': -97.4042
                    },
                    'image_path': placeholder_images[0] if len(placeholder_images) > 0 else '/static/images/camera-placeholder.jpg',
                    'timestamp': datetime.now().isoformat()
                },
                {
                    'id': 2,
                    'location': {
                        'name': 'IH-37 at Weber Road',
                        'lat': 27.7834,
                        'lng': -97.4132
                    },
                    'image_path': placeholder_images[1] if len(placeholder_images) > 1 else '/static/images/camera-placeholder.jpg',
                    'timestamp': datetime.now().isoformat()
                },
                {
                    'id': 3,
                    'location': {
                        'name': 'IH-37 at SPID',
                        'lat': 27.7225,
                        'lng': -97.3956
                    },
                    'image_path': placeholder_images[2] if len(placeholder_images) > 2 else '/static/images/camera-placeholder.jpg',
                    'timestamp': datetime.now().isoformat()
                },
                {
                    'id': 4,
                    'location': {
                        'name': 'IH-37 at Ayers Street',
                        'lat': 27.7912,
                        'lng': -97.4215
                    },
                    'image_path': placeholder_images[0] if len(placeholder_images) > 0 else '/static/images/camera-placeholder.jpg',
                    'timestamp': datetime.now().isoformat()
                },
                {
                    'id': 5,
                    'location': {
                        'name': 'US-181 at SH-361',
                        'lat': 27.7134,
                        'lng': -97.3718
                    },
                    'image_path': placeholder_images[1] if len(placeholder_images) > 1 else '/static/images/camera-placeholder.jpg',
                    'timestamp': datetime.now().isoformat()
                },
                {
                    'id': 6,
                    'location': {
                        'name': 'US-181 at Port Avenue',
                        'lat': 27.7345,
                        'lng': -97.3829
                    },
                    'image_path': placeholder_images[2] if len(placeholder_images) > 2 else '/static/images/camera-placeholder.jpg',
                    'timestamp': datetime.now().isoformat()
                },
                {
                    'id': 7,
                    'location': {
                        'name': 'SPID at Staples Street',
                        'lat': 27.7089,
                        'lng': -97.3934
                    },
                    'image_path': placeholder_images[0] if len(placeholder_images) > 0 else '/static/images/camera-placeholder.jpg',
                    'timestamp': datetime.now().isoformat()
                },
                {
                    'id': 8,
                    'location': {
                        'name': 'SPID at Airline Road',
                        'lat': 27.7167,
                        'lng': -97.4012
                    },
                    'image_path': placeholder_images[1] if len(placeholder_images) > 1 else '/static/images/camera-placeholder.jpg',
                    'timestamp': datetime.now().isoformat()
                }
            ]
            
            self._save_cameras(default_cameras)
        else:
            # Update existing cameras to use the placeholder images if they don't have proper image paths
            import os
            cameras = self._load_cameras()
            updated = False
            
            project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            snapshot_dir = Path(project_root) / 'camera_snapshots'
            available_images = [
                'CRP-SH358.jpg',
                'sh286@hawthorne.jpg',
                'sh358@ayers.jpg'
            ]
            
            # Build image paths
            placeholder_images = []
            for img_name in available_images:
                img_path = snapshot_dir / img_name
                if img_path.exists():
                    placeholder_images.append(f'/api/cameras/image/{img_name}')
            
            # Update cameras that are using old placeholder paths
            for i, camera in enumerate(cameras):
                old_path = camera.get('image_path', '')
                if '/static/images/camera-placeholder.jpg' in old_path or not old_path:
                    # Assign one of the placeholder images cyclically
                    img_index = i % len(placeholder_images) if placeholder_images else 0
                    camera['image_path'] = placeholder_images[img_index] if placeholder_images else '/static/images/camera-placeholder.jpg'
                    if 'timestamp' not in camera:
                        camera['timestamp'] = datetime.now().isoformat()
                    updated = True
            
            if updated:
                self._save_cameras(cameras)
    
    def _load_cameras(self) -> List[Dict[str, Any]]:
        """Load cameras from JSON file"""
        try:
            with open(self.data_file, 'r') as f:
                data = json.load(f)
                return data.get('cameras', [])
        except (json.JSONDecodeError, FileNotFoundError):
            return []
    
    def _save_cameras(self, cameras: List[Dict[str, Any]]):
        """Save cameras to JSON file"""
        with open(self.data_file, 'w') as f:
            json.dump({'cameras': cameras}, f, indent=2)
    
    def get_all_cameras(self) -> List[Dict[str, Any]]:
        """Get all cameras with coordinates"""
        return self._load_cameras()
    
    def get_camera_by_id(self, camera_id: int) -> Optional[Dict[str, Any]]:
        """Get a specific camera by ID"""
        cameras = self._load_cameras()
        for camera in cameras:
            if camera.get('id') == camera_id:
                return camera
        return None
    
    def add_camera(self, name: str, lat: float, lng: float) -> Dict[str, Any]:
        """
        Add a new camera with coordinates
        
        Args:
            name: Camera location name
            lat: Latitude
            lng: Longitude
            
        Returns:
            Created camera dictionary
        """
        cameras = self._load_cameras()
        
        # Generate new ID
        max_id = max([c.get('id', 0) for c in cameras], default=0)
        camera_id = max_id + 1
        
        camera = {
            'id': camera_id,
            'location': {
                'name': name,
                'lat': lat,
                'lng': lng
            },
            'image_path': '/static/images/camera-placeholder.jpg',
            'timestamp': datetime.now().isoformat()
        }
        
        cameras.append(camera)
        self._save_cameras(cameras)
        
        return camera
    
    def update_camera_location(self, camera_id: int, lat: float = None, lng: float = None, name: str = None) -> Optional[Dict[str, Any]]:
        """
        Update camera location coordinates
        
        Args:
            camera_id: Camera ID
            lat: New latitude (optional)
            lng: New longitude (optional)
            name: New location name (optional)
            
        Returns:
            Updated camera dictionary or None if not found
        """
        cameras = self._load_cameras()
        
        for camera in cameras:
            if camera.get('id') == camera_id:
                if lat is not None:
                    camera['location']['lat'] = lat
                if lng is not None:
                    camera['location']['lng'] = lng
                if name is not None:
                    camera['location']['name'] = name
                
                camera['timestamp'] = datetime.now().isoformat()
                
                self._save_cameras(cameras)
                return camera
        
        return None
    
    def delete_camera(self, camera_id: int) -> bool:
        """
        Delete a camera by ID
        
        Returns:
            True if deleted, False if not found
        """
        cameras = self._load_cameras()
        initial_count = len(cameras)
        
        cameras = [c for c in cameras if c.get('id') != camera_id]
        
        if len(cameras) < initial_count:
            self._save_cameras(cameras)
            return True
        
        return False
