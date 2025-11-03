"""
Vercel serverless function wrapper for Flask app
"""

import sys
import os
import traceback

# Add the project root to the Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Change to project root directory to ensure relative paths work
try:
    os.chdir(project_root)
except Exception as e:
    print(f"Warning: Could not change directory: {e}")

# Import Flask app with comprehensive error handling
try:
    print(f"Starting Flask app import...")
    print(f"Python path: {sys.path}")
    print(f"Project root: {project_root}")
    print(f"Current directory: {os.getcwd()}")
    
    # Import the Flask app
    from app import app
    
    print(f"Flask app imported successfully")
    print(f"App name: {app.name}")
    print(f"Static folder: {app.static_folder}")
    print(f"Template folder: {app.template_folder}")
    
except ImportError as e:
    error_msg = f"Import error: {e}"
    print(error_msg)
    traceback.print_exc()
    
    # Create a minimal error handler Flask app
    from flask import Flask, jsonify
    error_app = Flask(__name__)
    
    @error_app.route('/', defaults={'path': ''})
    @error_app.route('/<path:path>')
    def error_handler(path):
        return jsonify({
            'error': 'Application import failed',
            'message': str(e),
            'type': 'ImportError'
        }), 500
    
    handler = error_app
    
except Exception as e:
    error_msg = f"Error importing app: {e}"
    print(error_msg)
    traceback.print_exc()
    
    # Create a minimal error handler Flask app
    from flask import Flask, jsonify
    error_app = Flask(__name__)
    
    @error_app.route('/', defaults={'path': ''})
    @error_app.route('/<path:path>')
    def error_handler(path):
        return jsonify({
            'error': 'Application initialization failed',
            'message': str(e),
            'type': type(e).__name__
        }), 500
    
    handler = error_app
else:
    # Successfully imported - use the Flask app
    handler = app

# Vercel Python runtime expects the WSGI app to be exported as 'handler'
# Vercel will automatically wrap this with their WSGI adapter
