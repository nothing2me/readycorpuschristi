"""
Vercel Python handler - WSGI wrapper for Flask app
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

# Import Flask app directly
# Note: The error happens in Vercel's handler inspection code, not our code
# This is a known issue with certain Flask/Vercel combinations
from app import app

# Export handler - Vercel will inspect this
# The handler must be a callable that accepts (environ, start_response)
handler = app
