"""
Vercel Python handler - custom WSGI class that avoids class inspection bug
"""

import sys
import os

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

try:
    os.chdir(project_root)
except:
    pass

from app import app as flask_app

# Create a simple class that only inherits from object to avoid Vercel's issubclass bug
class WSGIHandler(object):
    """Simple WSGI handler that delegates to Flask - inherits only from object"""
    def __init__(self, app):
        self.app = app
    
    def __call__(self, environ, start_response):
        """WSGI interface"""
        return self.app(environ, start_response)

# Export handler as instance of simple class
handler = WSGIHandler(flask_app)
