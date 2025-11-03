"""
Vercel Python handler - WSGI wrapper for Flask app
Workaround for Vercel's handler inspection issue with Flask apps
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

# Lazy import - only load Flask app when handler is called
# This prevents Vercel's handler inspection from running during module import
_flask_app = None

def _get_app():
    """Lazy load Flask app to avoid Vercel inspection issues"""
    global _flask_app
    if _flask_app is None:
        from app import app
        _flask_app = app
    return _flask_app

# Export handler as a function - Vercel can inspect functions better than instances
# Using a plain function avoids the issubclass error in Vercel's inspection code
def handler(environ, start_response):
    """
    WSGI handler function for Vercel
    This function signature avoids Vercel's handler inspection issues
    """
    return _get_app()(environ, start_response)
