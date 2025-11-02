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

app = Flask(__name__)
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
    return send_from_directory('mapzone', filename)

# Register blueprints for modular architecture
from routes.chatbot import chatbot_bp
from routes.map_data import map_data_bp
from routes.weather import weather_bp
from routes.news import news_bp
from routes.warnings import warnings_bp
from routes.admin import admin_bp
from routes.flood_zones import flood_zones_bp
from routes.traffic import traffic_bp
from routes.hotels import hotels_bp
from routes.cameras import cameras_bp
from routes.evacuation_routes import evacuation_routes_bp

app.register_blueprint(chatbot_bp, url_prefix='/api/chatbot')
app.register_blueprint(map_data_bp, url_prefix='/api/map')
app.register_blueprint(weather_bp, url_prefix='/api/weather')
app.register_blueprint(news_bp, url_prefix='/api/news')
app.register_blueprint(warnings_bp, url_prefix='/api/warnings')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(flood_zones_bp, url_prefix='/api/flood-zones')
app.register_blueprint(traffic_bp, url_prefix='/api/traffic')
app.register_blueprint(hotels_bp, url_prefix='/api/hotels')
app.register_blueprint(cameras_bp, url_prefix='/api/cameras')
app.register_blueprint(evacuation_routes_bp, url_prefix='/api/evacuation-routes')

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

