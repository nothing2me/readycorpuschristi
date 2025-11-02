"""
Vercel serverless function wrapper for Flask app
"""

import sys
import os

# Add the project root to the Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Change to project root directory
try:
    os.chdir(project_root)
except:
    pass

# Import Flask app
try:
    from app import app
except Exception as e:
    import traceback
    traceback.print_exc()
    raise

# Vercel Python runtime expects the WSGI app to be exported as 'handler'
handler = app
