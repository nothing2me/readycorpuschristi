"""
Vercel serverless function wrapper for Flask app
"""

import sys
import os

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app

# Export the Flask app as 'handler' for Vercel
# Vercel expects a WSGI application
handler = app

