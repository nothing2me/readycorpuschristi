"""
ReadyCorpusChristi Flask Application
Main entry point for the disaster preparedness web application
"""

from flask import Flask, render_template, send_from_directory
import os

# Create Flask app instance
app = Flask(__name__)

# Import and register all blueprints
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

# Root route - serve main index page
@app.route('/')
def index():
    """Serve the main index page"""
    return render_template('index.html')

# Admin dashboard route - serve admin template
@app.route('/admin')
def admin():
    """Serve the admin dashboard page"""
    return render_template('admin.html')

# Mobile route
@app.route('/mobile')
def mobile():
    """Serve the mobile version"""
    return render_template('mobile.html')

# Health check endpoint
@app.route('/api/health')
def health():
    """Health check endpoint for monitoring"""
    return {'status': 'healthy', 'service': 'readycorpuschristi'}

# Serve static files explicitly (if needed)
@app.route('/static/<path:filename>')
def static_files(filename):
    """Serve static files"""
    return send_from_directory(app.static_folder, filename)

if __name__ == '__main__':
    # Run in development mode
    app.run(debug=True, host='0.0.0.0', port=5000)
