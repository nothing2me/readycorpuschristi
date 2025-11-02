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
except Exception as e:
    print(f"Warning: Could not change directory: {e}")

# Import Flask app with error handling
try:
    print(f"Python path: {sys.path}")
    print(f"Current directory: {os.getcwd()}")
    print(f"Project root: {project_root}")
    
    from app import app
    print("Successfully imported Flask app")
    
except ImportError as e:
    import traceback
    print(f"Import error: {e}")
    traceback.print_exc()
    raise
except Exception as e:
    import traceback
    print(f"Error importing app: {e}")
    traceback.print_exc()
    raise

# Vercel Python runtime expects the WSGI app to be exported as 'handler'
handler = app
