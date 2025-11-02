"""
Cameras API Routes
Handles camera nodes with coordinates
"""

import os
from flask import Blueprint, request, jsonify, send_from_directory
from pathlib import Path
from services.camera_service import CameraService

cameras_bp = Blueprint('cameras', __name__)
camera_service = CameraService()

# Get the correct path to camera_snapshots directory (in project root)
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAMERA_SNAPSHOTS_DIR = Path(project_root) / 'camera_snapshots'

@cameras_bp.route('/all', methods=['GET'])
def get_all_cameras():
    """
    Get all camera locations with coordinates
    
    Returns list of cameras with location and image data
    """
    try:
        cameras = camera_service.get_all_cameras()
        
        return jsonify({
            'status': 'success',
            'cameras': cameras,
            'count': len(cameras)
        }), 200
    
    except Exception as e:
        print(f"Error getting cameras: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@cameras_bp.route('/<int:camera_id>', methods=['GET'])
def get_camera(camera_id):
    """Get a specific camera by ID"""
    try:
        camera = camera_service.get_camera_by_id(camera_id)
        
        if not camera:
            return jsonify({'error': 'Camera not found'}), 404
        
        return jsonify({
            'status': 'success',
            'camera': camera
        }), 200
    
    except Exception as e:
        print(f"Error getting camera: {e}")
        return jsonify({'error': str(e)}), 500

@cameras_bp.route('/create', methods=['POST'])
def create_camera():
    """
    Create a new camera with coordinates
    
    Expected JSON:
    {
        "name": "Camera Location Name",
        "lat": 27.8006,
        "lng": -97.3964
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request data is required'}), 400
        
        name = data.get('name', '').strip()
        lat = data.get('lat')
        lng = data.get('lng')
        
        if not name:
            return jsonify({'error': 'Camera name is required'}), 400
        
        if lat is None or lng is None:
            return jsonify({'error': 'Latitude and longitude are required'}), 400
        
        camera = camera_service.add_camera(name, float(lat), float(lng))
        
        return jsonify({
            'status': 'success',
            'camera': camera
        }), 201
    
    except Exception as e:
        print(f"Error creating camera: {e}")
        return jsonify({'error': str(e)}), 500

@cameras_bp.route('/update-location/<int:camera_id>', methods=['PUT'])
def update_camera_location(camera_id):
    """
    Update camera location coordinates
    
    Expected JSON:
    {
        "lat": 27.8006,
        "lng": -97.3964,
        "name": "Updated Location Name"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request data is required'}), 400
        
        lat = data.get('lat')
        lng = data.get('lng')
        name = data.get('name')
        
        camera = camera_service.update_camera_location(camera_id, lat, lng, name)
        
        if not camera:
            return jsonify({'error': 'Camera not found'}), 404
        
        return jsonify({
            'status': 'success',
            'camera': camera
        }), 200
    
    except Exception as e:
        print(f"Error updating camera location: {e}")
        return jsonify({'error': str(e)}), 500

@cameras_bp.route('/<int:camera_id>', methods=['DELETE'])
def delete_camera(camera_id):
    """Delete a camera by ID"""
    try:
        deleted = camera_service.delete_camera(camera_id)
        
        if not deleted:
            return jsonify({'error': 'Camera not found'}), 404
        
        return jsonify({
            'status': 'success',
            'message': 'Camera deleted successfully'
        }), 200
    
    except Exception as e:
        print(f"Error deleting camera: {e}")
        return jsonify({'error': str(e)}), 500

@cameras_bp.route('/image/<filename>', methods=['GET'])
def get_camera_image(filename):
    """Serve camera snapshot images"""
    try:
        # Security: Only allow jpg and jpeg files
        if not filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            return jsonify({'error': 'Invalid file type'}), 400
        
        # Check if file exists
        file_path = CAMERA_SNAPSHOTS_DIR / filename
        if not file_path.exists():
            print(f"Camera image not found: {file_path}")
            return jsonify({'error': 'Image not found'}), 404
        
        return send_from_directory(str(CAMERA_SNAPSHOTS_DIR), filename)
    
    except Exception as e:
        print(f"Error serving camera image: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@cameras_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'cameras',
        'message': 'Camera node service with coordinates'
    })
