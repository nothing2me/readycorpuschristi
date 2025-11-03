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
handler = None
error_message = None

try:
    print(f"Starting Flask app import...")
    print(f"Python path: {sys.path}")
    print(f"Project root: {project_root}")
    print(f"Current directory: {os.getcwd()}")
    
    # Import the Flask app - this will also trigger route imports and service initialization
    from app import app
    
    # Verify the app was created successfully
    if app is None:
        raise ValueError("Flask app is None after import")
    
    print(f"Flask app imported successfully")
    print(f"App name: {app.name}")
    print(f"Static folder: {app.static_folder}")
    print(f"Template folder: {app.template_folder}")
    
    # Set handler to the app
    handler = app
    
except Exception as e:
    # Catch ALL exceptions including ImportError, AttributeError, OSError, etc.
    error_msg = f"Error during app import/initialization: {type(e).__name__}: {e}"
    print(error_msg)
    traceback.print_exc()
    error_message = str(e)
    
    # Create a minimal error handler Flask app that will at least respond
    try:
        from flask import Flask, jsonify
        error_app = Flask(__name__)
        
        @error_app.route('/', defaults={'path': ''})
        @error_app.route('/<path:path>')
        def error_handler_func(path):
            return jsonify({
                'error': 'Application initialization failed',
                'message': error_message,
                'type': type(e).__name__,
                'traceback': traceback.format_exc() if hasattr(traceback, 'format_exc') else None
            }), 500
        
        handler = error_app
        print(f"Created error handler Flask app")
    except Exception as inner_e:
        # If even creating the error app fails, we're in big trouble
        print(f"CRITICAL: Failed to create error handler: {inner_e}")
        traceback.print_exc()
        # At this point, handler is None and Vercel will show a different error

# Ensure handler is always set - Vercel requires it
if handler is None:
    # Last resort - create absolute minimal Flask app
    from flask import Flask, jsonify
    handler = Flask(__name__)
    
    @handler.route('/', defaults={'path': ''})
    @handler.route('/<path:path>')
    def fallback_handler(path):
        return jsonify({
            'error': 'Application handler was not properly initialized',
            'message': error_message or 'Unknown error during initialization'
        }), 500
    
    print(f"WARNING: Using fallback error handler")

# Vercel Python runtime expects the WSGI app to be exported as 'handler'
# Vercel will automatically wrap this with their WSGI adapter
