"""
Vercel Python handler - minimal export
"""

import sys
import os

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

try:
    os.chdir(project_root)
except:
    pass

from app import app

handler = app
