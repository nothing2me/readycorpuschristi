"""
Traffic API Routes
Handles traffic congestion data fetching using OpenStreetMap (FREE)
"""

from flask import Blueprint, request, jsonify
from services.traffic_service import TrafficService

traffic_bp = Blueprint('traffic', __name__)

# Lazy initialization for services (avoids initialization during import in serverless environments)
_traffic_service = None

def get_traffic_service():
    """Get or create traffic service (lazy initialization)"""
    global _traffic_service
    if _traffic_service is None:
        _traffic_service = TrafficService()
    return _traffic_service

@traffic_bp.route('/congestion', methods=['POST'])
def get_traffic_congestion():
    """
    Get traffic congestion data for an area using OpenStreetMap
    
    Expected JSON:
    {
        "location": {
            "lat": 27.8006,
            "lng": -97.3964
        },
        "radius_km": 5.0  // optional, default 5km
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'location' not in data:
            return jsonify({'error': 'Location is required'}), 400
        
        location = data['location']
        lat = location.get('lat')
        lng = location.get('lng')
        radius_km = data.get('radius_km', 5.0)
        
        if lat is None or lng is None:
            return jsonify({'error': 'Location must have lat and lng'}), 400
        
        # Get service (lazy initialization)
        traffic_service = get_traffic_service()
        
        # Get traffic data from OpenStreetMap
        traffic_points = traffic_service.get_traffic_data(lat, lng, radius_km)
        
        return jsonify({
            'status': 'success',
            'traffic_points': traffic_points,
            'count': len(traffic_points)
        }), 200
        
    except Exception as e:
        print(f"Error getting traffic congestion: {e}")
        return jsonify({'error': str(e)}), 500

@traffic_bp.route('/construction', methods=['POST'])
def get_construction_data():
    """
    Get construction data for an area using OpenStreetMap
    
    Expected JSON:
    {
        "location": {
            "lat": 27.8006,
            "lng": -97.3964
        },
        "radius_km": 5.0  // optional, default 5km
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'location' not in data:
            return jsonify({'error': 'Location is required'}), 400
        
        location = data['location']
        lat = location.get('lat')
        lng = location.get('lng')
        radius_km = data.get('radius_km', 5.0)
        
        if lat is None or lng is None:
            return jsonify({'error': 'Location must have lat and lng'}), 400
        
        # Get service (lazy initialization)
        traffic_service = get_traffic_service()
        
        # Get construction data from OpenStreetMap
        construction_points = traffic_service.get_construction_data(lat, lng, radius_km)
        
        return jsonify({
            'status': 'success',
            'construction_points': construction_points,
            'count': len(construction_points)
        }), 200
        
    except Exception as e:
        print(f"Error getting construction data: {e}")
        return jsonify({'error': str(e)}), 500

@traffic_bp.route('/health', methods=['GET'])
def health_check():
    """Check if traffic service is configured"""
    return jsonify({
        'status': 'success',
        'provider': 'osm',
        'configured': True,
        'message': 'Traffic service is running with OpenStreetMap (free, no API key required)'
    }), 200
