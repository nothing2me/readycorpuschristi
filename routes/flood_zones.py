"""
Flood Zones API Routes
Handles flood zone overlay management
"""

import os
from flask import Blueprint, request, jsonify
from services.flood_zone_service import FloodZoneService

flood_zones_bp = Blueprint('flood_zones', __name__)

# Lazy initialization for services (avoids file writes during import in serverless environments)
_flood_zone_service = None

def get_flood_zone_service():
    """Get or create flood zone service (lazy initialization)"""
    global _flood_zone_service
    if _flood_zone_service is None:
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        flood_zones_file = os.path.join(project_root, 'flood_zones.json')
        _flood_zone_service = FloodZoneService(db_file=flood_zones_file)
    return _flood_zone_service

@flood_zones_bp.route('/all', methods=['GET'])
def get_all_zones():
    """Get all flood zones"""
    try:
        flood_zone_service = get_flood_zone_service()
        
        zones = flood_zone_service.get_all_zones()
        return jsonify({
            'status': 'success',
            'zones': zones,
            'count': len(zones)
        }), 200
    except Exception as e:
        print(f"Error getting flood zones: {e}")
        return jsonify({'error': str(e)}), 500

@flood_zones_bp.route('/create', methods=['POST'])
def create_zone():
    """
    Create a new flood zone overlay
    
    Expected JSON:
    {
        "name": "green",
        "image_path": "mapzone/green.png",
        "bounds": [[27.7, -97.5], [27.9, -97.3]],
        "opacity": 0.5
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request data is required'}), 400
        
        name = data.get('name', '').strip()
        image_path = data.get('image_path', '').strip()
        bounds = data.get('bounds')
        opacity = data.get('opacity', 0.5)
        scale = data.get('scale', 1.0)  # Optional scale factor
        rotation = data.get('rotation', 0)  # Optional rotation in degrees
        
        # Validation
        if not name:
            return jsonify({'error': 'Zone name is required'}), 400
        
        if not image_path:
            return jsonify({'error': 'Image path is required'}), 400
        
        if not bounds or not isinstance(bounds, list) or len(bounds) != 2:
            return jsonify({'error': 'Bounds must be a 2-element array [[south, west], [north, east]]'}), 400
        
        # Create zone data
        zone_data = {
            'name': name,
            'image_path': image_path,
            'bounds': bounds,
            'opacity': opacity,
            'scale': scale,
            'rotation': rotation
        }
        
        # Get service (lazy initialization)
        flood_zone_service = get_flood_zone_service()
        
        # Save zone
        created_zone = flood_zone_service.create_zone(zone_data)
        
        return jsonify({
            'status': 'success',
            'zone': created_zone
        }), 201
    
    except Exception as e:
        print(f"Error creating flood zone: {e}")
        return jsonify({'error': str(e)}), 500

@flood_zones_bp.route('/update/<int:zone_id>', methods=['PUT'])
def update_zone(zone_id):
    """
    Update a flood zone overlay
    
    Expected JSON:
    {
        "name": "green",
        "image_path": "mapzone/green.png",
        "bounds": [[27.7, -97.5], [27.9, -97.3]],
        "opacity": 0.5
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request data is required'}), 400
        
        # Get service (lazy initialization)
        flood_zone_service = get_flood_zone_service()
        
        # Update zone
        updated = flood_zone_service.update_zone(zone_id, data)
        
        if not updated:
            return jsonify({'error': 'Zone not found'}), 404
        
        updated_zone = flood_zone_service.get_zone_by_id(zone_id)
        
        return jsonify({
            'status': 'success',
            'zone': updated_zone
        }), 200
    
    except Exception as e:
        print(f"Error updating flood zone: {e}")
        return jsonify({'error': str(e)}), 500

@flood_zones_bp.route('/<int:zone_id>', methods=['GET'])
def get_zone(zone_id):
    """Get a specific zone by ID"""
    try:
        flood_zone_service = get_flood_zone_service()
        
        zone = flood_zone_service.get_zone_by_id(zone_id)
        
        if not zone:
            return jsonify({'error': 'Zone not found'}), 404
        
        return jsonify({
            'status': 'success',
            'zone': zone
        }), 200
    
    except Exception as e:
        print(f"Error getting flood zone: {e}")
        return jsonify({'error': str(e)}), 500

@flood_zones_bp.route('/<int:zone_id>', methods=['DELETE'])
def delete_zone(zone_id):
    """Delete a zone by ID"""
    try:
        flood_zone_service = get_flood_zone_service()
        
        deleted = flood_zone_service.delete_zone(zone_id)
        
        if not deleted:
            return jsonify({'error': 'Zone not found'}), 404
        
        return jsonify({
            'status': 'success',
            'message': 'Zone deleted successfully'
        }), 200
    
    except Exception as e:
        print(f"Error deleting flood zone: {e}")
        return jsonify({'error': str(e)}), 500

