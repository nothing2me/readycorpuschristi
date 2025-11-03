# Vercel Flask Test App

Minimal Flask app to test Vercel deployment.

## Structure
- `app.py` - Main Flask application
- `api/index.py` - Vercel handler entry point
- `vercel.json` - Vercel configuration
- `requirements.txt` - Python dependencies

## Test locally
```bash
pip install -r requirements.txt
python app.py
```

## Deploy to Vercel
Push to GitHub and connect to Vercel, or use:
```bash
vercel
```

