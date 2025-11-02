"""
Evacuation Routes API Routes
Handles fetching evacuation routes from OpenStreetMap
"""

from flask import Blueprint, jsonify
from services.evacuation_routes_service import EvacuationRoutesService

evacuation_routes_bp = Blueprint('evacuation_routes', __name__)
evacuation_service = EvacuationRoutesService()

@evacuation_routes_bp.route('/all', methods=['GET'])
def get_all_evacuation_routes():
    """
    Get all evacuation routes with coordinates from OSM
    
    Returns:
        JSON with evacuation routes using actual OSM data
    """
    try:
        routes = evacuation_service.get_all_evacuation_routes()
        
        return jsonify({
            'status': 'success',
            'routes': routes,
            'count': len(routes)
        }), 200
    
    except Exception as e:
        print(f"Error getting evacuation routes: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@evacuation_routes_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'evacuation_routes'
    })

