"""
Vercel Python handler - Flask WSGI app
"""

from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    return jsonify({
        'status': 'working',
        'path': path,
        'message': 'Flask app is running'
    })

# Export Flask WSGI app - Vercel expects this to be named 'handler'
handler = app
