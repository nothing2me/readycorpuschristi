"""
Warnings API Routes
Handles warning creation, retrieval, and management
"""

import os
from flask import Blueprint, request, jsonify
from services.warning_service import WarningService

warnings_bp = Blueprint('warnings', __name__)

# Lazy initialization for services (avoids file writes during import in serverless environments)
_warning_service = None

def get_warning_service():
    """Get or create warning service (lazy initialization)"""
    global _warning_service
    if _warning_service is None:
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        warnings_file = os.path.join(project_root, 'warnings.json')
        _warning_service = WarningService(db_file=warnings_file)
    return _warning_service

@warnings_bp.route('/create', methods=['POST'])
def create_warning():
    """
    Create a new warning
    
    Expected JSON:
    {
        "title": "Warning title",
        "types": ["fire", "road-closure"],
        "location": {
            "lat": 27.8006,
            "lng": -97.3964,
            "name": "Corpus Christi, TX"
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request data is required'}), 400
        
        title = data.get('title', '').strip()
        types = data.get('types', [])
        location = data.get('location', {})
        expiry_time = data.get('expiry_time')
        
        # Validation
        if not title:
            return jsonify({'error': 'Title is required'}), 400
        
        if not types or len(types) == 0:
            return jsonify({'error': 'At least one warning type is required'}), 400
        
        if not location or 'lat' not in location or 'lng' not in location:
            return jsonify({'error': 'Location with lat and lng is required'}), 400
        
        # Create warning data
        from datetime import datetime
        warning_data = {
            'title': title,
            'types': types,
            'location': location,
            'timestamp': datetime.now().isoformat()
        }
        
        # Add expiry_time if provided
        if expiry_time:
            warning_data['expiry_time'] = expiry_time
        
        # Get service (lazy initialization)
        warning_service = get_warning_service()
        
        # Save warning
        created_warning = warning_service.create_warning(warning_data)
        
        return jsonify({
            'status': 'success',
            'warning': created_warning
        }), 201
    
    except Exception as e:
        print(f"Error creating warning: {e}")
        return jsonify({'error': str(e)}), 500

@warnings_bp.route('/all', methods=['GET'])
def get_all_warnings():
    """
    Get all active (non-expired) warnings
    
    Query params:
    - include_expired: true/false (default false)
    """
    try:
        warning_service = get_warning_service()
        
        include_expired = request.args.get('include_expired', 'false').lower() == 'true'
        
        warnings = warning_service.get_all_warnings(include_expired=include_expired)
        
        return jsonify({
            'status': 'success',
            'warnings': warnings,
            'count': len(warnings)
        }), 200
    
    except Exception as e:
        print(f"Error getting warnings: {e}")
        return jsonify({'error': str(e)}), 500

@warnings_bp.route('/nearby', methods=['POST'])
def get_nearby_warnings():
    """
    Get warnings near a location
    
    Expected JSON:
    {
        "location": {
            "lat": 27.8006,
            "lng": -97.3964
        },
        "radius_km": 10.0  # optional, default 10km
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'location' not in data:
            return jsonify({'error': 'Location is required'}), 400
        
        location = data['location']
        lat = location.get('lat')
        lng = location.get('lng')
        radius_km = data.get('radius_km', 10.0)
        
        if lat is None or lng is None:
            return jsonify({'error': 'Location must have lat and lng'}), 400
        
        warning_service = get_warning_service()
        
        warnings = warning_service.get_warnings_in_area(lat, lng, radius_km)
        
        return jsonify({
            'status': 'success',
            'warnings': warnings,
            'count': len(warnings)
        }), 200
    
    except Exception as e:
        print(f"Error getting nearby warnings: {e}")
        return jsonify({'error': str(e)}), 500

@warnings_bp.route('/<int:warning_id>', methods=['GET'])
def get_warning(warning_id):
    """Get a specific warning by ID"""
    try:
        warning_service = get_warning_service()
        
        warning = warning_service.get_warning_by_id(warning_id)
        
        if not warning:
            return jsonify({'error': 'Warning not found'}), 404
        
        return jsonify({
            'status': 'success',
            'warning': warning
        }), 200
    
    except Exception as e:
        print(f"Error getting warning: {e}")
        return jsonify({'error': str(e)}), 500

@warnings_bp.route('/<int:warning_id>', methods=['DELETE'])
def delete_warning(warning_id):
    """Delete a warning by ID"""
    try:
        warning_service = get_warning_service()
        
        deleted = warning_service.delete_warning(warning_id)
        
        if not deleted:
            return jsonify({'error': 'Warning not found'}), 404
        
        return jsonify({
            'status': 'success',
            'message': 'Warning deleted successfully'
        }), 200
    
    except Exception as e:
        print(f"Error deleting warning: {e}")
        return jsonify({'error': str(e)}), 500

@warnings_bp.route('/cleanup', methods=['POST'])
def cleanup_expired():
    """Remove all expired warnings from the database"""
    try:
        warning_service = get_warning_service()
        
        removed_count = warning_service.cleanup_expired()
        
        return jsonify({
            'status': 'success',
            'removed_count': removed_count,
            'message': f'Removed {removed_count} expired warning(s)'
        }), 200
    
    except Exception as e:
        print(f"Error cleaning up warnings: {e}")
        return jsonify({'error': str(e)}), 500

