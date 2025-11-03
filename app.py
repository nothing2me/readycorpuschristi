"""
Minimal Flask app for Vercel testing
"""

from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({'message': 'Hello from Vercel Flask app!', 'status': 'working'})

@app.route('/api/test')
def test():
    return jsonify({'message': 'API endpoint works!', 'status': 'success'})

if __name__ == '__main__':
    app.run(debug=True)
