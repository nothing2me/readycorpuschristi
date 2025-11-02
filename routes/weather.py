"""
Weather API routes
"""

from flask import Blueprint, request, jsonify
from services.weather_service import WeatherService

weather_bp = Blueprint('weather', __name__)

# Initialize weather service
weather_service = WeatherService()

@weather_bp.route('/forecast', methods=['POST'])
def get_forecast():
    """
    Get weather forecast for a location.
    
    Expected JSON:
    {
        "location": {
            "lat": 27.8006,
            "lng": -97.3964
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'location' not in data:
            return jsonify({'error': 'Location is required'}), 400
        
        location = data.get('location')
        
        if 'lat' not in location or 'lng' not in location:
            return jsonify({'error': 'Latitude and longitude are required'}), 400
        
        lat = float(location.get('lat'))
        lng = float(location.get('lng'))
        
        # Get weather forecast
        weather_data = weather_service.get_forecast(lat, lng)
        
        return jsonify({
            'status': 'success',
            'weather': weather_data
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@weather_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'weather'})

