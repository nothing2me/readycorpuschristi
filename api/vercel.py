"""
Vercel Python handler - Flask app with minimal dependencies
"""

import sys
import os
import traceback

# Setup
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)
try:
    os.chdir(project_root)
except:
    pass

# Import Flask
from flask import Flask, jsonify, render_template, send_from_directory

# Create minimal working app
app = Flask(__name__, static_folder=None)

@app.route('/')
def index():
    try:
        # Try to render template
        template_path = os.path.join(project_root, 'templates', 'index.html')
        if os.path.exists(template_path):
            return render_template('index.html')
        return jsonify({'status': 'app working', 'template': 'not found'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e), 'type': type(e).__name__}), 500

@app.route('/health')
def health():
    return jsonify({'status': 'healthy'})

# Try to register routes gradually
try:
    from routes.chatbot import chatbot_bp
    app.register_blueprint(chatbot_bp, url_prefix='/api/chatbot')
    print("Registered chatbot route")
except Exception as e:
    print(f"Failed to register chatbot: {e}")

try:
    from routes.weather import weather_bp
    app.register_blueprint(weather_bp, url_prefix='/api/weather')
    print("Registered weather route")
except Exception as e:
    print(f"Failed to register weather: {e}")

try:
    from routes.map_data import map_data_bp
    app.register_blueprint(map_data_bp, url_prefix='/api/map')
    print("Registered map_data route")
except Exception as e:
    print(f"Failed to register map_data: {e}")

try:
    from routes.news import news_bp
    app.register_blueprint(news_bp, url_prefix='/api/news')
    print("Registered news route")
except Exception as e:
    print(f"Failed to register news: {e}")

try:
    from routes.warnings import warnings_bp
    app.register_blueprint(warnings_bp, url_prefix='/api/warnings')
    print("Registered warnings route")
except Exception as e:
    print(f"Failed to register warnings: {e}")

try:
    from routes.admin import admin_bp
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    print("Registered admin route")
except Exception as e:
    print(f"Failed to register admin: {e}")

try:
    from routes.flood_zones import flood_zones_bp
    app.register_blueprint(flood_zones_bp, url_prefix='/api/flood-zones')
    print("Registered flood_zones route")
except Exception as e:
    print(f"Failed to register flood_zones: {e}")

try:
    from routes.traffic import traffic_bp
    app.register_blueprint(traffic_bp, url_prefix='/api/traffic')
    print("Registered traffic route")
except Exception as e:
    print(f"Failed to register traffic: {e}")

try:
    from routes.hotels import hotels_bp
    app.register_blueprint(hotels_bp, url_prefix='/api/hotels')
    print("Registered hotels route")
except Exception as e:
    print(f"Failed to register hotels: {e}")

try:
    from routes.cameras import cameras_bp
    app.register_blueprint(cameras_bp, url_prefix='/api/cameras')
    print("Registered cameras route")
except Exception as e:
    print(f"Failed to register cameras: {e}")

try:
    from routes.evacuation_routes import evacuation_routes_bp
    app.register_blueprint(evacuation_routes_bp, url_prefix='/api/evacuation-routes')
    print("Registered evacuation_routes route")
except Exception as e:
    print(f"Failed to register evacuation_routes: {e}")

# Export handler
handler = app
