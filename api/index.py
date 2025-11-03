"""
Vercel Python handler - function-based WSGI wrapper
"""

import sys
import os

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

try:
    os.chdir(project_root)
except:
    pass

# Lazy import - delay importing Flask app until handler is called
_flask_app = None

def _get_app():
    """Lazy load Flask app"""
    global _flask_app
    if _flask_app is None:
        from app import app
        _flask_app = app
    return _flask_app

# Handler is a simple function - no class inheritance at all
def handler(environ, start_response):
    """WSGI handler function"""
    app = _get_app()
    return app(environ, start_response)
