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

# Global error tracking
_init_error = None
_init_traceback = None

# Try to import Flask app with maximum error handling
handler = None

try:
    print("=" * 80)
    print("VERCEL HANDLER INITIALIZATION")
    print("=" * 80)
    print(f"Python version: {sys.version}")
    print(f"Python path: {sys.path[:3]}...")  # Print first 3 entries
    print(f"Project root: {project_root}")
    print(f"Current directory: {os.getcwd()}")
    print("=" * 80)
    
    # Import Flask first to ensure it's available
    from flask import Flask, jsonify, render_template
    
    # Create a minimal test handler first
    test_app = Flask(__name__)
    
    @test_app.route('/test')
    def test():
        return jsonify({'status': 'test handler working'}), 200
    
    # Now try to import the actual app
    print("Attempting to import app.py...")
    from app import app as flask_app
    
    if flask_app is None:
        raise ValueError("Flask app is None after import")
    
    print(f"✓ Flask app imported successfully")
    print(f"  App name: {flask_app.name}")
    print(f"  Static folder: {flask_app.static_folder}")
    print(f"  Template folder: {flask_app.template_folder}")
    
    # Replace test app with real app
    handler = flask_app
    print("✓ Handler set to Flask app")
    
except Exception as e:
    # Capture the error for debugging
    _init_error = str(e)
    _init_traceback = traceback.format_exc()
    
    print("=" * 80)
    print("ERROR DURING INITIALIZATION")
    print("=" * 80)
    print(f"Error type: {type(e).__name__}")
    print(f"Error message: {e}")
    print("\nTraceback:")
    print(_init_traceback)
    print("=" * 80)
    
    # Create error handler that ALWAYS works
    try:
        from flask import Flask, jsonify
        
        error_app = Flask(__name__)
        
        @error_app.route('/', defaults={'path': ''})
        @error_app.route('/<path:path>')
        def error_handler(path):
            """Error handler that shows detailed error information"""
            return jsonify({
                'error': 'Application initialization failed',
                'message': _init_error,
                'error_type': type(e).__name__ if hasattr(e, '__class__') else 'Unknown',
                'traceback': _init_traceback.split('\n')[-10:] if _init_traceback else None,  # Last 10 lines
                'python_version': sys.version,
                'project_root': project_root,
                'current_dir': os.getcwd()
            }), 500
        
        handler = error_app
        print("✓ Created error handler Flask app")
        
    except Exception as inner_e:
        print(f"CRITICAL: Failed to create error handler: {inner_e}")
        traceback.print_exc()
        
        # Absolute last resort - create handler inline
        try:
            from flask import Flask, jsonify
            handler = Flask(__name__)
            @handler.route('/', defaults={'path': ''})
            @handler.route('/<path:path>')
            def fallback(path):
                return jsonify({
                    'error': 'Complete initialization failure',
                    'init_error': str(_init_error) if _init_error else 'Unknown',
                    'handler_error': str(inner_e)
                }), 500
        except:
            # If even this fails, we're completely hosed
            pass

# Ensure handler is ALWAYS set
if handler is None:
    print("CRITICAL: Handler is None - creating absolute minimal handler")
    from flask import Flask, jsonify
    handler = Flask(__name__)
    
    @handler.route('/', defaults={'path': ''})
    @handler.route('/<path:path>')
    def final_fallback(path):
        return jsonify({
            'error': 'Handler was None',
            'init_error': str(_init_error) if _init_error else 'No error captured'
        }), 500

print("=" * 80)
print("HANDLER INITIALIZATION COMPLETE")
print(f"Handler type: {type(handler)}")
print(f"Handler is None: {handler is None}")
print("=" * 80)

# Vercel Python runtime expects the WSGI app to be exported as 'handler'
