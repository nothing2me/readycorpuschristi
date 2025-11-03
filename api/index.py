"""
Vercel Python handler - wrap Flask app to avoid Vercel's class inspection bug
"""

import sys
import os

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Change to project root
try:
    os.chdir(project_root)
except:
    pass

# Import Flask app
from app import app as flask_app

# Create a wrapper class that Vercel's inspection can handle
class FlaskHandler:
    """Wrapper class for Flask app to avoid Vercel's issubclass check bug"""
    def __init__(self, app):
        self.app = app
    
    def __call__(self, environ, start_response):
        """WSGI callable - delegate to Flask app"""
        return self.app(environ, start_response)
    
    def wsgi_app(self, environ, start_response):
        """Alternative WSGI interface"""
        return self.app(environ, start_response)

# Export handler as a callable class instance
handler = FlaskHandler(flask_app)
