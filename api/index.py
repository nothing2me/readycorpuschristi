"""
Vercel Python handler - WSGI function wrapper to bypass class inspection bug
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

# Create a plain WSGI function - Vercel should accept this
def handler(environ, start_response):
    """
    WSGI handler function that delegates to Flask app.
    This is a plain function, not a class, so Vercel's issubclass check won't fail.
    """
    return flask_app(environ, start_response)
