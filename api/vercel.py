"""
Vercel Python handler - minimal Flask WSGI app
"""

from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def handler(path):
    return jsonify({
        'status': 'working',
        'path': path,
        'message': 'Flask app is running'
    })

# Export Flask app for Vercel
handler = app
