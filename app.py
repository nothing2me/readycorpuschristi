"""
Main Flask application entry point.
Expandable architecture for map data and AI chatbot integration.
"""

from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import re
from dotenv import load_dotenv

# Load environment variables (only if .env file exists)
# On Vercel, environment variables are provided by the platform
try:
    load_dotenv()
except Exception:
    pass  # .env file not available, use platform environment variables

# Determine the base directory (works in both local and Vercel serverless environments)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Create Flask app with explicit static and template folders for serverless compatibility
app = Flask(
    __name__,
    static_folder=os.path.join(BASE_DIR, 'static'),
    static_url_path='/static',
    template_folder=os.path.join(BASE_DIR, 'templates')
)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

def is_mobile_device(user_agent):
    """Detect if the request is from a mobile device"""
    if not user_agent:
        return False
    
    mobile_patterns = [
        r'Mobile|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone|Opera Mini|IEMobile|WPDesktop',
        r'Mobile|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone|Opera Mini|IEMobile|WPDesktop'
    ]
    
    user_agent_lower = user_agent.lower()
    mobile_keywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone', 'opera mini', 'iemobile']
    
    return any(keyword in user_agent_lower for keyword in mobile_keywords)

# Camera service uses simple dummy data with coordinates

# Serve mapzone images
@app.route('/mapzone/<path:filename>')
def serve_mapzone(filename):
    """Serve flood zone images from mapzone directory"""
    mapzone_dir = os.path.join(BASE_DIR, 'mapzone')
    return send_from_directory(mapzone_dir, filename)

# Register blueprints for modular architecture
# Wrap each import in try/except to prevent one failing route from crashing the entire app
blueprints = [
    ('routes.chatbot', 'chatbot_bp', '/api/chatbot'),
    ('routes.map_data', 'map_data_bp', '/api/map'),
    ('routes.weather', 'weather_bp', '/api/weather'),
    ('routes.news', 'news_bp', '/api/news'),
    ('routes.warnings', 'warnings_bp', '/api/warnings'),
    ('routes.admin', 'admin_bp', '/api/admin'),
    ('routes.flood_zones', 'flood_zones_bp', '/api/flood-zones'),
    ('routes.traffic', 'traffic_bp', '/api/traffic'),
    ('routes.hotels', 'hotels_bp', '/api/hotels'),
    ('routes.cameras', 'cameras_bp', '/api/cameras'),
    ('routes.evacuation_routes', 'evacuation_routes_bp', '/api/evacuation-routes'),
]

for module_name, bp_name, url_prefix in blueprints:
    try:
        module = __import__(module_name, fromlist=[bp_name])
        blueprint = getattr(module, bp_name)
        app.register_blueprint(blueprint, url_prefix=url_prefix)
        print(f"✓ Registered blueprint: {url_prefix}")
    except Exception as e:
        print(f"⚠ Warning: Failed to register {url_prefix}: {type(e).__name__}: {e}")
        # Continue with other blueprints - don't crash the entire app

@app.route('/')
def index():
    """Main page route - auto-detect mobile and redirect if needed"""
    user_agent = request.headers.get('User-Agent', '')
    
    # Check for mobile parameter or mobile device
    mobile_param = request.args.get('mobile', '').lower()
    force_mobile = mobile_param in ['1', 'true', 'yes']
    force_desktop = mobile_param in ['0', 'false', 'no']
    
    if force_mobile or (not force_desktop and is_mobile_device(user_agent)):
        return render_template('mobile.html')
    
    return render_template('index.html')

@app.route('/mobile')
def mobile_view():
    """Mobile page route"""
    return render_template('mobile.html')

@app.route('/admin')
def admin():
    """Admin dashboard route"""
    return render_template('admin.html')

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
