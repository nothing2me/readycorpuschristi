"""
ReadyCorpusChristi Flask Application
Main entry point for the disaster preparedness web application
"""

# Import Flask first and create app instance immediately
# This ensures Vercel can detect Flask usage right away
from flask import Flask, render_template, send_from_directory
import os

# Create Flask app instance - this must be at module level for Vercel detection
app = Flask(__name__)

# Define a simple route first to ensure Flask is being used
@app.route('/')
def index():
    """Serve the main index page"""
    return render_template('index.html')

# Additional routes
@app.route('/admin')
def admin():
    """Serve the admin dashboard page"""
    return render_template('admin.html')

@app.route('/mobile')
def mobile():
    """Serve the mobile version"""
    return render_template('mobile.html')

@app.route('/api/health')
def health():
    """Health check endpoint for monitoring"""
    return {'status': 'healthy', 'service': 'readycorpuschristi'}

# Serve static files explicitly (if needed)
@app.route('/static/<path:filename>')
def static_files(filename):
    """Serve static files"""
    return send_from_directory(app.static_folder, filename)

# Import and register all blueprints after initial Flask setup
# This ensures Flask is detected even if blueprint imports fail
try:
    from routes.chatbot import chatbot_bp
    from routes.warnings import warnings_bp
    from routes.flood_zones import flood_zones_bp
    from routes.cameras import cameras_bp
    from routes.weather import weather_bp
    from routes.traffic import traffic_bp
    from routes.news import news_bp
    from routes.map_data import map_data_bp
    from routes.evacuation_routes import evacuation_routes_bp
    from routes.hotels import hotels_bp
    from routes.admin import admin_bp

    # Register blueprints with URL prefixes
    app.register_blueprint(chatbot_bp, url_prefix='/api/chatbot')
    app.register_blueprint(warnings_bp, url_prefix='/api/warnings')
    app.register_blueprint(flood_zones_bp, url_prefix='/api/flood-zones')
    app.register_blueprint(cameras_bp, url_prefix='/api/cameras')
    app.register_blueprint(weather_bp, url_prefix='/api/weather')
    app.register_blueprint(traffic_bp, url_prefix='/api/traffic')
    app.register_blueprint(news_bp, url_prefix='/api/news')
    app.register_blueprint(map_data_bp, url_prefix='/api/map')
    app.register_blueprint(evacuation_routes_bp, url_prefix='/api/evacuation-routes')
    app.register_blueprint(hotels_bp, url_prefix='/api/hotels')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
except ImportError as e:
    # Log import errors but don't fail - app will still work with basic routes
    print(f"Warning: Could not import some blueprints: {e}")

# Export app for Vercel
if __name__ == '__main__':
    # Run in development mode
    app.run(debug=True, host='0.0.0.0', port=5000)
