"""
Map data API routes for geocoding and map-related operations.
Easily expandable for different map providers (Google Maps, Mapbox, etc.)
"""

from flask import Blueprint, request, jsonify
from services.map_service import MapService

map_data_bp = Blueprint('map_data', __name__)

# Lazy initialization for services (avoids initialization during import in serverless environments)
_map_service = None

def get_map_service():
    """Get or create map service (lazy initialization)"""
    global _map_service
    if _map_service is None:
        _map_service = MapService()
    return _map_service

@map_data_bp.route('/geocode', methods=['POST'])
def geocode_address():
    """
    Geocode an address to coordinates.
    
    Expected JSON:
    {
        "address": "123 Main St, City, State"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'address' not in data:
            return jsonify({'error': 'Address is required'}), 400
        
        address = data.get('address')
        
        # Get service (lazy initialization)
        map_service = get_map_service()
        
        # Get geocoded data from map service
        result = map_service.geocode_address(address)
        
        return jsonify({
            'result': result,
            'status': 'success'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@map_data_bp.route('/reverse-geocode', methods=['POST'])
def reverse_geocode():
    """
    Reverse geocode coordinates to address.
    
    Expected JSON:
    {
        "lat": 40.7128,
        "lng": -74.0060
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'lat' not in data or 'lng' not in data:
            return jsonify({'error': 'Latitude and longitude are required'}), 400
        
        lat = float(data.get('lat'))
        lng = float(data.get('lng'))
        
        # Get service (lazy initialization)
        map_service = get_map_service()
        
        # Get reverse geocoded data
        result = map_service.reverse_geocode(lat, lng)
        
        return jsonify({
            'result': result,
            'status': 'success'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@map_data_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'map_data'})

