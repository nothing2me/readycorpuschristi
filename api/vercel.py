"""
Vercel serverless function wrapper for Flask app
"""

from app import app

# Export the Flask app as 'handler' for Vercel
handler = app

