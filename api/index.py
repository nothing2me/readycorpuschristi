"""
Vercel Python handler - standard api/index.py format
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

# Import Flask app
from app import app

# Export handler
handler = app

