"""
Vercel serverless function wrapper for Flask app
"""

import sys
import os

# Add the project root to the Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Change to project root directory to ensure relative imports work
original_cwd = os.getcwd()
try:
    os.chdir(project_root)
except:
    pass

# Import Flask app
try:
    from app import app
    
    # Export the Flask app as 'handler' for Vercel
    # Vercel's Python runtime expects a WSGI application as 'handler'
    handler = app
    
except ImportError as e:
    # Handle import errors
    print(f"IMPORT ERROR: {e}")
    print(f"Python path: {sys.path}")
    print(f"Current directory: {os.getcwd()}")
    print(f"Project root: {project_root}")
    
    def error_handler(environ, start_response):
        status = '500 Internal Server Error'
        headers = [('Content-Type', 'application/json')]
        start_response(status, headers)
        error_msg = f"Import error: {str(e)}"
        return [f'{{"error": "{error_msg}"}}'.encode()]
    
    handler = error_handler

except Exception as e:
    # Handle other initialization errors
    print(f"INIT ERROR: {e}")
    import traceback
    traceback.print_exc()
    
    def error_handler(environ, start_response):
        status = '500 Internal Server Error'
        headers = [('Content-Type', 'application/json')]
        start_response(status, headers)
        error_msg = f"Initialization error: {str(e)}"
        return [f'{{"error": "{error_msg}"}}'.encode()]
    
    handler = error_handler

